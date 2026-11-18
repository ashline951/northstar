# Standard: list views (look, feel, behavior and the AI assistant)

**Status:** LLUH app standard, v1.0 (2026-11-18). Owner: Ryan Ashline. Reference build: CS Tracker (`src/components/list-view/`, `src/lib/list-view/`, `src/lib/lists/registry.ts`, `src/lib/ai/list-assistant.ts`).

**How to use this file.** Copy it into any LLUH app repo (`docs/standards/list-view.md`) and point the app's AI instructions at it, for example `@docs/standards/list-view.md` in `CLAUDE.md` or `AGENTS.md`. Coding agents must treat every **must** as a requirement and every **should** as the default unless the app's owners decide otherwise (record that decision in the app's docs).

**Instructions for coding agents.**
1. Build **one shared list view** and a **registry** of lists. A list declares its columns; it never gets its own table component. If you find yourself writing a second table, stop.
2. Build **every feature in section 1**. Saved views, saved filters and the AI assistant need database tables and server actions (section 9); create them with the app's normal migration process.
3. Use the **sizes in section 3**. Don't approximate; "close" is what makes apps feel different.
4. When done, work through the **checklist in section 12** and report each item as pass or fail.

**What is standard and what isn't.** Layout, sizes, behavior, operators and the AI contract are the same in every LLUH app. **Brand color is not set here:** each app uses its own palette through its tokens. Never hard-code a brand color in a list view.

**The shape of it.** This is ServiceNow's list view, which LLUH staff already know, with the parts that waste space removed and an AI assistant added. Where a decision could go either way, match ServiceNow.

---

## 1. Required features (all must be built)

1. **One shared list view**, driven by a per-list **registry** of columns.
2. **Column chooser** (available / selected slush bucket) with order, saved per person.
3. **Per-column search boxes** with the operators in section 5.
4. **Filter builder** with AND / OR / NOT and nested groups.
5. **Group by** a column, with collapsible group headers.
6. **Right-click a value** for Show matching / Filter out / Copy.
7. **Breadcrumbs** showing the filter, each step removable.
8. **Sort** by any column.
9. **Saved filters (★ favorites)**, per person; admins can share one with everyone.
10. **CSV export** of every matching row, not just the page on screen.
11. **Row density**: compact by default, comfortable as an option, remembered per browser.
12. **Pagination** in the toolbar, rows-per-page remembered.
13. **Saved view per person on the server** (columns, sort, filter, grouping), plus an admin default for everyone.
14. **AI assistant (✨)** as specified in section 8.
15. **Phone/tablet layout**: cards, not a sideways-scrolling table.

## 2. Anatomy

One slim toolbar above the table, in this order:

1. **☰ list menu**: Group by…, Choose columns…, Export CSV, Reset to default, Set as default for everyone… (admins), row spacing.
2. **Filter icon** (funnel), with a dot when a filter is on.
3. **★ saved filters.**
4. **✨ AI assistant** (section 8).
5. **The list's title.** The count does **not** go here; it goes in the pager.
6. **Breadcrumbs**, only while a filter is on.
7. **Page actions** at the right (e.g. "Add person"), then the **pager**.

Then the table: header row, a search box under each header on large screens, then rows.

## 3. Size and spacing

| Element | Value |
|---|---|
| Toolbar title | 24 px |
| Toolbar icon buttons | 32 px |
| Column headers | 28 px |
| Column search boxes | 28 px |
| Row height, compact (default) | ~24 px (~36 px when a date column shows its relative line) |
| Row height, comfortable | 44 px |
| Body text | 16 px |
| Dates | 14 px, with the relative line at 12 px |

**Compact is the default.** These lists are read on desktops and laptops, and wasted vertical space costs rows on screen. Touch-first or gloved use switches to **Comfortable rows**, remembered per browser. Text stays 16 px in both.

## 4. Table behavior

- **Sort:** select a header; select again to reverse. Only the sorted column shows an arrow. Dates start newest first. Phones get a "Sort by" control.
- **Shaded rows:** every other row lightly shaded, in both densities, counted within each group when grouped.
- **Long text** is cut with "…" and shows in full on hover.
- **Dates** read "10/28/2026, 11:48 AM" with "3 weeks ago" beneath, computed in the browser and refreshed every minute.
- **Wide lists** scroll sideways inside the table, never the page.

## 5. Search box operators

Plain text means **contains** — that is the default and must stay the default.

| Input | Meaning |
|---|---|
| `text` | contains |
| `*` or `%` | any text (matches the whole value): `7C*`, `*-01`, `7*01` |
| `?` | any single character |
| `=EMER` | exactly |
| `=` | is empty |
| `!EMER` | does not contain |
| `!=EMER` | is not exactly |
| `!=` | is not empty |

Capitals never matter. Operators work on every column, including dates (`10/28*`) and choice values, matched **on the words people see** — never on database codes. Pressing Enter runs the search; there is no Search button. A × clears it.

## 6. Filter builder

"Show rows that match **all** of these (AND) / **any** of these (OR)", each condition being *column + comparison + value*. **Add group** mixes AND and OR, up to **3 levels and 30 conditions**. Any group can be negated with **Leave these out (NOT)**.

Comparisons by column type: text (contains, doesn't contain, is, is not, starts with, ends with, is empty, is not empty); dates (on, before, after, is empty, is not empty); single choice (is, is not); multi-value (includes, doesn't include).

**A negation keeps rows whose value is empty.** "Leave out bed 3x" keeps rows with no bed, because that is what people mean.

## 7. State, URLs and validation

- **The URL holds filter, sort, search and page**, so a view can be bookmarked, shared, and Back works.
- Opening a list with no URL state uses, in order: the person's saved view, the admin default, the built-in default.
- **Every filter must be re-validated on the server** against that list's registry before use. Unknown columns, wrong comparisons and malformed values are dropped, not trusted.
- **Values go to the database as parameters.** Never interpolate a filter value into SQL.
- A list may require a permission. Its page, its actions **and its CSV export** must each check it on the server.

## 8. The AI assistant (✨)

A **gold sparkle button** in the toolbar opens a side panel beside the list.

**Scope.** The assistant answers about **the rows matching the current filter and column searches** — all of them, not just the page on screen.

**What it can do**
- **Analyze:** count, compare, find the largest groups and trends. **Every number must come from a real database query**, never from the model's own reading of rows. If it cannot be counted, it is not answered.
- **Chart:** bar (groups) or line (over time), with hover values and a **Show table** view of the numbers.
- **Propose a filter:** a question like "EMER orders not in bed 3x" produces a **proposed** filter with an **Apply filter** button. **Nothing is ever applied silently.** Once applied it behaves like any other filter, including breadcrumbs and saving as a favorite.

**Tools (all executed by the app's server, never by the model)**
| Tool | Does |
|---|---|
| `count_rows` | Counts, optionally grouped by 1–2 columns (dates by day/week/month), over the current filter plus an optional extra |
| `list_rows` | Up to 25 rows, chosen non-private columns only |
| `propose_filter` | Returns a validated filter for the person to apply |
| `show_chart` | Returns a validated chart spec |

**Privacy — the rule that matters**
- **Columns holding patient identifiers are marked `private: true` in the registry and are never sent to the model.** It cannot read, group, filter, chart or list them; the tools refuse, and row lookups omit them. The assistant tells people to use the column search boxes instead.
- The model sees: column names and choice values, the current filter and searches, today's date, and whatever the tools return.
- The assistant inherits the list's permission. The API route checks the session and the permission on every request.
- **Before any real patient data:** confirm a BAA or approved data terms covering the model provider, and re-review which columns are marked private.

**Models and cost.** Typed questions use the app's standard reasoning model. Spoken questions use a faster, cheaper model at low effort with a "spoken conversation" instruction (one to three short plain sentences, no markdown), because latency matters more than depth out loud. Enable the provider's refusal fallback so a declined request retries on the recommended fallback rather than failing.

**Voice (optional, but specified so apps match)**
- Prefer an enterprise speech service in the organisation's own tenant (Azure AI Speech) over browser speech, which sends audio to the browser vendor. Fall back to browser speech only when the key is absent, and say so.
- **Never be silent during a lookup:** the model gives a three-to-six-word lead-in before a tool call, spoken immediately; if it goes straight to a tool, the panel speaks a short filler.
- **Barge-in:** the microphone stays live while the assistant talks; two or more words stop playback and become the next question.
- **Echo:** ignore microphone input matching what was just spoken, during and for 1.5 s after.
- Speak each phrase as it is written, starting at the first comma once there are four or more words.
- End a phrase after **0.6 s** of quiet.

**Degrading well.** With no API key the panel says "The AI assistant isn't set up yet" and the rest of the list works normally. An assistant failure must never break the list.

## 9. Data model

Two tables, per app:

- **Saved layouts** — one row per person per list: columns and order, sort, filter, grouping, rows per page. A row with a null user is the **default for everyone**.
- **Saved filters** — a named filter; per person, or shared with everyone when an admin ticks it. Names are unique per person, and unique among shared filters.

Only an admin permission may share a filter, delete a shared one, or set a list's default.

## 10. Accessibility (must)

- Sortable headers report their state with `aria-sort`; every search box and filter field has a name.
- Breadcrumbs are a labelled navigation; remove buttons name what they remove.
- Counts and result changes are announced (`aria-live`): "9 of 54 orders match".
- Every icon button has an accessible name and a tooltip.
- A designed empty state ("No orders match") with a way back to everything.
- Destructive or wide-reaching actions confirm first: deleting a shared filter, setting the default for everyone.
- Errors in plain words.
- Column reordering uses buttons, not drag and drop — easier with keyboards and gloves.

## 11. Don'ts

- Don't build a one-off table for a list. Declare its columns in the registry.
- Don't apply an AI-proposed filter without the person pressing Apply.
- Don't send a column marked private to the model, in any tool, for any reason.
- Don't put the row count next to the title; it belongs in the pager.
- Don't trust a filter that arrived from the browser.
- Don't drop below 16 px for body text to fit more in.

## 12. Conformance checklist

- [ ] One shared list view; a new list is a registry entry, not a component.
- [ ] Column chooser with order; saved per person on the server.
- [ ] Per-column search with the full operator set; Enter runs it.
- [ ] Filter builder with AND / OR / NOT, nested groups, 3 levels, 30 conditions.
- [ ] Group by with collapsible headers; right-click Show matching / Filter out / Copy.
- [ ] Breadcrumbs, each step removable.
- [ ] Saved filters per person; admin sharing and admin default.
- [ ] CSV export of all matching rows, permission-checked.
- [ ] Compact rows by default, comfortable option remembered per browser.
- [ ] Pager in the toolbar; rows per page remembered.
- [ ] URL carries filter, sort, search, page; Back works.
- [ ] Every filter re-validated server-side; values parameterised.
- [ ] AI panel: analyze, chart, propose-filter-with-Apply; every number from a real query.
- [ ] Private columns provably never reach the model.
- [ ] Phone layout is cards, with no sideways page scrolling.
- [ ] Accessibility items in section 10 pass.
