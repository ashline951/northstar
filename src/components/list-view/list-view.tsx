"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Columns3,
  Download,
  Menu,
  Plus,
  RotateCcw,
  Rows3,
  Search,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  PER_PAGE_OPTIONS,
  type ListQuery,
  type WireColumn,
  type WireRow,
} from "@/lib/list-view/types";
import RelativeDate from "./relative-date";

const DENSITY_KEY = "northstar:list-density";
/** Chosen columns are per list and per browser. */
const colsKey = (listId: string) => `northstar:list-cols:${listId}`;

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
  listId,
  columns,
  rows,
  noun,
  total,
  query,
  title,
  description,
  exportHref,
  createHref,
  createLabel,
}: {
  listId: string;
  columns: WireColumn[];
  rows: WireRow[];
  noun: string;
  total: number;
  query: ListQuery;
  title: string;
  description?: string;
  exportHref: string;
  /** Omitted when the list has nothing to create. */
  createHref?: string;
  createLabel?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [comfortable, setComfortable] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(query.search);
  const [hidden, setHidden] = useState<string[]>([]);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    try {
      setComfortable(localStorage.getItem(DENSITY_KEY) === "comfortable");
      const saved = localStorage.getItem(colsKey(listId));
      // Read after mount, never during render: the server has no localStorage,
      // and differing markup would be a hydration mismatch.
      if (saved) setHidden(JSON.parse(saved) as string[]);
    } catch {
      /* stay compact, show every column */
    }
  }, [listId]);

  // Escape closes the menu, as it would any other popover.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

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

  function toggleColumn(key: string) {
    const next = hidden.includes(key)
      ? hidden.filter((k) => k !== key)
      : [...hidden, key];
    setHidden(next);
    try {
      localStorage.setItem(colsKey(listId), JSON.stringify(next));
    } catch {
      /* preference just will not persist */
    }
    // A search on a column you can no longer see would filter the list with
    // nothing on screen to explain why.
    if (!hidden.includes(key) && query.search[key]) {
      go({ [`q_${key}`]: null });
    }
  }

  function resetView() {
    setHidden([]);
    try {
      localStorage.removeItem(colsKey(listId));
    } catch {
      /* nothing to clear */
    }
    setMenu(false);
    router.push("?");
  }

  const visible = columns.filter((c) => !hidden.includes(c.key));
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

        {/* Sort lives in the column headers, which phones do not show. */}
        <label className="flex items-center gap-1 text-sm text-[var(--ns-text-secondary)] md:hidden">
          Sort by
          <select
            value={`${query.sortKey}.${query.sortDir}`}
            onChange={(e) => go({ sort: e.target.value })}
            className="min-h-7 rounded-md border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-1 text-sm text-[var(--ns-text-primary)]"
          >
            {visible.map((col) => (
              <optgroup key={col.key} label={col.label}>
                <option value={`${col.key}.asc`}>{col.label} ↑</option>
                <option value={`${col.key}.desc`}>{col.label} ↓</option>
              </optgroup>
            ))}
          </select>
        </label>

        {createHref && (
          <Link
            href={createHref}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ns-nav-primary)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus aria-hidden className="size-4" />
            {createLabel ?? "Create new"}
          </Link>
        )}

        <ListMenu
          open={menu}
          setOpen={setMenu}
          columns={columns}
          hidden={hidden}
          onToggleColumn={toggleColumn}
          comfortable={comfortable}
          onToggleDensity={toggleDensity}
          onReset={resetView}
          exportHref={exportHref}
        />

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

      {/* Phones get cards instead; a table that scrolls sideways is the
          thing the standard is most explicit about avoiding. */}
      <div className="hidden min-w-0 overflow-x-auto md:block">
        <table className="w-full border-collapse text-base">
          <thead>
            <tr className="border-b border-[var(--ns-border-subtle)]">
              {visible.map((col) => (
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
              {visible.map((col) => (
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
                // The whole row is the target, as in ServiceNow. The first cell
                // is still a real link, so keyboard and middle-click work and
                // the address is visible on hover.
                onClick={row.href ? () => router.push(row.href!) : undefined}
                className={cn(
                  "border-b border-[var(--ns-border-subtle)]",
                  i % 2 === 1 && "bg-black/[0.025] dark:bg-white/[0.025]",
                  row.href &&
                    "cursor-pointer hover:bg-[var(--ns-nav-primary)]/5"
                )}
              >
                {visible.map((col, ci) => (
                  <Cell
                    key={col.key}
                    col={col}
                    text={row.cells[col.key] ?? ""}
                    pad={cellPad}
                    href={ci === 0 ? row.href : undefined}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* The same rows as cards, below the table's breakpoint. The first
          column is the heading; the rest are label and value pairs. */}
      <ul className="divide-y divide-[var(--ns-border-subtle)] md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="px-4 py-3">
            {row.href ? (
              <Link
                href={row.href}
                className="font-semibold text-[var(--ns-nav-primary)] hover:underline"
              >
                {row.cells[visible[1]?.key ?? visible[0]?.key] ?? ""}
              </Link>
            ) : (
              <p className="font-semibold text-[var(--ns-text-primary)]">
                {row.cells[visible[1]?.key ?? visible[0]?.key] ?? ""}
              </p>
            )}
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
              {visible
                .filter((_, i) => i !== 1)
                .map((col) => (
                  <div key={col.key} className="contents">
                    <dt className="text-[var(--ns-text-secondary)]">
                      {col.label}
                    </dt>
                    <dd className="min-w-0 text-[var(--ns-text-primary)]">
                      {col.type === "date" ? (
                        <RelativeDate iso={row.cells[col.key] ?? ""} />
                      ) : (
                        (row.cells[col.key] ?? "")
                      )}
                    </dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>

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

/**
 * The ☰ list menu. Column choices, row spacing, export and reset live here
 * rather than as loose icons in the toolbar.
 */
function ListMenu({
  open,
  setOpen,
  columns,
  hidden,
  onToggleColumn,
  comfortable,
  onToggleDensity,
  onReset,
  exportHref,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  columns: WireColumn[];
  hidden: string[];
  onToggleColumn: (key: string) => void;
  comfortable: boolean;
  onToggleDensity: () => void;
  onReset: () => void;
  exportHref: string;
}) {
  const item =
    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[var(--ns-text-primary)] hover:bg-black/5 dark:hover:bg-white/5";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="List menu"
        title="List menu"
        className="flex size-8 items-center justify-center rounded-md text-[var(--ns-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
      >
        <Menu aria-hidden className="size-4" />
      </button>

      {open && (
        <>
          {/* Clicking anywhere else closes it. */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 w-64 overflow-hidden rounded-lg border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] py-1 shadow-lg"
          >
            <p className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold tracking-wide text-[var(--ns-text-secondary)] uppercase">
              <Columns3 aria-hidden className="size-3.5" />
              Columns
            </p>
            {columns.map((col) => {
              const on = !hidden.includes(col.key);
              return (
                <button
                  key={col.key}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={on}
                  onClick={() => onToggleColumn(col.key)}
                  className={item}
                >
                  <Check
                    aria-hidden
                    className={cn("size-3.5 shrink-0", !on && "invisible")}
                  />
                  {col.label}
                </button>
              );
            })}

            <div className="my-1 border-t border-[var(--ns-border-subtle)]" />

            <button type="button" role="menuitem" onClick={onToggleDensity} className={item}>
              <Rows3 aria-hidden className="size-3.5 shrink-0" />
              {comfortable ? "Compact rows" : "Comfortable rows"}
            </button>

            <a
              href={exportHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={item}
            >
              <Download aria-hidden className="size-3.5 shrink-0" />
              Export CSV
            </a>

            <button type="button" role="menuitem" onClick={onReset} className={item}>
              <RotateCcw aria-hidden className="size-3.5 shrink-0" />
              Reset to default
            </button>
          </div>
        </>
      )}
    </div>
  );
}


function Cell({
  col,
  text,
  pad,
  href,
}: {
  col: WireColumn;
  text: string;
  pad: string;
  href?: string;
}) {
  return (
    <td className={cn(pad, "align-middle")}>
      {col.type === "date" ? (
        <RelativeDate iso={text} />
      ) : href ? (
        <Link
          href={href}
          className="block truncate font-medium text-[var(--ns-nav-primary)] hover:underline"
          title={text}
        >
          {text}
        </Link>
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
    <div className="flex min-w-0 flex-wrap items-center gap-1 text-sm text-[var(--ns-text-secondary)]">
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

      <button
        className={cn(btn, "hidden sm:block")}
        onClick={() => onPage(1)}
        disabled={page === 1}
      >
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
        className={cn(btn, "hidden sm:block")}
        onClick={() => onPage(pages)}
        disabled={page >= pages}
      >
        Last
      </button>
    </div>
  );
}
