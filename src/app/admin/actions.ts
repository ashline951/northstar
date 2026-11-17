"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  ROLE_MEMBER,
  ROLE_PROJECT_MANAGER,
  addUser,
  deactivateUser,
  getActiveUser,
  setRole,
} from "@/lib/users";
import { addNote, deleteNote } from "@/lib/assistant";

/**
 * Every action re-checks the caller server-side. A server action is a public
 * HTTP endpoint - hiding the UI is not access control.
 */
async function requireProjectManager(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email;
  const user = await getActiveUser(email);
  if (!user || user.role !== ROLE_PROJECT_MANAGER) {
    throw new Error("Not authorised");
  }
  return user.email;
}

export async function addUserAction(formData: FormData) {
  const actor = await requireProjectManager();

  const email = String(formData.get("email") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim() || null;
  const makePM = formData.get("role") === ROLE_PROJECT_MANAGER;

  if (!email || !email.includes("@")) return;

  await addUser(
    email,
    displayName,
    makePM ? ROLE_PROJECT_MANAGER : ROLE_MEMBER,
    actor
  );
  revalidatePath("/admin");
}

export async function deactivateUserAction(formData: FormData) {
  const actor = await requireProjectManager();
  const email = String(formData.get("email") ?? "").trim();

  // Removing your own access would lock you out with no way back in.
  if (email.toLowerCase() === actor.toLowerCase()) return;

  await deactivateUser(email);
  revalidatePath("/admin");
}

export async function setRoleAction(formData: FormData) {
  const actor = await requireProjectManager();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "");

  if (role !== ROLE_MEMBER && role !== ROLE_PROJECT_MANAGER) return;
  // Same reasoning: do not let the last admin demote themselves by accident.
  if (email.toLowerCase() === actor.toLowerCase()) return;

  await setRole(email, role);
  revalidatePath("/admin");
}

export async function addNoteAction(formData: FormData) {
  const actor = await requireProjectManager();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await addNote(body.slice(0, 500), actor);
  revalidatePath("/admin");
}

export async function deleteNoteAction(formData: FormData) {
  await requireProjectManager();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await deleteNote(id);
  revalidatePath("/admin");
}
