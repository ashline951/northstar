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
- Hosting: Vercel, team **LLUH POC**, custom domain **northstar.lluh.app**
- Source control: GitHub
- Auth: Auth.js v5 (`next-auth@beta`) + Microsoft Entra ID, single tenant, LLUH tenant
- Database: none (deliberate - see Architecture)
- Brand: token set in `src/app/globals.css`, assets in `public/brand`
- Email: none yet
- Other integrations: none yet

## 3. Data and compliance rules (read first)

LLUH is a healthcare organization. Until Ryan confirms otherwise:

- **Synthetic or sample data only.** No PHI, no real patient, employee, or other sensitive data.
- **No real LLUH production credentials.** Sandbox / dev / PDI instances only.
- Never commit secrets. Keep them in `.env.local` (gitignored) and in Vercel environment variables.
- Do not paste secrets, tokens, or API keys into chat, code, README, or commit messages.
- If the POC needs real LLUH data or production access, **stop and ask Ryan** — that needs approval and likely a work-owned hosting account first.

## 4. Account separation

Ryan has approved **personal Vercel and GitHub accounts for the POC phase** (2026-11-17). This is
conditional: personal infrastructure is outside any LLUH BAA or contract, so the section 3 data rules
are what keep this compliant. Synthetic data only, no production credentials — no exceptions without
moving to work-owned infrastructure first.

The **Claude Code account must still be the LLUH one**. These checks are client-side and must be run
locally — a cloud session cannot do them.

1. `/status` in Claude Code — confirm the LLUH Claude account. If not: `/logout` then `/login`.
   - Optional isolation: `CLAUDE_CONFIG_DIR=~/.claude-lluh claude`
2. `vercel whoami` and `vercel teams ls` — the active scope must be **LLUH POC**.
3. `git config user.email` and `git remote -v` — expect Ryan's personal GitHub for now.

If the **Claude** account is personal rather than LLUH, stop and tell Ryan.

## 5. Setup checklist

### 5.1 Local tooling
- [ ] Node.js LTS (built against v22) — `node -v`
- [ ] `npm i -g vercel`

### 5.2 GitHub
- [ ] Create the repo under Ryan's **personal** GitHub account (private)
- [ ] `git remote add origin <url>` and `git push -u origin main`
- [ ] Claude GitHub App installed on the personal account (needed for cloud sessions to push)

### 5.3 Vercel
- [ ] `vercel login` (browser sign-in — confirm the correct account)
- [ ] `vercel whoami` / `vercel teams ls` — confirm scope
- [ ] `vercel link --scope "LLUH POC"` in the project root — **must land in the LLUH POC team**,
      not a personal scope. Check with `vercel teams ls` first and confirm with `vercel project ls`.
- [ ] Add domain `northstar.lluh.app` (Project → Settings → Domains); add the CNAME it shows
      at whoever hosts `lluh.app` DNS. TLS is provisioned automatically.
- [ ] `vercel env pull .env.local`
- [ ] Confirm `.env*` and `.vercel` are gitignored — **already true in this repo**
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
| `NORTHSTAR_PROJECT_MANAGERS` | Comma-separated emails with the Project Manager role | `.env.local` + Vercel | Keeps staff addresses out of git |
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

**Entra app registration** `Northstar POC`, LLUH tenant, single tenant, assignment required.
Delegated Graph scopes: `openid profile email User.Read User.ReadBasic.All`. Optional `email`
claim is on. Client secret expires ~2027-05.

**Routes**
| Route | Notes |
|---|---|
| `/` | Welcome + emblem + motto. Auth required |
| `/profile` | Entra/Graph details, read-only |
| `/preferences` | Theme control |
| `/signed-out` | Public. Must NOT auto-redirect, or SSO re-signs them in |
| `/api/auth/*` | Auth.js handlers |

**Key decisions baked into the code**
- Middleware protects everything except `/api/auth`, `/signed-out` and static brand assets.
- Graph profile (name, title, department, 64px photo) is fetched once in the `jwt` callback at
  sign-in and carried in the session cookie. Photo size is kept small because Auth.js has to chunk
  the cookie past ~4KB.
- No photo in Graph is normal, not an error - `Avatar` falls back to initials.
- Welcome video state lives in `localStorage` keyed by email. Per browser, by design: it replays on
  a new device. Per-person would need a database.
- Video playback starts from a click. Browsers block audio without a user gesture; this is not
  something that can be coded around.
- Sign-out is app-only. Ending the Entra session would sign people out of Outlook and Teams.
- `NEXT_PUBLIC_WELCOME_VIDEO_URL` blank is a supported state - the welcome screen shows a message
  and still offers Enter Northstar.

**Not built, deliberately**
- Any actual project management
- Self-service "add anyone" - needs a database
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

## 10. Open questions for Ryan

- [ ] Demo date.
- [ ] Welcome video file (Gemini, ~60s) — then set `NEXT_PUBLIC_WELCOME_VIDEO_URL`.
- [ ] Project Manager roster — emails for `NORTHSTAR_PROJECT_MANAGERS`.
- [ ] Assign the core team in Entra. **Assignment required is ON** — unassigned users cannot sign in.
- [ ] Which systems must it connect to (ServiceNow, Clear Skye), and are sandboxes available?
- [ ] Synthetic data sufficient? (Real LLUH data requires approval **and** moving off personal infrastructure.)
- [ ] Who controls DNS for `lluh.app`, and can they add the CNAME?
