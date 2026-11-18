import { NextRequest, NextResponse } from "next/server";

/** RFC 8414 metadata. Claude reads this to discover how to authorise. */
export async function GET(req: NextRequest) {
  const base = new URL(req.url).origin;
  return NextResponse.json(
    {
      issuer: base,
      authorization_endpoint: `${base}/oauth/authorize`,
      token_endpoint: `${base}/oauth/token`,
      registration_endpoint: `${base}/oauth/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      // S256 only. "plain" offers no protection and is not accepted.
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: ["northstar"],
    },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
