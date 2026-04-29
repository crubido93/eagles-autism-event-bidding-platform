"use client";

import Image from "next/image";
import Link from "next/link";
import Countdown from "./Countdown";
import type { AuctionItem } from "@/lib/types";

type Props = {
  item: AuctionItem;
  currentUser: { userId: string };
};

export default function ItemCard({ item, currentUser }: Props) {
  const ended = new Date(item.endsAt).getTime() <= Date.now();
  const isLeader = item.currentBidderId === currentUser.userId;
  const won = ended && isLeader;

  return (
    <Link
      href={`/auction/${item.itemId}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5 dark:bg-white/[0.03]">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-contain p-3 transition group-hover:scale-105"
        />
        {won ? (
          <span className="absolute left-3 top-3 rounded-full bg-eagles-green px-3 py-1 text-xs font-medium text-white shadow">
            🏆 You won!
          </span>
        ) : ended ? (
          <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
            Closed
          </span>
        ) : isLeader ? (
          <span className="absolute left-3 top-3 rounded-full bg-eagles-green px-3 py-1 text-xs font-medium text-white">
            You're the high bidder
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl tracking-wide">{item.name}</h3>
          <span className="shrink-0 rounded-full border border-eagles-green/30 bg-eagles-green/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-eagles-green">
            Est.{" "}
            {item.estimatedValue
              ? `$${item.estimatedValue.toLocaleString()}`
              : "Priceless"}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-black/60 dark:text-white/60">
          {item.description}
        </p>
        <div className="mt-auto grid grid-cols-2 gap-3 border-t border-black/10 pt-3 text-sm dark:border-white/10">
          <div>
            <p className="text-xs uppercase tracking-widest text-black/50 dark:text-white/50">
              Current bid
            </p>
            <p className="font-display text-2xl tracking-wide text-eagles-green">
              ${item.currentBid.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-black/50 dark:text-white/50">
              {ended ? "Ended" : "Ends in"}
            </p>
            <p className="text-base">
              <Countdown endsAt={item.endsAt} />
            </p>
          </div>
        </div>
        <p className="text-xs text-black/50 dark:text-white/50">
          Starting bid ${item.startingBid.toLocaleString()} · {item.bidCount}{" "}
          bid{item.bidCount === 1 ? "" : "s"}
        </p>
      </div>
    </Link>
  );
}
