"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  History as HistoryIcon,
  Menu as MenuIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  addFavoriteAction,
  clearHistoryAction,
  loadHistoryAction,
  moveFavoriteAction,
  removeFavoriteAction,
  renameFavoriteAction,
  type NavResult,
} from "@/app/nav-actions";
import type { HistoryEntry } from "@/lib/nav-store";
import { NAV_ITEMS, isActive, type NavItem } from "./nav-items";
import { HISTORY_EVENT } from "./history-recorder";

/**
 * Left-hand navigator, built to docs/standards/left-navigator.md (v1.2): collapse
 * to an icon rail, search, Menu / Favorites / History tabs, collapsible groups,
 * and per-person favourites and history saved on the server.
 *
 * Sizes, type, states and wording come from the standard so staff who learn one
 * LLUH app know them all; only the brand colour differs per app, through
 * --ns-nav-primary (navy in light mode, gold in dark - gold fails the standard's
 * 4.5:1 rule on the light background; see globals.css).
 *
 * Northstar deviations, both agreed with Ryan and noted in CLAUDE.md: two levels
 * of nesting (Project Management -> Ideas -> Active Ideas), and groups have no
 * page of their own, so there is no "<Group> overview" row.
 */

export type NavFavorite = { id: number; label: string; href: string };

type Props = {
  showAdmin?: boolean;
  onNavigate?: () => void;
  favorites?: NavFavorite[];
  /** In the phone/tablet drawer: no collapse button. */
  inDrawer?: boolean;
};

const NAV_KEY = "northstar:nav";
const TAB_KEY = "northstar:nav-tab";
const TITLE_SUFFIX = /\s*·\s*Northstar$/;

// --- Classes (standard section 13), with Northstar's colour tokens. ---
const ring = "outline-none focus-visible:ring-3 focus-visible:ring-[var(--ns-nav-text)]";
const textClass = "text-[var(--ns-nav-text)]";
const mutedClass = "text-[var(--ns-nav-text-muted)]";
const rowClass = cn(
  "flex min-h-7 w-full min-w-0 items-center gap-2 rounded-md px-2 py-1 text-base leading-5 hover:bg-[var(--ns-nav-hover)] nav-closed:justify-center nav-closed:px-0",
  ring,
);
/** Current page: brand text, weight 600, 10% tint, 3px bar down the left. */
const currentClass =
  "bg-[var(--ns-nav-primary-tint)] font-semibold text-[var(--ns-nav-primary)] shadow-[inset_3px_0_0_var(--ns-nav-primary)]";
const actionClass = cn(
  "inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-[var(--ns-nav-primary)] hover:bg-[var(--ns-nav-hover)]",
  ring,
);
const hintClass = cn("px-1 text-base", mutedClass);
/** Submenu text starts 32px in; Northstar's second level steps by 16px more. */
const INDENT = ["", "pl-8", "pl-12", "pl-16"];

// --- Which tab is showing, remembered in this browser. ---
type Tab = "menu" | "favorites" | "history";
const TABS: { id: Tab; label: string; icon: typeof Star }[] = [
  { id: "menu", label: "Menu", icon: MenuIcon },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "history", label: "History", icon: HistoryIcon },
];
const tabListeners = new Set<() => void>();
let tabFallback: Tab = "menu";
function readTab(): Tab {
  try {
    const saved = localStorage.getItem(TAB_KEY);
    return saved === "favorites" || saved === "history" ? saved : "menu";
  } catch {
    return tabFallback;
  }
}
function useTab() {
  const tab = useSyncExternalStore(
    (cb) => {
      tabListeners.add(cb);
      return () => tabListeners.delete(cb);
    },
    readTab,
    () => "menu" as Tab,
  );
  const setTab = (next: Tab) => {
    tabFallback = next;
    try {
      localStorage.setItem(TAB_KEY, next);
    } catch {
      // Storage blocked: lasts until reload.
    }
    tabListeners.forEach((l) => l());
  };
  return [tab, setTab] as const;
}

/** Case-insensitive "contains". A group matches by its own name (all children
 *  kept) or by any descendant (only matching children kept). */
function filterItems(items: NavItem[], query: string): NavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const out: NavItem[] = [];
  for (const item of items) {
    if (item.title.toLowerCase().includes(q)) out.push(item);
    else {
      const kids = item.children ? filterItems(item.children, query) : [];
      if (kids.length) out.push({ ...item, children: kids });
    }
  }
  return out;
}

export default function SideNav({ showAdmin = false, onNavigate, favorites = [], inDrawer = false }: Props) {
  const pathname = usePathname();
  const [tab, setTab] = useTab();
  const [query, setQuery] = useState("");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const items = useMemo(
    () => filterItems(NAV_ITEMS.filter((i) => showAdmin || !i.adminOnly), query),
    [showAdmin, query],
  );
  const q = query.trim().toLowerCase();
  const shownFavorites = q ? favorites.filter((f) => f.label.toLowerCase().includes(q)) : favorites;
  const favoriteFor = (href: string) => favorites.find((f) => f.href === href);

  /** Run a favourites action, then reload the server-rendered list. */
  function run(task: () => Promise<NavResult>) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await task();
        if (!result.ok) setError(result.error);
      } catch {
        setError("That didn't work. Try again.");
      }
      router.refresh();
    });
  }
  const toggleStar = (title: string, href: string) => {
    const existing = favoriteFor(href);
    run(() => (existing ? removeFavoriteAction(existing.id) : addFavoriteAction(title, href)));
  };

  return (
    <div className={cn("flex h-full min-w-0 flex-col gap-1.5 px-2 py-2 nav-closed:px-1.5", pending && "opacity-80")}>
      {!inDrawer && <CollapseButton />}

      {/* Search and tabs; hidden when the menu is slid closed to icons. */}
      <div className="grid gap-1.5 nav-closed:hidden">
        <label className="relative block">
          <span className="sr-only">Search the menu</span>
          <Search
            aria-hidden
            className={cn("pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2", mutedClass)}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tab === "menu" ? "the menu" : tab}`}
            className={cn(
              "h-8 w-full rounded-md border border-[var(--ns-nav-input)] bg-[var(--ns-surface-card)] pr-2 pl-8 text-base leading-5",
              textClass,
              ring,
            )}
          />
        </label>
        {/* Three tabs fit by showing the chosen tab's name and only icons for
            the others (names on hover and for screen readers). */}
        <div role="tablist" aria-label="Navigator" className="flex gap-0.5 rounded-lg bg-[var(--ns-nav-hover)] p-0.5">
          {TABS.map(({ id, label, icon: Icon }) => {
            const selected = tab === id;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-label={label}
                title={label}
                onClick={() => setTab(id)}
                className={cn(
                  "flex min-h-7 items-center justify-center gap-1.5 rounded-md text-base",
                  ring,
                  selected
                    ? cn("flex-1 bg-[var(--ns-surface-card)] px-2 font-semibold shadow-sm", textClass)
                    : cn(
                        "w-10 shrink-0 hover:bg-[var(--ns-surface-card)]/60 hover:text-[var(--ns-nav-text)]",
                        mutedClass,
                      ),
                )}
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                {selected && <span className="truncate">{label}</span>}
              </button>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="text-sm text-[var(--ns-nav-error)]">
            {error}
          </p>
        )}
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        {/* Menu. Always shown when slid closed (icons), whichever tab is chosen. */}
        <nav aria-label="Main" className={cn(tab !== "menu" && "hidden nav-closed:block")}>
          {items.length === 0 ? (
            <p className={cn("px-2 py-1 text-base nav-closed:hidden", mutedClass)}>
              Nothing in the menu matches “{query}”.
            </p>
          ) : (
            <NavList
              items={items}
              pathname={pathname}
              depth={0}
              searching={!!q}
              onNavigate={onNavigate}
              favoriteFor={favoriteFor}
              onStar={toggleStar}
            />
          )}
        </nav>

        {tab === "favorites" && (
          <section aria-label="Favorites" className="nav-closed:hidden">
            <Favorites
              favorites={shownFavorites}
              total={favorites.length}
              query={query}
              pathname={pathname}
              onNavigate={onNavigate}
              run={run}
            />
          </section>
        )}

        {tab === "history" && (
          <section aria-label="History" className="nav-closed:hidden">
            <History query={query} onNavigate={onNavigate} />
          </section>
        )}
      </div>
    </div>
  );
}

/** Slides the navigator closed to an icon rail, or open again. The state lives on
 *  <html data-nav> (set before paint by layout.tsx), so the right icon and name
 *  show even before React loads. */
function CollapseButton() {
  return (
    <div className="flex justify-end nav-closed:justify-center">
      <button
        type="button"
        onClick={() => {
          const root = document.documentElement;
          const closing = root.dataset.nav !== "closed";
          root.dataset.nav = closing ? "closed" : "open";
          try {
            localStorage.setItem(NAV_KEY, closing ? "closed" : "open");
          } catch {
            // Storage blocked: the choice lasts until the page is reloaded.
          }
        }}
        title="Collapse or expand the menu"
        className={cn(
          "flex size-8 items-center justify-center rounded-lg hover:bg-[var(--ns-nav-hover)] hover:text-[var(--ns-nav-text)]",
          mutedClass,
          ring,
        )}
      >
        <PanelLeftClose aria-hidden className="size-5 nav-closed:hidden" />
        <PanelLeftOpen aria-hidden className="hidden size-5 nav-closed:block" />
        <span className="sr-only nav-closed:hidden">Collapse menu</span>
        <span className="hidden nav-closed:sr-only nav-closed:inline">Expand menu</span>
      </button>
    </div>
  );
}

type RowProps = {
  pathname: string;
  depth: number;
  onNavigate?: () => void;
  favoriteFor: (href: string) => NavFavorite | undefined;
  onStar: (title: string, href: string) => void;
};

function NavList({ items, searching, ...row }: RowProps & { items: NavItem[]; searching: boolean }) {
  return (
    <ul className="grid min-w-0 gap-px">
      {items.map((item) => (
        <li key={item.href + item.title} className="min-w-0">
          {item.children?.length ? (
            <NavGroup item={item} searching={searching} {...row} />
          ) : (
            <NavRow item={item} {...row} />
          )}
        </li>
      ))}
    </ul>
  );
}

/** A menu link with a ☆ to add it to (or remove it from) favourites. */
function NavRow({ item, pathname, depth, onNavigate, favoriteFor, onStar }: RowProps & { item: NavItem }) {
  const current = depth > 0 ? pathname === item.href : isActive(item, pathname);
  const starred = !!favoriteFor(item.href);
  const Icon = item.icon;
  return (
    <div className={cn("group relative flex min-w-0 items-center", depth > 0 && "nav-closed:hidden")}>
      <Link
        href={item.href}
        onClick={onNavigate}
        title={item.title}
        aria-current={current ? "page" : undefined}
        className={cn(
          rowClass,
          "pr-7 nav-closed:pr-0",
          INDENT[Math.min(depth, INDENT.length - 1)],
          current ? currentClass : textClass,
        )}
      >
        {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
        <span className="min-w-0 truncate nav-closed:sr-only">{item.title}</span>
      </Link>
      <button
        type="button"
        onClick={() => onStar(item.title, item.href)}
        aria-pressed={starred}
        aria-label={starred ? `Remove ${item.title} from favorites` : `Add ${item.title} to favorites`}
        title={starred ? "Remove from favorites" : "Add to favorites"}
        className={cn(
          "absolute right-0.5 flex size-6 items-center justify-center rounded-md hover:bg-[var(--ns-surface-card)] focus-visible:opacity-100 nav-closed:hidden",
          ring,
          starred ? "text-[var(--ns-nav-primary)] opacity-100" : cn(mutedClass, "opacity-0 group-hover:opacity-100"),
        )}
      >
        <Star aria-hidden className={cn("size-3.5", starred && "fill-current")} />
      </button>
    </div>
  );
}

/** A menu with a submenu. Collapsed by default (standard 9.2), but **open when
 *  the current page is inside it** - a group that hides where you are leaves
 *  the navigator unable to answer "where am I". Opens while searching too.
 *  Slid closed, the group's icon goes straight to its first page. */
function NavGroup({ item, searching, ...row }: RowProps & { item: NavItem; searching: boolean }) {
  const { pathname, depth, onNavigate } = row;
  const active = isActive(item, pathname);
  const [openState, setOpen] = useState(active);
  // Opens on arriving at a page inside it. Closing it by hand stays closed
  // until you navigate into it again, because this only runs when `active`
  // changes - the same value on the server and the first client render, so
  // there is nothing for hydration to disagree about.
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);
  const open = searching || openState;
  const Icon = item.icon;
  const id = `nav-${depth}-${item.title.replace(/\W+/g, "-")}`;
  return (
    <>
      {depth === 0 && (
        <Link
          href={item.href}
          onClick={onNavigate}
          title={item.title}
          className={cn(rowClass, "hidden nav-closed:flex", active ? currentClass : textClass)}
        >
          {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
          <span className="sr-only">{item.title}</span>
        </Link>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!openState)}
        className={cn(
          rowClass,
          "nav-closed:hidden",
          INDENT[Math.min(depth, INDENT.length - 1)],
          active ? "font-semibold text-[var(--ns-nav-primary)]" : textClass,
        )}
      >
        {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
        <span className="min-w-0 flex-1 truncate text-left">{item.title}</span>
        <ChevronRight aria-hidden className={cn("size-4 shrink-0 transition-transform", open && "rotate-90")} />
      </button>
      <div id={id} hidden={!open} className="min-w-0 nav-closed:hidden">
        <NavList items={item.children ?? []} searching={searching} {...row} depth={depth + 1} />
      </div>
    </>
  );
}

/** The person's own favourites: open, add this page, and (Edit) rename, reorder, remove. */
function Favorites({
  favorites,
  total,
  query,
  pathname,
  onNavigate,
  run,
}: {
  favorites: NavFavorite[];
  total: number;
  query: string;
  pathname: string;
  onNavigate?: () => void;
  run: (task: () => Promise<NavResult>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState<{ label: string; href: string } | null>(null);

  function startAdd() {
    const title = document.title.replace(TITLE_SUFFIX, "").trim() || "This page";
    setAdding({ label: title, href: `${window.location.pathname}${window.location.search}` });
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-1.5">
      {total === 0 && !adding && (
        <p className={hintClass}>
          No favorites yet. Select ☆ next to a menu item, or add the page you&apos;re on (with its filter).
        </p>
      )}
      {total > 0 && favorites.length === 0 && <p className={hintClass}>No favorites match “{query}”.</p>}

      <ol className="grid min-w-0 grid-cols-1 gap-px">
        {favorites.map((f, i) => {
          const current = pathname === f.href.split("?")[0] && !f.href.includes("?");
          return (
            <li key={f.id} className="min-w-0">
              {editing ? (
                <EditRow
                  favorite={f}
                  first={i === 0}
                  last={i === favorites.length - 1}
                  reorder={!query.trim()}
                  run={run}
                />
              ) : (
                <Link
                  href={f.href}
                  onClick={onNavigate}
                  title={f.label}
                  aria-current={current ? "page" : undefined}
                  className={cn(rowClass, current ? currentClass : textClass)}
                >
                  <Star aria-hidden className="size-3.5 shrink-0 fill-current text-[var(--ns-nav-primary)]" />
                  <span className="min-w-0 truncate">{f.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {adding ? (
        <form
          className="grid gap-2 rounded-lg border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] p-2"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            const { label, href } = adding;
            setAdding(null);
            run(() => addFavoriteAction(label, href));
          }}
        >
          <label className={cn("grid gap-1 text-sm font-medium", textClass)}>
            Name this favorite
            <input
              autoFocus
              value={adding.label}
              maxLength={60}
              onChange={(e) => setAdding({ ...adding, label: e.target.value })}
              className={cn(
                "h-9 rounded-md border border-[var(--ns-nav-input)] bg-[var(--ns-surface-card)] px-2 text-base font-normal",
                ring,
              )}
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className={cn(
                "inline-flex h-9 items-center gap-1 rounded-md bg-[var(--ns-nav-primary)] px-3 text-sm font-medium text-[var(--ns-surface-card)]",
                ring,
              )}
            >
              <Check aria-hidden className="size-4" />
              Save
            </button>
            <button
              type="button"
              onClick={() => setAdding(null)}
              className={cn(
                "inline-flex h-9 items-center rounded-md px-3 text-sm hover:bg-[var(--ns-nav-hover)]",
                textClass,
                ring,
              )}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-1">
          <button type="button" onClick={startAdd} className={actionClass}>
            <Plus aria-hidden className="size-4" />
            Add this page
          </button>
          {total > 0 && (
            <button type="button" aria-pressed={editing} onClick={() => setEditing(!editing)} className={actionClass}>
              {editing ? <Check aria-hidden className="size-4" /> : <Pencil aria-hidden className="size-4" />}
              {editing ? "Done" : "Edit"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EditRow({
  favorite,
  first,
  last,
  reorder,
  run,
}: {
  favorite: NavFavorite;
  first: boolean;
  last: boolean;
  reorder: boolean;
  run: (task: () => Promise<NavResult>) => void;
}) {
  const [label, setLabel] = useState(favorite.label);
  const save = () => {
    if (label.trim() && label.trim() !== favorite.label) run(() => renameFavoriteAction(favorite.id, label));
  };
  const icon = cn(
    "flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-[var(--ns-nav-hover)] hover:text-[var(--ns-nav-text)] disabled:opacity-30",
    mutedClass,
    ring,
  );
  return (
    <div className="flex min-w-0 items-center gap-0.5 rounded-lg border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] p-1">
      <input
        aria-label={`Name of favorite ${favorite.label}`}
        value={label}
        maxLength={60}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        size={1}
        className={cn("h-8 w-0 min-w-0 flex-1 rounded-md bg-transparent px-2 text-base", textClass, ring)}
      />
      {reorder && (
        <>
          <button
            type="button"
            className={icon}
            disabled={first}
            onClick={() => run(() => moveFavoriteAction(favorite.id, -1))}
            aria-label={`Move ${favorite.label} up`}
            title="Move up"
          >
            <ArrowUp aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            className={icon}
            disabled={last}
            onClick={() => run(() => moveFavoriteAction(favorite.id, 1))}
            aria-label={`Move ${favorite.label} down`}
            title="Move down"
          >
            <ArrowDown aria-hidden className="size-4" />
          </button>
        </>
      )}
      <button
        type="button"
        className={icon}
        onClick={() => run(() => removeFavoriteAction(favorite.id))}
        aria-label={`Remove ${favorite.label} from favorites`}
        title="Remove"
      >
        <Trash2 aria-hidden className="size-4" />
      </button>
    </div>
  );
}

/** "now", "5m", "3h", "2d": short enough to sit beside the page name. */
function shortAgo(iso: string, now: number) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / (60 * 24))}d`;
}

/** The last 30 pages this person opened (saved per person on the server), newest first. */
function History({ query, onNavigate }: { query: string; onNavigate?: () => void }) {
  const [state, setState] = useState<{ entries: HistoryEntry[]; now: number; here: string } | null>(null);
  const reload = useCallback(() => {
    const here = `${window.location.pathname}${window.location.search}`;
    loadHistoryAction()
      .then((entries) => setState({ entries, now: Date.now(), here }))
      .catch(() => setState({ entries: [], now: Date.now(), here }));
  }, []);
  useEffect(() => {
    reload();
    window.addEventListener(HISTORY_EVENT, reload);
    return () => window.removeEventListener(HISTORY_EVENT, reload);
  }, [reload]);

  if (!state) return <p className={hintClass}>Loading…</p>;
  const q = query.trim().toLowerCase();
  const entries = q ? state.entries.filter((e) => e.label.toLowerCase().includes(q)) : state.entries;
  return (
    <div className="grid min-w-0 grid-cols-1 gap-1.5">
      {state.entries.length === 0 && <p className={hintClass}>Pages you open will appear here, newest first.</p>}
      {state.entries.length > 0 && entries.length === 0 && (
        <p className={hintClass}>No pages in your history match “{query}”.</p>
      )}
      <ol className="grid min-w-0 grid-cols-1 gap-px">
        {entries.map((e) => {
          const current = e.href === state.here;
          return (
            <li key={e.id} className="min-w-0">
              <Link
                href={e.href}
                onClick={onNavigate}
                title={`${e.label}\n${new Date(e.visited_at).toLocaleString()}`}
                aria-current={current ? "page" : undefined}
                className={cn(rowClass, current ? currentClass : textClass)}
              >
                <span className="min-w-0 flex-1 truncate">{e.label}</span>
                <span className={cn("shrink-0 text-sm font-normal", mutedClass)}>
                  {shortAgo(e.visited_at, state.now)}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      {state.entries.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => {
              setState({ ...state, entries: [] });
              void clearHistoryAction();
            }}
            className={actionClass}
          >
            <Trash2 aria-hidden className="size-4" />
            Clear history
          </button>
        </div>
      )}
    </div>
  );
}
