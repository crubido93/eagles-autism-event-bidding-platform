"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { configureAmplify } from "@/lib/amplify";
import AuthShell from "@/components/AuthShell";

function ConfirmInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      configureAmplify();
      await confirmSignUp({ username: email, confirmationCode: code });
      router.push(`/login?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setError(null);
    setInfo(null);
    try {
      configureAmplify();
      await resendSignUpCode({ username: email });
      setInfo("New code sent. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
    }
  }

  return (
    <AuthShell
      title="Confirm your email"
      subtitle="We sent a 6-digit code. Paste it below."
      footer={
        <>
          Wrong account?{" "}
          <Link href="/signup" className="text-eagles-green underline">
            Sign up again
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 outline-none focus:border-eagles-green focus:ring-1 focus:ring-eagles-green dark:border-white/15 dark:bg-eagles-midnight"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
            Code
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 font-mono text-lg tracking-[0.4em] outline-none focus:border-eagles-green focus:ring-1 focus:ring-eagles-green dark:border-white/15 dark:bg-eagles-midnight"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {info ? <p className="text-sm text-eagles-green">{info}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-eagles-green px-4 py-3 font-medium text-white transition hover:bg-eagles-green/90 disabled:opacity-50"
        >
          {loading ? "Confirming…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={onResend}
          className="w-full text-sm text-black/60 underline-offset-2 hover:underline dark:text-white/60"
        >
          Resend code
        </button>
      </form>
    </AuthShell>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmInner />
    </Suspense>
  );
}
