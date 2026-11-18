"use client";

import { useRef, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";

/**
 * Drag handle on the navigator's right edge (docs/standards/left-navigator.md
 * 9.1): drag to any width between 200 and 400px; double-click (or Enter) goes
 * back to the standard 240px. Arrow keys move it 16px. The width is remembered
 * per browser and applied before paint by layout.tsx, as the --nav-width CSS
 * variable, so there is no jump on load. Hidden while collapsed and in the drawer.
 */
export const NAV_WIDTH = { min: 200, max: 400, standard: 240, step: 16 };
const KEY = "northstar:nav-width";

const listeners = new Set<() => void>();
/** The width on screen once this page has changed it; until then, what was saved. */
let live: number | null = null;
const clamp = (w: number) => Math.round(Math.min(NAV_WIDTH.max, Math.max(NAV_WIDTH.min, w)));

function read(): number {
  try {
    const saved = Number(localStorage.getItem(KEY));
    return saved >= NAV_WIDTH.min && saved <= NAV_WIDTH.max ? saved : NAV_WIDTH.standard;
  } catch {
    return NAV_WIDTH.standard;
  }
}

/** Shows a width now; `save` also remembers it (only at the end of a drag). */
function setWidth(width: number, save: boolean) {
  const w = clamp(width);
  live = w;
  document.documentElement.style.setProperty("--nav-width", `${w}px`);
  if (save) {
    try {
      if (w === NAV_WIDTH.standard) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, String(w));
    } catch {
      // Storage blocked: lasts until reload.
    }
  }
  listeners.forEach((l) => l());
}

export default function NavResizer() {
  const width = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => live ?? read(),
    () => NAV_WIDTH.standard,
  );
  const drag = useRef<{ x: number; w: number; aside: HTMLElement } | null>(null);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    const aside = e.currentTarget.parentElement;
    if (!aside || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    aside.style.transition = "none"; // follow the pointer exactly while dragging
    document.body.style.cursor = "col-resize";
    drag.current = { x: e.clientX, w: aside.getBoundingClientRect().width, aside };
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d) setWidth(d.w + e.clientX - d.x, false);
  }
  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    d.aside.style.transition = "";
    document.body.style.cursor = "";
    setWidth(d.w + e.clientX - d.x, true);
  }
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const by = { ArrowLeft: -NAV_WIDTH.step, ArrowRight: NAV_WIDTH.step }[e.key];
    if (by) setWidth(width + by, true);
    else if (e.key === "Home") setWidth(NAV_WIDTH.min, true);
    else if (e.key === "End") setWidth(NAV_WIDTH.max, true);
    else if (e.key === "Enter") setWidth(NAV_WIDTH.standard, true);
    else return;
    e.preventDefault();
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize menu"
      aria-valuemin={NAV_WIDTH.min}
      aria-valuemax={NAV_WIDTH.max}
      aria-valuenow={width}
      tabIndex={0}
      title="Drag to resize the menu. Double-click to reset."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => setWidth(NAV_WIDTH.standard, true)}
      onKeyDown={onKeyDown}
      className="absolute inset-y-0 -right-1 z-10 w-2 cursor-col-resize touch-none outline-none after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:transition-colors hover:after:bg-[var(--ns-nav-primary)] focus-visible:after:bg-[var(--ns-nav-primary)] nav-closed:hidden"
    />
  );
}
