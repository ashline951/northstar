import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getActiveUser } from "@/lib/users";
import { getClient, issueCode } from "@/lib/oauth";

/**
 * The authorisation endpoint, and the reason this whole flow exists.
 *
 * It requires a live Northstar session, which means the person has signed in
 * through Entra and passed the roster check. The code is minted against THAT
 * person, so the token Claude ends up holding carries their identity and
 * nobody else's.
 *
 * Anyone not on the roster is refused here, before a code is ever issued.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("client_id") ?? "";
  const redirectUri = url.searchParams.get("redirect_uri") ?? "";
  const state = url.searchParams.get("state");
  const challenge = url.searchParams.get("code_challenge") ?? "";
  const challengeMethod = url.searchParams.get("code_challenge_method") ?? "";
  const scope = url.searchParams.get("scope");

  let client;
  try {
    client = await getClient(clientId);
  } catch (err) {
    // An unreachable database must not surface as a 500 with a stack trace.
    console.error("northstar oauth: client lookup failed", err);
    return NextResponse.json(
      { error: "temporarily_unavailable" },
      { status: 503 }
    );
  }
  // A bad client or redirect must NOT be bounced back to the caller - that is
  // how an open redirect becomes a code-stealing bug. Fail in place.
  if (!client) {
    return NextResponse.json({ error: "invalid_client" }, { status: 400 });
  }
  if (!client.redirect_uris.includes(redirectUri)) {
    return NextResponse.json({ error: "invalid_redirect_uri" }, { status: 400 });
  }

  const fail = (error: string, description?: string) => {
    const to = new URL(redirectUri);
    to.searchParams.set("error", error);
    if (description) to.searchParams.set("error_description", description);
    if (state) to.searchParams.set("state", state);
    return NextResponse.redirect(to.toString());
  };

  if (challengeMethod !== "S256" || !challenge) {
    return fail("invalid_request", "PKCE with S256 is required");
  }

  const session = await auth();
  const user = await getActiveUser(session?.user?.email);
  if (!user) {
    // Not signed in, or signed in but not on the Northstar roster. Send them
    // through sign-in and return here afterwards.
    const signin = new URL("/signin", url.origin);
    signin.searchParams.set("callbackUrl", url.toString());
    return NextResponse.redirect(signin.toString());
  }

  const code = await issueCode({
    clientId,
    userEmail: user.email,
    redirectUri,
    codeChallenge: challenge,
    scope,
  });

  const to = new URL(redirectUri);
  to.searchParams.set("code", code);
  if (state) to.searchParams.set("state", state);
  return NextResponse.redirect(to.toString());
}
