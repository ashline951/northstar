"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getActiveUser } from "@/lib/users";
import {
  LIFECYCLES,
  type Lifecycle,
  advanceLifecycle,
  createRecord,
  deleteRecord,
  isValidState,
  setState,
  updateRecord,
} from "@/lib/records";
import { sql } from "@/lib/db";

async function requireProjectAccess(): Promise<string> {
  const session = await auth();
  const user = await getActiveUser(session?.user?.email);
  if (!user?.has_project_access) throw new Error("Not authorised");
  return user.email;
}

export async function createRecordAction(formData: FormData) {
  const actor = await requireProjectAccess();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const lifecycleRaw = String(formData.get("lifecycle") ?? "Idea");
  const lifecycle = (LIFECYCLES as readonly string[]).includes(lifecycleRaw)
    ? (lifecycleRaw as Lifecycle)
    : "Idea";

  await createRecord({
    title: title.slice(0, 300),
    description: String(formData.get("description") ?? "").trim().slice(0, 4000) || null,
    lifecycle,
    assignedTo: String(formData.get("assigned_to") ?? "").trim() || null,
    assignedGroup: String(formData.get("assigned_group") ?? "").trim().slice(0, 120) || null,
    createdBy: actor,
  });
  revalidatePath("/project");
}

export async function setRecordStateAction(formData: FormData) {
  await requireProjectAccess();
  const id = Number(formData.get("id"));
  const state = String(formData.get("state") ?? "");
  if (!Number.isInteger(id)) return;

  // Re-read the lifecycle rather than trusting the form: the state must be
  // valid for the lifecycle the record is actually in right now.
  const rows = (await sql`
    select lifecycle from northstar_records where id = ${id} limit 1
  `) as { lifecycle: Lifecycle }[];
  const lifecycle = rows[0]?.lifecycle;
  if (!lifecycle || !isValidState(lifecycle, state)) return;

  await setState(id, state);
  revalidatePath("/project");
}

export async function advanceLifecycleAction(formData: FormData) {
  const actor = await requireProjectAccess();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await advanceLifecycle(id, actor);
  revalidatePath("/project");
}

export async function updateRecordAction(formData: FormData) {
  await requireProjectAccess();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await updateRecord(id, {
    assignedTo: String(formData.get("assigned_to") ?? "").trim() || null,
    assignedGroup: String(formData.get("assigned_group") ?? "").trim().slice(0, 120) || null,
  });
  revalidatePath("/project");
}

export async function deleteRecordAction(formData: FormData) {
  await requireProjectAccess();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await deleteRecord(id);
  revalidatePath("/project");
}
