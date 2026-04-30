"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Notification } from "@/lib/types";

export default function NotificationBell({
  notifications,
  onMarkAllRead,
}: {
  notifications: Notification[];
  onMarkAllRead: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        aria-label={`Notifications, ${unread} unread`}
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && unread > 0) onMarkAllRead();
        }}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white transition hover:border-eagles-green hover:text-eagles-green dark:border-white/10 dark:bg-white/[0.05]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-black/10 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-eagles-midnight">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-black/60 dark:text-white/60">
              No notifications yet.
            </p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {notifications.slice(0, 10).map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/auction/${n.itemId}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg p-3 transition hover:bg-eagles-green/10 dark:hover:bg-white/5"
                  >
                    <p className="text-sm font-medium">
                      You were outbid on{" "}
                      <span className="text-eagles-green underline-offset-2 group-hover:underline">
                        {n.itemName}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-black/60 dark:text-white/60">
                      New high bid: ${n.amount.toLocaleString()} ·{" "}
                      {timeAgo(n.createdAt)}
                    </p>
                    <p className="mt-1 text-xs font-medium text-eagles-green">
                      Bid again →
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
