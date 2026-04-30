/**
 * Cognito Custom Email Sender — handles every email Cognito would normally
 * send (signup verification, resend code, forgot password, etc.) by
 * decrypting the code with KMS and forwarding through Resend.
 *
 * Triggers handled:
 *   - CustomEmailSender_SignUp
 *   - CustomEmailSender_ResendCode
 *   - CustomEmailSender_ForgotPassword
 *   - CustomEmailSender_UpdateUserAttribute
 *   - CustomEmailSender_VerifyUserAttribute
 *   - CustomEmailSender_AdminCreateUser
 *   - CustomEmailSender_AccountTakeOverNotification (no code, just notice)
 */
import {
  buildClient,
  CommitmentPolicy,
  KmsKeyringNode,
} from "@aws-crypto/client-node";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const { decrypt } = buildClient(
  CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT,
);

const KMS_KEY_ARN = process.env.KMS_KEY_ARN!;
const FROM_EMAIL = process.env.FROM_EMAIL!;
const RESEND_SECRET_ARN = process.env.RESEND_SECRET_ARN!;
const APP_URL = process.env.APP_URL ?? "https://mccloskeyseaf.com";

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

type CognitoCustomEmailEvent = {
  triggerSource: string;
  userName?: string;
  request: {
    code?: string;
    userAttributes: Record<string, string>;
  };
  response?: unknown;
};

type EmailContent = {
  subject: string;
  html: string;
} | null;

function buildEmail(
  triggerSource: string,
  code: string | null,
  displayName: string,
): EmailContent {
  const codeBlock = code
    ? `<div style="margin:24px 0;padding:20px;background:#f5f5f5;border-radius:8px;text-align:center;font-family:monospace;font-size:32px;letter-spacing:8px;font-weight:600;color:#004C54">${code}</div>`
    : "";

  switch (triggerSource) {
    case "CustomEmailSender_SignUp":
    case "CustomEmailSender_ResendCode":
      return {
        subject: "Verify your account — Eagles Autism Foundation Auction",
        html: `
          <p>Hi ${displayName},</p>
          <p>Thanks for signing up for the <strong>Eagles Autism Foundation</strong> auction at McCloskey's. Use the code below to verify your email:</p>
          ${codeBlock}
          <p>This code expires in 24 hours.</p>
          <p>If you didn't request this, you can ignore this email.</p>
          <p>— The team</p>
        `,
      };
    case "CustomEmailSender_ForgotPassword":
      return {
        subject: "Reset your password",
        html: `
          <p>Hi ${displayName},</p>
          <p>You requested a password reset. Use this code:</p>
          ${codeBlock}
          <p>If you didn't request a reset, you can ignore this email.</p>
          <p>— The team</p>
        `,
      };
    case "CustomEmailSender_UpdateUserAttribute":
    case "CustomEmailSender_VerifyUserAttribute":
      return {
        subject: "Verify your new email address",
        html: `
          <p>Hi ${displayName},</p>
          <p>Confirm the change to your account by entering this code:</p>
          ${codeBlock}
          <p>— The team</p>
        `,
      };
    case "CustomEmailSender_AdminCreateUser":
      return {
        subject: "Welcome — your auction account is ready",
        html: `
          <p>Hi ${displayName},</p>
          <p>An account was created for you. Sign in at <a href="${APP_URL}">${APP_URL}</a> with this temporary password:</p>
          ${codeBlock}
          <p>You'll be asked to set a new password after your first sign-in.</p>
        `,
      };
    default:
      return null;
  }
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const apiKey = await getResendKey();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}

export const handler = async (event: CognitoCustomEmailEvent) => {
  const triggerSource = event.triggerSource;
  const userEmail = event.request.userAttributes.email;
  const displayName =
    event.request.userAttributes.name ?? event.userName ?? "there";

  if (!userEmail) {
    console.warn("No email attribute on user — skipping send");
    return event;
  }

  let code: string | null = null;
  if (event.request.code) {
    const keyring = new KmsKeyringNode({ generatorKeyId: KMS_KEY_ARN });
    const ciphertext = Buffer.from(event.request.code, "base64");
    const { plaintext } = await decrypt(keyring, ciphertext);
    code = plaintext.toString("utf-8");
  }

  const email = buildEmail(triggerSource, code, displayName);
  if (!email) {
    console.log(`Skipping unhandled trigger: ${triggerSource}`);
    return event;
  }

  try {
    await sendViaResend(userEmail, email.subject, email.html);
    console.log(`Sent ${triggerSource} email to ${userEmail}`);
  } catch (err) {
    console.error(`Failed to send ${triggerSource} to ${userEmail}:`, err);
    throw err; // surface to Cognito so it can retry/log
  }

  return event;
};
