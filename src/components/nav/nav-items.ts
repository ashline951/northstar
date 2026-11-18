import {
  House,
  Lightbulb,
  ListChecks,
  FolderKanban,
  Layers,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { VIEW_GROUPS } from "@/lib/views";

/**
 * The left-hand navigation, in the shape the cs-tracker uses: an item with
 * `children` becomes a group that opens and closes.
 *
 * The record groups are generated from VIEW_GROUPS rather than written out
 * here, so a new list view appears in the navigation automatically and the
 * label can never disagree with what the page queries.
 */
export type NavItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  children?: NavItem[];
  /** Shown only to project managers. The pages check on the server too. */
  adminOnly?: boolean;
};

const LIFECYCLE_ICON: Record<string, LucideIcon> = {
  Idea: Lightbulb,
  Demand: ListChecks,
  Project: FolderKanban,
};

const recordGroups: NavItem[] = VIEW_GROUPS.map((g) => ({
  title: `${g.lifecycle}s`,
  // A group has no page of its own; its first view stands in for it.
  href: `/records/${g.views[0].key}`,
  icon: LIFECYCLE_ICON[g.lifecycle],
  children: g.views.map((v) => ({ title: v.label, href: `/records/${v.key}` })),
}));

/**
 * Project Portfolio Management is the application; Ideas, Demands and Projects
 * live inside it. Northstar is the code name of the project building it, so it
 * sits alongside as its own workspace - when PPM joins a larger platform, other
 * applications become siblings of this entry rather than being bolted under it.
 */
export const NAV_ITEMS: NavItem[] = [
  { title: "Home", href: "/", icon: House },
  {
    title: "Project Management",
    href: `/records/${VIEW_GROUPS[0].views[0].key}`,
    icon: Layers,
    children: recordGroups,
  },
  { title: "Northstar Project", href: "/project", icon: FolderKanban },
  { title: "Admin", href: "/admin", icon: ShieldCheck, adminOnly: true },
];

/** True when `pathname` is this item's page or one of the pages under it. */
export function isActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/") return pathname === "/";
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
  // Recurses, so a group counts as current when any page nested under it is -
  // however deep. Northstar will grow more levels as the platform does.
  return Boolean(item.children?.some((c) => isActive(c, pathname)));
}
