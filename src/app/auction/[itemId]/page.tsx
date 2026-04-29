"use client";

import { use } from "react";
import AuthGate from "@/components/AuthGate";
import ItemDetail from "@/components/ItemDetail";

export default function ItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = use(params);
  return (
    <AuthGate>
      {(user) => <ItemDetail itemId={itemId} user={user} />}
    </AuthGate>
  );
}
