# CLAUDE.md — LLUH Proof of Concept

Claude Code reads this at the start of every session.

---

## 1. Project overview

- **POC name:** `lluh-poc` (working name — rename once the POC is defined)
- **Goal / problem it solves:** NOT YET DEFINED — see Open Questions. Do not write feature code until this is answered.
- **Audience / who will demo it:** NOT YET DEFINED
- **Success criteria:** NOT YET DEFINED
- **Owner:** Ryan (Loma Linda University Health, IS leadership)
- **Deadline / demo date:** NOT YET DEFINED

## 2. Stack

- Next.js 15.5.4 (App Router) + TypeScript + React 19
- Tailwind CSS v4, ESLint
- `src/` directory, import alias `@/*`
- Package manager: **npm** (do not mix in pnpm/yarn)
- Hosting: Vercel
- Source control: GitHub
- Database / auth: none yet
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

This work must use the **LLUH accounts**, not Ryan's personal ones. These checks are client-side and must be run locally — a cloud session cannot do them.

1. `/status` in Claude Code — confirm the LLUH Claude account. If not: `/logout` then `/login`.
   - Optional isolation: `CLAUDE_CONFIG_DIR=~/.claude-lluh claude`
2. `vercel whoami` and `vercel teams ls` — confirm the intended scope.
3. `git config user.email` and `git remote -v` — confirm the intended work identity and remote.

If any point at a personal account when work is intended, stop and tell Ryan.

## 5. Setup checklist

### 5.1 Local tooling
- [ ] Node.js LTS (built against v22) — `node -v`
- [ ] `npm i -g vercel`

### 5.2 GitHub
- [ ] Create the repo under the intended LLUH-appropriate account/org
- [ ] `git remote add origin <url>` and `git push -u origin main`
- [ ] Claude GitHub App installed on that account/org (needed for cloud sessions to push)

### 5.3 Vercel
- [ ] `vercel login` (browser sign-in — confirm the correct account)
- [ ] `vercel whoami` / `vercel teams ls` — confirm scope
- [ ] `vercel link` in the project root
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
| _(none yet)_ | | | |

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
- When blocked on a credential, approval, or access, say so plainly and list exactly what Ryan needs to do.

## 8. Architecture notes

Nothing beyond the default Next.js scaffold yet. Fill in as it develops:
- Key routes / pages / API endpoints
- Data model
- External API contracts

## 9. Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-11-17 | Build POC on Vercel + GitHub; develop in Claude Code under LLUH account | Work project; keep separate from personal accounts |
| 2026-11-17 | Next.js 15 App Router + TypeScript + Tailwind, npm | Default Vercel path; least friction to a deployable demo |

## 10. Open questions for Ryan

- [ ] **What is the POC?** Problem, audience, and what "working" looks like on demo day. Blocking — no feature code until answered.
- [ ] Demo date.
- [ ] Which systems must it connect to, and are sandbox instances available?
- [ ] Is a personal Vercel account approved, or should this live in a work-owned Vercel team?
- [ ] Synthetic data sufficient, or is real LLUH data needed? (If real: approval required first.)
- [ ] Who needs access to the deployed demo — does it need SSO or password protection?
