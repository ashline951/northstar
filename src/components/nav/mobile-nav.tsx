"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import SideNav, { type NavFavorite } from "./side-nav";

/**
 * Phones and tablets (below 1024px): a Menu button in the banner opens the same
 * navigator as a drawer (docs/standards/left-navigator.md 9.7). A native
 * <dialog> shown as a modal keeps focus inside, closes on Esc, and returns focus
 * to the Menu button; choosing a page, ✕ or tapping outside also closes it.
 */
export default function MobileNav({
  showAdmin,
  favorites,
}: {
  showAdmin: boolean;
  favorites?: NavFavorite[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-[var(--ns-text-inverse)] outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-[var(--ns-gold-glow)] lg:hidden"
      >
        <Menu aria-hidden className="size-6" />
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="ns-drawer-title"
        aria-describedby="ns-drawer-desc"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // A click on the backdrop lands on the <dialog> itself.
          if (e.target === e.currentTarget) setOpen(false);
        }}
        className="fixed inset-y-0 left-0 m-0 h-full max-h-none w-72 max-w-[85vw] bg-[var(--ns-nav-bg)] p-0 shadow-2xl backdrop:bg-black/40 lg:hidden"
      >
        {open && (
          <div className="flex h-full flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <h2 id="ns-drawer-title" className="text-2xl font-semibold text-[var(--ns-nav-text)]">
                Menu
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex size-11 items-center justify-center rounded-lg text-[var(--ns-nav-text-muted)] outline-none hover:bg-[var(--ns-nav-hover)] focus-visible:ring-3 focus-visible:ring-[var(--ns-nav-text)]"
              >
                <X aria-hidden className="size-6" />
              </button>
            </div>
            <p id="ns-drawer-desc" className="sr-only">
              Go to a page in Northstar.
            </p>
            <div className="-mx-2 min-h-0 flex-1">
              <SideNav showAdmin={showAdmin} favorites={favorites} inDrawer onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
