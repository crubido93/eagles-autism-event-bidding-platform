"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, signUp } from "aws-amplify/auth";
import { configureAmplify } from "@/lib/amplify";
import AuthShell from "@/components/AuthShell";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // If already signed in, redirect to /auction (same pattern as /login).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        configureAmplify();
        await getCurrentUser();
        if (!cancelled) router.replace("/auction");
      } catch {
        if (!cancelled) setCheckingSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      configureAmplify();
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email, name },
        },
      });
      router.push(`/confirm?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="grid min-h-screen place-items-center text-sm text-black/60 dark:text-white/60">
        Loading…
      </main>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="So we can notify you the moment you're outbid."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-eagles-green underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Full name"
          type="text"
          value={name}
          onChange={setName}
          required
        />
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          hint="Min 8 chars, with a number and a symbol."
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-eagles-green px-4 py-3 font-medium text-white transition hover:bg-eagles-green/90 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  required,
  hint,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-base outline-none focus:border-eagles-green focus:ring-1 focus:ring-eagles-green dark:border-white/15 dark:bg-eagles-midnight"
      />
      {hint ? (
        <span className="mt-1 block text-xs text-black/50 dark:text-white/50">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
