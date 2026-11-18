import { sql } from "./db";

/**
 * Per-person favourites and history for the navigator
 * (docs/standards/left-navigator.md sections 1.5 and 1.6).
 *
 * Both live on the server rather than in the browser, so they follow someone
 * between computers - that is the point of them, and the standard requires it.
 * Everything is keyed on lower(email) to match how the roster is looked up.
 */

const HISTORY_LIMIT = 30;

export type Favorite = {
  id: number;
  label: string;
  href: string;
  position: number;
};

export type HistoryEntry = {
  id: number;
  label: string;
  href: string;
  visited_at: string;
};

export async function listFavorites(email: string): Promise<Favorite[]> {
  try {
    return (await sql`
      select id, label, href, position from northstar_nav_favorites
      where lower(user_email) = ${email.toLowerCase()}
      order by position, id
    `) as Favorite[];
  } catch (err) {
    // The navigator must still render if these tables are unreachable.
    console.error("northstar: favourites unavailable", err);
    return [];
  }
}

export async function addFavorite(
  email: string,
  label: string,
  href: string
): Promise<void> {
  await sql`
    insert into northstar_nav_favorites (user_email, label, href, position)
    select ${email}, ${label}, ${href},
           coalesce(max(position), -1) + 1
    from northstar_nav_favorites
    where lower(user_email) = ${email.toLowerCase()}
  `;
}

export async function removeFavorite(email: string, id: number): Promise<void> {
  await sql`
    delete from northstar_nav_favorites
    where id = ${id} and lower(user_email) = ${email.toLowerCase()}
  `;
}

export async function renameFavorite(
  email: string,
  id: number,
  label: string
): Promise<void> {
  await sql`
    update northstar_nav_favorites set label = ${label}
    where id = ${id} and lower(user_email) = ${email.toLowerCase()}
  `;
}

/** Swaps a favourite with its neighbour. Position is only meaningful within
 *  one person's list, so both updates are scoped to that person. */
export async function moveFavorite(
  email: string,
  id: number,
  direction: "up" | "down"
): Promise<void> {
  const rows = (await sql`
    select id, position from northstar_nav_favorites
    where lower(user_email) = ${email.toLowerCase()}
    order by position, id
  `) as { id: number; position: number }[];

  const i = rows.findIndex((r) => r.id === id);
  if (i < 0) return;
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= rows.length) return;

  // Rewrite the whole list rather than swapping two values: positions can be
  // equal after an import, and a full rewrite is always correct.
  const reordered = [...rows];
  [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
  for (let k = 0; k < reordered.length; k++) {
    await sql`
      update northstar_nav_favorites set position = ${k}
      where id = ${reordered[k].id} and lower(user_email) = ${email.toLowerCase()}
    `;
  }
}

export async function listHistory(email: string): Promise<HistoryEntry[]> {
  try {
    return (await sql`
      select id, label, href, visited_at from northstar_nav_history
      where lower(user_email) = ${email.toLowerCase()}
      order by visited_at desc
      limit ${HISTORY_LIMIT}
    `) as HistoryEntry[];
  } catch (err) {
    console.error("northstar: history unavailable", err);
    return [];
  }
}

/**
 * Records a page visit. One row per page per person - revisiting moves it to
 * the top (with its latest address) instead of filling the list with the same
 * page - and anything past the newest 30 is trimmed.
 */
export async function recordVisit(
  email: string,
  label: string,
  href: string
): Promise<void> {
  // One row per page (path); the row keeps the latest full address, so a list
  // comes back with the filter it last had.
  const path = href.split(/[?#]/)[0] || "/";
  try {
    await sql`
      insert into northstar_nav_history (user_email, label, href, path)
      values (${email}, ${label}, ${href}, ${path})
      on conflict (lower(user_email), path)
      do update set visited_at = now(), label = ${label}, href = ${href}
    `;
    await sql`
      delete from northstar_nav_history
      where lower(user_email) = ${email.toLowerCase()}
        and id not in (
          select id from northstar_nav_history
          where lower(user_email) = ${email.toLowerCase()}
          order by visited_at desc
          limit ${HISTORY_LIMIT}
        )
    `;
  } catch (err) {
    // Never let history bookkeeping break a page render.
    console.error("northstar: could not record visit", err);
  }
}

export async function clearHistory(email: string): Promise<void> {
  await sql`
    delete from northstar_nav_history
    where lower(user_email) = ${email.toLowerCase()}
  `;
}
