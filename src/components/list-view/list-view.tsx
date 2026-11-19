"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Columns3,
  Copy,
  Download,
  Filter,
  Layers,
  Menu,
  Plus,
  RotateCcw,
  Rows3,
  Search,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  MAX_GROUPS,
  PER_PAGE_OPTIONS,
  groupRows,
  type ListQuery,
  type WireColumn,
  type WireRow,
} from "@/lib/list-view/types";
import {
  EMPTY_FILTER,
  appendStep,
  describeNode,
  isEmptyFilter,
  throughStep,
  withoutStep,
  type Condition,
  type Group,
} from "@/lib/list-view/filter";
import {
  resetMyLayoutAction,
  saveMyColumnsAction,
  saveMyViewAction,
  setDefaultLayoutAction,
} from "@/app/records/list-actions";
import RelativeDate from "./relative-date";
import FilterBuilder from "./filter-builder";
import ColumnPicker from "./column-picker";
import Favorites, { type Favorite } from "./favorites";
import AiPanel from "./ai-panel";
import Sparkle from "./sparkle";

const DENSITY_KEY = "northstar:list-density";

/**
 * The one list view - docs/standards/list-view.md. Every list renders this;
 * none gets its own table.
 *
 * Filter, sort, group, rows, searches and page all live in the URL (section
 * 12), so a view can be bookmarked or sent to someone and Back works.
 * Changing any of them is a navigation, which means the server re-reads and
 * re-validates them rather than trusting state held in the browser. The same
 * changes are saved to the person's view as they go - there is no Save
 * button for anything but columns.
 *
 * Northstar deviation, recorded in CLAUDE.md: this is hand-written rather
 * than copied from the standard's Appendix A, which assumes shadcn/ui.
 */
export default function ListView({
  listId,
  columns,
  selectedKeys,
  rows,
  noun,
  total,
  grandTotal,
  query,
  title,
  trail,
  exportHref,
  createHref,
  createLabel,
  favorites,
  isAdmin,
  myEmail,
}: {
  listId: string;
  /** Every column the registry defines, for the picker and the builder. */
  columns: WireColumn[];
  /** The person's chosen columns, in order. */
  selectedKeys: string[];
  rows: WireRow[];
  noun: string;
  total: number;
  /** Rows before any filter, so "no matches" can differ from "none yet". */
  grandTotal: number;
  query: ListQuery;
  /** The table's name, never a filtered view's - standard 11a. */
  title: string;
  /** The view's own steps in the trail, and where All / removing them go. */
  trail: { allHref: string; viewSteps: string[]; withoutViewHref: string };
  exportHref: string;
  createHref?: string;
  createLabel?: string;
  favorites: Favorite[];
  isAdmin: boolean;
  myEmail: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [comfortable, setComfortable] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(query.search);
  const [chosen, setChosen] = useState<string[]>(selectedKeys);
  const [menu, setMenu] = useState(false);
  const [picker, setPicker] = useState(false);
  const [builder, setBuilder] = useState(false);
  const [ai, setAi] = useState(false);
  const [confirmDefault, setConfirmDefault] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const [phoneSearch, setPhoneSearch] = useState(false);
  const [closedGroups, setClosedGroups] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [context, setContext] = useState<{
    x: number;
    y: number;
    col: WireColumn;
    text: string;
  } | null>(null);

  useEffect(() => {
    try {
      setComfortable(localStorage.getItem(DENSITY_KEY) === "comfortable");
    } catch {
      /* stay compact */
    }
  }, []);

  useEffect(() => setDraft(query.search), [query.search]);
  useEffect(() => setChosen(selectedKeys), [selectedKeys]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  /**
   * One way in and out for every change: push the URL, and save the parts of
   * the view the standard says are saved. Searches and the page number are
   * never saved (section 12).
   */
  function go(
    changes: Record<string, string | null>,
    save?: Parameters<typeof saveMyViewAction>[0]
  ) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    // Any change other than the page itself returns to page one, or you can
    // end up on page 5 of a 2-page result.
    if (!("page" in changes)) next.delete("page");
    router.push(`?${next.toString()}`);
    if (save) void saveMyViewAction(save);
  }

  function runFilter(g: Group) {
    setBuilder(false);
    go({ filter: isEmptyFilter(g) ? null : JSON.stringify(g) }, { filter: g });
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

  const visible = chosen
    .map((k) => columns.find((c) => c.key === k))
    .filter((c): c is WireColumn => Boolean(c));
  const groups = query.groupKey ? groupRows(rows, query.groupKey) : null;
  const groupedCol = columns.find((c) => c.key === query.groupKey);
  const steps = query.filter.items;
  const filtered = !isEmptyFilter(query.filter) || Object.keys(query.search).length > 0;
  const searching = Object.keys(query.search).length > 0;

  const pages = Math.max(1, Math.ceil(total / query.perPage));
  const from = total === 0 ? 0 : (query.page - 1) * query.perPage + 1;
  const to = Math.min(query.page * query.perPage, total);
  const cellPad = comfortable ? "px-3 py-3" : "px-3 py-0.5";
  const iconBtn =
    "flex size-8 items-center justify-center rounded-md text-[var(--ns-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5";

  // Section 2: a list with nothing in it at all shows no toolbar.
  if (grandTotal === 0) {
    return (
      <div className="px-4 py-6">
        <h1 className="ns-display text-2xl text-[var(--ns-text-primary)]">
          {title}
        </h1>
        <div className="mt-8 rounded-xl border border-[var(--ns-border-subtle)] px-6 py-12 text-center">
          <p className="text-[var(--ns-text-primary)]">No {noun} yet</p>
          <p className="mt-2 text-sm text-[var(--ns-text-secondary)]">
            {title} will appear here once they&rsquo;re added.
          </p>
          {createHref && (
            <Link
              href={createHref}
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[var(--ns-nav-primary)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              <Plus aria-hidden className="size-4" />
              {createLabel ?? "Create new"}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col">
      {/* Section 4: ☰ ⛛ ☆ ✨ then the title; the pager and page actions are
          pushed to the right. The count never sits beside the title. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[var(--ns-border-subtle)] px-4 py-2">
        <ListMenu
          open={menu}
          setOpen={setMenu}
          isAdmin={isAdmin}
          comfortable={comfortable}
          canReset={filtered || Boolean(query.groupKey) || chosen.join() !== columns.map((c) => c.key).join()}
          onChooseColumns={() => setPicker(true)}
          onGroupBy={(key) => {
            setClosedGroups([]);
            go({ group: key }, { groupBy: key });
          }}
          groupKey={query.groupKey}
          columns={columns}
          onToggleDensity={toggleDensity}
          onReset={async () => {
            setMenu(false);
            await resetMyLayoutAction();
            setStatus("Your columns, sort and filter are back to the default.");
            router.push("?");
            router.refresh();
          }}
          onSetDefault={() => {
            setMenu(false);
            setConfirmDefault(true);
          }}
          exportHref={exportHref}
        />

        <button
          type="button"
          onClick={() => setBuilder(!builder)}
          aria-expanded={builder}
          aria-label={isEmptyFilter(query.filter) ? "Filter" : "Filter (on)"}
          title={isEmptyFilter(query.filter) ? "Filter" : "Filter (on)"}
          className={cn(
            iconBtn,
            "relative",
            !isEmptyFilter(query.filter) &&
              "bg-[var(--ns-nav-primary)]/10 text-[var(--ns-nav-primary)]"
          )}
        >
          <Filter aria-hidden className="size-5" />
          {!isEmptyFilter(query.filter) && (
            <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-[var(--ns-nav-primary)]" />
          )}
        </button>

        <Favorites
          favorites={favorites}
          filter={query.filter}
          isAdmin={isAdmin}
          myEmail={myEmail}
          onApply={(g) => runFilter(g)}
          onChanged={() => router.refresh()}
        />

        <button
          type="button"
          onClick={() => setAi(true)}
          aria-label="Ask AI"
          title="Ask AI about this list"
          className={iconBtn}
        >
          <Sparkle className="size-5" />
        </button>

        <h1 className="ns-display text-2xl leading-tight font-normal text-[var(--ns-text-primary)]">
          {title}
        </h1>

        {query.groupKey && (
          <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-black/5 px-3 text-sm text-[var(--ns-text-primary)] dark:bg-white/10">
            <span>
              Grouped by <strong>{groupedCol?.label}</strong> (
              {groups?.length ?? 0})
            </span>
            <button
              type="button"
              onClick={() => setClosedGroups([])}
              className="text-[var(--ns-nav-primary)] underline-offset-2 hover:underline"
            >
              Open all
            </button>
            <button
              type="button"
              onClick={() =>
                setClosedGroups((groups ?? []).map((g) => g.label))
              }
              className="text-[var(--ns-nav-primary)] underline-offset-2 hover:underline"
            >
              Close all
            </button>
            <button
              type="button"
              onClick={() => go({ group: null }, { groupBy: null })}
              aria-label="Stop grouping"
              title="Stop grouping"
              className="flex size-6 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X aria-hidden className="size-3" />
            </button>
          </span>
        )}

        <span className="ml-auto" />

        <button
          type="button"
          onClick={() => setPhoneSearch(!phoneSearch)}
          aria-expanded={phoneSearch}
          className="inline-flex min-h-8 items-center gap-1 rounded-md border border-[var(--ns-border-subtle)] px-2 text-sm text-[var(--ns-text-primary)] lg:hidden"
        >
          <Search aria-hidden className="size-4" />
          {phoneSearch ? "Hide search" : "Search"}
        </button>

        <label className="flex items-center gap-1 text-sm text-[var(--ns-text-secondary)] lg:hidden">
          Sort by
          <select
            value={`${query.sortKey}.${query.sortDir}`}
            onChange={(e) => {
              const [column, dir] = e.target.value.split(".");
              go({ sort: e.target.value }, { sort: { column, dir } });
            }}
            className="min-h-8 rounded-md border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-1 text-sm text-[var(--ns-text-primary)]"
          >
            {visible.map((col) => (
              <optgroup key={col.key} label={col.label}>
                <option value={`${col.key}.asc`}>
                  {col.label} {col.type === "date" ? "(oldest first)" : "(A to Z)"}
                </option>
                <option value={`${col.key}.desc`}>
                  {col.label} {col.type === "date" ? "(newest first)" : "(Z to A)"}
                </option>
              </optgroup>
            ))}
          </select>
        </label>

        {!query.groupKey && (
          <Pager
            page={query.page}
            pages={pages}
            from={from}
            to={to}
            total={total}
            noun={noun}
            perPage={query.perPage}
            onPage={(p) => go({ page: p === 1 ? null : String(p) })}
            onPerPage={(n) =>
              go({ rows: String(n), page: null }, { pageSize: n })
            }
          />
        )}

        {createHref && (
          <Link
            href={createHref}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ns-nav-primary)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus aria-hidden className="size-4" />
            {createLabel ?? "Create new"}
          </Link>
        )}
      </div>

      {/* Section 11 (v1.2): the trail is always shown, starting with All, so
          the page does not jump when a filter arrives. The view's own step
          ("Active is Yes") comes first and leads back to the whole table, then
          the filter builder's steps, then column searches. */}
      <nav
        aria-label="Active filter"
        className="mt-0.5 flex flex-wrap items-center gap-x-0.5 gap-y-0.5 border-b border-[var(--ns-border-subtle)] px-4 py-1"
      >
        {(() => {
          const crumb =
            "min-h-7 rounded-md px-1.5 text-base font-medium text-[var(--ns-nav-primary)] underline-offset-4 hover:underline";
          const current = "min-h-7 px-1.5 text-base text-[var(--ns-text-primary)]";
          const sep = (t: string, k: string) => (
            <span key={k} aria-hidden className="px-0.5 text-[var(--ns-text-secondary)]">
              {t}
            </span>
          );
          const remove = (label: string, onClick: () => void, k: string) => (
            <button
              key={k}
              type="button"
              onClick={onClick}
              aria-label={`Remove "${label}" from the filter`}
              title="Remove"
              className="flex size-7 items-center justify-center rounded-md text-[var(--ns-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X aria-hidden className="size-4" />
            </button>
          );

          const searchSteps = Object.entries(query.search).map(([key, term]) => ({
            key,
            text: `${columns.find((c) => c.key === key)?.label ?? key} ${
              term.startsWith("=") ? "is" : term.startsWith("!") ? "is not" : "contains"
            } ${term.replace(/^!?=?/, "")}`,
          }));
          const anything =
            trail.viewSteps.length + steps.length + searchSteps.length > 0;
          const nodes: React.ReactNode[] = [];

          // "All" is always first: the whole table. Selecting it clears everything.
          nodes.push(
            anything ? (
              <Link key="all" href={trail.allHref} className={crumb} title={`Show all ${noun}`}>
                All
              </Link>
            ) : (
              <span key="all" className={current} aria-current="true">
                All
              </span>
            )
          );

          if (query.filter.not && steps.length) {
            nodes.push(sep(">", "not-sep"), <span key="not" className="px-1 text-base font-semibold">not</span>);
          }

          // Removing the view's own step keeps everything else: the same
          // filter and searches on the all-rows table.
          const keepRest = params.toString();
          const withoutView = keepRest
            ? `${trail.withoutViewHref}?${keepRest}`
            : trail.withoutViewHref;
          trail.viewSteps.forEach((text, i) => {
            nodes.push(
              sep(">", `v${i}`),
              <Link key={`vl${i}`} href={withoutView} className={crumb} title="Remove">
                {text}
              </Link>,
              remove(text, () => router.push(withoutView), `vx${i}`)
            );
          });

          steps.forEach((step, i) => {
            const text = describeNode({ columns }, step);
            const last = i === steps.length - 1 && searchSteps.length === 0;
            nodes.push(
              sep(i === 0 ? ">" : query.filter.match === "all" ? ">" : "or", `s${i}`),
              last ? (
                <span key={`st${i}`} className={current} aria-current="true">
                  {text}
                </span>
              ) : (
                <button
                  key={`sb${i}`}
                  type="button"
                  className={crumb}
                  // Selecting a step keeps the filter up to it and drops the
                  // later ones.
                  onClick={() => runFilter(throughStep(query.filter, i))}
                >
                  {text}
                </button>
              ),
              remove(text, () => runFilter(withoutStep(query.filter, i)), `sx${i}`)
            );
          });

          searchSteps.forEach((st, i) => {
            const last = i === searchSteps.length - 1;
            nodes.push(
              sep(">", `q${i}`),
              <span key={`qt${i}`} className={last ? current : crumb} aria-current={last ? "true" : undefined}>
                {st.text}
              </span>,
              remove(st.text, () => go({ [`q_${st.key}`]: null }), `qx${i}`)
            );
          });

          return nodes;
        })()}
      </nav>

      {builder && (
        <FilterBuilder
          columns={columns}
          filter={query.filter}
          onRun={runFilter}
          onClear={() => runFilter({ ...EMPTY_FILTER })}
          onClose={() => setBuilder(false)}
        />
      )}

      <div aria-live="polite" className="sr-only">
        {status ?? (filtered ? `${total} of ${grandTotal} match` : `${total} ${noun}`)}
      </div>
      {status && /n't|Only admins|Couldn|Try again/.test(status) && (
        <p
          role="alert"
          className="border-b border-[var(--ns-border-subtle)] px-4 py-1.5 text-sm text-red-700 dark:text-red-400"
        >
          {status}
        </p>
      )}

      {groups && groups.length >= MAX_GROUPS && (
        <p className="border-b border-[var(--ns-border-subtle)] px-4 py-1.5 text-sm text-[var(--ns-text-secondary)]">
          Showing the first {MAX_GROUPS} groups. Filter the list to see the rest.
        </p>
      )}

      {/* Phones and tablets get cards; a table that scrolls sideways is the
          thing the standard is most explicit about avoiding. */}
      <div className="hidden min-w-0 overflow-x-auto lg:block">
        <table className="w-full border-collapse text-base">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b-2 border-[var(--ns-border-subtle)]">
              <th scope="col" className="w-12 px-2">
                <button
                  type="button"
                  onClick={() => setShowSearch(!showSearch)}
                  aria-label={showSearch ? "Hide column search" : "Search columns"}
                  title={showSearch ? "Hide column search" : "Search columns"}
                  className={iconBtn}
                >
                  <Search aria-hidden className="size-4" />
                </button>
              </th>
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
                  className={cn(
                    "px-3 text-left align-middle font-semibold text-[var(--ns-text-primary)]",
                    comfortable ? "min-h-11" : "min-h-7"
                  )}
                >
                  <button
                    type="button"
                    title={`Sort by ${col.label}`}
                    onClick={() => {
                      const dir =
                        query.sortKey === col.key && query.sortDir === "asc"
                          ? "desc"
                          : "asc";
                      go(
                        { sort: `${col.key}.${dir}` },
                        { sort: { column: col.key, dir } }
                      );
                    }}
                    className={cn(
                      "flex items-center gap-1 rounded hover:text-[var(--ns-nav-primary)]",
                      comfortable ? "min-h-11" : "min-h-7"
                    )}
                  >
                    {col.label}
                    {query.sortKey === col.key &&
                      (query.sortDir === "asc" ? (
                        <ArrowUp aria-hidden className="size-3.5" />
                      ) : (
                        <ArrowDown aria-hidden className="size-3.5" />
                      ))}
                    <span className="sr-only">
                      {query.sortKey === col.key
                        ? query.sortDir === "asc"
                          ? ", sorted A to Z"
                          : ", sorted Z to A"
                        : ", select to sort"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>

            {/* A search box under every header, as in ServiceNow. Enter runs
                it; there is no Search button on desktop. */}
            {showSearch && (
              <tr className="border-b border-[var(--ns-border-subtle)] bg-black/[0.02] dark:bg-white/[0.03]">
                <th scope="col" className="px-2">
                  {searching && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = new URLSearchParams(params.toString());
                        for (const key of Object.keys(query.search)) {
                          next.delete(`q_${key}`);
                        }
                        next.delete("page");
                        router.push(`?${next.toString()}`);
                      }}
                      aria-label="Clear search"
                      title="Clear search"
                      className={iconBtn}
                    >
                      <X aria-hidden className="size-4" />
                    </button>
                  )}
                </th>
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
                        placeholder="Search"
                        title="Press Enter to search. Text is found anywhere. * = any text (7C* starts with 7C), ? = one character, =EMER exactly, = empty, ! = not (!EMER, !=EMER, != not empty)."
                        className={cn(
                          "w-full min-w-16 rounded-md border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] pr-2 pl-7 text-sm font-normal text-[var(--ns-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ns-nav-primary)]",
                          comfortable ? "h-11" : "h-7"
                        )}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            )}
          </thead>

          {groups ? (
            groups.map((g) => {
              const closed = closedGroups.includes(g.label);
              return (
                <tbody key={g.label}>
                  <tr className="border-b border-[var(--ns-border-subtle)] bg-black/[0.06] dark:bg-white/[0.08]">
                    <th
                      colSpan={visible.length + 1}
                      scope="colgroup"
                      className="px-3 py-1 text-left"
                    >
                      <button
                        type="button"
                        aria-expanded={!closed}
                        onClick={() =>
                          setClosedGroups(
                            closed
                              ? closedGroups.filter((l) => l !== g.label)
                              : [...closedGroups, g.label]
                          )
                        }
                        className="flex min-h-8 items-center gap-1.5 font-semibold text-[var(--ns-text-primary)]"
                      >
                        <ChevronRight
                          aria-hidden
                          className={cn(
                            "size-5 transition-transform",
                            !closed && "rotate-90"
                          )}
                        />
                        {groupedCol?.label}: {g.label}
                        <span className="font-normal text-[var(--ns-text-secondary)]">
                          ({g.rows.length})
                        </span>
                      </button>
                    </th>
                  </tr>
                  {!closed &&
                    g.rows.map((row, i) => (
                      <Row
                        key={row.id}
                        row={row}
                        i={i}
                        visible={visible}
                        cellPad={cellPad}
                        comfortable={comfortable}
                        router={router}
                        onContext={setContext}
                      />
                    ))}
                </tbody>
              );
            })
          ) : (
            <tbody>
              {rows.map((row, i) => (
                <Row
                  key={row.id}
                  row={row}
                  i={i}
                  visible={visible}
                  cellPad={cellPad}
                  comfortable={comfortable}
                  router={router}
                  onContext={setContext}
                />
              ))}
            </tbody>
          )}
        </table>
      </div>

      {/* Section 9: on phones the same search fields, stacked, with visible
          Search and Clear buttons since there is no Enter to lean on. */}
      {phoneSearch && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const changes: Record<string, string | null> = {};
            for (const col of visible) {
              changes[`q_${col.key}`] = draft[col.key]?.trim() || null;
            }
            go(changes);
          }}
          className="space-y-2 border-b border-[var(--ns-border-subtle)] px-4 py-3 lg:hidden"
        >
          {visible.map((col) => (
            <label key={col.key} className="block text-sm text-[var(--ns-text-secondary)]">
              {col.label}
              <input
                value={draft[col.key] ?? ""}
                onChange={(e) => setDraft({ ...draft, [col.key]: e.target.value })}
                aria-label={`Search ${col.label}`}
                placeholder="Search"
                className="mt-0.5 h-11 w-full rounded-md border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-3 text-base text-[var(--ns-text-primary)]"
              />
            </label>
          ))}
          <p className="text-sm text-[var(--ns-text-secondary)]">
            Press Enter or Search. Rows must match every box you fill in;
            capitals don&rsquo;t matter.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              className="h-11 rounded-lg bg-[var(--ns-nav-primary)] px-4 text-sm font-medium text-white"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft({});
                const next = new URLSearchParams(params.toString());
                for (const key of Object.keys(query.search)) next.delete(`q_${key}`);
                next.delete("page");
                router.push(`?${next.toString()}`);
              }}
              className="h-11 rounded-lg border border-[var(--ns-border-subtle)] px-4 text-sm text-[var(--ns-text-primary)]"
            >
              Clear search
            </button>
          </div>
        </form>
      )}

      {/* The same rows as cards, below the table's breakpoint. */}
      <ul className="divide-y divide-[var(--ns-border-subtle)] lg:hidden">
        {rows.map((row) => (
          <li key={row.id} className="px-4 py-3">
            {row.href ? (
              <Link
                href={row.href}
                className="font-semibold text-[var(--ns-nav-primary)] hover:underline"
              >
                {row.cells[visible[0]?.key] || "—"}
              </Link>
            ) : (
              <p className="font-semibold text-[var(--ns-text-primary)]">
                {row.cells[visible[0]?.key] || "—"}
              </p>
            )}
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
              {visible.slice(1).map((col) => (
                <div key={col.key} className="contents">
                  <dt className="text-[var(--ns-text-secondary)]">
                    {col.label}
                  </dt>
                  <dd className="min-w-0 text-[var(--ns-text-primary)]">
                    {col.type === "date" ? (
                      <RelativeDate iso={row.cells[col.key] ?? ""} />
                    ) : (
                      row.cells[col.key] || "—"
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {context && (
        <RowMenu
          at={context}
          onClose={() => setContext(null)}
          onStep={(step) => runFilter(appendStep(query.filter, step))}
        />
      )}

      {rows.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-[var(--ns-text-primary)]">No {noun} match</p>
          <p className="mt-2 text-sm text-[var(--ns-text-secondary)]">
            Check the spelling, or remove part of the filter or search.
          </p>
          <button
            onClick={() => router.push("?")}
            className="mt-3 text-sm text-[var(--ns-nav-primary)] underline-offset-2 hover:underline"
          >
            Show all {noun}
          </button>
        </div>
      )}

      {picker && (
        <ColumnPicker
          columns={columns}
          selected={chosen}
          onCancel={() => setPicker(false)}
          onSave={async (keys) => {
            const before = chosen;
            setChosen(keys);
            setPicker(false);
            const res = await saveMyColumnsAction(keys);
            // A failed save puts the columns back and says so, rather than
            // leaving a view on screen that will be gone on the next visit.
            if (!res.ok) {
              setChosen(before);
              setStatus(res.error);
            }
          }}
        />
      )}

      {confirmDefault && (
        <ConfirmDefault
          title={title}
          onCancel={() => setConfirmDefault(false)}
          onConfirm={async () => {
            await setDefaultLayoutAction({
              columns: chosen,
              sort: { column: query.sortKey, dir: query.sortDir },
              filter: query.filter,
              groupBy: query.groupKey || null,
            });
            setConfirmDefault(false);
            setStatus("Saved as the default for everyone.");
            router.refresh();
          }}
        />
      )}

      {ai && (
        <AiPanel
          listId={listId}
          title={title}
          noun={noun}
          columns={columns}
          privateLabels={columns.filter((c) => c.private).map((c) => c.label)}
          query={query}
          onClose={() => setAi(false)}
          onApplyFilter={(g) => {
            setAi(false);
            runFilter(g);
          }}
        />
      )}
    </div>
  );
}

/** A table row. Shared so grouped and ungrouped lists cannot drift apart. */
function Row({
  row,
  i,
  visible,
  cellPad,
  comfortable,
  router,
  onContext,
}: {
  row: WireRow;
  i: number;
  visible: WireColumn[];
  cellPad: string;
  comfortable: boolean;
  router: ReturnType<typeof useRouter>;
  onContext: (c: { x: number; y: number; col: WireColumn; text: string }) => void;
}) {
  return (
    <tr
      // The whole row is the target, as in ServiceNow. The first cell is still
      // a real link, so keyboard and middle-click work and the address is
      // visible on hover.
      onClick={row.href ? () => router.push(row.href!) : undefined}
      className={cn(
        "border-b border-[var(--ns-border-subtle)]",
        i % 2 === 1 && "bg-black/[0.025] dark:bg-white/[0.025]",
        row.href && "cursor-pointer hover:bg-[var(--ns-nav-primary)]/5"
      )}
    >
      <td className="w-12" />
      {visible.map((col, ci) => (
        <Cell
          key={col.key}
          col={col}
          text={row.cells[col.key] ?? ""}
          pad={cellPad}
          comfortable={comfortable}
          href={ci === 0 ? row.href : undefined}
          onContext={(x, y) =>
            onContext({ x, y, col, text: row.cells[col.key] ?? "" })
          }
        />
      ))}
    </tr>
  );
}

/** Right-click on a value: filter to it, filter it out, or copy it. */
function RowMenu({
  at,
  onClose,
  onStep,
}: {
  at: { x: number; y: number; col: WireColumn; text: string };
  onClose: () => void;
  onStep: (step: Condition) => void;
}) {
  const item =
    "flex min-h-9 w-full items-center gap-2 px-3 text-left text-sm text-[var(--ns-text-primary)] hover:bg-black/5 dark:hover:bg-white/5";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const empty = at.text.trim() === "";
  // Section 11: a date filters by its day, text by exactly that value.
  const day = at.col.type === "date" ? dayOf(at.text) : null;

  function step(negate: boolean): Condition {
    if (empty) {
      return {
        kind: "condition",
        column: at.col.key,
        comparison: negate ? "isNotEmpty" : "isEmpty",
        value: "",
      };
    }
    if (day) {
      return {
        kind: "condition",
        column: at.col.key,
        comparison: negate ? "isNot" : "on",
        value: negate ? at.text : day,
      };
    }
    return {
      kind: "condition",
      column: at.col.key,
      comparison: negate ? "isNot" : "is",
      value: at.text,
    };
  }

  return (
    <>
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
        className="fixed inset-0 z-40 cursor-default"
      />
      <div
        role="menu"
        style={{
          // Kept inside the window: a menu opened near the right edge would
          // otherwise hang off it.
          left: Math.min(at.x, (globalThis.innerWidth ?? 1024) - 272),
          top: at.y,
        }}
        className="fixed z-50 min-w-64 overflow-hidden rounded-lg border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] py-1 shadow-lg"
      >
        <p className="truncate px-3 py-1 text-xs text-[var(--ns-text-secondary)]">
          {at.col.label}: {at.text || "(empty)"}
        </p>
        <button
          type="button"
          role="menuitem"
          className={item}
          onClick={() => {
            onStep(step(false));
            onClose();
          }}
        >
          <Filter aria-hidden className="size-5 shrink-0" />
          Show matching
        </button>
        <button
          type="button"
          role="menuitem"
          className={item}
          onClick={() => {
            onStep(step(true));
            onClose();
          }}
        >
          <X aria-hidden className="size-5 shrink-0" />
          Filter out
        </button>
        {/* Section 11: Copy is only offered when there is something to copy. */}
        {!empty && (
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              void navigator.clipboard?.writeText(at.text);
              onClose();
            }}
          >
            <Copy aria-hidden className="size-5 shrink-0" />
            Copy
          </button>
        )}
      </div>
    </>
  );
}

function dayOf(text: string): string | null {
  const t = Date.parse(text);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

/**
 * The ☰ list menu (section 3). Column choices, grouping, export, reset and
 * row spacing live here rather than as loose icons in the toolbar.
 */
function ListMenu({
  open,
  setOpen,
  isAdmin,
  comfortable,
  canReset,
  columns,
  groupKey,
  onChooseColumns,
  onGroupBy,
  onToggleDensity,
  onReset,
  onSetDefault,
  exportHref,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  isAdmin: boolean;
  comfortable: boolean;
  canReset: boolean;
  columns: WireColumn[];
  groupKey: string;
  onChooseColumns: () => void;
  onGroupBy: (key: string | null) => void;
  onToggleDensity: () => void;
  onReset: () => void;
  onSetDefault: () => void;
  exportHref: string;
}) {
  const item =
    "flex min-h-9 w-full items-center gap-2 px-3 text-left text-sm text-[var(--ns-text-primary)] hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/5";

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
        <Menu aria-hidden className="size-5" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute left-0 z-50 mt-1 w-80 overflow-hidden rounded-lg border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false);
                onChooseColumns();
              }}
            >
              <Columns3 aria-hidden className="size-5 shrink-0" />
              Choose columns…
            </button>

            <div className="flex min-h-9 items-center gap-2 px-3">
              <Layers aria-hidden className="size-5 shrink-0 text-[var(--ns-text-primary)]" />
              <label htmlFor="group-by" className="text-sm text-[var(--ns-text-primary)]">
                Group by…
              </label>
              <select
                id="group-by"
                value={groupKey}
                onChange={(e) => {
                  onGroupBy(e.target.value || null);
                  setOpen(false);
                }}
                className="ml-auto min-h-8 rounded-md border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-1 text-sm text-[var(--ns-text-primary)]"
              >
                <option value="">No grouping</option>
                {/* Dates are left out: one group per timestamp is one group
                    per row. */}
                {columns
                  .filter((c) => c.type !== "date")
                  .map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
              </select>
            </div>

            <a
              href={exportHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={item}
            >
              <Download aria-hidden className="size-5 shrink-0" />
              Export CSV
            </a>

            <button
              type="button"
              role="menuitem"
              className={cn(item, "flex-col !items-start gap-0")}
              disabled={!canReset}
              onClick={onReset}
            >
              <span className="flex items-center gap-2">
                <RotateCcw aria-hidden className="size-5 shrink-0" />
                Reset to default
              </span>
              {!canReset && (
                <span className="pl-7 text-xs text-[var(--ns-text-secondary)]">
                  You&rsquo;re using it now
                </span>
              )}
            </button>

            {isAdmin && (
              <button
                type="button"
                role="menuitem"
                className={item}
                onClick={onSetDefault}
              >
                <Settings aria-hidden className="size-5 shrink-0" />
                Set as default for everyone…
              </button>
            )}

            <div className="my-1 border-t border-[var(--ns-border-subtle)]" />

            <p className="px-3 py-1 text-xs font-semibold tracking-wide text-[var(--ns-text-secondary)] uppercase">
              Row spacing (this browser)
            </p>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={!comfortable}
              className={item}
              onClick={() => {
                if (comfortable) onToggleDensity();
                setOpen(false);
              }}
            >
              <Check
                aria-hidden
                className={cn("size-4 shrink-0", comfortable && "invisible")}
              />
              Compact rows
            </button>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={comfortable}
              className={item}
              onClick={() => {
                if (!comfortable) onToggleDensity();
                setOpen(false);
              }}
            >
              <Check
                aria-hidden
                className={cn("size-4 shrink-0", !comfortable && "invisible")}
              />
              <Rows3 aria-hidden className="size-4 shrink-0" />
              Comfortable rows (tablets, gloves)
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Section 18: a change that reaches everyone confirms first. */
function ConfirmDefault({
  title,
  onCancel,
  onConfirm,
}: {
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] p-5 shadow-xl"
      >
        <h2 className="ns-display text-xl text-[var(--ns-text-primary)]">
          Set as default for everyone?
        </h2>
        <p className="mt-2 text-sm text-[var(--ns-text-secondary)]">
          Everyone who opens {title} will start with your current columns,
          sort, filter and grouping. People who have changed their own view
          keep theirs until they choose Reset to default.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--ns-border-subtle)] px-4 py-2 text-sm text-[var(--ns-text-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-[var(--ns-nav-primary)] px-4 py-2 text-sm font-medium text-white"
          >
            Set as default for everyone
          </button>
        </div>
      </div>
    </div>
  );
}

function Cell({
  col,
  text,
  pad,
  comfortable,
  href,
  onContext,
}: {
  col: WireColumn;
  text: string;
  pad: string;
  comfortable: boolean;
  href?: string;
  onContext?: (x: number, y: number) => void;
}) {
  return (
    <td
      className={cn(pad, "align-middle", !comfortable && "whitespace-nowrap")}
      onContextMenu={
        onContext
          ? (e) => {
              e.preventDefault();
              onContext(e.clientX, e.clientY);
            }
          : undefined
      }
    >
      {col.type === "date" ? (
        // A date in a linked first column shows without the relative line.
        href ? (
          <Link href={href} className="font-semibold text-[var(--ns-nav-primary)] hover:underline">
            {text || "—"}
          </Link>
        ) : (
          <RelativeDate iso={text} />
        )
      ) : href ? (
        <Link
          href={href}
          className="block max-w-112 truncate font-semibold text-[var(--ns-nav-primary)] hover:underline"
          title={text}
        >
          {text || "—"}
        </Link>
      ) : (
        <span
          className={cn("block", !comfortable && "max-w-112 truncate")}
          title={text}
        >
          {text || "—"}
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
    "min-h-8 rounded-md px-1.5 text-sm text-[var(--ns-text-secondary)] hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/5";

  // Up to five page numbers, centred on the current page.
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = Array.from(
    { length: Math.min(5, pages) },
    (_, i) => start + i
  ).filter((n) => n >= 1 && n <= pages);

  return (
    <nav
      aria-label="Pages"
      className="flex min-w-0 flex-wrap items-center gap-1 text-sm text-[var(--ns-text-secondary)]"
    >
      <label className="sr-only" htmlFor="per-page">
        Rows
      </label>
      <select
        id="per-page"
        value={perPage}
        onChange={(e) => onPerPage(Number(e.target.value))}
        className="h-8 rounded-md border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-1 text-sm text-[var(--ns-text-primary)]"
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
        aria-label="First page"
      >
        «
      </button>
      <button
        className={btn}
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ‹
      </button>
      {numbers.map((n) => (
        <button
          key={n}
          onClick={() => onPage(n)}
          aria-label={`Page ${n}`}
          aria-current={n === page ? "page" : undefined}
          className={cn(
            btn,
            "min-w-8",
            n === page &&
              "bg-[var(--ns-nav-primary)]/10 font-semibold text-[var(--ns-nav-primary)]"
          )}
        >
          {n}
        </button>
      ))}
      <button
        className={btn}
        onClick={() => onPage(page + 1)}
        disabled={page >= pages}
        aria-label="Next page"
      >
        ›
      </button>
      <button
        className={cn(btn, "hidden sm:block")}
        onClick={() => onPage(pages)}
        disabled={page >= pages}
        aria-label={`Last page (${pages})`}
      >
        »
      </button>
    </nav>
  );
}
