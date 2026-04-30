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
const FROM_NAME = process.env.FROM_NAME ?? "Eagles Autism Foundation";
const REPLY_TO = process.env.REPLY_TO ?? "info@eaglesautismfoundation.org";
const APP_URL = process.env.APP_URL ?? "https://mccloskeyseaf.com";
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

function buildHtml(originalHtml: string, recipient: string): string {
  // Append a CAN-SPAM compliant footer if the body doesn't already
  // include "unsubscribe" — gives every blast a visible opt-out + address.
  if (/unsubscribe/i.test(originalHtml)) return originalHtml;
  const unsubUrl = `${APP_URL}/unsubscribe?email=${encodeURIComponent(recipient)}`;
  const footer = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:24px;font-family:-apple-system,sans-serif;font-size:12px;line-height:1.5;color:#6b7280;text-align:center;">
      <tr><td style="padding:16px;">
        <p style="margin:0;">You're receiving this because you signed up at ${APP_URL} or attended an Eagles Autism Foundation event.</p>
        <p style="margin:8px 0 0;"><a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a> · McCloskey's Pub, 17 Cricket Ave, Ardmore, PA 19003</p>
      </td></tr>
    </table>
  `;
  return originalHtml + footer;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sendOne(
  apiKey: string,
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const unsubUrl = `${APP_URL}/unsubscribe?email=${encodeURIComponent(to)}`;
  const body = JSON.stringify({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject,
    html: buildHtml(html, to),
    reply_to: REPLY_TO,
    headers: {
      "List-Unsubscribe": `<mailto:unsubscribe@info.mccloskeyseaf.com?subject=unsubscribe>, <${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  // Up to 3 attempts with exponential backoff on 429s
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body,
      });
      if (res.ok) return true;
      if (res.status === 429 && attempt < 3) {
        await sleep(1000 * attempt); // 1s, then 2s
        continue;
      }
      console.warn(`Resend ${res.status} for ${to}: ${await res.text()}`);
      return false;
    } catch (err) {
      console.error(`fetch threw for ${to}:`, err);
      if (attempt < 3) {
        await sleep(500);
        continue;
      }
      return false;
    }
  }
  return false;
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

  // Resend free tier caps at 5 req/sec — we throttle to 4/sec (250ms gap)
  // to leave headroom and avoid 429s. Plus per-call backoff retry inside
  // sendOne handles the occasional transient 429.
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < targets.length; i++) {
    const to = targets[i];
    const ok = await sendOne(apiKey, to, subject, htmlBody);
    if (ok) sent++;
    else failed++;
    if (i < targets.length - 1) await sleep(250);
  }

  return { sent, failed, total: targets.length };
};
