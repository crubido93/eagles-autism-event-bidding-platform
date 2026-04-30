"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { generateClient } from "aws-amplify/api";
import AuthGate, { type CurrentUser } from "@/components/AuthGate";
import Logo from "@/components/Logo";
import { configureAmplify } from "@/lib/amplify";
import { mutations } from "@/lib/graphql";

export default function AdminBlastPage() {
  return <AuthGate>{(user) => <BlastForm user={user} />}</AuthGate>;
}

const DEFAULT_SUBJECT =
  "Saturday at McCloskey's — Auction is open. Bid for the Eagles Autism Foundation.";

const DEFAULT_HTML = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f3f4f6;padding:24px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0b2027;">
  <tr><td align="center">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <tr><td style="padding:32px 32px 0;text-align:center;">
        <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:2px;color:#004C54;text-transform:uppercase;">Saturday · May 2 · 7 PM</p>
        <h1 style="margin:12px 0 0;font-size:32px;line-height:1.15;font-weight:800;color:#0b2027;">A night for the<br/><span style="color:#004C54;">Eagles Autism Foundation</span></h1>
        <p style="margin:16px 0 0;font-size:16px;line-height:1.55;color:#4b5563;">Join us at McCloskey's in Ardmore for an evening with familiar friends and faces — Super Bowl raffles, exclusive auctions, and special guests stopping by. <strong>100% of proceeds</strong> go to autism research and care.</p>
      </td></tr>
      <tr><td style="padding:28px 32px 0;text-align:center;">
        <a href="https://mccloskeyseaf.com/signup" style="display:inline-block;background:#004C54;color:#ffffff;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:16px;">Sign up &amp; start bidding →</a>
      </td></tr>
      <tr><td style="padding:24px 32px 32px;text-align:center;">
        <a href="https://mccloskeyseaf.com/auction" style="display:inline-block;background:#004C54;color:#ffffff;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:16px;margin:0 6px 8px;">View the auction</a>
        <a href="https://fundraisers.eaglesautismfoundation.org/jimmer-mccafferty-6" style="display:inline-block;background:#ffffff;color:#004C54;font-weight:600;text-decoration:none;padding:13px 27px;border-radius:8px;font-size:16px;border:1px solid #004C54;margin:0 6px 8px;">Donate directly</a>
      </td></tr>
      <tr><td style="background:#0b2027;color:#9ca3af;padding:24px 32px;text-align:center;font-size:13px;line-height:1.6;">
        <p style="margin:0;color:#ffffff;font-weight:700;letter-spacing:1.5px;">EAGLES AUTISM FOUNDATION</p>
        <p style="margin:6px 0 0;">Shifting from autism awareness to action.</p>
      </td></tr>
    </table>
  </td></tr>
</table>`;

function BlastForm({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const isAdmin = user.groups.includes("admins");

  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [htmlBody, setHtmlBody] = useState(DEFAULT_HTML);
  const [recipientsRaw, setRecipientsRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    { sent: number; failed: number; total: number } | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  if (!isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="max-w-md rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <h1 className="font-display text-2xl tracking-wide">Not authorized</h1>
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">
            This page is restricted to admins. If you were just added, sign out
            and back in to refresh your token.
          </p>
          <button
            onClick={() => router.push("/auction")}
            className="mt-6 rounded-md bg-eagles-green px-5 py-2.5 text-sm font-medium text-white"
          >
            Back to auction
          </button>
        </div>
      </main>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      configureAmplify();
      const client = generateClient();
      const recipients = recipientsRaw
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await client.graphql({
        query: mutations.sendEmailBlast,
        variables: {
          subject,
          htmlBody,
          recipients: recipients.length > 0 ? recipients : null,
        },
      });
      const data = (
        res as {
          data: {
            sendEmailBlast: { sent: number; failed: number; total: number };
          };
        }
      ).data.sendEmailBlast;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-eagles-midnight/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Logo />
          <Link
            href="/auction"
            className="text-sm text-black/60 hover:text-eagles-green dark:text-white/60"
          >
            ← Back to auction
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
              Email blast
            </h1>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              Send a one-off email to a list of recipients (or all registered
              users if Recipients is left blank).
            </p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]"
        >
          <div className="space-y-5">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
                Subject
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 outline-none focus:border-eagles-green focus:ring-1 focus:ring-eagles-green dark:border-white/15 dark:bg-eagles-midnight"
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
                  HTML body
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreview((v) => !v)}
                  className="text-xs text-eagles-green underline-offset-2 hover:underline"
                >
                  {showPreview ? "Hide preview" : "Show preview"}
                </button>
              </div>
              <textarea
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                required
                rows={16}
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-eagles-green focus:ring-1 focus:ring-eagles-green dark:border-white/15 dark:bg-eagles-midnight"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
                Recipients
              </span>
              <textarea
                value={recipientsRaw}
                onChange={(e) => setRecipientsRaw(e.target.value)}
                rows={3}
                placeholder="comma- or newline-separated emails. Leave blank to send to all registered users."
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-eagles-green focus:ring-1 focus:ring-eagles-green dark:border-white/15 dark:bg-eagles-midnight"
              />
              <span className="mt-1 block text-xs text-black/50 dark:text-white/50">
                Leaving this empty blasts to every email-verified user in the
                Cognito User Pool.
              </span>
            </label>

            {error ? (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950">
                {error}
              </div>
            ) : null}

            {result ? (
              <div className="rounded-lg border border-eagles-green/40 bg-eagles-green/10 p-3 text-sm">
                ✅ Sent <strong>{result.sent}</strong> of{" "}
                <strong>{result.total}</strong>
                {result.failed > 0 ? (
                  <>
                    {" "}
                    — <strong>{result.failed}</strong> failed
                  </>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-eagles-green px-5 py-3 font-medium text-white hover:bg-eagles-green/90 disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send blast"}
            </button>
          </div>

          {showPreview ? (
            <div className="space-y-2 lg:sticky lg:top-24 lg:self-start">
              <p className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
                Preview
              </p>
              <div className="overflow-hidden rounded-md border border-black/10 bg-white dark:border-white/10">
                <iframe
                  srcDoc={htmlBody}
                  title="Email preview"
                  className="h-[800px] w-full"
                  sandbox=""
                />
              </div>
            </div>
          ) : null}
        </form>
      </section>
    </main>
  );
}
