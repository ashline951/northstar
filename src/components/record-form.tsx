import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import type { HistoryRow } from "@/lib/records";
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

/**
 * One form for both creating and editing, because they are the same fields.
 * A new record has no number and no state - the state is the first state of
 * its lifecycle, set when it is created.
 *
 * Only the lifecycle is special: it is chosen once on create and then changes
 * only by promotion, never by editing a dropdown, because promotion resets the
 * state and is written to the record's history.
 */
export default function RecordForm({
  record,
  history,
  lifecycle,
  backHref,
  backLabel,
}: {
  record?: NorthstarRecord;
  /** Lifecycle moves, oldest first. Empty for a record that never moved. */
  history?: HistoryRow[];
  /** Create only: the lifecycle the new record starts in. */
  lifecycle?: Lifecycle;
  backHref: string;
  backLabel: string;
}) {
  const creating = !record;
  const current: Lifecycle = record?.lifecycle ?? lifecycle ?? "Idea";
  const next = record ? nextLifecycle(record.lifecycle) : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-[var(--ns-text-secondary)] hover:text-[var(--ns-nav-primary)]"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {backLabel}
      </Link>

      <div className="mt-2 flex flex-wrap items-baseline gap-3">
        <h1 className="ns-display text-2xl text-[var(--ns-text-primary)]">
          {creating ? `New ${current}` : displayNumber(record)}
        </h1>
        {record && (
          <>
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-sm text-[var(--ns-text-secondary)] dark:bg-white/10">
              {record.lifecycle}
            </span>
            {!record.is_active && (
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-sm text-[var(--ns-text-secondary)] dark:bg-white/10">
                Inactive
              </span>
            )}
          </>
        )}
      </div>

      <form
        action={creating ? createRecordAction : saveRecordAction}
        className="mt-5 space-y-4"
      >
        {record && (
          <>
            <input type="hidden" name="id" value={record.id} />
            <input type="hidden" name="number" value={displayNumber(record)} />
          </>
        )}
        {creating && <input type="hidden" name="lifecycle" value={current} />}

        <div>
          <label className={label} htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={300}
            defaultValue={record?.title ?? ""}
            autoFocus={creating}
            className={`${field} mt-1`}
          />
        </div>

        <div>
          <label className={label} htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            maxLength={4000}
            defaultValue={record?.description ?? ""}
            className={`${field} mt-1`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="assigned_to">
              Assigned to
            </label>
            <input
              id="assigned_to"
              name="assigned_to"
              maxLength={200}
              defaultValue={record?.assigned_to ?? ""}
              className={`${field} mt-1`}
            />
          </div>

          <div>
            <label className={label} htmlFor="assigned_group">
              Assignment group
            </label>
            <input
              id="assigned_group"
              name="assigned_group"
              maxLength={120}
              defaultValue={record?.assigned_group ?? ""}
              className={`${field} mt-1`}
            />
          </div>

          {record && (
            <div>
              <label className={label} htmlFor="state">
                State
              </label>
              {/* Only this lifecycle's states are offered, and the server
                  re-reads the lifecycle before accepting the change. */}
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
            </div>
          )}

          {creating && (
            <div>
              <label className={label}>Lifecycle</label>
              <p className="mt-1 text-base text-[var(--ns-text-primary)]">
                {current}
                <span className="block text-sm text-[var(--ns-text-secondary)]">
                  Starts at {statesFor(current)[0]}. Promote it later rather
                  than creating it again.
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-[var(--ns-nav-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {creating ? `Create ${current}` : "Save"}
          </button>
          <Link
            href={backHref}
            className="text-sm text-[var(--ns-text-secondary)] hover:text-[var(--ns-nav-primary)]"
          >
            Cancel
          </Link>
        </div>
      </form>

      {record && (
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--ns-border-subtle)] pt-5">
          {next && (
            <form action={advanceLifecycleAction}>
              <input type="hidden" name="id" value={record.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ns-border-subtle)] px-3 py-1.5 text-sm text-[var(--ns-text-primary)] hover:border-[var(--ns-nav-primary)]"
              >
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
            <button
              type="submit"
              className="rounded-lg border border-[var(--ns-border-subtle)] px-3 py-1.5 text-sm text-[var(--ns-text-primary)] hover:border-[var(--ns-nav-primary)]"
            >
              {record.is_active ? "Mark inactive" : "Mark active"}
            </button>
          </form>

          <span className="text-sm text-[var(--ns-text-secondary)]">
            Promotion is forward only, and keeps the number&rsquo;s digits.
          </span>
        </div>
      )}

      {record && (
        <div className="mt-8 border-t border-[var(--ns-border-subtle)] pt-5">
          <h2 className="text-sm font-semibold text-[var(--ns-text-primary)]">
            History
          </h2>

          <ol className="mt-3 space-y-2 text-sm">
            <li className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[var(--ns-text-primary)]">
                Created as {history?.[0]?.from_lifecycle ?? record.lifecycle}
              </span>
              {record.created_by && (
                <span className="text-[var(--ns-text-secondary)]">
                  by {record.created_by}
                </span>
              )}
              <RelativeDate iso={record.created_at} />
            </li>

            {/* The whole point of one maturing record: the moves are part of
                it, not a trail of copies in other tables. */}
            {(history ?? []).map((h) => (
              <li
                key={`${h.changed_at}-${h.to_lifecycle}`}
                className="flex flex-wrap items-baseline gap-x-2"
              >
                <span className="text-[var(--ns-text-primary)]">
                  {h.from_lifecycle} became {h.to_lifecycle}
                </span>
                {h.changed_by && (
                  <span className="text-[var(--ns-text-secondary)]">
                    by {h.changed_by}
                  </span>
                )}
                <RelativeDate iso={h.changed_at} />
              </li>
            ))}

            <li className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[var(--ns-text-secondary)]">
                Last updated
              </span>
              <RelativeDate iso={record.updated_at} />
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
