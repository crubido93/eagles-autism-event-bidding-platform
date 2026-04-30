/**
 * Email blast Lambda — invoked by AppSync as the resolver for the
 * `sendEmailBlast` mutation. Admin-only (gated by Cognito group at the
 * AppSync level).
 *
 * Arguments (from AppSync):
 *   subject: String!
 *   htmlBody: String!
 *   recipients: [String!]   (optional — defaults to all User Pool users)
 *
 * Returns:
 *   { sent: Int!, failed: Int!, total: Int! }
 */
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const FROM_EMAIL = process.env.FROM_EMAIL!;
const USER_POOL_ID = process.env.USER_POOL_ID!;
const RESEND_SECRET_ARN = process.env.RESEND_SECRET_ARN!;

const cognito = new CognitoIdentityProviderClient({});
const sm = new SecretsManagerClient({});
let cachedKey: string | null = null;

async function getResendKey(): Promise<string> {
  if (cachedKey) return cachedKey;
  const res = await sm.send(
    new GetSecretValueCommand({ SecretId: RESEND_SECRET_ARN }),
  );
  if (!res.SecretString) throw new Error("Resend API key secret is empty");
  cachedKey = res.SecretString;
  return cachedKey;
}

async function listAllUserEmails(): Promise<string[]> {
  const emails: string[] = [];
  let paginationToken: string | undefined = undefined;
  do {
    const res = await cognito.send(
      new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        AttributesToGet: ["email", "email_verified"],
        Limit: 60,
        PaginationToken: paginationToken,
      }),
    );
    for (const user of res.Users ?? []) {
      const email = user.Attributes?.find((a) => a.Name === "email")?.Value;
      const verified =
        user.Attributes?.find((a) => a.Name === "email_verified")?.Value ===
        "true";
      if (email && verified) emails.push(email);
    }
    paginationToken = res.PaginationToken;
  } while (paginationToken);
  return emails;
}

async function sendOne(
  apiKey: string,
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!res.ok) {
      console.warn(`Resend ${res.status} for ${to}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`fetch threw for ${to}:`, err);
    return false;
  }
}

type AppSyncEvent = {
  arguments: {
    subject: string;
    htmlBody: string;
    recipients?: string[] | null;
  };
};

export const handler = async (event: AppSyncEvent) => {
  const { subject, htmlBody, recipients } = event.arguments;
  if (!subject || !htmlBody) {
    throw new Error("subject and htmlBody are required");
  }

  const targets =
    recipients && recipients.length > 0
      ? recipients
      : await listAllUserEmails();

  const apiKey = await getResendKey();

  // Send sequentially to keep things simple. For larger lists, swap to
  // chunked Promise.all with a concurrency limit.
  let sent = 0;
  let failed = 0;
  for (const to of targets) {
    const ok = await sendOne(apiKey, to, subject, htmlBody);
    if (ok) sent++;
    else failed++;
  }

  return { sent, failed, total: targets.length };
};
