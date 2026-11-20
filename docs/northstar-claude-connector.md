# Northstar: connecting Claude (custom MCP connector)

**For:** the LLUH Claude administrator
**From:** Ryan Ashline, IS
**What you are being asked to do:** add Northstar as a custom connector in the Claude admin
console, so people at LLUH can ask Claude about Northstar as themselves.

Northstar is the project portfolio management proof of concept at
`https://northstar.lluh.app`. It exposes a remote MCP server with its own OAuth 2.1
authorization server, so **Claude connects as the person using it**: each person signs in to
Northstar with their LLUH account the first time, and Claude only sees what that person can see.
There is no shared key, API key or service account to store on the Claude side.

---

## 1. Add the connector

In the Claude admin console (Settings → Connectors → **Add custom connector**; the exact wording
may differ slightly by release):

| Field | Value |
|---|---|
| Name | `Northstar` |
| Remote MCP server URL | `https://northstar.lluh.app/mcp` |
| OAuth client ID | *leave blank* |
| OAuth client secret | *leave blank* |

Leave the client ID and secret blank. Northstar supports **dynamic client registration**
(RFC 7591) at `https://northstar.lluh.app/oauth/register`, so Claude registers itself on first
connection. If the console insists on a value, tell Ryan and he will register Claude by hand and
send you a client ID (there is no secret: the server uses PKCE and `token_endpoint_auth_method:
none`).

Make it available to the organisation, or to a group if you would rather start small. Nobody
can use it without also being on Northstar's own access list (section 3), so making it broadly
available is safe.

## 2. What Claude will discover

Claude reads these before anyone signs in. You can open them in a browser to check they answer:

- `https://northstar.lluh.app/.well-known/oauth-protected-resource` — says `/mcp` is guarded by
  Northstar's authorization server
- `https://northstar.lluh.app/.well-known/oauth-authorization-server` — the authorize, token
  and registration endpoints; PKCE **S256 only**; scope `northstar`

Access tokens last one hour; refresh tokens last 30 days and rotate on every use.

## 3. Who can use it, and what each person gets

1. The person enables the Northstar connector in their own Claude settings.
2. On first use, Claude sends them to Northstar, which signs them in with **LLUH Entra ID**
   (single sign-on; no new password).
3. Northstar checks its own access list. **Only people with an active Northstar account get a
   token.** Anyone else sees "not authorised" and Claude gets nothing.
4. From then on, every tool call re-checks that person against the same list. Removing someone
   from Northstar (Ryan does this at `/admin`) cuts off their Claude access too — no action is
   needed on the Claude side.

What the tools return depends on the person:

| Tool | Returns | Who |
|---|---|---|
| `northstar_whoami` | Their own name, role and whether they are on the project team | Anyone with a Northstar account |
| `northstar_project_items`, `northstar_project_links`, `northstar_capabilities` | The Northstar project workspace | People on the project team |
| `northstar_people` | The Northstar access list | Project managers only |

## 4. Test data, memory and retention — please read

Northstar is a **proof of concept with synthetic project data**. Every tool result that
carries project content is prefixed with a banner saying so, and the server's instructions tell
Claude not to retain it or carry it into other conversations. That is a mitigation inside the
app; it is not a guarantee.

**Retention and memory are controlled in your console, not in Northstar.** Ryan's concern,
which we share, is a fake POC project resurfacing months from now as if it were real. Please
check what your organisation's memory and data-retention settings do with connector results,
and tell Ryan what they are, so we know whether anything further is needed before the data
becomes real.

The access list (names and roles) is real LLUH staff information and is not banner-wrapped.

## 5. Security notes, for the record

- PKCE with S256 is required; `plain` is refused.
- Authorization codes are single-use, expire in five minutes, and a replayed code revokes the
  tokens minted from it. Codes and tokens are stored only as SHA-256 hashes.
- Registered redirect URIs must be `https://`. An unknown client or redirect URI fails in place
  rather than redirecting anywhere.
- There is no shared credential anywhere in this path, by design. If anyone ever asks for an
  "API key for Northstar", the answer is that there isn't one.
- Not yet built: a consent screen between sign-in and the token. Today, signing in *is* the
  consent, which is acceptable for a POC with synthetic data and should be added before real
  project data.

## 6. Checking it worked

Have any person with a Northstar account enable the connector and ask Claude:

> Who am I in Northstar?

Claude should sign them in through Entra (once), then answer with their name and role via
`northstar_whoami`. If the person is not on Northstar's list, they will be told they are not
authorised — that is correct behaviour, not a fault; ask Ryan to add them.

## 7. If something goes wrong

| Symptom | Likely cause | What to do |
|---|---|---|
| Console rejects the URL or cannot discover OAuth | The well-known endpoints in section 2 are not answering | Open them in a browser; tell Ryan what you see |
| Person is sent round in a loop to sign in | They are not on Northstar's access list | Ryan adds them at `/admin` |
| "invalid_redirect_uri" during registration | Claude's callback was not `https://` | Should not happen with claude.ai; tell Ryan |
| Tools return 401 | Token expired and refresh failed | Disable and re-enable the connector |

Questions: Ryan Ashline, IS.
