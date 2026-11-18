import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import ThemeToggle from "@/components/ThemeToggle";


export const metadata: Metadata = { title: "Preferences" };

export default function PreferencesPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="ns-display text-3xl text-[var(--ns-text-primary)]">Preferences</h1>
        <p className="mt-2 text-sm text-[var(--ns-text-secondary)]">
          Saved in this browser.
        </p>

        <div className="mt-8 rounded-xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] p-6">
          <h2 className="font-semibold text-[var(--ns-text-primary)]">Appearance</h2>
          <p className="mt-1 mb-4 text-sm text-[var(--ns-text-secondary)]">
            System follows your device setting.
          </p>
          <ThemeToggle />
        </div>
      </div>
    </AppShell>
  );
}
