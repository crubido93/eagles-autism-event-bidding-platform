"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { configureAmplify } from "@/lib/amplify";

export type CurrentUser = {
  userId: string;
  email: string;
  name: string;
  groups: string[];
};

export default function AuthGate({
  children,
}: {
  children: (user: CurrentUser) => ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        configureAmplify();
        const u = await getCurrentUser();
        const session = await fetchAuthSession();
        const claims = session.tokens?.idToken?.payload ?? {};
        const accessClaims = session.tokens?.accessToken?.payload ?? {};
        const groups =
          (accessClaims["cognito:groups"] as string[] | undefined) ??
          (claims["cognito:groups"] as string[] | undefined) ??
          [];
        if (cancelled) return;
        setUser({
          userId: u.userId,
          email: (claims.email as string) ?? u.username,
          name: (claims.name as string) ?? u.username,
          groups,
        });
      } catch {
        router.replace("/login");
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-sm text-black/60 dark:text-white/60">
          Loading…
        </div>
      </div>
    );
  }

  return <>{children(user)}</>;
}
