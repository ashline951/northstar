import AppShell from "./AppShell";

/** The same refusal on every record page, so the wording cannot drift. */
export default function NotOnProject() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="ns-display text-2xl text-[var(--ns-text-primary)]">
          Not part of this project
        </h1>
        <p className="mt-3 text-sm text-[var(--ns-text-secondary)]">
          Records are limited to the core team.
        </p>
      </div>
    </AppShell>
  );
}
