"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VIEW_GROUPS } from "@/lib/views";

/**
 * Left navigation: a parent per lifecycle, with its list views beneath.
 * Driven entirely by VIEW_GROUPS, so adding a view adds a nav entry.
 */
export default function SideNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Records"
      className="shrink-0 border-r border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-3 py-6 md:w-60"
    >
      <Link
        href="/project"
        className={`mb-4 block rounded-lg px-3 py-2 text-sm font-medium ${
          pathname === "/project"
            ? "bg-[var(--ns-gold-glow)]/15 text-[var(--ns-text-primary)]"
            : "text-[var(--ns-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
        }`}
      >
        Northstar Project
      </Link>

      {VIEW_GROUPS.map((group) => (
        <div key={group.lifecycle} className="mb-5">
          <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-[var(--ns-text-secondary)] uppercase">
            {group.lifecycle}s
          </p>
          <ul>
            {group.views.map((v) => {
              const href = `/records/${v.key}`;
              const active = pathname === href;
              return (
                <li key={v.key}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-lg px-3 py-1.5 text-sm ${
                      active
                        ? "bg-[var(--ns-gold-glow)]/15 font-medium text-[var(--ns-text-primary)]"
                        : "text-[var(--ns-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {v.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
