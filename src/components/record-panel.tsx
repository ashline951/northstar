"use client";

import { useState } from "react";
import { Activity, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import type { HistoryRow, NorthstarRecord } from "@/lib/records";
import { displayNumber } from "@/lib/records";
import RelativeDate from "./list-view/relative-date";

type TabKey = "activity" | "details";

/**
 * The side panel beside a record - the things that change, kept next to the
 * things that do not. An icon rail picks the tab; more tabs will be added as
 * the record grows (documents, financials, change controls), which is why the
 * rail is a list rather than two hard-coded buttons.
 *
 * On a desktop it sits at the top right beside the record and stays put while
 * the record scrolls. On a phone it sits above the record, never beneath it,
 * so the live part of the page is the first thing seen.
 */
export default function RecordPanel({
  record,
  history,
}: {
  record: NorthstarRecord;
  history: HistoryRow[];
}) {
  const [tab, setTab] = useState<TabKey>("activity");

  const tabs: { key: TabKey; label: string; icon: typeof Activity }[] = [
    { key: "activity", label: "Activity", icon: Activity },
    { key: "details", label: "Details", icon: Info },
  ];

  return (
    <aside
      aria-label="Record panel"
      className="flex max-h-[calc(100vh-6rem)] overflow-hidden rounded-xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] lg:sticky lg:top-4"
    >
      <div
        role="tablist"
        aria-orientation="vertical"
        className="flex shrink-0 flex-col gap-1 border-r border-[var(--ns-border-subtle)] p-2"
      >
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            aria-label={label}
            title={label}
            onClick={() => setTab(key)}
            className={cn(
              "flex size-11 items-center justify-center rounded-lg",
              tab === key
                ? "bg-[var(--ns-nav-primary)]/10 text-[var(--ns-nav-primary)]"
                : "text-[var(--ns-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <Icon aria-hidden className="size-5" />
          </button>
        ))}
      </div>

      <div role="tabpanel" className="min-w-0 flex-1 overflow-y-auto px-5 py-4">
        {tab === "activity" && (
          <>
            <h2 className="text-sm font-semibold text-[var(--ns-text-primary)]">
              Activity
            </h2>
            <ol className="mt-3 divide-y divide-[var(--ns-border-subtle)] text-sm">
              <li className="py-2.5">
                <p className="text-[var(--ns-text-primary)]">Last updated</p>
                <RelativeDate iso={record.updated_at} />
              </li>
              {/* Newest first, so the latest move is at the top. The moves are
                  part of the record - that is the point of one maturing row. */}
              {[...history].reverse().map((h) => (
                <li key={`${h.changed_at}-${h.to_lifecycle}`} className="py-2.5">
                  <p className="text-[var(--ns-text-primary)]">
                    {h.from_lifecycle} became {h.to_lifecycle}
                    {h.changed_by && (
                      <span className="text-[var(--ns-text-secondary)]">
                        {" "}
                        by {h.changed_by}
                      </span>
                    )}
                  </p>
                  <RelativeDate iso={h.changed_at} />
                </li>
              ))}
              <li className="py-2.5">
                <p className="text-[var(--ns-text-primary)]">
                  Created as {history[0]?.from_lifecycle ?? record.lifecycle}
                  {record.created_by && (
                    <span className="text-[var(--ns-text-secondary)]">
                      {" "}
                      by {record.created_by}
                    </span>
                  )}
                </p>
                <RelativeDate iso={record.created_at} />
              </li>
            </ol>
          </>
        )}

        {tab === "details" && (
          <>
            <h2 className="text-sm font-semibold text-[var(--ns-text-primary)]">
              Details
            </h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-[var(--ns-text-secondary)]">Number</dt>
              <dd className="text-[var(--ns-text-primary)]">{displayNumber(record)}</dd>
              <dt className="text-[var(--ns-text-secondary)]">Lifecycle</dt>
              <dd className="text-[var(--ns-text-primary)]">{record.lifecycle}</dd>
              <dt className="text-[var(--ns-text-secondary)]">State</dt>
              <dd className="text-[var(--ns-text-primary)]">{record.state}</dd>
              <dt className="text-[var(--ns-text-secondary)]">Active</dt>
              <dd className="text-[var(--ns-text-primary)]">{record.is_active ? "Yes" : "No"}</dd>
              <dt className="text-[var(--ns-text-secondary)]">Suffix</dt>
              <dd className="text-[var(--ns-text-primary)]">{record.suffix}</dd>
              <dt className="text-[var(--ns-text-secondary)]">Created by</dt>
              <dd className="text-[var(--ns-text-primary)]">{record.created_by ?? "—"}</dd>
            </dl>
            <p className="mt-4 text-xs text-[var(--ns-text-secondary)]">
              The suffix never changes. The prefix follows the lifecycle, so an
              old link still finds this record after promotion.
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
