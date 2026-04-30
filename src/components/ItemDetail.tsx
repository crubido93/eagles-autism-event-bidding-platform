"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { generateClient } from "aws-amplify/api";
import { configureAmplify } from "@/lib/amplify";
import { mutations, queries, subscriptions } from "@/lib/graphql";
import type { AuctionItem } from "@/lib/types";
import type { CurrentUser } from "@/components/AuthGate";
import Countdown from "./Countdown";
import Logo from "./Logo";

const MIN_INCREMENT = 5;

export default function ItemDetail({
  itemId,
  user,
}: {
  itemId: string;
  user: CurrentUser;
}) {
  const [item, setItem] = useState<AuctionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [outbid, setOutbid] = useState(false);
  const lastSeenBid = useRef<number | null>(null);
  const wasLeader = useRef<boolean | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        configureAmplify();
        const client = generateClient();
        const res = await client.graphql({
          query: queries.getItem,
          variables: { itemId },
        });
        const data = (res as { data: { getItem: AuctionItem } }).data.getItem;
        if (!active) return;
        setItem(data);
        setBidAmount(Math.max(data.currentBid + MIN_INCREMENT, data.startingBid));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load item");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [itemId]);

  useEffect(() => {
    configureAmplify();
    const client = generateClient();
    const sub = client
      .graphql({ query: subscriptions.onBidPlaced })
      // @ts-expect-error: subscription typing varies
      .subscribe({
        next: ({ data }: { data: { onBidPlaced: AuctionItem } }) => {
          const evt = data.onBidPlaced;
          if (evt.itemId !== itemId) return;
          setItem((prev) =>
            prev
              ? {
                  ...prev,
                  currentBid: evt.currentBid,
                  currentBidderId: evt.currentBidderId,
                  currentBidderName: evt.currentBidderName,
                  bidCount: evt.bidCount,
                }
              : prev,
          );
          // Auto-bump the typed bid amount if it's now below the new minimum
          // so the user can't accidentally submit an invalid bid after being outbid.
          setBidAmount((current) => {
            const newMinimum = evt.currentBid + MIN_INCREMENT;
            return current < newMinimum ? newMinimum : current;
          });
        },
        error: () => {},
      });
    return () => sub.unsubscribe();
  }, [itemId]);

  // Flash the current-bid stat whenever it changes (subscription, mutation response, or initial load).
  // Also detect outbid-while-on-page so we can show an inline warning in the bid form,
  // and clear that warning the moment the user reclaims the lead.
  useEffect(() => {
    if (!item) return;
    if (lastSeenBid.current !== null && lastSeenBid.current !== item.currentBid) {
      setFlashKey((k) => k + 1);
    }
    lastSeenBid.current = item.currentBid;

    const isLeaderNow = item.currentBidderId === user.userId;
    if (
      wasLeader.current === true &&
      !isLeaderNow &&
      item.currentBidderId !== null
    ) {
      setOutbid(true); // persistent — only cleared when user becomes leader again
    } else if (isLeaderNow && outbid) {
      setOutbid(false);
    }
    wasLeader.current = isLeaderNow;
  }, [item, user.userId, outbid]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!item) return;
    setError(null);
    if (bidAmount < item.currentBid + MIN_INCREMENT) {
      setError(
        `Bid must be at least $${(item.currentBid + MIN_INCREMENT).toLocaleString()}`,
      );
      return;
    }
    setSubmitting(true);
    try {
      configureAmplify();
      const client = generateClient();
      const res = await client.graphql({
        query: mutations.placeBid,
        variables: {
          itemId,
          amount: bidAmount,
          bidderName: user.name,
        },
      });
      const evt = (
        res as {
          data: {
            placeBid: {
              currentBid: number;
              currentBidderId: string;
              currentBidderName: string;
              bidCount: number;
            };
          };
        }
      ).data.placeBid;
      // Optimistic local update — don't wait for the subscription roundtrip
      setItem((prev) =>
        prev
          ? {
              ...prev,
              currentBid: evt.currentBid,
              currentBidderId: evt.currentBidderId,
              currentBidderName: evt.currentBidderName,
              bidCount: evt.bidCount,
            }
          : prev,
      );
      setBidAmount(evt.currentBid + MIN_INCREMENT);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place bid");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-black/60 dark:text-white/60">
        Loading item…
      </div>
    );
  }

  if (!item) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="text-sm text-red-600">{error ?? "Item not found"}</p>
      </div>
    );
  }

  const ended = new Date(item.endsAt).getTime() <= Date.now();
  const isLeader = item.currentBidderId === user.userId;
  const won = ended && isLeader;
  const lost = ended && !isLeader && item.currentBidderId !== null;

  return (
    <main className="min-h-screen">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-eagles-midnight/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Logo />
          <Link
            href="/auction"
            className="shrink-0 text-sm text-black/60 hover:text-eagles-green dark:text-white/60"
          >
            <span className="sm:hidden">← Back</span>
            <span className="hidden sm:inline">← Back to auction</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:gap-10 sm:px-6 sm:py-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="self-start overflow-hidden rounded-2xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-eagles-green/30 bg-eagles-green/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-eagles-green">
              Estimated value:{" "}
              {item.estimatedValue
                ? `$${item.estimatedValue.toLocaleString()}`
                : "Priceless"}
            </span>
            {isLeader && !ended ? (
              <span className="inline-flex items-center rounded-full bg-eagles-green px-3 py-1 text-xs font-medium uppercase tracking-wider text-white shadow-sm">
                🏆 You're the high bidder
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 font-display text-3xl tracking-wide sm:text-4xl lg:text-5xl">
            {item.name}
          </h1>
          <p className="mt-3 text-sm text-black/70 sm:mt-4 sm:text-base dark:text-white/70">
            {item.description}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-black/10 bg-white p-4 sm:mt-8 sm:gap-4 sm:p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <Stat
              label="Starting bid"
              value={`$${item.startingBid.toLocaleString()}`}
            />
            <div key={flashKey} className={flashKey > 0 ? "bid-flash" : ""}>
              <Stat
                label="Current bid"
                value={`$${item.currentBid.toLocaleString()}`}
                accent
              />
            </div>
            <Stat
              label={ended ? "Ended" : "Ends in"}
              value={<Countdown endsAt={item.endsAt} />}
            />
            <Stat label="Bids" value={`${item.bidCount}`} />
          </div>

          {won ? (
            <div className="mt-6 rounded-xl border border-eagles-green/40 bg-eagles-green/10 p-5">
              <p className="font-display text-2xl tracking-wide text-eagles-green">
                🏆 You won!
              </p>
              <p className="mt-1 text-sm">
                Final bid ${item.currentBid.toLocaleString()}. We'll be in
                touch with payment + pickup details.
              </p>
            </div>
          ) : lost ? (
            <div className="mt-6 rounded-xl border border-black/10 bg-black/5 p-5 dark:border-white/10 dark:bg-white/5">
              <p className="font-display text-xl tracking-wide">
                Bidding closed
              </p>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                Won by {item.currentBidderName} at $
                {item.currentBid.toLocaleString()}.
              </p>
            </div>
          ) : ended ? (
            <div className="mt-6 rounded-xl border border-black/10 bg-black/5 p-5 dark:border-white/10 dark:bg-white/5">
              <p className="font-display text-xl tracking-wide">
                Bidding closed — no bids placed
              </p>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mt-6 rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <p className="text-xs uppercase tracking-widest text-black/50 dark:text-white/50">
                Place a bid
              </p>

              {outbid ? (
                <div className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  ⚠️ You were just outbid by{" "}
                  <span className="font-semibold">
                    {item.currentBidderName ?? "another bidder"}
                  </span>
                  . New minimum is ${(item.currentBid + MIN_INCREMENT).toLocaleString()}.
                </div>
              ) : null}

              <p
                key={`min-${flashKey}`}
                className={`mt-1 text-sm text-black/60 dark:text-white/60 ${
                  flashKey > 0 ? "bid-flash" : ""
                }`}
              >
                Minimum next bid: $
                {(item.currentBid + MIN_INCREMENT).toLocaleString()}
              </p>

              {item.currentBidderName ? (
                <p className="mt-1 text-xs text-black/50 dark:text-white/50">
                  Currently leading:{" "}
                  <span
                    className={
                      isLeader
                        ? "font-semibold text-eagles-green"
                        : "font-medium"
                    }
                  >
                    {isLeader ? "You" : item.currentBidderName}
                  </span>
                </p>
              ) : null}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40">
                    $
                  </span>
                  <input
                    type="number"
                    step="1"
                    min={item.currentBid + MIN_INCREMENT}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    className="w-full rounded-md border border-black/15 bg-white py-3 pl-7 pr-3 text-lg outline-none focus:border-eagles-green focus:ring-1 focus:ring-eagles-green dark:border-white/15 dark:bg-eagles-midnight"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-eagles-green px-6 py-3 font-medium text-white transition hover:bg-eagles-green/90 disabled:opacity-50"
                >
                  {submitting ? "Placing…" : "Place bid"}
                </button>
              </div>
              {error ? (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              ) : null}
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-black/50 dark:text-white/50">
        {label}
      </p>
      <p
        className={`font-display text-2xl tracking-wide ${
          accent ? "text-eagles-green" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
