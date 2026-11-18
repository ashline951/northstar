import {
  type NorthstarRecord,
  displayNumber,
  nextLifecycle,
  statesFor,
  LIFECYCLES,
  type Lifecycle,
} from "@/lib/records";
import {
  advanceLifecycleAction,
  createRecordAction,
  deleteRecordAction,
  setRecordStateAction,
  updateRecordAction,
} from "@/app/project/record-actions";

const LIFECYCLE_STYLE: Record<Lifecycle, string> = {
  Idea: "bg-[var(--ns-bg-rich-navy)]/15 text-[var(--ns-bg-rich-navy)] dark:bg-white/10 dark:text-slate-300",
  Demand: "bg-[var(--ns-gold-glow)]/20 text-[var(--ns-amber-warm)]",
  Project: "bg-[var(--ns-lluh-teal)]/15 text-[var(--ns-lluh-teal)]",
};

const input =
  "rounded-lg border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-3 py-2 text-sm text-[var(--ns-text-primary)]";

export default function RecordsBoard({
  records,
  people,
}: {
  records: NorthstarRecord[];
  people: { email: string; display_name: string | null }[];
}) {
  return (
    <section className="mt-14">
      <h2 className="ns-display text-2xl text-[var(--ns-text-primary)]">
        Ideas, Demands and Projects
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-[var(--ns-text-secondary)]">
        One record that matures. An Idea becomes a Demand becomes a Project —
        nothing is copied, so the history, the title and the conversation stay
        with it. The number keeps its suffix, so a reference written when it was
        an Idea still finds it as a Project.
      </p>

      <form
        action={createRecordAction}
        className="mt-6 grid gap-3 rounded-xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] p-5 sm:grid-cols-2"
      >
        <input name="title" required placeholder="Title" className={`${input} sm:col-span-2`} />
        <textarea
          name="description"
          rows={2}
          placeholder="Description"
          className={`${input} sm:col-span-2`}
        />
        <select name="lifecycle" defaultValue="Idea" className={input}>
          {LIFECYCLES.map((l) => (
            <option key={l} value={l}>
              Start as {l}
            </option>
          ))}
        </select>
        <select name="assigned_to" defaultValue="" className={input}>
          <option value="">Unassigned</option>
          {people.map((p) => (
            <option key={p.email} value={p.email}>
              {p.display_name ?? p.email}
            </option>
          ))}
        </select>
        <input name="assigned_group" placeholder="Assignment group" className={input} />
        <button className="rounded-lg bg-[var(--ns-gold-glow)] px-5 py-2 text-sm font-semibold text-[var(--ns-bg-midnight)] hover:bg-[var(--ns-gold-light)]">
          Create
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {records.map((r) => {
          const next = nextLifecycle(r.lifecycle);
          return (
            <div
              key={r.id}
              className="rounded-xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] p-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <code className="text-sm font-semibold text-[var(--ns-text-primary)]">
                  {displayNumber(r)}
                </code>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${LIFECYCLE_STYLE[r.lifecycle]}`}
                >
                  {r.lifecycle}
                </span>

                {/* Only this lifecycle's states are offered. */}
                <form action={setRecordStateAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <select name="state" defaultValue={r.state} className={`${input} py-1`}>
                    {statesFor(r.lifecycle).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <button className="text-xs text-[var(--ns-text-secondary)] hover:text-[var(--ns-text-primary)]">
                    Save
                  </button>
                </form>

                <span className="flex-1" />

                {next && (
                  <form action={advanceLifecycleAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      title={`Keeps the same record and suffix; state resets to ${statesFor(next)[0]}`}
                      className="rounded-lg border border-[var(--ns-lluh-teal)]/50 px-3 py-1 text-xs font-medium text-[var(--ns-lluh-teal)] hover:bg-[var(--ns-lluh-teal)]/10"
                    >
                      Promote to {next}
                    </button>
                  </form>
                )}
                <form action={deleteRecordAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="text-xs text-[var(--ns-text-secondary)] hover:text-red-600">
                    Remove
                  </button>
                </form>
              </div>

              <p className="mt-3 font-medium text-[var(--ns-text-primary)]">{r.title}</p>
              {r.description && (
                <p className="mt-1 text-sm whitespace-pre-wrap text-[var(--ns-text-secondary)]">
                  {r.description}
                </p>
              )}

              <form
                action={updateRecordAction}
                className="mt-3 flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="id" value={r.id} />
                <select
                  name="assigned_to"
                  defaultValue={r.assigned_to ?? ""}
                  className={`${input} py-1`}
                >
                  <option value="">Unassigned</option>
                  {people.map((p) => (
                    <option key={p.email} value={p.email}>
                      {p.display_name ?? p.email}
                    </option>
                  ))}
                </select>
                <input
                  name="assigned_group"
                  defaultValue={r.assigned_group ?? ""}
                  placeholder="Assignment group"
                  className={`${input} py-1`}
                />
                <button className="text-xs text-[var(--ns-text-secondary)] hover:text-[var(--ns-text-primary)]">
                  Save
                </button>
              </form>
            </div>
          );
        })}
        {records.length === 0 && (
          <p className="text-sm text-[var(--ns-text-secondary)]">
            Nothing yet. Add an Idea above.
          </p>
        )}
      </div>
    </section>
  );
}
