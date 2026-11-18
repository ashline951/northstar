import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import { lookupUser } from "@/lib/users";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import { STATUSES, listItems, listLinks } from "@/lib/project";
import { CAPABILITIES, type Coverage } from "@/lib/capabilities";
import {
  addItemAction,
  addLinkAction,
  deleteItemAction,
  deleteLinkAction,
  setStatusAction,
} from "./actions";

const STATUS_STYLE: Record<string, string> = {
  "Not started": "bg-black/5 text-[var(--ns-text-secondary)] dark:bg-white/10",
  "In progress": "bg-[var(--ns-lluh-teal)]/15 text-[var(--ns-lluh-teal)]",
  Blocked: "bg-red-500/15 text-red-700 dark:text-red-400",
  Done: "bg-[var(--ns-gold-glow)]/20 text-[var(--ns-bg-rich-navy)] dark:text-[var(--ns-gold-light)]",
};

const DOT: Record<Coverage, string> = {
  Covered: "bg-[var(--ns-lluh-teal)]",
  Partial: "bg-[var(--ns-gold-glow)]",
  Gap: "bg-[var(--ns-bg-rich-navy)] dark:bg-slate-400",
};

function Dot({ c }: { c: Coverage }) {
  return (
    <span
      aria-label={c}
      title={c}
      className={`inline-block h-2.5 w-2.5 rounded-full ${DOT[c]}`}
    />
  );
}

export default async function ProjectPage() {
  const session = await auth();
  const lookup = await lookupUser(session?.user?.email);

  if (lookup.status === "unavailable") return <ServiceUnavailable />;

  const me = lookup.status === "ok" ? lookup.user : null;

  if (!me?.has_project_access) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h1 className="ns-display text-2xl text-[var(--ns-text-primary)]">
            Not part of this project
          </h1>
          <p className="mt-3 text-sm text-[var(--ns-text-secondary)]">
            The Northstar project workspace is limited to the core team.
          </p>
        </div>
      </AppShell>
    );
  }

  const [items, links] = await Promise.all([listItems(), listLinks()]);
  const input =
    "rounded-lg border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-3 py-2 text-sm text-[var(--ns-text-primary)]";

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="ns-display text-3xl text-[var(--ns-text-primary)]">
          Northstar Project
        </h1>
        <p className="mt-2 text-sm text-[var(--ns-text-secondary)]">
          Where we run the Northstar project until Northstar can run it. A
          stop-gap — this data moves into the real system later.
        </p>

        {/* Links first: the Teams site is where the actual documents live. */}
        <section className="mt-8 rounded-xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] p-5">
          <h2 className="font-semibold text-[var(--ns-text-primary)]">
            Project links
          </h2>
          <ul className="mt-3 space-y-2">
            {links.map((l) => (
              <li key={l.id} className="flex items-center gap-3">
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-[var(--ns-lluh-teal)] underline-offset-2 hover:underline"
                >
                  {l.label}
                </a>
                <form action={deleteLinkAction}>
                  <input type="hidden" name="id" value={l.id} />
                  <button className="text-xs text-[var(--ns-text-secondary)] hover:text-red-600">
                    Remove
                  </button>
                </form>
              </li>
            ))}
            {links.length === 0 && (
              <li className="text-sm text-[var(--ns-text-secondary)]">
                No links yet — add the Teams site below.
              </li>
            )}
          </ul>

          <form action={addLinkAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input name="label" required placeholder="Teams — Northstar documents" className={`${input} sm:w-72`} />
            <input name="url" type="url" required placeholder="https://..." className={`${input} flex-1`} />
            <button className="rounded-lg bg-[var(--ns-bg-night-sky)] px-4 py-2 text-sm font-medium text-[var(--ns-text-inverse)]">
              Add link
            </button>
          </form>
        </section>

        <section className="mt-10">
          <h2 className="font-semibold text-[var(--ns-text-primary)]">Work items</h2>

          <form
            action={addItemAction}
            className="mt-3 flex flex-col gap-2 rounded-xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] p-5 sm:flex-row"
          >
            <input name="title" required placeholder="What needs doing" className={`${input} flex-1`} />
            <input name="owner_email" placeholder="Owner (email)" className={`${input} sm:w-56`} />
            <input name="due_on" type="date" className={input} />
            <button className="rounded-lg bg-[var(--ns-gold-glow)] px-5 py-2 text-sm font-semibold text-[var(--ns-bg-midnight)] hover:bg-[var(--ns-gold-light)]">
              Add
            </button>
          </form>

          <ul className="mt-4 space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-4 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[var(--ns-text-primary)]">
                    {it.title}
                  </span>
                  <span className="text-xs text-[var(--ns-text-secondary)]">
                    {it.owner_email ?? "Unassigned"}
                    {it.due_on && ` · due ${new Date(it.due_on).toLocaleDateString()}`}
                  </span>
                </span>

                <form action={setStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={it.id} />
                  <select
                    name="status"
                    defaultValue={it.status}
                    className={`${input} ${STATUS_STYLE[it.status] ?? ""}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button className="text-xs text-[var(--ns-text-secondary)] hover:text-[var(--ns-text-primary)]">
                    Save
                  </button>
                </form>

                <form action={deleteItemAction}>
                  <input type="hidden" name="id" value={it.id} />
                  <button className="text-xs text-[var(--ns-text-secondary)] hover:text-red-600">
                    Remove
                  </button>
                </form>
              </li>
            ))}
            {items.length === 0 && (
              <li className="px-1 text-sm text-[var(--ns-text-secondary)]">
                Nothing tracked yet.
              </li>
            )}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="ns-display text-2xl text-[var(--ns-text-primary)]">
            What a modern AI project management system needs
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--ns-text-secondary)]">
            A working checklist for Northstar, with our current ServiceNow
            footprint as the baseline — so the conversation is about the gap
            rather than rebuilding what we already have. This is a reference
            list, not a backlog.
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--ns-text-secondary)]">
            <span><Dot c="Covered" /> ServiceNow covers it</span>
            <span><Dot c="Partial" /> Partly there</span>
            <span><Dot c="Gap" /> Where Northstar earns its place</span>
          </div>

          <div className="mt-6 space-y-6">
            {CAPABILITIES.map((g) => (
              <div
                key={g.group}
                className="overflow-hidden rounded-xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)]"
              >
                <h3 className="border-b border-[var(--ns-border-subtle)] bg-black/[0.03] px-5 py-3 text-sm font-semibold tracking-wide text-[var(--ns-text-primary)] uppercase dark:bg-white/[0.04]">
                  {g.group}
                </h3>
                <ul>
                  {g.items.map((c) => (
                    <li
                      key={c.name}
                      className="flex gap-3 border-b border-[var(--ns-border-subtle)] px-5 py-3 last:border-0"
                    >
                      <span className="mt-1.5 shrink-0">
                        <Dot c={c.servicenow} />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-[var(--ns-text-primary)]">
                          {c.name}
                        </span>
                        <span className="block text-sm text-[var(--ns-text-secondary)]">
                          {c.detail}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-10 text-xs text-[var(--ns-text-secondary)]">
          Work items and links are stored in <code>northstar_tmp_*</code> tables.
          Deliberately throwaway — do not build on them.
        </p>
      </div>
    </AppShell>
  );
}
