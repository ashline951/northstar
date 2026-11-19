import Link from "next/link";
import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";
import RelativeDate from "./list-view/relative-date";
import {
  type Lifecycle,
  type NorthstarRecord,
  displayNumber,
  nextLifecycle,
  statesFor,
} from "@/lib/records";
import {
  advanceLifecycleAction,
  createRecordAction,
  saveRecordAction,
  setRecordActiveAction,
} from "@/app/records/actions";

const field =
  "w-full rounded-md border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-3 py-2 text-base text-[var(--ns-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ns-nav-primary)]";
const label = "block text-sm font-medium text-[var(--ns-text-secondary)]";
const value = "mt-1 min-h-10 py-2 text-base text-[var(--ns-text-primary)]";
const button =
  "inline-flex items-center gap-1.5 rounded-lg border border-[var(--ns-border-subtle)] px-3 py-1.5 text-sm text-[var(--ns-text-primary)] hover:border-[var(--ns-nav-primary)]";
const primary =
  "inline-flex items-center gap-1.5 rounded-lg bg-[var(--ns-nav-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90";

export type Person = { email: string; name: string };

/**
 * One record, read-only by default, with an Edit mode that keeps every field
 * where it was - values turn into inputs, nothing moves, so the eye does not
 * have to re-find anything. Creating uses the edit layout, because a new
 * record has nothing to read yet.
 *
 * Only the lifecycle is special: it is chosen once on create and then changes
 * only by promotion, never by editing a dropdown, because promotion resets the
 * state and is written to the record's history. Promote and Mark inactive are
 * decisions rather than edits, so they stay out of the form.
 */
export default function RecordForm({
  record,
  lifecycle,
  editing,
  people,
  groups,
  from,
  backHref,
  backLabel,
}: {
  record?: NorthstarRecord;
  /** Create only: the lifecycle the new record starts in. */
  lifecycle?: Lifecycle;
  editing: boolean;
  /** The active roster, for the Assigned to picker. */
  people: Person[];
  /** Assignment groups already in use. New ones can still be typed. */
  groups: string[];
  /** The list view this was opened from, carried through so Cancel and Save return there. */
  from?: string;
  backHref: string;
  backLabel: string;
}) {
  const creating = !record;
  const current: Lifecycle = record?.lifecycle ?? lifecycle ?? "Idea";
  const next = record ? nextLifecycle(record.lifecycle) : null;
  const edit = creating || editing;
  const fromQuery = from ? `?from=${encodeURIComponent(from)}` : "";
  const viewHref = record ? `/record/${displayNumber(record)}${fromQuery}` : backHref;
  const editHref = record
    ? `/record/${displayNumber(record)}?edit=1${from ? `&from=${encodeURIComponent(from)}` : ""}`
    : "";

  // The roster might not contain whoever a demo record is assigned to; show
  // them anyway rather than silently reassigning on the next save.
  const assignee = record?.assigned_to ?? "";
  const assigneeKnown = people.some(
    (p) => p.email.toLowerCase() === assignee.toLowerCase()
  );
  const assigneeName =
    people.find((p) => p.email.toLowerCase() === assignee.toLowerCase())?.name ??
    assignee;

  return (
    <div className="w-full min-w-0 px-4 py-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-[var(--ns-text-secondary)] hover:text-[var(--ns-nav-primary)]"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {backLabel}
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="ns-display text-2xl text-[var(--ns-text-primary)]">
          {creating ? `New ${current}` : displayNumber(record)}
        </h1>
        {/* The number's prefix already says what it is (PRJ, DMND, IDEA), so
            no lifecycle badge - only Inactive, which the number cannot show. */}
        {record && !record.is_active && (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-sm text-[var(--ns-text-secondary)] dark:bg-white/10">
            Inactive
          </span>
        )}
        {record && !edit && (
          <Link href={editHref} className={`${button} ml-auto`}>
            <Pencil aria-hidden className="size-4" />
            Edit
          </Link>
        )}
      </div>

      <form
        action={creating ? createRecordAction : saveRecordAction}
        className="mt-5 space-y-5"
      >
        {record && (
          <>
            <input type="hidden" name="id" value={record.id} />
            <input type="hidden" name="number" value={displayNumber(record)} />
          </>
        )}
        {creating && <input type="hidden" name="lifecycle" value={current} />}
        {from && <input type="hidden" name="from" value={from} />}

        <div>
          <label className={label} htmlFor="title">
            Title
          </label>
          {edit ? (
            <input
              id="title"
              name="title"
              required
              maxLength={300}
              defaultValue={record?.title ?? ""}
              autoFocus={creating}
              className={`${field} mt-1`}
            />
          ) : (
            <p className={`${value} text-lg font-medium`}>{record?.title}</p>
          )}
        </div>

        <div>
          <label className={label} htmlFor="description">
            Description
          </label>
          {edit ? (
            <textarea
              id="description"
              name="description"
              rows={5}
              maxLength={4000}
              defaultValue={record?.description ?? ""}
              className={`${field} mt-1`}
            />
          ) : record?.description ? (
            <div className={`${value} space-y-2 whitespace-pre-wrap`}>
              {record.description}
            </div>
          ) : (
            <p className={`${value} text-[var(--ns-text-secondary)]`}>—</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="assigned_to">
              Assigned to
            </label>
            {edit ? (
              <select
                id="assigned_to"
                name="assigned_to"
                defaultValue={assignee}
                className={`${field} mt-1`}
              >
                <option value="">Unassigned</option>
                {!assigneeKnown && assignee && (
                  <option value={assignee}>{assignee}</option>
                )}
                {people.map((p) => (
                  <option key={p.email} value={p.email}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className={value}>
                {assignee ? (
                  <>
                    {assigneeName}
                    {assigneeName !== assignee && (
                      <span className="block text-sm text-[var(--ns-text-secondary)]">
                        {assignee}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[var(--ns-text-secondary)]">Unassigned</span>
                )}
              </p>
            )}
          </div>

          <div>
            <label className={label} htmlFor="assigned_group">
              Assignment group
            </label>
            {edit ? (
              <>
                {/* A datalist, not a select: pick a group in use, or type a
                    new one. */}
                <input
                  id="assigned_group"
                  name="assigned_group"
                  list="assignment-groups"
                  maxLength={120}
                  defaultValue={record?.assigned_group ?? ""}
                  className={`${field} mt-1`}
                />
                <datalist id="assignment-groups">
                  {groups.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </>
            ) : (
              <p className={value}>
                {record?.assigned_group || (
                  <span className="text-[var(--ns-text-secondary)]">—</span>
                )}
              </p>
            )}
          </div>

          {record && (
            <div>
              <label className={label} htmlFor="state">
                State
              </label>
              {edit ? (
                // Only this lifecycle's states are offered, and the server
                // re-reads the lifecycle before accepting the change.
                <select
                  id="state"
                  name="state"
                  defaultValue={record.state}
                  className={`${field} mt-1`}
                >
                  {statesFor(record.lifecycle).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={value}>{record.state}</p>
              )}
            </div>
          )}

          {record && !edit && (
            <div>
              <span className={label}>Updated</span>
              <div className={value}>
                <RelativeDate iso={record.updated_at} />
              </div>
            </div>
          )}

          {creating && (
            <div>
              <span className={label}>Lifecycle</span>
              <p className={value}>
                {current}
                <span className="block text-sm text-[var(--ns-text-secondary)]">
                  Starts at {statesFor(current)[0]}. Promote it later rather
                  than creating it again.
                </span>
              </p>
            </div>
          )}
        </div>

        {edit && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button type="submit" className={primary}>
              {creating ? `Create ${current}` : "Save"}
            </button>
            <Link
              href={viewHref}
              className="text-sm text-[var(--ns-text-secondary)] hover:text-[var(--ns-nav-primary)]"
            >
              Cancel
            </Link>
          </div>
        )}
      </form>

      {record && !edit && (
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--ns-border-subtle)] pt-5">
          {next && (
            <form action={advanceLifecycleAction}>
              <input type="hidden" name="id" value={record.id} />
              <button type="submit" className={button}>
                Promote to {next}
                <ArrowRight aria-hidden className="size-4" />
              </button>
            </form>
          )}

          <form action={setRecordActiveAction}>
            <input type="hidden" name="id" value={record.id} />
            <input type="hidden" name="number" value={displayNumber(record)} />
            <input
              type="hidden"
              name="is_active"
              value={record.is_active ? "false" : "true"}
            />
            <button type="submit" className={button}>
              {record.is_active ? "Mark inactive" : "Mark active"}
            </button>
          </form>

          {next && (
            <span className="text-sm text-[var(--ns-text-secondary)]">
              Promotion is forward only, and keeps the number&rsquo;s digits.
            </span>
          )}
        </div>
      )}

    </div>
  );
}
