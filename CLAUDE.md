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
- Database: **Neon Postgres** via the Vercel integration (`DATABASE_URL`); schema changes go in
  `src/lib/migrations.ts` and apply themselves on deploy. `db/*.sql` is historical reference only
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
| `NORTHSTAR_DATA_MODE` | `test` (default) or `live` | Vercel | `test` labels all MCP project content as synthetic. Switch only when the data is real |
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
| `/admin` | Access, assistant notes, project access, migrations. Project managers only |
| `/project` | Northstar project workspace. `has_project_access` only |
| `/records/[view]` | List views from `src/lib/views.ts`. `has_project_access` only |
| `/record/[number]` | One record's form. `has_project_access` only |
| `/record/new` | Create, with `?lifecycle=` and `?from=`. `has_project_access` only |
| `/api/chat` | Northstar assistant. Auth required, re-checked in the route |
| `/api/auth/*` | Auth.js handlers |
| `/mcp` | MCP server for Claude. Bearer token, per person |
| `/oauth/*`, `/.well-known/*` | OAuth 2.1 authorization server for the connector |

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

**Migrations apply themselves on deploy.** `src/lib/migrations.ts` holds the statements;
`ensureMigrated()` runs anything pending on the first database read after a deploy, once per
serverless instance, called from `getActiveUser()`. Pushing code is the whole deployment step -
nobody clicks a button or opens a SQL console. `/admin` still lists migration state with a manual
retry, as a fallback. Failures are logged and swallowed so a broken migration cannot lock everyone
out, and the claim is released so the next request retries. Append new
migrations to the end, one statement per array entry (the Neon HTTP driver rejects multi-statement
calls), and write each so re-running is harmless. A migration's name is inserted before its
statements run, so with several serverless instances exactly one applies it; a failure deletes the
claim so a retry picks it up.

**Database** - Neon Postgres: `northstar_users`, `northstar_assistant_notes`, and the
`northstar_tmp_project_*` tables. Migrations in `db/`, applied by hand in
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

**Northstar project workspace** (`/project`) - a stop-gap for running the Northstar project itself,
gated on `northstar_users.has_project_access` (separate from `role`: who administers access and who
is on the project are different questions). Checked against the database on every render, not from
the JWT, so a grant takes effect without re-signing in. Backed by **`northstar_tmp_*` tables, which
are deliberately throwaway** - migrate what is worth keeping when real project management ships, and
do not build anything else on them. Links are stored and rendered only when `https://`.

**Claude connector (MCP).** Northstar is an OAuth 2.1 authorization server so Claude can connect
**as the person using it**, not as a service account. `/oauth/authorize` requires a live Northstar
session, so a token is minted against a named person who already passed the roster check; every MCP
tool then re-checks that person with `lookupUser` and the same rules the pages use. **Never add a
shared API key or service credential to this path** - one would let Claude see everything regardless
of who asked, and the access model would stop meaning anything.

Details worth keeping: PKCE S256 is required and `plain` is refused; codes and tokens are stored
only as SHA-256 hashes; codes are single-use and replay revokes the tokens minted from them; refresh
tokens rotate. An unknown client or unregistered redirect URI fails **in place** rather than
redirecting - bouncing to an unvalidated redirect is how an open redirect becomes a stolen code.
`/oauth/*` and `/mcp` are excluded from middleware because they authenticate themselves;
`/oauth/authorize` still calls `auth()` itself.

**Ideas, Demands and Projects are one table, not three.** `northstar_records` holds a `lifecycle`
(Idea / Demand / Project) that changes in place. Nothing is copied on promotion, so history, title
and conversation stay with the record - the copying in ServiceNow is what loses them.

- **`suffix` is assigned once and never changes. The number is derived.** Display is
  `PREFIX[lifecycle] + suffix` (IDEA / DMND / PRJ), and `suffixFromNumber()` strips any prefix, so
  IDEA2600001 and PRJ2600001 both find the same row. **Do not store the prefixed number or mutate
  the suffix** - that would recreate the broken-reference problem the single table exists to avoid.
- Suffix is minted in SQL (`to_char(now(),'YY') || lpad(nextval(...),5,'0')`) so concurrent creates
  cannot collide. The sequence does not reset annually; the year is a label, not a counter reset.
- **States belong to a lifecycle** and only that lifecycle's states are offered. The pairing is
  enforced by a CHECK constraint, not only in the UI, so a bad combination cannot land by any route.
  `setRecordStateAction` re-reads the lifecycle rather than trusting the form.
- Promotion is forward only (Idea -> Demand -> Project) and resets state to the new lifecycle's
  first state. Each move is written to `northstar_record_history`, so "when did this become a
  project, and who decided" has an answer.

**Efforts views span every lifecycle.** `RecordView.lifecycle` is optional, and `undefined` means
all three - `listByView` handles it in one statement rather than branching. Active Efforts and All
Efforts sit directly under Project Management, above the lifecycle groups, and the Lifecycle column
is what distinguishes the rows.

**Records open a form at `/record/<number>`** (`src/components/record-form.tsx`, actions in
`src/app/records/actions.ts`). It is `/record`, singular and its own segment, because
`/records/<something>` is already a view key and a number there would have collided. Clicking a row
navigates; the first cell is still a real link so keyboard, middle-click and hover all work. The
form opens **read-only**; Edit (or `?edit=1`) turns the same layout into inputs, nothing moves,
Save returns to read-only and Cancel discards. Promote and Mark inactive are decisions, not
edits, so they sit outside the form and only in view mode. **A side panel** (`record-panel.tsx`)
sits beside the record, top-aligned and sticky on desktop and **above** the record on a phone,
never beneath it (Ryan). An icon rail picks the tab - Activity (history, newest first) and Details
for now; the rail is a list so documents, financials and the rest can be added as the record grows. **Assigned to is a picker over the
active roster** (stored as the email; an unknown assignee on a seeded record is kept as an option
rather than silently reassigned); **Assignment group is a datalist** of groups in use, so a new one
can still be typed. **Only the current lifecycle's states are offered, and the server re-reads
the lifecycle before accepting a state** - the form is not trusted. Create new is on every list and carries that view's
lifecycle; the Efforts views start an Idea. Every action re-checks `has_project_access`.

**List views are a registry, not routes.** `src/lib/views.ts` defines each view as a named filter
(lifecycle + `activeOnly`); `src/components/nav/nav-items.ts` builds the navigation from it and
`/records/[view]` resolves the key and runs `listByView`. Adding a view is one entry - the nav, the heading and the query
cannot drift apart. **Views are shortcuts onto one table** (list view standard v1.2, 11a; Ryan,
2026-11-19): the navigator keeps their names ("Active Demands"), but the page title is the
table's name ("Demands", `RecordView.title`), and the view's filter shows in the **breadcrumb
trail**, always visible under the toolbar: `All > Active is Yes > Title contains roof`. "All" and
removing the Active step go to the table's all-rows view (`allViewFor`); filter-builder steps
follow, and column searches are shown as steps too (ServiceNow does; note that standard s9 still
says searches are not breadcrumbs - Ryan to settle in the standard). Page titles in the browser
tab / History stay the shortcut's name (`view.label`). `northstar_records.is_active` is the flag: `activeOnly: false` returns active
and inactive together, which is what "All Demands" means.

**The list view is built to `docs/standards/list-view.md` v1.3 - hand-written, not from Appendix A.**
Ryan's call (2026-11-18): don't add shadcn/ui, don't over-complicate. So the shared view in
`src/components/list-view/` reproduces the standard's behaviour, sizes and wording without the
reference code. It will differ from CS Tracker in small ways. Do not add a second table - extend
the shared one.

Where things live: `src/lib/list-view/types.ts` (query, search operators, sort, wire format, CSV),
`filter.ts` (the filter tree, limits, server-side validation, breadcrumb text, private-column
redaction), `store.ts` (saved layouts and favourites), `registry.ts` (the columns),
`src/app/records/list-actions.ts` (server actions, every one re-checking access),
`src/app/api/lists/[list]/ai/route.ts` (the assistant), `src/app/api/records/[view]/export/route.ts`.

**Conformance (section 21), checked 2026-11-19 in a real browser at 1440px and 390px:**

| Item | Result |
|---|---|
| One shared view; a list is a registry entry + one-component page | Pass |
| Toolbar order ☰ ⛛ ☆ ✨ title … pager, actions; 32px buttons; 24px title; no count by the title | Pass, measured |
| ☰ menu items and order; Set as default (admins, confirmed); Reset | Pass. Group by is an inline select, not a dialog |
| Compact rows 24px (36 with dates); Comfortable remembered per browser; 16px text; shaded | Pass (36+1 measured; comfortable wraps long text, per s8) |
| Column search, full operators, Enter runs it, Clear search, "not" keeps empty | Pass |
| Filter builder AND/OR/NOT, 3 levels, 30 conditions, per-type comparisons, Run filter, server-enforced | Pass |
| Breadcrumbs: select to cut, per-step remove | Pass |
| Sort, one arrow; phones get Sort by | Pass |
| Group by: rows, counts, Open all / Close all / stop, 200 cap | Pass. **Not built:** per-group "Showing n. Show all"; the list caps at 2000 rows total instead |
| Right-click Show matching / Filter out / Copy per s11 | Pass |
| Saved filters per person; admin sharing; unique names; confirm on remove | Built; the database path is exercised only by code review here (no DB in the preview). Unique indexes enforce the names |
| View saved automatically; columns saved; admin default; precedence per s12 | Built; same caveat. Precedence is URL → person → admin default → registry |
| URL carries filter, sort, group, rows, searches, page | Pass |
| Pager in toolbar; 10/20/50/100/500, default 50; hidden while grouped | Pass |
| CSV ≤10,000 rows, formula-safe, permission-checked, BOM + CRLF + all quoted | Pass |
| Dates with the relative line, refreshed each minute | Pass |
| AI: analyze, chart, propose filter with Apply; numbers from queries; event stream per 14.6 | Pass, tested against a scripted fake model. **Not built:** markdown rendering (answers show as plain text); line charts draw as bars; voice (14.8, optional) |
| **Private columns never reach the model** | **Pass, tested the standard's way:** a search and a filter condition on `Assigned to` with a sentinel value; across three requests the sentinel never appeared, the model was told "also has conditions on hidden columns" / "also searches on hidden columns", `count_rows` grouped by it was refused, `list_rows` dropped it, and the server still applied the real filter (matching count was right) |
| Phones/tablets: cards, Search panel, Sort by; no sideways scrolling | Pass (390px scrollWidth = 390) |
| Wording per s7 / 14.7 | Followed where built; not every string audited |
| Accessibility s18 | Caption, aria-sort with sort hints, named fields, "Active filter" nav, live region, confirmations, button-ordered columns: pass. Keyboard-only pass not run |

**Design choices worth knowing:**
- **`Assigned to` is `private: true`.** A named member of staff is a person identifier and section
  14.4 is absolute. The AI can group by Assignment group instead. Remove the flag only with a
  reason written here.
- **Filtering runs in memory on the server, not in SQL.** `listByView` loads the view's rows and
  `applyQuery` filters, sorts and pages them. Fine at POC size, wrong at 50,000 rows - the
  filter model is the standard's, so moving it to SQL later is a translation, not a redesign.
  The AI's `count_rows` uses the same path, so its numbers are the page's numbers.
- **The AI uses `claude-opus-5-5` at medium effort** (section 14.5 names it), with the provider's
  refusal fallback on. The Northstar guide assistant stays on Haiku; they are different jobs.
- **Choice columns list their values.** `options` on a registry column (Lifecycle, State, Active)
turns the filter builder's value into a dropdown, and `parseFilter` drops a choice value that isn't
one of them. On one lifecycle's list, the records page narrows State to that lifecycle's states.
A new choice column needs its `options`, or the filter falls back to a free-text box.

**A grouped list is not paged.** Group headers must show real totals, so the page sends every
  matching row (capped at 2000) and hides the pager. Groups sort alphabetically, empties last.
- **Saved views are keyed on lower(email)** like every other per-person table here, not a user
  id. A null email is the default for everyone; a unique index on `(list_id, lower(coalesce(email,'')))`
  stands in for `unique nulls not distinct`.
- Hiding a column clears any search on it; a failed column save reverts and says so.

Two rules from that standard are non-negotiable and easy to get wrong: **every AI answer's numbers
come from a real query, never from the model reading rows**, and **nothing from a column marked
private reaches the model, by any route** - not tool results, and not the description of the
person's current filter and searches (strip private conditions and searches first; CS Tracker had
this gap until v1.1 of the standard).

**The navigator follows `docs/standards/left-navigator.md` (v1.3)** - the LLUH app standard, copied
in from cs-tracker (re-copy it when cs-tracker updates it). Sizes, type, states, wording and behaviour
come from there; only the brand colour is per-app. Read it before changing the navigator. Built:
collapse to an icon rail, **drag-to-resize** (240px default, 200-400px, `northstar:nav-width`),
search, **Menu / Favorites / History** tabs, per-person **favourites** and **history** on the server,
and the phone/tablet drawer.

- **`--ns-nav-primary` is navy in light mode, gold in dark.** The standard requires the
  current-page colour to clear 4.5:1 on the navigator background and on its own 10% tint. Measured:
  gold is **1.77:1** on the light background and teal 4.14:1 - both fail. Navy is 7.41:1 light, gold
  7.36:1 dark. **Do not "fix" the navigator by putting gold back in light mode.**
- `nav-items.ts` is the registry; `side-nav.tsx` renders it recursively. Record groups come from
  `views.ts`, so a new view appears in the nav automatically.
- Collapse state is in `localStorage` under `northstar:nav` and applied by an inline script in
  `layout.tsx` **before paint**, via the `nav-closed:` variant - no flicker on load.
- **A group opens when the current page is inside it** (Ryan asked for this). Groups are otherwise
  collapsed, per standard 9.2. Closing one by hand keeps it closed until you navigate into it again:
  the effect only runs when the active state changes, and the initial value is the same on the
  server and the first client render, so there is nothing for hydration to disagree about.
- **Rows need `min-w-0` on the `ul`, the `li` and the label.** Flex and grid children default to
  `min-width: auto`, so without all three the label runs past the 240px column and pushes the
  chevron out of sight. It looks fine until a label is long.
- **Deviation from the standard:** it allows one level of nesting; Northstar has two
  (PPM -> Ideas -> Active Ideas). Ryan asked for PPM at the top with the lifecycles beneath.
  Flagged, not yet decided.
- **Favourites and history** live in `northstar_nav_favorites` / `northstar_nav_history` (migrations
  011 and 012), keyed on lower(email). `src/lib/nav-store.ts` holds the queries; `src/app/nav-actions.ts`
  is the only way in from the browser, and **every action re-checks the signed-in person against the
  roster and touches only their rows** - the email comes from the session, never the client. History
  is one row per page (path) with the latest address, kept to 30; `history-recorder.tsx` (in
  AppShell) records each page change using the page title.
- **Page titles are saved in History and favourites**, so they read "Active Ideas · Northstar"
  (`title.template` in `layout.tsx`, `metadata` / `generateMetadata` per page) and **must never
  contain sensitive data**.
- Navigator text uses the standard's neutral colours (`--ns-nav-text` #333333, `--ns-nav-text-muted`
  #5c5c5c in light mode), not the general Northstar text tokens.
- The `nav-closed:` variant skips `<dialog>`, so the phone drawer (a native modal `<dialog>`) always
  shows the full navigator even when the desktop rail is collapsed.
- **Deviation from the standard:** groups have no page of their own (a group's link is its first
  view), so there is no "<Group> overview" row.

**Test data labels itself.** While `NORTHSTAR_DATA_MODE` is not `live`, every MCP tool that returns
project content prefixes it with a banner saying it is POC test data, and the server's `initialize`
instructions tell Claude not to retain it or carry it between conversations. The reason is Ryan's:
a fake project resurfacing months later as if it were real is how people stop trusting the
assistant. The banner rides with the payload, not only in the server instructions, so a single
result quoted out of context still carries its own warning. The roster of people is real and is not
banner-wrapped. **Set `NORTHSTAR_DATA_MODE=live` only when the workspace genuinely holds real
project data.** This is mitigation, not a guarantee - retention and memory are controlled in the
Claude admin console, not here.

**Not built, deliberately**
- Real project management (the `/project` page is a stop-gap, not the product)
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
| 2026-11-18 | Navigator built to `docs/standards/left-navigator.md`, with navy as the light-mode nav primary | Gold measures 1.77:1 against the standard's 4.5:1 requirement |
| 2026-11-18 | Navigator brought up to standard v1.3: tabs, favourites, history, drag-to-resize, standard drawer | Ryan asked for Northstar to match the CS Tracker navigator, including the new features |
| 2026-11-18 | Navigator width: 240px default, people drag it from 200 to 400px | Ryan first asked for wider, then chose resizable with the original default |
| 2026-11-19 | List view completed to standard v1.1 without shadcn/ui; `Assigned to` marked private | Ryan: build to the standards, don't ask. A staff email is a person identifier under 14.4 |
| 2026-11-19 | List AI on `claude-opus-5-5` at medium effort; guide assistant stays on Haiku | The standard names it; the two assistants do different jobs |
| 2026-11-19 | List filtering stays in memory on the server for the POC | The filter model matches the standard, so moving to SQL later is a translation |
| 2026-11-19 | Record page gets an icon-tab side panel, top-right on desktop, above the form on phones | Ryan chose layout 3 from the mock-ups; panel at the top, not below |
| 2026-11-19 | Record form opens read-only with an Edit mode; person picker and group datalist | Ryan asked for a form that reads like a form, not a wall of inputs; one layout for both modes so nothing moves |
| 2026-11-19 | Nav groups open when the current page is inside them | Ryan asked. A group that hides where you are leaves the navigator unable to answer "where am I" |
| 2026-11-19 | Grouped lists are not paged, and cap at 2000 rows / 200 groups | Group counts have to be real totals, not per-page counts |
| 2026-11-19 | List title is the table ("Demands"); filters show in an always-visible breadcrumb trail starting with All; views stay as navigator shortcuts | Ryan prefers ServiceNow's pattern; list view standard v1.2 |
| 2026-11-19 | Choice columns (Lifecycle, State, Active) carry their `options`; the filter builder offers them as a dropdown, and the server rejects other values | Ryan expected to pick a State, not type one; standard section 10 |
| 2026-11-18 | Keep the hand-written list view; do not adopt Appendix A or shadcn/ui | Ryan's call: don't over-complicate it. Accepts some drift from CS Tracker |
| 2026-11-18 | Active Efforts / All Efforts span every lifecycle, above the lifecycle groups | Ryan wants one place to see everything; the Lifecycle column tells them apart |
| 2026-11-18 | Records open a form at `/record/<number>`, not inside `/records/<view>` | A view key and a record number would have collided in the same segment |
| 2026-11-18 | List views built by hand from standard v1.0, before Appendix A existed | A stop-gap. v1.1 says to copy the reference code; adopting it needs shadcn/ui, which is Ryan's call |
| 2026-11-18 | Demo records seeded in a migration, marked `created_by = 'demo seed'` | The list views needed content; the marker means one statement removes it all |
| 2026-11-18 | List view standard v1.1 copied from cs-tracker, its home | Checked against the CS Tracker code, with full reference code; cs-tracker keeps the master copy |
| 2026-11-18 | Project Portfolio Management is the top-level application in the nav | Northstar is a project code name; PPM is the product, and will sit beside others on a larger platform |
| 2026-11-18 | List views are defined in one registry and rendered from it | Nav, heading and query come from one definition, so they cannot disagree |
| 2026-11-18 | Idea / Demand / Project are one table with a lifecycle field | Ryan's design. Conversion copying is what loses history; one maturing record keeps it |
| 2026-11-18 | The record number is derived from lifecycle + an immutable suffix | A number that mutates breaks every reference written before it changed |
| 2026-11-18 | POC project data labels itself as synthetic in every MCP result | A fake project recalled as fact months later is how trust in the assistant dies |
| 2026-11-18 | Claude connects via MCP with per-user OAuth, not a shared key | Claude must see exactly what the person sees; a service credential would erase the access model |
| 2026-11-17 | Migrations ship in code and apply themselves on deploy | Pushing code is the whole deployment step; nobody should click a button or open a SQL console |
| 2026-11-17 | `/project` workspace on throwaway `northstar_tmp_*` tables | Run the project now; migrate later rather than guessing the real model today |
| 2026-11-17 | Project visibility is a flag, not a role | Who administers access and who is on the project are different questions |
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
