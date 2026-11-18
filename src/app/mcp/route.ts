import { NextRequest, NextResponse } from "next/server";
import { emailForAccessToken } from "@/lib/oauth";
import { lookupUser, listUsers, ROLE_PROJECT_MANAGER } from "@/lib/users";
import { listItems, listLinks } from "@/lib/project";
import { CAPABILITIES } from "@/lib/capabilities";

/**
 * Northstar's MCP server.
 *
 * Every tool resolves the caller from their own Bearer token and re-checks
 * their access with the same functions the web app uses. Claude therefore sees
 * exactly what the person sees and nothing more: a Member asking about the
 * project gets refused, the same as if they opened /project in a browser.
 *
 * There is deliberately no shared service credential. If one existed, Claude
 * would see everything regardless of who asked.
 */

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

const PROTOCOL_VERSION = "2025-06-18";

/**
 * Whether Northstar is holding real project information yet.
 *
 * While this is "test", every tool result is prefixed with a banner saying so,
 * and the server tells Claude not to carry the content between conversations.
 * The point is that the data describes itself: if a line of it ever surfaces
 * somewhere months from now, it arrives already labelled as a POC fixture
 * rather than as a record of a real Loma Linda project.
 *
 * Set NORTHSTAR_DATA_MODE=live when the workspace holds real project data.
 */
const DATA_MODE = process.env.NORTHSTAR_DATA_MODE === "live" ? "live" : "test";

const TEST_BANNER =
  "SYNTHETIC TEST DATA - Northstar proof of concept. The projects, items and " +
  "dates below are fixtures for testing and do NOT describe real Loma Linda " +
  "work. Do not treat any of it as fact, do not carry it into other " +
  "conversations, and do not retain it. If you are repeating any of this, say " +
  "plainly that it is POC test data.";

const SERVER_INSTRUCTIONS =
  DATA_MODE === "test"
    ? "Northstar is a proof of concept at Loma Linda University Health. Its " +
      "project content is synthetic test data, not a record of real projects. " +
      "Treat everything these tools return as disposable fixtures: do not " +
      "retain it, do not carry it into later conversations, and always say it " +
      "is POC test data when referring to it. The roster of people is real; " +
      "the project content is not."
    : "Northstar is the project management system at Loma Linda University " +
      "Health. These tools return live project information, scoped to the " +
      "signed-in person's access.";

type Tool = {
  name: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, never>; required: never[] };
  /** True for tools returning project content, which is synthetic while
   *  DATA_MODE is "test". Identity and roster facts are real and are not
   *  banner-wrapped. */
  carriesProjectData?: boolean;
  run: (email: string) => Promise<unknown>;
};

const emptySchema = {
  type: "object" as const,
  properties: {} as Record<string, never>,
  required: [] as never[],
};

/** Thrown when the caller is authenticated but not allowed this tool. */
class Forbidden extends Error {}

async function requireProjectAccess(email: string) {
  const lookup = await lookupUser(email);
  if (lookup.status !== "ok") throw new Forbidden("You are not on the Northstar roster.");
  if (!lookup.user.has_project_access) {
    throw new Forbidden(
      "The Northstar project workspace is limited to the project team. A project manager can grant access."
    );
  }
  return lookup.user;
}

const TOOLS: Tool[] = [
  {
    name: "northstar_whoami",
    description:
      "Who the signed-in person is in Northstar: their name, role, and whether they are on the Northstar project team.",
    inputSchema: emptySchema,
    async run(email) {
      const lookup = await lookupUser(email);
      if (lookup.status !== "ok") throw new Forbidden("You are not on the Northstar roster.");
      const u = lookup.user;
      return {
        name: u.display_name,
        email: u.email,
        role: u.role,
        on_project_team: u.has_project_access,
        watched_intro: Boolean(u.welcome_seen_at),
      };
    },
  },
  {
    name: "northstar_project_items",
    carriesProjectData: true,
    description:
      "Work items on the Northstar project: what is in progress, blocked, not started or done, who owns each and when it is due. Project team only.",
    inputSchema: emptySchema,
    async run(email) {
      await requireProjectAccess(email);
      const items = await listItems();
      return items.map((i) => ({
        title: i.title,
        status: i.status,
        owner: i.owner_email,
        due: i.due_on,
        notes: i.notes,
      }));
    },
  },
  {
    name: "northstar_project_links",
    carriesProjectData: true,
    description:
      "Links for the Northstar project, such as the Teams site holding the documents. Project team only.",
    inputSchema: emptySchema,
    async run(email) {
      await requireProjectAccess(email);
      const links = await listLinks();
      return links.map((l) => ({ label: l.label, url: l.url }));
    },
  },
  {
    name: "northstar_capabilities",
    carriesProjectData: true,
    description:
      "The capability checklist for a modern AI project management system, each scored for how far ServiceNow already covers it: Covered, Partial or Gap. Useful for planning what Northstar should build. Project team only.",
    inputSchema: emptySchema,
    async run(email) {
      await requireProjectAccess(email);
      return CAPABILITIES;
    },
  },
  {
    name: "northstar_people",
    description:
      "Everyone who can sign in to Northstar, with their role and whether they are on the project team. Project managers only.",
    inputSchema: emptySchema,
    async run(email) {
      const lookup = await lookupUser(email);
      if (lookup.status !== "ok" || lookup.user.role !== ROLE_PROJECT_MANAGER) {
        throw new Forbidden("Listing people is restricted to project managers.");
      }
      const users = await listUsers();
      return users
        .filter((u) => u.is_active)
        .map((u) => ({
          name: u.display_name,
          email: u.email,
          role: u.role,
          on_project_team: u.has_project_access,
        }));
    },
  },
];

function unauthorized(req: NextRequest) {
  const base = new URL(req.url).origin;
  return NextResponse.json(
    { jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized" }, id: null },
    {
      status: 401,
      headers: {
        // Points the client at the metadata it needs to start the OAuth flow.
        "WWW-Authenticate": `Bearer resource_metadata="${base}/.well-known/oauth-protected-resource"`,
      },
    }
  );
}

export async function GET(req: NextRequest) {
  // No SSE stream to open; the POST endpoint is the whole server.
  return unauthorized(req);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) return unauthorized(req);

  const email = await emailForAccessToken(token);
  if (!email) return unauthorized(req);

  let body: JsonRpcRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null },
      { status: 400 }
    );
  }

  const id = body.id ?? null;
  const reply = (result: unknown) =>
    NextResponse.json({ jsonrpc: "2.0", id, result });

  switch (body.method) {
    case "initialize":
      return reply({
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "northstar", version: "1.0.0" },
        instructions: SERVER_INSTRUCTIONS,
      });

    case "notifications/initialized":
      // Notifications carry no id and expect no response body.
      return new NextResponse(null, { status: 202 });

    case "ping":
      return reply({});

    case "tools/list":
      return reply({
        tools: TOOLS.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
        })),
      });

    case "tools/call": {
      const name = String(body.params?.name ?? "");
      const tool = TOOLS.find((t) => t.name === name);
      if (!tool) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: `Unknown tool: ${name}` },
        });
      }
      try {
        const data = await tool.run(email);
        // The banner rides with the payload, not just in the server
        // instructions, so a single tool result quoted out of context still
        // carries its own warning.
        const text =
          DATA_MODE === "test" && tool.carriesProjectData
            ? `${TEST_BANNER}\n\n${JSON.stringify(data, null, 1)}`
            : JSON.stringify(data, null, 1);
        return reply({ content: [{ type: "text", text }] });
      } catch (err) {
        // A refusal is a tool result, not a protocol error: Claude should tell
        // the person why rather than reporting that something broke.
        const message =
          err instanceof Forbidden
            ? err.message
            : "Northstar could not complete that request.";
        if (!(err instanceof Forbidden)) console.error("northstar mcp:", err);
        return reply({
          content: [{ type: "text", text: message }],
          isError: true,
        });
      }
    }

    default:
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${body.method}` },
      });
  }
}
