"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser, signIn, signOut } from "aws-amplify/auth";
import { configureAmplify } from "@/lib/amplify";
import AuthShell from "@/components/AuthShell";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // If already signed in, send them straight to /auction.
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
      try {
        await signIn({ username: email, password });
      } catch (err) {
        // If Amplify says someone's already signed in, sign them out and retry.
        if (
          err instanceof Error &&
          /already a signed in user/i.test(err.message)
        ) {
          await signOut();
          await signIn({ username: email, password });
        } else {
          throw err;
        }
      }
      router.push("/auction");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
      title="Welcome back"
      subtitle="Log in to bid and follow your items."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-eagles-green underline">
            Create an account
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
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
              Password
            </span>
            <Link
              href={
                email
                  ? `/forgot-password?email=${encodeURIComponent(email)}`
                  : "/forgot-password"
              }
              className="text-xs text-eagles-green underline-offset-2 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 outline-none focus:border-eagles-green focus:ring-1 focus:ring-eagles-green dark:border-white/15 dark:bg-eagles-midnight"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-eagles-green px-4 py-3 font-medium text-white transition hover:bg-eagles-green/90 disabled:opacity-50"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
