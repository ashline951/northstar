"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import { replayWelcomeVideo } from "@/lib/welcome";

export default function UserMenu({
  name,
  email,
  image,
  jobTitle,
  signOutAction,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  jobTitle?: string | null;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "block w-full px-4 py-2.5 text-left text-sm text-[var(--ns-text-primary)] hover:bg-black/5 dark:hover:bg-white/10";

  return (
    <div ref={wrap} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-white/10"
      >
        <Avatar src={image} name={name} email={email} size={36} />
        <span className="hidden text-sm font-medium text-[var(--ns-text-inverse)] sm:block">
          {name ?? email}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className="text-[var(--ns-text-inverse)]/70"
        >
          <path
            d="M6 8l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-[var(--ns-border-subtle)] px-4 py-3">
            <Avatar src={image} name={name} email={email} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--ns-text-primary)]">
                {name ?? "Signed in"}
              </p>
              <p className="truncate text-xs text-[var(--ns-text-secondary)]">
                {jobTitle || email}
              </p>
            </div>
          </div>

          <Link href="/profile" role="menuitem" className={item} onClick={() => setOpen(false)}>
            Profile
          </Link>
          <Link href="/preferences" role="menuitem" className={item} onClick={() => setOpen(false)}>
            Preferences
          </Link>
          <button
            role="menuitem"
            className={item}
            onClick={() => {
              setOpen(false);
              replayWelcomeVideo();
            }}
          >
            Watch the Northstar video
          </button>

          <div className="border-t border-[var(--ns-border-subtle)]">
            <form action={signOutAction}>
              <button role="menuitem" type="submit" className={item}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
