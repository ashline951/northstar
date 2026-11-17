import AppShell from "./AppShell";

/** Shown when the database cannot be reached. Deliberately distinct from a
 *  permission message: telling someone they lack a role they actually hold
 *  sends them hunting for the wrong problem. */
export default function ServiceUnavailable() {
  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="ns-display text-2xl text-[var(--ns-text-primary)]">
          Northstar cannot reach its database
        </h1>
        <p className="mt-3 text-sm text-[var(--ns-text-secondary)]">
          This is not a permissions problem — your access is unchanged. The
          database is unreachable, which usually means its connection details
          changed and the app has not been redeployed yet.
        </p>
      </div>
    </AppShell>
  );
}
