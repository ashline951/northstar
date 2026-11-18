"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { NAV_ITEMS, isActive, type NavItem } from "./nav-items";

const rowClass =
  "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm outline-none transition hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[var(--ns-gold-glow)] dark:hover:bg-white/5";

/** The current page gets a gold bar down its left edge - the same cue the
 *  cs-tracker uses, in Northstar's palette. */
const currentClass =
  "bg-[var(--ns-gold-glow)]/12 font-semibold text-[var(--ns-text-primary)] shadow-[inset_3px_0_0_var(--ns-gold-glow)] hover:bg-[var(--ns-gold-glow)]/18";

const idleClass = "text-[var(--ns-text-secondary)]";

export default function SideNav({ showAdmin = false }: { showAdmin?: boolean }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => showAdmin || !i.adminOnly);

  return (
    <nav aria-label="Main" className="p-3">
      <NavList items={items} pathname={pathname} depth={0} />
    </nav>
  );
}

/** Indent per level. Deep enough to read as a hierarchy, shallow enough that a
 *  third level still fits a 15rem rail. */
const INDENT = ["pl-3", "pl-8", "pl-12", "pl-16"];

function NavList({
  items,
  pathname,
  depth,
}: {
  items: NavItem[];
  pathname: string;
  depth: number;
}) {
  return (
    <ul className="grid gap-1">
      {items.map((item) => (
        <li key={item.href}>
          {item.children?.length ? (
            <NavGroup item={item} pathname={pathname} depth={depth} />
          ) : (
            <NavLink item={item} pathname={pathname} depth={depth} />
          )}
        </li>
      ))}
    </ul>
  );
}

function NavLink({
  item,
  pathname,
  depth,
}: {
  item: NavItem;
  pathname: string;
  depth: number;
}) {
  // A leaf is current only on its own page; a parent uses isActive.
  const current = depth > 0 ? pathname === item.href : isActive(item, pathname);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.title}
      aria-current={current ? "page" : undefined}
      className={cn(
        rowClass,
        INDENT[Math.min(depth, INDENT.length - 1)],
        current ? currentClass : idleClass
      )}
    >
      {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
      <span>{item.title}</span>
    </Link>
  );
}

/** A group with a submenu. Opens by default when the current page is inside it. */
function NavGroup({
  item,
  pathname,
  depth,
}: {
  item: NavItem;
  pathname: string;
  depth: number;
}) {
  const active = isActive(item, pathname);
  const [open, setOpen] = useState(active);
  const Icon = item.icon;
  const id = `nav-${item.href.replaceAll("/", "-")}`;

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className={cn(
          rowClass,
          INDENT[Math.min(depth, INDENT.length - 1)],
          active ? "font-semibold text-[var(--ns-text-primary)]" : idleClass
        )}
      >
        {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
        <span className="flex-1 text-left">{item.title}</span>
        <ChevronRight
          aria-hidden
          className={cn("size-4 shrink-0 transition-transform", open && "rotate-90")}
        />
      </button>
      <div id={id} hidden={!open} className="mt-1">
        <NavList items={item.children ?? []} pathname={pathname} depth={depth + 1} />
      </div>
    </>
  );
}
