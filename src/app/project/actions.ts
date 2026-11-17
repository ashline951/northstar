"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getActiveUser } from "@/lib/users";
import {
  STATUSES,
  addItem,
  addLink,
  deleteItem,
  deleteLink,
  setItemNotes,
  setItemStatus,
} from "@/lib/project";

/** Every action re-checks access server-side. A server action is a public
 *  endpoint - hiding the link in the banner is not access control. */
async function requireProjectAccess(): Promise<string> {
  const session = await auth();
  const user = await getActiveUser(session?.user?.email);
  if (!user?.has_project_access) throw new Error("Not authorised");
  return user.email;
}

export async function addItemAction(formData: FormData) {
  const actor = await requireProjectAccess();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const owner = String(formData.get("owner_email") ?? "").trim() || null;
  const due = String(formData.get("due_on") ?? "").trim() || null;
  await addItem(title.slice(0, 300), owner, due, actor);
  revalidatePath("/project");
}

export async function setStatusAction(formData: FormData) {
  await requireProjectAccess();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  if (!Number.isInteger(id)) return;
  if (!(STATUSES as readonly string[]).includes(status)) return;
  await setItemStatus(id, status);
  revalidatePath("/project");
}

export async function setNotesAction(formData: FormData) {
  await requireProjectAccess();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await setItemNotes(id, String(formData.get("notes") ?? "").slice(0, 2000));
  revalidatePath("/project");
}

export async function deleteItemAction(formData: FormData) {
  await requireProjectAccess();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await deleteItem(id);
  revalidatePath("/project");
}

export async function addLinkAction(formData: FormData) {
  const actor = await requireProjectAccess();
  const label = String(formData.get("label") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!label || !url) return;
  // Only ever render links we know are http(s) - keeps javascript: URLs out.
  if (!/^https:\/\//i.test(url)) return;
  await addLink(label.slice(0, 120), url.slice(0, 1000), actor);
  revalidatePath("/project");
}

export async function deleteLinkAction(formData: FormData) {
  await requireProjectAccess();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await deleteLink(id);
  revalidatePath("/project");
}
