"use client";

import { useEffect } from "react";
import { configureAmplify } from "@/lib/amplify";

export default function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    configureAmplify();
  }, []);
  return <>{children}</>;
}
