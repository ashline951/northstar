import { NextRequest, NextResponse } from "next/server";
import { consumeCode, exchangeRefreshToken, issueTokens } from "@/lib/oauth";

const noStore = { "Cache-Control": "no-store", Pragma: "no-cache" };

function bad(error: string, description?: string, status = 400) {
  return NextResponse.json(
    { error, error_description: description },
    { status, headers: noStore }
  );
}

/** RFC 6749 token endpoint: authorization_code and refresh_token grants. */
export async function POST(req: NextRequest) {
  let form: URLSearchParams;
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      form = new URLSearchParams(Object.entries(await req.json()) as [string, string][]);
    } else {
      form = new URLSearchParams(await req.text());
    }
  } catch {
    return bad("invalid_request");
  }

  const grantType = form.get("grant_type");
  const clientId = form.get("client_id") ?? "";
  if (!clientId) return bad("invalid_client");

  if (grantType === "authorization_code") {
    const code = form.get("code") ?? "";
    const redirectUri = form.get("redirect_uri") ?? "";
    const verifier = form.get("code_verifier") ?? "";
    if (!code || !redirectUri || !verifier) return bad("invalid_request");

    const result = await consumeCode(code, clientId, redirectUri, verifier);
    if (!result) return bad("invalid_grant");

    const tokens = await issueTokens(clientId, result.userEmail, result.scope);
    return NextResponse.json(tokens, { headers: noStore });
  }

  if (grantType === "refresh_token") {
    const refresh = form.get("refresh_token") ?? "";
    if (!refresh) return bad("invalid_request");
    const tokens = await exchangeRefreshToken(refresh, clientId);
    if (!tokens) return bad("invalid_grant");
    return NextResponse.json(tokens, { headers: noStore });
  }

  return bad("unsupported_grant_type");
}
