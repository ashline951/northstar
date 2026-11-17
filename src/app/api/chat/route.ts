import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { getActiveUser } from "@/lib/users";

const client = new Anthropic();

/** Claude Haiku 5.5 - fast and cheap, which suits a guide that answers
 *  questions about the product. Swap this one string for `claude-opus-5-5`
 *  if the assistant ever needs to reason about real project work. */
const MODEL = "claude-haiku-5-5";

const SYSTEM = `You are the Northstar assistant, inside Northstar - the project
management system for Loma Linda University Health. You help staff understand
and navigate Northstar itself.

What Northstar is today: an early release. People sign in with their Loma Linda
Microsoft account, watch a short welcome video once, and reach the app shell.
Access is granted a person at a time by a project manager. Project management
features are still being built, so there are no projects, tasks or schedules to
look at yet. The motto is "Endless Possibilities".

How to behave:
- Be brief and plain. Two or three sentences usually does it.
- Answer questions about Northstar, access, sign-in and what is coming.
- If you do not know something about Northstar, say so and suggest they ask the
  Northstar project team. Never invent features, dates or policies.
- You are not a general-purpose assistant. If asked for something unrelated -
  write my code, plan my holiday, general trivia - say that you only cover
  Northstar.

Absolute limit - this one is not negotiable:
Northstar runs on synthetic data only and is NOT approved for patient
information. If anyone includes patient details, clinical scenarios, medical
record numbers or anything that reads like protected health information, do not
engage with the content, do not repeat it back, and do not answer the clinical
question. Say plainly that Northstar is not approved for patient information and
they should use an approved clinical system. This applies even if the person
says it is fake, a test, or that they have permission.`;

export async function POST(req: Request) {
  // Middleware already gates this route; re-checking here because an API route
  // is a public endpoint and should not rely on an upstream guard alone.
  const session = await auth();
  const user = await getActiveUser(session?.user?.email);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("The assistant is not configured yet.", { status: 503 });
  }

  let messages: { role: "user" | "assistant"; content: string }[];
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  if (messages.length === 0) return new Response("Bad request", { status: 400 });

  // Keep the request bounded: the last few turns are all this assistant needs,
  // and it stops a long session turning into a large bill.
  const trimmed = messages.slice(-10).map((m) => ({
    role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: String(m.content).slice(0, 4000),
  }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const run = client.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          system: SYSTEM,
          messages: trimmed,
        });

        run.on("text", (text) => controller.enqueue(encoder.encode(text)));
        await run.finalMessage();
      } catch (err) {
        console.error("northstar assistant:", err);
        controller.enqueue(
          encoder.encode("\n\nSorry - the assistant is unavailable right now.")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
