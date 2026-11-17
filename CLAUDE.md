# CLAUDE.md — Northstar (LLUH Proof of Concept)

Claude Code reads this at the start of every session.

---

## 1. Project overview

- **POC name:** **Northstar** — project management system (package and Vercel project `northstar`)
- **Goal / problem it solves:** LLUH project management system. Phase 1 is the front door only:
  SSO, a welcome video, the app shell and profile/preferences. No PM features yet.
- **Audience:** core team, then invited members
- **Success criteria (phase 1):** a core team member opens northstar.lluh.app, is signed in by
  SSO, watches the welcome video once, and lands in the shell with their own name and photo
- **Owner:** Ryan (Loma Linda University Health, IS leadership)
- **Deadline / demo date:** NOT YET DEFINED

## 2. Stack

- Next.js 15.5.4 (App Router) + TypeScript + React 19
- Tailwind CSS v4, ESLint
- `src/` directory, import alias `@/*`
- Package manager: **npm** (do not mix in pnpm/yarn)
- Hosting: Vercel, team **LLUH POC**, project `northstar`
  - **https://northstar.lluh.app** — LIVE. Cloudflare CNAME to `cname.vercel-dns.com`, DNS only
    (not proxied; proxying causes redirect loops with Vercel). TLS issued by Vercel.
  - Also serves on `https://northstar-liart-five.vercel.app`
- Source control: GitHub
- Auth: Auth.js v5 (`next-auth@beta`) + Microsoft Entra ID, single tenant, LLUH tenant
- Database: **Neon Postgres** via the Vercel integration (`DATABASE_URL`); schema in `db/`
- Brand: token set in `src/app/globals.css`, assets in `public/brand`
- AI: Anthropic SDK, `claude-haiku-5-5`, called directly (not via Vercel AI Gateway)
- Email: none yet

## 3. Data and compliance rules (read first)

LLUH is a healthcare organization. Until Ryan confirms otherwise:

- **Synthetic or sample data only.** No PHI, no real patient, employee, or other sensitive data.
- **No real LLUH production credentials.** Sandbox / dev / PDI instances only.
- Never commit secrets. Keep them in `.env.local` (gitignored) and in Vercel environment variables.
- Do not paste secrets, tokens, or API keys into chat, code, README, or commit messages.
- If the POC needs real LLUH data or production access, **stop and ask Ryan** — that needs approval and likely a work-owned hosting account first.

## 4. Account separation

Vercel deploys into the work-owned **LLUH POC team**. GitHub remains Ryan's **personal** account
(`ashline951/northstar`, private) for the POC phase, with CIO backing. Personal GitHub sits outside
any LLUH BAA, so the section 3 data rules are what keep this compliant: synthetic data only, no
production credentials, no exceptions without moving the repo to work-owned infrastructure first.

The **Claude Code account must still be the LLUH one**. These checks are client-side and must be run
locally — a cloud session cannot do them.

1. `/status` in Claude Code — confirm the LLUH Claude account. If not: `/logout` then `/login`.
   - Optional isolation: `CLAUDE_CONFIG_DIR=~/.claude-lluh claude`
2. `vercel whoami` and `vercel teams ls` — the active scope must be **LLUH POC**.
3. `git remote -v` — expect `ashline951/northstar`.

If the **Claude** account is personal rather than LLUH, stop and tell Ryan.

## 5. Setup checklist

### 5.1 Local tooling
- [ ] Node.js LTS (built against v22) — `node -v`
- [ ] `npm i -g vercel`

### 5.2 GitHub — DONE
- [x] Private repo `ashline951/northstar` created
- [x] Remote added, `main` pushed
- [x] Claude GitHub App installed — cloud sessions can push directly

### 5.3 Vercel — Ryan does this in the dashboard (no CLI needed)
Ryan is not running this app locally. Deployment is git-based: push to `main`, Vercel builds.

- [x] LLUH POC team → imported `ashline951/northstar`, deployed
- [x] Environment variables added
- [ ] `AUTH_URL` set to the interim Vercel URL, then redeploy (env vars need a new build)
- [x] Domain `northstar.lluh.app` added, CNAME created in Cloudflare, certificate issued
- [ ] Identity team to add the interim redirect URI:
      `https://northstar-liart-five.vercel.app/api/auth/callback/microsoft-entra-id`
- [ ] Switch `AUTH_URL` to `https://northstar.lluh.app` once DNS resolves, and redeploy
- [x] `.env*` and `.vercel` are gitignored
- [ ] Vercel MCP server: `claude mcp add --transport http vercel https://mcp.vercel.com`, then `/mcp` and complete browser sign-in

### 5.4 Other MCP servers — add only what the POC needs
```
claude mcp add --scope project --transport http <name> <url>
```
Candidates (undecided, pending section 1): Supabase, Resend, Microsoft 365 / SharePoint / Teams, ServiceNow (sandbox/PDI).
Record base URL, auth method, and env var **names** below. Never record secret values.

### 5.5 Environment variables

| Variable | Purpose | Where it is set | Notes |
|---|---|---|---|
| `AUTH_SECRET` | Auth.js session/JWT signing | `.env.local` + Vercel | `npx auth secret` |
| `ANTHROPIC_API_KEY` | Northstar assistant | Vercel | **Secret.** Missing = assistant returns 503, rest of the app is fine |
| `AUTH_URL` | Public origin Auth.js builds callback URLs from | Vercel | **Must match a registered Entra redirect URI**, or sign-in fails with redirect_uri mismatch |
| `DATABASE_URL` | Neon Postgres | Vercel (set by the integration) | Access control and roles live here, not in env vars |
| `NEXT_PUBLIC_WELCOME_VIDEO_URL` | Welcome video source | `.env.local` + Vercel | Blank is handled gracefully |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | Entra Application (client) ID | `.env.local` + Vercel | Not secret |
| `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` | Entra Directory (tenant) ID | `.env.local` + Vercel | Not secret |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Entra client secret | `.env.local` + Vercel | **Secret.** Rotate at POC end |

See `.env.example`. Entra registration request for the Identity team: `docs/northstar-entra-setup.md`.

Add with `vercel env add <NAME> <environment>`.

## 6. Build and run commands

```
npm install
npm run dev     # local dev server (http://localhost:3000)
npm run build   # production build check — currently passes
npm run lint
vercel          # preview deploy
vercel --prod   # production deploy (ask Ryan first)
```

No test runner is configured yet.

## 7. Working agreements for Claude Code

- Start each session by reading this file and checking `git status`.
- Work in small steps; commit with clear messages. Branch per feature.
- Use **preview deployments** for demos. Never `vercel --prod` or change production env vars without Ryan's explicit OK.
- Do not delete projects, databases, domains, or env vars without asking.
- Prefer simple, readable code. This is a POC: favor speed to a working demo, but flag shortcuts that would need hardening before production.
- Keep the Decisions log and Open questions current.
- **Name every document and deliverable with `northstar` in the filename** — e.g.
  `northstar-entra-setup.md`, `northstar-demo-script.md`. These get forwarded to people
  outside the project, where a bare `entra-setup.md` has no context. Exception: `CLAUDE.md`,
  which Claude Code requires by that exact name.
- When blocked on a credential, approval, or access, say so plainly and list exactly what Ryan needs to do.

## 8. Architecture notes

**Entra app registration** `Northstar POC`, LLUH tenant, single tenant, **assignment NOT required** -
anyone in the tenant can authenticate. Delegated Graph scopes:
`openid profile email User.Read User.ReadBasic.All`. Optional `email` claim is on. Client secret
expires ~2027-05.

**Authorization is Northstar's job, not Entra's.** The `signIn` callback in `src/auth.ts` looks the
email up in `northstar_users` and sends anyone without an active row to `/not-authorized`. This is a
deliberate trade Ryan chose: Entra assignment is enforced by Microsoft before a token is issued,
whereas this is enforced by our code afterwards. **Do not weaken the `signIn` callback** - it is the
only thing standing between a tenant-wide identity and the app. It fails closed: an unreachable
database denies access rather than granting it.

**Auth config is split on purpose.** `src/auth.config.ts` is edge-safe and is what `middleware.ts`
builds from, so the Neon driver never runs in middleware. `src/auth.ts` adds the callbacks that need
the database. Do not collapse them back together.

**Server actions re-check authorization.** `src/app/admin/actions.ts` calls `requireProjectManager()`
in every action. A server action is a public endpoint; hiding the admin link is not access control.

**Routes**
| Route | Notes |
|---|---|
| `/` | Welcome + emblem + motto. Auth required |
| `/profile` | Entra/Graph details, read-only |
| `/preferences` | Theme control |
| `/signed-out` | Public. Must NOT auto-redirect, or SSO re-signs them in |
| `/not-authorized` | Public. Authenticated but not on the allow list |
| `/admin` | Manage who can sign in, and what the assistant knows. Project managers only |
| `/api/chat` | Northstar assistant. Auth required, re-checked in the route |
| `/api/auth/*` | Auth.js handlers |

**Key decisions baked into the code**
- **The route guard is `callbacks.authorized` in `src/auth.config.ts`, not the matcher.** Exporting
  `auth` as middleware without it only attaches session info and blocks nothing - every route
  answered 200 to anonymous callers until this was added. If routes ever go public again, look here
  first. Verify with `curl -o /dev/null -w '%{http_code}' <url>/admin` - it must be 307, not 200.
- `/signin` bounces straight to Entra rather than showing a provider picker: one provider, and
  sign-in should be invisible on a corporate device.
- Graph profile (name, title, department, 64px photo) is fetched once in the `jwt` callback at
  sign-in and carried in the session cookie. Photo size is kept small because Auth.js has to chunk
  the cookie past ~4KB.
- No photo in Graph is normal, not an error - `Avatar` falls back to initials.
- Welcome video state is `northstar_users.welcome_seen_at` - per person, across devices.
- Video playback starts from a click. Browsers block audio without a user gesture; this is not
  something that can be coded around.
- Sign-out is app-only. Ending the Entra session would sign people out of Outlook and Teams.
- `NEXT_PUBLIC_WELCOME_VIDEO_URL` blank is a supported state - the welcome screen shows a message
  and still offers Enter Northstar.

**Database** - Neon Postgres: `northstar_users` and `northstar_assistant_notes`. Migrations in `db/`, applied by hand in
the Neon SQL editor (no migration runner; there is one table). `deactivateUser` is a soft delete so
there is a record of who once had access.

**Northstar assistant** (`src/app/api/chat/route.ts`, `src/components/Assistant.tsx`) - a scoped
guide to Northstar, not a general chatbot. Conversations are not persisted. History is trimmed to
the last 10 turns and 4000 characters per message to bound cost. `ANTHROPIC_API_KEY` missing
returns 503 rather than crashing.

Its prompt is built in three parts by `buildSystem()`: `SYSTEM_BASE`, then the team's editable
notes from `northstar_assistant_notes`, then `SYSTEM_SAFETY` **last**. That order is the point -
the safety section refuses clinical content and PHI even when the user claims it is fake or
authorised, and it comes after the notes so a note cannot talk the assistant out of it. **Keep the
safety block last and do not loosen it.** Project managers edit the notes at `/admin`; changes
apply to the next message with no redeploy.

**Not built, deliberately**
- Any actual project management
- Entra security groups - roles are in-app only

## 9. Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-11-17 | Build POC on Vercel + GitHub; Claude Code under LLUH account | Work project |
| 2026-11-17 | Deploy into the **LLUH POC** Vercel team, not a personal scope | Work-owned hosting; supersedes the earlier personal-Vercel decision |
| 2026-11-17 | GitHub remains Ryan's personal account for now | Ryan confirms CIO backing |
| 2026-11-17 | Next.js 15 App Router + TypeScript + Tailwind, npm | Default Vercel path; least friction to a deployable demo |
| 2026-11-17 | Entra ID sign-in via Auth.js v5; `User.Read` scope dropped | Keeps the app registration to the three standard OIDC scopes |
| 2026-11-17 | Pin to `northstar.lluh.app` rather than per-deploy preview URLs | Entra redirect URIs require exact matches; one stable URI |
| 2026-11-17 | Access control moved from Entra assignment to an in-app allow list | Ryan wants the tenant able to authenticate, with Northstar deciding who gets in |
| 2026-11-17 | Assistant calls Anthropic directly, not through Vercel AI Gateway | Ryan wants LLUH's own Claude account; the app host and the model provider are independent |
| 2026-11-17 | Assistant scoped to Northstar only, with a hard PHI refusal | A free-text box in a health system is how PHI leaks by accident |
| 2026-11-17 | Assistant's personality and facts live in a table, edited at `/admin` | Ryan wants to add in-jokes without a deploy; safety block stays in code, appended last |
| 2026-11-17 | Roster moved from env vars to Neon Postgres, with an in-app admin page | Env vars needed a redeploy per change and only Ryan could edit them |
| 2026-11-17 | Interim testing on `northstar-liart-five.vercel.app` while DNS is pending | Decouples sign-in testing from the Cloudflare change |
| 2026-11-17 | Next.js pinned to the 15.5.x backport line, not 16.x | 15.5.4 shipped a critical RCE and Vercel refused to deploy it; 16.x renames middleware to proxy |
| 2026-11-17 | No local development; deploy from GitHub to Vercel only | Ryan's choice. Means the deployed app is the first test, and preview deploys cannot authenticate |

## 10. Open questions for Ryan

- [ ] Demo date.
- [ ] Welcome video file (Gemini, ~60s) — then set `NEXT_PUBLIC_WELCOME_VIDEO_URL`.
- [ ] Ask Identity to turn **Assignment required OFF**; Northstar now gates access itself.
- [ ] Which systems must it connect to (ServiceNow, Clear Skye), and are sandboxes available?
- [ ] Synthetic data sufficient? (Real LLUH data requires approval **and** moving off personal infrastructure.)
