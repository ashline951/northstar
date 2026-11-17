/**
 * Tracks whether a person has seen the welcome video.
 *
 * Stored per browser in localStorage, by design: Ryan confirmed the video
 * should play again on a new device. A per-person record would need a
 * database. Keyed by email so shared machines behave sensibly.
 *
 * Every access is wrapped - localStorage throws in some private modes.
 */
const KEY = "ns-welcome-seen";

export function hasSeenWelcome(email?: string | null): boolean {
  if (!email) return false;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    return (JSON.parse(raw) as string[]).includes(email.toLowerCase());
  } catch {
    // Treat unreadable storage as "not seen" - showing the welcome twice is
    // better than a blank screen.
    return false;
  }
}

export function markWelcomeSeen(email?: string | null): void {
  if (!email) return;
  try {
    const raw = localStorage.getItem(KEY);
    const seen: string[] = raw ? JSON.parse(raw) : [];
    const e = email.toLowerCase();
    if (!seen.includes(e)) seen.push(e);
    localStorage.setItem(KEY, JSON.stringify(seen));
  } catch {
    /* preference just will not persist */
  }
}

/** Used by the "Watch the Northstar video" menu item. */
export function replayWelcomeVideo(): void {
  window.dispatchEvent(new CustomEvent("ns:replay-welcome"));
}
