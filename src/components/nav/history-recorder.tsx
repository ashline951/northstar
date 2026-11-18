"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { recordVisitAction } from "@/app/nav-actions";

/** Tells the navigator's History list that it changed. */
export const HISTORY_EVENT = "northstar:nav-history";

/**
 * Adds each page the person opens to their navigator History
 * (docs/standards/left-navigator.md 9.6). Renders nothing. Page titles are
 * saved, so they must never contain sensitive details.
 */
export default function HistoryRecorder() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    // Wait a moment so the new page's title is in place.
    const timer = setTimeout(() => {
      const label = document.title.replace(/\s*·\s*Northstar$/, "").trim();
      const href = search ? `${pathname}?${search}` : pathname;
      recordVisitAction(label, href)
        .then(() => window.dispatchEvent(new Event(HISTORY_EVENT)))
        .catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [pathname, search]);
  return null;
}
