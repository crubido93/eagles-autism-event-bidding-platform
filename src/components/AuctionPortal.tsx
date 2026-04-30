"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { configureAmplify } from "@/lib/amplify";
import { queries, subscriptions } from "@/lib/graphql";
import type { AuctionItem, Notification } from "@/lib/types";
import type { CurrentUser } from "@/components/AuthGate";
import ItemCard from "./ItemCard";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";

type BidEvent = {
  itemId: string;
  currentBid: number;
  currentBidderId: string;
  currentBidderName: string;
  bidCount: number;
};

export default function AuctionPortal({ user }: { user: CurrentUser }) {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const itemsRef = useRef<AuctionItem[]>([]);
  itemsRef.current = items;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        configureAmplify();
        const client = generateClient();
        const res = await client.graphql({ query: queries.listItems });
        const list = (res as { data: { listItems: AuctionItem[] } }).data
          .listItems;
        if (!active) return;
        setItems(
          [...list].sort(
            (a, b) =>
              new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load items");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    configureAmplify();
    const client = generateClient();
    const sub = client
      .graphql({ query: subscriptions.onBidPlaced })
      // @ts-expect-error: subscription typing varies across amplify versions
      .subscribe({
        next: ({ data }: { data: { onBidPlaced: BidEvent } }) => {
          const evt = data.onBidPlaced;
          const previous = itemsRef.current.find(
            (i) => i.itemId === evt.itemId,
          );
          if (
            previous &&
            previous.currentBidderId === user.userId &&
            evt.currentBidderId !== user.userId
          ) {
            setNotifications((prev) => [
              {
                id: `${evt.itemId}-${Date.now()}`,
                itemId: evt.itemId,
                itemName: previous.name,
                amount: evt.currentBid,
                createdAt: new Date().toISOString(),
                read: false,
              },
              ...prev,
            ]);
          }
          setItems((prev) =>
            prev.map((i) =>
              i.itemId === evt.itemId
                ? {
                    ...i,
                    currentBid: evt.currentBid,
                    currentBidderId: evt.currentBidderId,
                    currentBidderName: evt.currentBidderName,
                    bidCount: evt.bidCount,
                  }
                : i,
            ),
          );
        },
        error: (err: unknown) => {
          // eslint-disable-next-line no-console
          console.warn("subscription error", err);
        },
      });
    return () => sub.unsubscribe();
  }, [user.userId]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const stats = useMemo(() => {
    const leading = items.filter(
      (i) => i.currentBidderId === user.userId,
    ).length;
    const won = items.filter(
      (i) =>
        i.currentBidderId === user.userId &&
        new Date(i.endsAt).getTime() <= Date.now(),
    ).length;
    return { leading, won, total: items.length };
  }, [items, user.userId]);

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-eagles-midnight/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <Logo />
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[200px] truncate text-sm text-black/60 lg:block dark:text-white/60">
              {user.name}
            </span>
            <NotificationBell
              notifications={notifications}
              onMarkAllRead={markAllRead}
            />
            <button
              onClick={async () => {
                await signOut();
                window.location.href = "/";
              }}
              className="rounded-md border border-black/10 px-2.5 py-1.5 text-sm hover:bg-black/5 sm:px-3 sm:py-2 dark:border-white/10 dark:hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-wide sm:text-4xl lg:text-5xl">
              Auction
            </h1>
            <p className="mt-2 max-w-xl text-sm text-black/60 sm:text-base dark:text-white/60">
              Exclusive items and experiences, available for the benefit of the
              Eagles Autism Foundation. Bid as often as you'd like — we'll
              notify you instantly if you're outbid.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:gap-4">
            <Stat label="Items" value={stats.total} />
            <Stat label="Leading" value={stats.leading} />
            <Stat label="Won" value={stats.won} />
          </div>
        </div>

        {error ? (
          <div className="mt-8 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950">
            {error}
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5"
                />
              ))
            : items.map((item) => (
                <ItemCard
                  key={item.itemId}
                  item={item}
                  currentUser={user}
                />
              ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white px-2.5 py-2 sm:px-4 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="font-display text-xl tracking-wide text-eagles-green sm:text-2xl">
        {value}
      </p>
      <p className="text-xs uppercase tracking-widest text-black/50 dark:text-white/50">
        {label}
      </p>
    </div>
  );
}
