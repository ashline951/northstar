"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getActiveUser } from "@/lib/users";
import {
  LIFECYCLES,
  type Lifecycle,
  advanceLifecycle,
  createRecord,
  displayNumber,
  isValidState,
  setRecordActive,
  setState,
  updateRecord,
} from "@/lib/records";
import { sql } from "@/lib/db";

/**
 * Every action re-checks the person against the roster. A server action is a
 * public endpoint: hiding a button is not access control, and these change
 * records, so the check cannot live only in the page.
 */
async function requireProjectAccess(): Promise<string> {
  const session = await auth();
  const user = await getActiveUser(session?.user?.email);
  if (!user?.has_project_access) throw new Error("Not authorised");
  return user.email;
}

function text(form: FormData, key: string, max: number): string {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

/** Refreshes both the record and every list it could appear in. */
function revalidateRecord(number: string) {
  revalidatePath("/records", "layout");
  revalidatePath(`/record/${number}`);
  revalidatePath("/project");
}

export async function createRecordAction(formData: FormData) {
  const actor = await requireProjectAccess();

  const title = text(formData, "title", 300);
  if (!title) return;

  const raw = String(formData.get("lifecycle") ?? "Idea");
  const lifecycle = (LIFECYCLES as readonly string[]).includes(raw)
    ? (raw as Lifecycle)
    : "Idea";

  const record = await createRecord({
    title,
    description: text(formData, "description", 4000) || null,
    lifecycle,
    assignedTo: text(formData, "assigned_to", 200) || null,
    assignedGroup: text(formData, "assigned_group", 120) || null,
    createdBy: actor,
  });
  if (!record) return;

  revalidateRecord(displayNumber(record));
  // Straight into the new record, which is what people expect after Create.
  redirect(`/record/${displayNumber(record)}`);
}

export async function saveRecordAction(formData: FormData) {
  await requireProjectAccess();
  const id = Number(formData.get("id"));
  const number = String(formData.get("number") ?? "");
  if (!Number.isInteger(id)) return;

  const title = text(formData, "title", 300);
  if (!title) return;

  await updateRecord(id, {
    title,
    description: text(formData, "description", 4000) || null,
    assignedTo: text(formData, "assigned_to", 200) || null,
    assignedGroup: text(formData, "assigned_group", 120) || null,
  });

  // State is on the same form, but it is validated against the lifecycle the
  // record is in right now, re-read here rather than taken from the form.
  const state = String(formData.get("state") ?? "");
  if (state) {
    const rows = (await sql`
      select lifecycle from northstar_records where id = ${id} limit 1
    `) as { lifecycle: Lifecycle }[];
    const lifecycle = rows[0]?.lifecycle;
    if (lifecycle && isValidState(lifecycle, state)) await setState(id, state);
  }

  revalidateRecord(number);
}

export async function advanceLifecycleAction(formData: FormData) {
  const actor = await requireProjectAccess();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await advanceLifecycle(id, actor);

  // The number is derived from the lifecycle, so promotion changes the address:
  // IDEA2600007 becomes DMND2600007. Same row, same suffix.
  const rows = (await sql`
    select * from northstar_records where id = ${id} limit 1
  `) as Parameters<typeof displayNumber>[0][];
  const moved = rows[0];
  if (!moved) return;

  revalidateRecord(displayNumber(moved));
  redirect(`/record/${displayNumber(moved)}`);
}

export async function setRecordActiveAction(formData: FormData) {
  await requireProjectAccess();
  const id = Number(formData.get("id"));
  const number = String(formData.get("number") ?? "");
  if (!Number.isInteger(id)) return;
  await setRecordActive(id, formData.get("is_active") === "true");
  revalidateRecord(number);
}
