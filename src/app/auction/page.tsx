"use client";

import AuthGate from "@/components/AuthGate";
import AuctionPortal from "@/components/AuctionPortal";

export default function AuctionPage() {
  return <AuthGate>{(user) => <AuctionPortal user={user} />}</AuthGate>;
}
