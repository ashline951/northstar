import { sql } from "./db";

/**
 * One record, three lifecycles.
 *
 * In ServiceNow an Idea, a Demand and a Project are three tables, and
 * "converting" copies data between them - which is why history, comments and
 * links get left behind, and why the idea and the project it became drift
 * apart. Here it is one row whose `lifecycle` changes. Nothing is copied, so
 * nothing is lost.
 *
 * THE NUMBER IS DERIVED, THE SUFFIX IS NOT.
 * `suffix` is assigned once and never changes. The displayed number is the
 * lifecycle's prefix plus that suffix, so the same record reads IDEA2600001,
 * then DMND2600001, then PRJ2600001. Lookup accepts ANY prefix, so a number
 * written in an email last month still finds the record after it matured.
 * Mutating the stored number instead would just move the broken-reference
 * problem rather than solve it.
 */

export const LIFECYCLES = ["Idea", "Demand", "Project"] as const;
export type Lifecycle = (typeof LIFECYCLES)[number];

/** States are per lifecycle: only the current lifecycle's states are offered,
 *  and the database rejects any other combination. */
export const STATES: Record<Lifecycle, readonly string[]> = {
  Idea: ["Draft", "Submitted", "Accepted", "Idea Closed"],
  Demand: [
    "Draft",
    "Submitted",
    "Screening",
    "Qualified",
    "Approved",
    "Deferred",
    "DMND Closed",
  ],
  Project: ["Initiate", "Plan", "Execute", "Monitor/Control", "Prj Closed"],
};

export const PREFIX: Record<Lifecycle, string> = {
  Idea: "IDEA",
  Demand: "DMND",
  Project: "PRJ",
};

export type NorthstarRecord = {
  id: number;
  suffix: string;
  lifecycle: Lifecycle;
  state: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  assigned_group: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export function displayNumber(r: Pick<NorthstarRecord, "lifecycle" | "suffix">) {
  return `${PREFIX[r.lifecycle]}${r.suffix}`;
}

/** Strips any known prefix, so IDEA2600001 and PRJ2600001 both yield 2600001. */
export function suffixFromNumber(input: string): string {
  const cleaned = input.trim().toUpperCase().replace(/[\s-]/g, "");
  for (const p of Object.values(PREFIX)) {
    if (cleaned.startsWith(p)) return cleaned.slice(p.length);
  }
  return cleaned;
}

export function statesFor(lifecycle: Lifecycle): readonly string[] {
  return STATES[lifecycle] ?? [];
}

export function isValidState(lifecycle: Lifecycle, state: string): boolean {
  return statesFor(lifecycle).includes(state);
}

/** Forward only: an Idea can become a Demand, a Demand a Project. Going back
 *  would leave a Project's history hanging off an Idea. */
export function nextLifecycle(current: Lifecycle): Lifecycle | null {
  const i = LIFECYCLES.indexOf(current);
  return i >= 0 && i < LIFECYCLES.length - 1 ? LIFECYCLES[i + 1] : null;
}

export async function listRecords(): Promise<NorthstarRecord[]> {
  return (await sql`
    select * from northstar_records
    order by
      case lifecycle when 'Project' then 0 when 'Demand' then 1 else 2 end,
      suffix desc
  `) as NorthstarRecord[];
}

export async function findByNumber(
  input: string
): Promise<NorthstarRecord | null> {
  const rows = (await sql`
    select * from northstar_records where suffix = ${suffixFromNumber(input)} limit 1
  `) as NorthstarRecord[];
  return rows[0] ?? null;
}

export async function createRecord(params: {
  title: string;
  description: string | null;
  lifecycle: Lifecycle;
  assignedTo: string | null;
  assignedGroup: string | null;
  createdBy: string;
}): Promise<NorthstarRecord | null> {
  // The suffix is minted in SQL so the sequence is atomic: two people adding
  // at once cannot collide. Two-digit year plus a five-digit sequence.
  const rows = (await sql`
    insert into northstar_records
      (suffix, lifecycle, state, title, description, assigned_to, assigned_group, created_by)
    values (
      to_char(now(), 'YY') || lpad(nextval('northstar_record_seq')::text, 5, '0'),
      ${params.lifecycle},
      ${statesFor(params.lifecycle)[0]},
      ${params.title},
      ${params.description},
      ${params.assignedTo},
      ${params.assignedGroup},
      ${params.createdBy}
    )
    returning *
  `) as NorthstarRecord[];
  return rows[0] ?? null;
}

export async function setState(id: number, state: string): Promise<void> {
  // The database also enforces the lifecycle/state pairing, so a bad state
  // cannot land even if it reaches here by another route.
  await sql`
    update northstar_records set state = ${state}, updated_at = now()
    where id = ${id}
  `;
}

export async function updateRecord(
  id: number,
  fields: {
    assignedTo: string | null;
    assignedGroup: string | null;
    /** Left undefined by callers that only change the assignment. */
    title?: string;
    description?: string | null;
  }
): Promise<void> {
  await sql`
    update northstar_records
    set assigned_to = ${fields.assignedTo},
        assigned_group = ${fields.assignedGroup},
        title = coalesce(${fields.title ?? null}, title),
        description = case
          when ${fields.description === undefined} then description
          else ${fields.description ?? null}
        end,
        updated_at = now()
    where id = ${id}
  `;
}

/**
 * Advances the lifecycle in place and resets the state to the first state of
 * the new lifecycle - a Demand that becomes a Project starts at Initiate, not
 * at whatever it was as a Demand. The move is recorded so "when did this
 * become a project, and who decided" has an answer.
 */
export async function advanceLifecycle(
  id: number,
  actor: string
): Promise<void> {
  const rows = (await sql`
    select lifecycle from northstar_records where id = ${id} limit 1
  `) as { lifecycle: Lifecycle }[];
  const current = rows[0]?.lifecycle;
  if (!current) return;

  const next = nextLifecycle(current);
  if (!next) return;

  await sql`
    update northstar_records
    set lifecycle = ${next}, state = ${statesFor(next)[0]}, updated_at = now()
    where id = ${id}
  `;
  await sql`
    insert into northstar_record_history
      (record_id, from_lifecycle, to_lifecycle, changed_by)
    values (${id}, ${current}, ${next}, ${actor})
  `;
}

export async function deleteRecord(id: number): Promise<void> {
  await sql`delete from northstar_records where id = ${id}`;
}

export type HistoryRow = {
  record_id: number;
  from_lifecycle: string | null;
  to_lifecycle: string;
  changed_by: string | null;
  changed_at: string;
};

export async function historyFor(id: number): Promise<HistoryRow[]> {
  return (await sql`
    select * from northstar_record_history
    where record_id = ${id} order by changed_at
  `) as HistoryRow[];
}

/**
 * The query behind every list view. `activeOnly: false` returns active and
 * inactive together, which is what "All Demands" means.
 */
export async function listByView(
  lifecycle: Lifecycle | undefined,
  activeOnly: boolean
): Promise<NorthstarRecord[]> {
  // No lifecycle means every lifecycle - the Efforts views, which show Ideas,
  // Demands and Projects together. Passing null rather than branching keeps it
  // to one statement.
  return (await sql`
    select * from northstar_records
    where (${lifecycle ?? null}::text is null or lifecycle = ${lifecycle ?? null})
      and (${activeOnly} = false or is_active = true)
    order by suffix desc
  `) as NorthstarRecord[];
}

/** Every assignment group already in use, for the form's pick list. */
export async function listGroups(): Promise<string[]> {
  const rows = (await sql`
    select distinct assigned_group as g from northstar_records
    where assigned_group is not null and assigned_group <> ''
    order by 1
  `) as { g: string }[];
  return rows.map((r) => r.g);
}

export async function setRecordActive(
  id: number,
  active: boolean
): Promise<void> {
  await sql`
    update northstar_records set is_active = ${active}, updated_at = now()
    where id = ${id}
  `;
}
