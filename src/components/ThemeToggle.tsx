"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function apply(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      setTheme((localStorage.getItem("ns-theme") as Theme) || "system");
    } catch {
      /* private mode - stay on the default */
    }
  }, []);

  // Follow the OS while on "system".
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  function choose(next: Theme) {
    setTheme(next);
    apply(next);
    try {
      localStorage.setItem("ns-theme", next);
    } catch {
      /* preference just will not persist */
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex rounded-lg border border-[var(--ns-border-subtle)] p-1"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={theme === o.value}
          onClick={() => choose(o.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            theme === o.value
              ? "bg-[var(--ns-bg-night-sky)] text-[var(--ns-text-inverse)]"
              : "text-[var(--ns-text-secondary)] hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
