"use server";

import { auth } from "@/auth";
import { getActiveUser } from "@/lib/users";
import {
  addFavorite,
  clearHistory,
  listFavorites,
  listHistory,
  moveFavorite,
  recordVisit,
  removeFavorite,
  renameFavorite,
  type HistoryEntry,
} from "@/lib/nav-store";

/**
 * Navigator favourites and history (docs/standards/left-navigator.md sections
 * 9.5, 9.6 and 10). A server action is a public endpoint, so every one of these
 * re-checks the signed-in person against the roster and only ever touches that
 * person's own rows; the email comes from the session, never from the client.
 */

export type NavResult = { ok: true } | { ok: false; error: string };

const MAX_FAVORITES = 50;

async function me(): Promise<string | null> {
  const session = await auth();
  const user = await getActiveUser(session?.user?.email);
  return user ? user.email : null;
}

/** Only pages inside Northstar: "/something", never "//other-site" or "https://…". */
function cleanHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  const value = href.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.length > 2000) return null;
  return value;
}

function cleanLabel(label: unknown, max: number): string {
  return typeof label === "string" ? label.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

const signedOut: NavResult = { ok: false, error: "Sign in to Northstar again, then try that." };

export async function addFavoriteAction(label: unknown, href: unknown): Promise<NavResult> {
  const email = await me();
  if (!email) return signedOut;
  const path = cleanHref(href);
  const name = cleanLabel(label, 60);
  if (!path) return { ok: false, error: "Only pages in Northstar can be favorites." };
  if (!name) return { ok: false, error: "Give the favorite a name." };
  const existing = await listFavorites(email);
  if (existing.some((f) => f.href === path)) return { ok: false, error: "That page is already a favorite." };
  if (existing.length >= MAX_FAVORITES)
    return { ok: false, error: `You can have up to ${MAX_FAVORITES} favorites.` };
  await addFavorite(email, name, path);
  return { ok: true };
}

export async function renameFavoriteAction(id: number, label: unknown): Promise<NavResult> {
  const email = await me();
  if (!email) return signedOut;
  const name = cleanLabel(label, 60);
  if (!name) return { ok: false, error: "Give the favorite a name." };
  await renameFavorite(email, Number(id), name);
  return { ok: true };
}

export async function moveFavoriteAction(id: number, by: -1 | 1): Promise<NavResult> {
  const email = await me();
  if (!email) return signedOut;
  await moveFavorite(email, Number(id), by < 0 ? "up" : "down");
  return { ok: true };
}

export async function removeFavoriteAction(id: number): Promise<NavResult> {
  const email = await me();
  if (!email) return signedOut;
  await removeFavorite(email, Number(id));
  return { ok: true };
}

/** Called by the browser after each page change. */
export async function recordVisitAction(label: unknown, href: unknown): Promise<void> {
  const email = await me();
  const full = cleanHref(href);
  if (!email || !full) return;
  const path = full.split(/[?#]/)[0] || "/";
  if (path.startsWith("/api/") || path.startsWith("/oauth") || path === "/signin") return;
  await recordVisit(email, cleanLabel(label, 80) || path, full);
}

export async function loadHistoryAction(): Promise<HistoryEntry[]> {
  const email = await me();
  if (!email) return [];
  const rows = await listHistory(email);
  // Plain values only across the server/client boundary.
  return rows.map((r) => ({ ...r, id: Number(r.id), visited_at: new Date(r.visited_at).toISOString() }));
}

export async function clearHistoryAction(): Promise<void> {
  const email = await me();
  if (email) await clearHistory(email);
}
