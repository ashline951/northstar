"use client";

import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { isEmptyFilter, type Group } from "@/lib/list-view/filter";
import {
  deleteFilterAction,
  saveFilterAction,
} from "@/app/records/list-actions";

export type Favorite = {
  id: number;
  name: string;
  filter: Group;
  owner_email: string;
  shared: boolean;
};

/**
 * Saved filters - docs/standards/list-view.md section 12.
 *
 * Shared ones are listed first, then by name. Saving needs a name and a
 * filter with something in it; sharing needs the admin permission. The server
 * checks all three again, so this is only what the person sees.
 */
export default function Favorites({
  favorites,
  filter,
  isAdmin,
  myEmail,
  onApply,
  onChanged,
}: {
  favorites: Favorite[];
  filter: Group;
  isAdmin: boolean;
  myEmail: string;
  onApply: (g: Group) => void;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<null | "save" | "remove">(null);
  const [name, setName] = useState("");
  const [share, setShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mine = favorites.filter((f) => !f.shared);
  const shared = favorites.filter((f) => f.shared);
  const unfiltered = isEmptyFilter(filter);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const item =
    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[var(--ns-text-primary)] hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/5";

  async function save() {
    setBusy(true);
    setError(null);
    const res = await saveFilterAction({ name, filter, shared: share });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDialog(null);
    setName("");
    setShare(false);
    onChanged();
  }

  async function remove(id: number) {
    setBusy(true);
    setError(null);
    const res = await deleteFilterAction(id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onChanged();
  }

  // Section 7: the star fills, and the name changes, while one is in use.
  const inUse = favorites.find(
    (f) => JSON.stringify(f.filter) === JSON.stringify(filter)
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={inUse ? `Favorites (showing ${inUse.name})` : "Favorites"}
        title={inUse ? `Favorite: ${inUse.name}` : "Favorites"}
        className={cn(
          "flex size-8 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5",
          inUse
            ? "text-[var(--ns-nav-primary)]"
            : "text-[var(--ns-text-secondary)]"
        )}
      >
        <Star
          aria-hidden
          className="size-5"
          fill={inUse ? "currentColor" : "none"}
        />
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
            className="absolute right-0 z-50 mt-1 w-80 overflow-hidden rounded-lg border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] py-1 shadow-lg"
          >
            <p className="px-3 py-1.5 text-xs font-semibold tracking-wide text-[var(--ns-text-secondary)] uppercase">
              Your favorites
            </p>
            {mine.length === 0 && (
              <p className="px-3 pb-1.5 text-sm text-[var(--ns-text-secondary)]">
                None yet. Filter the list, then save it here.
              </p>
            )}
            {mine.map((f) => (
              <button
                key={f.id}
                type="button"
                role="menuitem"
                className={item}
                onClick={() => {
                  onApply(f.filter);
                  setOpen(false);
                }}
              >
                {f.name}
              </button>
            ))}

            {shared.length > 0 && (
              <>
                <p className="px-3 py-1.5 text-xs font-semibold tracking-wide text-[var(--ns-text-secondary)] uppercase">
                  Shared with everyone
                </p>
                {shared.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="menuitem"
                    className={item}
                    onClick={() => {
                      onApply(f.filter);
                      setOpen(false);
                    }}
                  >
                    {f.name}
                  </button>
                ))}
              </>
            )}

            <div className="my-1 border-t border-[var(--ns-border-subtle)]" />

            <button
              type="button"
              role="menuitem"
              className={item}
              disabled={unfiltered}
              title={unfiltered ? "Filter the list first" : undefined}
              onClick={() => {
                setOpen(false);
                setDialog("save");
              }}
            >
              <Star aria-hidden className="size-3.5 shrink-0" />
              Save current filter as a favorite…
            </button>
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false);
                setDialog("remove");
              }}
            >
              <Trash2 aria-hidden className="size-3.5 shrink-0" />
              Remove a favorite…
            </button>
          </div>
        </>
      )}

      {dialog === "save" && (
        <Dialog
          title="Save as a favorite"
          intro="It will be listed under ★ Favorites so you can use it again with one click."
          onClose={() => setDialog(null)}
        >
          <label className="block text-sm font-medium text-[var(--ns-text-secondary)]">
            Name
            <input
              autoFocus
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-3 py-2 text-base text-[var(--ns-text-primary)]"
            />
          </label>

          {isAdmin && (
            <label className="mt-3 flex items-start gap-2 text-sm text-[var(--ns-text-primary)]">
              <input
                type="checkbox"
                checked={share}
                onChange={(e) => setShare(e.target.checked)}
                className="mt-1"
              />
              <span>
                Share with everyone
                <span className="block text-[var(--ns-text-secondary)]">
                  Everyone who uses this list will see it.
                </span>
              </span>
            </label>
          )}

          {error && <p className="mt-3 text-sm text-red-700 dark:text-red-400">{error}</p>}

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDialog(null)}
              className="rounded-lg border border-[var(--ns-border-subtle)] px-4 py-2 text-sm text-[var(--ns-text-primary)]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={save}
              className="rounded-lg bg-[var(--ns-nav-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save favorite"}
            </button>
          </div>
        </Dialog>
      )}

      {dialog === "remove" && (
        <Dialog
          title="Remove a favorite"
          intro="Removing takes it off ★ Favorites (for everyone, if it's shared). It doesn't change any data."
          onClose={() => setDialog(null)}
        >
          {(() => {
            // You may remove your own; a shared one needs the admin
            // permission. The server checks this again.
            const removable = favorites.filter((f) =>
              f.shared
                ? isAdmin
                : f.owner_email.toLowerCase() === myEmail.toLowerCase()
            );
            if (!removable.length) {
              return (
                <p className="text-sm text-[var(--ns-text-secondary)]">
                  You have no favorites to remove.
                </p>
              );
            }
            return (
              <ul className="space-y-1">
                {removable.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <span className="min-w-0 text-sm text-[var(--ns-text-primary)]">
                      <span className="block truncate">{f.name}</span>
                      {f.shared && (
                        <span className="text-xs text-[var(--ns-text-secondary)]">
                          Shared with everyone
                        </span>
                      )}
                    </span>
                    <ConfirmRemove
                      name={f.name}
                      busy={busy}
                      onConfirm={() => remove(f.id)}
                    />
                  </li>
                ))}
              </ul>
            );
          })()}

          {error && <p className="mt-3 text-sm text-red-700 dark:text-red-400">{error}</p>}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setDialog(null)}
              className="rounded-lg border border-[var(--ns-border-subtle)] px-4 py-2 text-sm text-[var(--ns-text-primary)]"
            >
              Keep
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

/** Section 18: a destructive action confirms before it happens. */
function ConfirmRemove({
  name,
  busy,
  onConfirm,
}: {
  name: string;
  busy: boolean;
  onConfirm: () => void;
}) {
  const [asked, setAsked] = useState(false);
  if (!asked) {
    return (
      <button
        type="button"
        onClick={() => setAsked(true)}
        className="shrink-0 rounded-md border border-[var(--ns-border-subtle)] px-2 py-1 text-sm text-[var(--ns-text-primary)]"
      >
        Remove
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onConfirm}
      className="shrink-0 rounded-md bg-red-700 px-2 py-1 text-sm text-white disabled:opacity-60"
    >
      Yes, remove &ldquo;{name}&rdquo;
    </button>
  );
}

function Dialog({
  title,
  intro,
  children,
  onClose,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] p-5 shadow-xl"
      >
        <h2 className="ns-display text-xl text-[var(--ns-text-primary)]">
          {title}
        </h2>
        <p className="mt-1 mb-4 text-sm text-[var(--ns-text-secondary)]">
          {intro}
        </p>
        {children}
      </div>
    </div>
  );
}
