"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { NAV_ITEMS, isActive, type NavItem } from "./nav-items";

/**
 * Left-hand navigator. Built to docs/standards/left-navigator.md.
 *
 * Sizes, type and states come from that standard so staff who learn one LLUH
 * app know them all; only the brand colour differs per app, through
 * --ns-nav-primary. That token is navy in light mode and gold in dark, because
 * gold measures 1.77:1 on the light navigator background and the standard
 * requires 4.5:1 - see globals.css.
 *
 * Favourites and the Menu/Favorites tabs are not built yet: they need
 * per-person storage on the server. Everything else conforms.
 */

const STORAGE_KEY = "northstar:nav";

const rowClass =
  "group flex min-h-7 w-full min-w-0 items-center gap-2 rounded-md px-2 py-1 text-base leading-5 outline-none hover:bg-[var(--ns-nav-hover)] focus-visible:ring-3 focus-visible:ring-[var(--ns-text-primary)] nav-closed:justify-center nav-closed:px-0";

/** Current page: brand text, weight 600, 10% tint, 3px bar down the left. */
const currentClass =
  "bg-[var(--ns-nav-primary-tint)] font-semibold text-[var(--ns-nav-primary)] shadow-[inset_3px_0_0_var(--ns-nav-primary)]";

const idleClass = "text-[var(--ns-text-primary)]";
const mutedClass = "text-[var(--ns-text-secondary)]";

export default function SideNav({
  showAdmin = false,
  onNavigate,
}: {
  showAdmin?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [closed, setClosed] = useState(false);
  const [query, setQuery] = useState("");

  // Read the stored state after mount; the inline script in layout.tsx has
  // already applied it to <html>, so this only syncs the button's own label.
  useEffect(() => {
    try {
      setClosed(localStorage.getItem(STORAGE_KEY) === "closed");
    } catch {
      /* private mode: stay open */
    }
  }, []);

  function toggle() {
    const next = !closed;
    setClosed(next);
    document.documentElement.setAttribute("data-nav", next ? "closed" : "open");
    try {
      localStorage.setItem(STORAGE_KEY, next ? "closed" : "open");
    } catch {
      /* preference just will not persist */
    }
  }

  const items = useMemo(
    () => NAV_ITEMS.filter((i) => showAdmin || !i.adminOnly),
    [showAdmin]
  );

  const filtered = useMemo(() => filterItems(items, query), [items, query]);

  return (
    <div className="flex h-full flex-col gap-1.5 px-2 py-2 nav-closed:px-1.5">
      <button
        type="button"
        onClick={toggle}
        aria-label={closed ? "Expand menu" : "Collapse menu"}
        title={closed ? "Expand menu" : "Collapse menu"}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center self-end rounded-md outline-none hover:bg-[var(--ns-nav-hover)] focus-visible:ring-3 focus-visible:ring-[var(--ns-text-primary)] nav-closed:self-center",
          mutedClass
        )}
      >
        {closed ? (
          <PanelLeftOpen aria-hidden className="size-5" />
        ) : (
          <PanelLeftClose aria-hidden className="size-5" />
        )}
      </button>

      <div className="relative nav-closed:hidden">
        <Search
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2",
            mutedClass
          )}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the menu"
          aria-label="Search the menu"
          className="h-8 w-full rounded-md border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] pr-2 pl-8 text-base leading-5 text-[var(--ns-text-primary)] outline-none focus-visible:ring-3 focus-visible:ring-[var(--ns-text-primary)]"
        />
      </div>

      <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className={cn("px-2 py-1 text-base nav-closed:hidden", mutedClass)}>
            Nothing in the menu matches “{query}”.
          </p>
        ) : (
          <NavList
            items={filtered}
            pathname={pathname}
            depth={0}
            searching={query.trim().length > 0}
            onNavigate={onNavigate}
          />
        )}
      </nav>
    </div>
  );
}

/** Case-insensitive "contains". A group matches by its own name or any
 *  descendant's, and keeps only the children that matched. */
function filterItems(items: NavItem[], query: string): NavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const out: NavItem[] = [];
  for (const item of items) {
    const selfMatch = item.title.toLowerCase().includes(q);
    const kids = item.children ? filterItems(item.children, query) : [];
    if (selfMatch) out.push(item);
    else if (kids.length) out.push({ ...item, children: kids });
  }
  return out;
}

function NavList({
  items,
  pathname,
  depth,
  searching,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  depth: number;
  searching: boolean;
  onNavigate?: () => void;
}) {
  return (
    <ul className="grid min-w-0 gap-px">
      {items.map((item) => (
        <li key={item.href} className="min-w-0">
          {item.children?.length ? (
            <NavGroup
              item={item}
              pathname={pathname}
              depth={depth}
              searching={searching}
              onNavigate={onNavigate}
            />
          ) : (
            <NavLink
              item={item}
              pathname={pathname}
              depth={depth}
              onNavigate={onNavigate}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

/** Submenu text starts 32px in; deeper levels step by the same amount. */
const INDENT = ["", "pl-8", "pl-12", "pl-16"];

function NavLink({
  item,
  pathname,
  depth,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  depth: number;
  onNavigate?: () => void;
}) {
  const current = depth > 0 ? pathname === item.href : isActive(item, pathname);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.title}
      onClick={onNavigate}
      aria-current={current ? "page" : undefined}
      className={cn(
        rowClass,
        INDENT[Math.min(depth, INDENT.length - 1)],
        depth > 0 && "nav-closed:hidden",
        current ? currentClass : idleClass
      )}
    >
      {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
      <span className="min-w-0 truncate nav-closed:sr-only">{item.title}</span>
    </Link>
  );
}

/** Groups start closed, and open only when searching or when the current page
 *  is inside them. Collapsed, the group's icon links to its first page. */
function NavGroup({
  item,
  pathname,
  depth,
  searching,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  depth: number;
  searching: boolean;
  onNavigate?: () => void;
}) {
  const active = isActive(item, pathname);
  const [open, setOpen] = useState(active);
  const Icon = item.icon;
  const id = `nav-${item.href.replaceAll("/", "-")}`;
  const expanded = open || searching;

  return (
    <>
      <Link
        href={item.href}
        title={item.title}
        onClick={onNavigate}
        className={cn(
          rowClass,
          "hidden nav-closed:flex",
          active ? currentClass : idleClass
        )}
      >
        {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
        <span className="sr-only">{item.title}</span>
      </Link>

      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className={cn(
          rowClass,
          INDENT[Math.min(depth, INDENT.length - 1)],
          "nav-closed:hidden",
          active
            ? "font-semibold text-[var(--ns-nav-primary)]"
            : idleClass
        )}
      >
        {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
        <span className="min-w-0 flex-1 truncate text-left">{item.title}</span>
        <ChevronRight
          aria-hidden
          className={cn(
            "size-4 shrink-0 transition-transform",
            expanded && "rotate-90"
          )}
        />
      </button>

      <div id={id} hidden={!expanded} className="nav-closed:hidden">
        <NavList
          items={item.children ?? []}
          pathname={pathname}
          depth={depth + 1}
          searching={searching}
          onNavigate={onNavigate}
        />
      </div>
    </>
  );
}
