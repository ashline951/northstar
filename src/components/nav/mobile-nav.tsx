"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import SideNav from "./side-nav";

/**
 * Below 1024px the navigator is not a column: the same navigator opens as a
 * drawer from a Menu button in the banner, and closes once a page is chosen.
 * Required by docs/standards/left-navigator.md.
 */
export default function MobileNav({ showAdmin }: { showAdmin: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-md text-[var(--ns-text-inverse)] outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-[var(--ns-gold-glow)] lg:hidden"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="absolute inset-y-0 left-0 flex w-60 flex-col bg-[var(--ns-nav-bg)] shadow-2xl">
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex size-8 items-center justify-center rounded-md text-[var(--ns-text-secondary)] hover:bg-[var(--ns-nav-hover)]"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <SideNav showAdmin={showAdmin} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
