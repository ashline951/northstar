import { NextRequest, NextResponse } from "next/server";

/** RFC 9728. Tells an MCP client which authorisation server guards /mcp. */
export async function GET(req: NextRequest) {
  const base = new URL(req.url).origin;
  return NextResponse.json(
    {
      resource: `${base}/mcp`,
      authorization_servers: [base],
      scopes_supported: ["northstar"],
      bearer_methods_supported: ["header"],
    },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
