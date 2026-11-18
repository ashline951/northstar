"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Download, Rows3, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  PER_PAGE_OPTIONS,
  type ListQuery,
  type WireColumn,
  type WireRow,
} from "@/lib/list-view/types";
import RelativeDate from "./relative-date";

const DENSITY_KEY = "northstar:list-density";

/**
 * The one list view - docs/standards/list-view.md. Every list renders this;
 * none gets its own table.
 *
 * Sort, search and page all live in the URL, so a view can be bookmarked or
 * sent to someone and Back works. Changing any of them is a navigation, which
 * means the server re-reads and re-validates them rather than trusting state
 * held in the browser.
 *
 * Built so far: columns from the registry, per-column search with the full
 * operator set, sort, paging, density, CSV export. Not yet: the filter
 * builder, group by, right-click actions, saved views and the AI panel.
 */
export default function ListView({
  columns,
  rows,
  noun,
  total,
  query,
  title,
  description,
  exportHref,
}: {
  columns: WireColumn[];
  rows: WireRow[];
  noun: string;
  total: number;
  query: ListQuery;
  title: string;
  description?: string;
  exportHref: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [comfortable, setComfortable] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(query.search);

  useEffect(() => {
    try {
      setComfortable(localStorage.getItem(DENSITY_KEY) === "comfortable");
    } catch {
      /* stay compact */
    }
  }, []);

  useEffect(() => setDraft(query.search), [query.search]);

  function go(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    // Any change other than the page itself returns to page one, or you can
    // end up on page 5 of a 2-page result.
    if (!("page" in changes)) next.delete("page");
    router.push(`?${next.toString()}`);
  }

  function toggleDensity() {
    const next = !comfortable;
    setComfortable(next);
    try {
      localStorage.setItem(DENSITY_KEY, next ? "comfortable" : "compact");
    } catch {
      /* preference just will not persist */
    }
  }

  const pages = Math.max(1, Math.ceil(total / query.perPage));
  const from = total === 0 ? 0 : (query.page - 1) * query.perPage + 1;
  const to = Math.min(query.page * query.perPage, total);
  const filtered = Object.keys(query.search).length > 0;

  const cellPad = comfortable ? "px-3 py-2.5" : "px-3 py-1";

  return (
    <div className="flex min-w-0 flex-col">
      {/* One slim toolbar. The count lives in the pager, not beside the title. */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--ns-border-subtle)] px-4 py-2">
        <h1 className="ns-display text-[24px] leading-tight text-[var(--ns-text-primary)]">
          {title}
        </h1>
        {description && (
          <span className="text-sm text-[var(--ns-text-secondary)]">
            {description}
          </span>
        )}

        <span className="flex-1" />

        <button
          type="button"
          onClick={toggleDensity}
          title={comfortable ? "Compact rows" : "Comfortable rows (tablets, gloves)"}
          aria-label={comfortable ? "Compact rows" : "Comfortable rows"}
          className="flex size-8 items-center justify-center rounded-md text-[var(--ns-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
        >
          <Rows3 aria-hidden className="size-4" />
        </button>

        <a
          href={exportHref}
          title="Export CSV"
          aria-label="Export CSV"
          className="flex size-8 items-center justify-center rounded-md text-[var(--ns-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
        >
          <Download aria-hidden className="size-4" />
        </a>

        <Pager
          page={query.page}
          pages={pages}
          from={from}
          to={to}
          total={total}
          noun={noun}
          perPage={query.perPage}
          onPage={(p) => go({ page: p === 1 ? null : String(p) })}
          onPerPage={(n) => go({ per: String(n), page: null })}
        />
      </div>

      <div aria-live="polite" className="sr-only">
        {filtered
          ? `${total} ${noun} match your search`
          : `${total} ${noun}`}
      </div>

      <div className="min-w-0 overflow-x-auto">
        <table className="w-full border-collapse text-base">
          <thead>
            <tr className="border-b border-[var(--ns-border-subtle)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  aria-sort={
                    query.sortKey === col.key
                      ? query.sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="h-7 px-3 text-left align-middle font-semibold text-[var(--ns-text-primary)]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      go({
                        sort: `${col.key}.${
                          query.sortKey === col.key && query.sortDir === "asc"
                            ? "desc"
                            : "asc"
                        }`,
                      })
                    }
                    className="flex items-center gap-1 rounded hover:text-[var(--ns-nav-primary)]"
                  >
                    {col.label}
                    {query.sortKey === col.key &&
                      (query.sortDir === "asc" ? (
                        <ArrowUp aria-hidden className="size-3.5" />
                      ) : (
                        <ArrowDown aria-hidden className="size-3.5" />
                      ))}
                  </button>
                </th>
              ))}
            </tr>

            {/* A search box under every header, as in ServiceNow. Enter runs
                it; there is no Search button. */}
            <tr className="border-b border-[var(--ns-border-subtle)]">
              {columns.map((col) => (
                <th key={col.key} scope="col" className="px-2 py-1">
                  <div className="relative">
                    <Search
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-[var(--ns-text-secondary)]"
                    />
                    <input
                      value={draft[col.key] ?? ""}
                      onChange={(e) =>
                        setDraft({ ...draft, [col.key]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          go({ [`q_${col.key}`]: draft[col.key] ?? null });
                        }
                      }}
                      aria-label={`Search ${col.label}`}
                      title={`contains · =exact · != not · * ? wildcards`}
                      className="h-7 w-full rounded-md border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] pr-2 pl-7 text-sm font-normal text-[var(--ns-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ns-nav-primary)]"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-[var(--ns-border-subtle)]",
                  i % 2 === 1 && "bg-black/[0.025] dark:bg-white/[0.025]"
                )}
              >
                {columns.map((col) => (
                  <Cell
                    key={col.key}
                    col={col}
                    text={row.cells[col.key] ?? ""}
                    pad={cellPad}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-[var(--ns-text-primary)]">
            No {noun} match
          </p>
          {filtered && (
            <button
              onClick={() => router.push("?")}
              className="mt-3 text-sm text-[var(--ns-nav-primary)] underline-offset-2 hover:underline"
            >
              Show all {noun}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Cell({
  col,
  text,
  pad,
}: {
  col: WireColumn;
  text: string;
  pad: string;
}) {
  return (
    <td className={cn(pad, "align-middle")}>
      {col.type === "date" ? (
        <RelativeDate iso={text} />
      ) : (
        <span className="block truncate" title={text}>
          {text}
        </span>
      )}
    </td>
  );
}

function Pager({
  page,
  pages,
  from,
  to,
  total,
  noun,
  perPage,
  onPage,
  onPerPage,
}: {
  page: number;
  pages: number;
  from: number;
  to: number;
  total: number;
  noun: string;
  perPage: number;
  onPage: (p: number) => void;
  onPerPage: (n: number) => void;
}) {
  const btn =
    "min-h-7 rounded-md px-2 text-sm text-[var(--ns-text-secondary)] hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/5";

  // Up to five page numbers, centred on the current page.
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = Array.from(
    { length: Math.min(5, pages) },
    (_, i) => start + i
  ).filter((n) => n >= 1 && n <= pages);

  return (
    <div className="flex items-center gap-1 text-sm text-[var(--ns-text-secondary)]">
      <label className="sr-only" htmlFor="per-page">
        Rows per page
      </label>
      <select
        id="per-page"
        value={perPage}
        onChange={(e) => onPerPage(Number(e.target.value))}
        className="min-h-7 rounded-md border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-1 text-sm text-[var(--ns-text-primary)]"
      >
        {PER_PAGE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <span className="px-2 whitespace-nowrap">
        {from}–{to} of {total} {noun}
      </span>

      <button className={btn} onClick={() => onPage(1)} disabled={page === 1}>
        First
      </button>
      <button
        className={btn}
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
      >
        Prev
      </button>
      {numbers.map((n) => (
        <button
          key={n}
          onClick={() => onPage(n)}
          aria-current={n === page ? "page" : undefined}
          className={cn(
            btn,
            n === page &&
              "bg-[var(--ns-nav-primary-tint)] font-semibold text-[var(--ns-nav-primary)]"
          )}
        >
          {n}
        </button>
      ))}
      <button
        className={btn}
        onClick={() => onPage(page + 1)}
        disabled={page >= pages}
      >
        Next
      </button>
      <button
        className={btn}
        onClick={() => onPage(pages)}
        disabled={page >= pages}
      >
        Last
      </button>
    </div>
  );
}
