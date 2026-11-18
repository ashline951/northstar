import { createHash, randomBytes } from "crypto";
import { sql } from "./db";

/**
 * A minimal OAuth 2.1 authorization server, existing for one purpose: letting
 * Claude connect to Northstar as the person using it, rather than as a shared
 * service account.
 *
 * That distinction is the whole point. A connector authenticated with one API
 * key would see everything regardless of who asked, and Northstar's access
 * rules would stop meaning anything. Here every token belongs to one person,
 * and every MCP tool re-checks that person's access the same way the web app
 * does.
 *
 * Design notes:
 *  - PKCE (S256) is required. No client secrets: Claude is a public client.
 *  - Codes and tokens are stored only as SHA-256 hashes, so a database leak
 *    does not hand over live credentials.
 *  - Codes are single-use and short-lived; reuse is treated as an attack and
 *    revokes the tokens issued from them.
 */

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const CODE_TTL_SECONDS = 60 * 5;

export function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function newSecret(): string {
  return randomBytes(32).toString("base64url");
}

/** RFC 7636 S256: BASE64URL(SHA256(verifier)) === challenge */
export function verifyPkce(verifier: string, challenge: string): boolean {
  const computed = createHash("sha256").update(verifier).digest("base64url");
  // Lengths are equal and both are hashes, so a plain compare is adequate here.
  return computed === challenge;
}

export type OAuthClient = {
  client_id: string;
  client_name: string | null;
  redirect_uris: string[];
};

export async function registerClient(
  clientName: string | null,
  redirectUris: string[]
): Promise<OAuthClient> {
  const clientId = randomBytes(16).toString("hex");
  await sql`
    insert into northstar_oauth_clients (client_id, client_name, redirect_uris)
    values (${clientId}, ${clientName}, ${redirectUris})
  `;
  return { client_id: clientId, client_name: clientName, redirect_uris: redirectUris };
}

export async function getClient(clientId: string): Promise<OAuthClient | null> {
  const rows = (await sql`
    select client_id, client_name, redirect_uris
    from northstar_oauth_clients where client_id = ${clientId} limit 1
  `) as OAuthClient[];
  return rows[0] ?? null;
}

export async function issueCode(params: {
  clientId: string;
  userEmail: string;
  redirectUri: string;
  codeChallenge: string;
  scope: string | null;
}): Promise<string> {
  const code = newSecret();
  await sql`
    insert into northstar_oauth_codes
      (code_hash, client_id, user_email, redirect_uri, code_challenge, scope, expires_at)
    values (
      ${hashToken(code)}, ${params.clientId}, ${params.userEmail},
      ${params.redirectUri}, ${params.codeChallenge}, ${params.scope},
      now() + ${`${CODE_TTL_SECONDS} seconds`}::interval
    )
  `;
  return code;
}

type CodeRow = {
  code_hash: string;
  client_id: string;
  user_email: string;
  redirect_uri: string;
  code_challenge: string;
  scope: string | null;
  used: boolean;
};

/**
 * Consumes an authorization code. Returns null for anything invalid.
 * A code presented twice revokes every token minted from it - the standard
 * response to a code that may have been stolen.
 */
export async function consumeCode(
  code: string,
  clientId: string,
  redirectUri: string,
  verifier: string
): Promise<{ userEmail: string; scope: string | null } | null> {
  const hash = hashToken(code);
  const rows = (await sql`
    select * from northstar_oauth_codes
    where code_hash = ${hash} and expires_at > now() limit 1
  `) as CodeRow[];
  const row = rows[0];
  if (!row) return null;

  if (row.used) {
    await sql`
      update northstar_oauth_tokens set revoked = true
      where client_id = ${row.client_id} and user_email = ${row.user_email}
    `;
    return null;
  }

  if (row.client_id !== clientId) return null;
  if (row.redirect_uri !== redirectUri) return null;
  if (!verifyPkce(verifier, row.code_challenge)) return null;

  await sql`update northstar_oauth_codes set used = true where code_hash = ${hash}`;
  return { userEmail: row.user_email, scope: row.scope };
}

export async function issueTokens(
  clientId: string,
  userEmail: string,
  scope: string | null
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
  scope: string;
}> {
  const access = newSecret();
  const refresh = newSecret();

  await sql`
    insert into northstar_oauth_tokens
      (token_hash, kind, client_id, user_email, scope, expires_at)
    values
      (${hashToken(access)}, 'access', ${clientId}, ${userEmail}, ${scope},
       now() + ${`${ACCESS_TOKEN_TTL_SECONDS} seconds`}::interval)
  `;
  await sql`
    insert into northstar_oauth_tokens
      (token_hash, kind, client_id, user_email, scope, expires_at)
    values
      (${hashToken(refresh)}, 'refresh', ${clientId}, ${userEmail}, ${scope},
       now() + ${`${REFRESH_TOKEN_TTL_SECONDS} seconds`}::interval)
  `;

  return {
    access_token: access,
    refresh_token: refresh,
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    token_type: "Bearer",
    scope: scope ?? "northstar",
  };
}

export async function exchangeRefreshToken(
  refreshToken: string,
  clientId: string
): Promise<Awaited<ReturnType<typeof issueTokens>> | null> {
  const rows = (await sql`
    select user_email, scope from northstar_oauth_tokens
    where token_hash = ${hashToken(refreshToken)} and kind = 'refresh'
      and client_id = ${clientId} and revoked = false and expires_at > now()
    limit 1
  `) as { user_email: string; scope: string | null }[];
  const row = rows[0];
  if (!row) return null;

  // Rotate: the presented refresh token is spent.
  await sql`
    update northstar_oauth_tokens set revoked = true
    where token_hash = ${hashToken(refreshToken)}
  `;
  return issueTokens(clientId, row.user_email, row.scope);
}

/** Resolves a Bearer token to the email it belongs to, or null. */
export async function emailForAccessToken(
  token: string
): Promise<string | null> {
  try {
    const rows = (await sql`
      select user_email from northstar_oauth_tokens
      where token_hash = ${hashToken(token)} and kind = 'access'
        and revoked = false and expires_at > now()
      limit 1
    `) as { user_email: string }[];
    return rows[0]?.user_email ?? null;
  } catch (err) {
    // Fail closed: an unreachable database denies rather than admits.
    console.error("northstar: token lookup failed", err);
    return null;
  }
}
