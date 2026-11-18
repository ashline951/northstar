import { NextRequest, NextResponse } from "next/server";
import { registerClient } from "@/lib/oauth";

/**
 * RFC 7591 dynamic client registration, so Claude can register itself rather
 * than someone copying a client ID around by hand.
 *
 * Registration is deliberately open: it grants nothing on its own. A client
 * only ever gets data after a named person completes the Entra sign-in and
 * consent at /oauth/authorize.
 */
export async function POST(req: NextRequest) {
  let body: { client_name?: unknown; redirect_uris?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris.filter((u): u is string => typeof u === "string")
    : [];

  // Every redirect must be https, or we would happily send a code anywhere.
  if (
    redirectUris.length === 0 ||
    !redirectUris.every((u) => /^https:\/\//i.test(u))
  ) {
    return NextResponse.json(
      { error: "invalid_redirect_uri", error_description: "https redirect_uris required" },
      { status: 400 }
    );
  }

  const name =
    typeof body.client_name === "string" ? body.client_name.slice(0, 120) : null;

  let client;
  try {
    client = await registerClient(name, redirectUris);
  } catch (err) {
    console.error("northstar oauth: registration failed", err);
    return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
  }

  return NextResponse.json(
    {
      client_id: client.client_id,
      client_name: client.client_name,
      redirect_uris: client.redirect_uris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    },
    { status: 201 }
  );
}
