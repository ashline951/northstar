"use server";

import { auth } from "@/auth";
import { markWelcomeSeen } from "@/lib/users";

/** Records that the signed-in person has watched the welcome video. Takes the
 *  email from the session, never from the client, so nobody can mark the
 *  record of another account. */
export async function recordWelcomeSeen(): Promise<void> {
  const session = await auth();
  await markWelcomeSeen(session?.user?.email);
}
