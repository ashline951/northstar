"use client";

import { useEffect, useState } from "react";

/**
 * "10/28/2026, 11:48 AM" with "3 weeks ago" beneath, as the standard requires.
 * Both are computed in the browser - the server does not know the reader's
 * timezone - and the relative line refreshes every minute.
 */
export default function RelativeDate({ iso }: { iso: string }) {
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  return (
    <span className="block leading-tight">
      <span className="block text-[14px] text-[var(--ns-text-primary)]">
        {d.toLocaleString(undefined, {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </span>
      <span className="block text-[12px] text-[var(--ns-text-secondary)]">
        {relative(d)}
      </span>
    </span>
  );
}

function relative(d: Date): string {
  const secs = Math.round((Date.now() - d.getTime()) / 1000);
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let value = secs;
  for (const [size, unit] of steps) {
    if (Math.abs(value) < size) {
      return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
        -Math.round(value),
        unit
      );
    }
    value /= size;
  }
  return "";
}
