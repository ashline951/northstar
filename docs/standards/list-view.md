# Standard: list views (look, feel, behavior and the AI assistant)

**Status:** LLUH app standard, **v1.1** (2026-11-18). Owner: Ryan Ashline. Reference build: CS Tracker. The full reference code is in **Appendix A** at the end of this file.

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-18 | First version, written in North Star from the CS Tracker build: features, operators, filter builder, AI assistant, data model (described only). |
| 1.1 | 2026-11-18 | Checked line by line against the CS Tracker code and corrected (sizes, ☰ menu order, toolbar order, comparisons, CSV limit, where settings are remembered, AI panel). Adds wireframes, every text string, exact classes, the URL format, grouping/right-click/breadcrumb rules, the AI event protocol, a build order, adapting to other stacks, and the complete reference code (Appendix A). **Also fixes a privacy gap found in the check:** filter and search values typed into private columns are no longer described to the AI (section 14.4). |

---

## 0. Read this first (instructions for coding agents)

You are adding the standard LLUH list view to an app. Staff move between LLUH apps all day; lists must look and work **exactly** the same in each one. Apps built from a description alone came out "close but different", so follow these rules:

1. **Build one shared list view and a registry of lists.** A list declares its columns in the registry; it never gets its own table component. If you find yourself writing a second table, stop.
2. **Build everything in section 1.** Nothing there is optional. Saved views, saved filters and the AI assistant need two database tables and server actions (section 15); create them with the app's normal migration process.
3. **Start from the reference code in Appendix A.** For Next.js App Router + Tailwind v4 + shadcn/ui, copy those files and change only what each file's note says (imports, the lists in the registry, permission names, storage-key prefix, model names). For other stacks, reproduce the same markup, classes and behavior (section 17). Do not redesign, simplify or "improve" it.
4. **The privacy rules in section 14.4 are absolute.** Mark every patient or person identifier `private: true`. Nothing typed into, stored in, or derived from a private column may reach the AI model, by any route.
5. **Follow the build order in section 19**, then **report every item of the checklist in section 21** as pass or fail to the person you're working with, with screenshots (desktop list, ☰ menu, filter builder, column picker, grouped list, AI panel with a chart, phone cards).
6. If something in the app makes a rule impossible, stop and ask; don't quietly leave it out. Record any agreed exception in the app's docs.

**What is standard and what isn't.** Layout, sizes, behavior, operators, wording and the AI contract are the same in every LLUH app. **Brand color is not set here:** each app uses its own palette through its tokens (`--primary` etc.). Never hard-code a brand color in a list view. The **AI sparkle is gold in every LLUH app** (section 6).

**The shape of it.** ServiceNow's list view, which LLUH staff already know, without the parts that waste space, plus an AI assistant. Where a decision could go either way, match ServiceNow.

---

## 1. Required features (all must be built)

| # | Feature | Summary |
|---|---|---|
| 1 | **One shared list view + registry** | Every list is a registry entry (columns, default layout, permission); one component renders them all. |
| 2 | **Slim toolbar** | ☰ list menu, filter funnel, ★ saved filters, ✨ AI, title; pager and page actions on the right. |
| 3 | **Column chooser** | Slush bucket (Available / Selected), order with buttons, saved per person on the server. |
| 4 | **Per-column search** | A box under every header with the operators in section 9; Enter runs it. |
| 5 | **Filter builder** | AND / OR / NOT, nested groups (3 levels, 30 conditions), comparisons per column type. |
| 6 | **Breadcrumbs** | The filter as removable steps, shown only while a filter is on. |
| 7 | **Sort** | Any column; only the sorted column shows an arrow; phones get a "Sort by" control. |
| 8 | **Group by** | One column; collapsible group rows with counts; "Grouped by" chip with Open all / Close all / stop. |
| 9 | **Right-click a value** | Show matching / Filter out / Copy. |
| 10 | **Saved filters (★)** | Per person; admins can share with everyone. |
| 11 | **Your view, saved automatically** | Filter, sort, grouping and rows per page saved per person on every change; columns when saved; admin default for everyone; Reset. |
| 12 | **Pager in the toolbar** | Rows per page 10/20/50/100/500 (default 50). |
| 13 | **Row spacing** | Compact by default; Comfortable for tablets/gloves; remembered per browser. |
| 14 | **CSV export** | Every matching row (up to 10,000), the person's columns, formula-safe. |
| 15 | **Dates** | "10/28/2026, 11:48 AM" with "3 weeks ago" beneath, kept fresh. |
| 16 | **AI assistant (✨)** | Analyze, chart, propose filters (applied only by the person); every number from a real query; private columns never reach the model. |
| 17 | **Phone/tablet layout** | Below 1024 px: cards, a Search panel and a Sort control; never a sideways-scrolling page. |
| 18 | **URL holds the view** | Filter, sort, group, rows, searches and page are in the address, so views can be bookmarked and Back works. |

---

## 2. Where it sits

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ TOP BANNER (the app's own)                                                          │
├──────────────┬──────────────────────────────────────────────────────────────────────┤
│ NAVIGATOR    │ <main class="w-full min-w-0 flex-1 px-4 py-2 sm:px-6">               │
│ (left-       │   TOOLBAR  (one row; wraps if it must)                               │
│ navigator    │   BREADCRUMBS (only while filtered; on the toolbar row on desktop)   │
│ standard)    │   FILTER BUILDER (only while open)                                   │
│              │   TABLE (desktop, ≥1024 px)  /  CARDS (phones and tablets)           │
│              │                                                    AI PANEL ──────▶ │
│              │                                       (fixed, right edge, 448 px)    │
└──────────────┴──────────────────────────────────────────────────────────────────────┘
```

- The list fills the page width (no max width). Wide lists scroll sideways **inside the table**, never the page.
- If a list has no rows at all (not just none matching), the page shows only the title, page actions and the "No … yet" box: no toolbar.

---

## 3. Wireframes (desktop; text sizes are real)

**List, compact rows (default):**

```text
 ☰  ⛛  ☆  ✨  Orders                            Rows [50 ▾]  1–50 of 54 orders  « ‹ [1] 2 › »  [+ Add]
┌────┬──────────────────┬──────────┬──────────┬─────────────┬───────────────┬──────────────────────┐
│ 🔍 │ Patient          │ Unit     │ Bed      │ Status      │ Substatus     │ Ordered ↓            │ header 32 px, 2 px rule
├────┼──────────────────┼──────────┼──────────┼─────────────┼───────────────┼──────────────────────┤
│    │[e.g. Smith     ] │[e.g. EM] │[e.g. 7C ]│[e.g. per  ] │[e.g. awaiting]│[e.g. 10/28         ] │ search row, muted
├────┼──────────────────┼──────────┼──────────┼─────────────┼───────────────┼──────────────────────┤
│    │ SMITH TEST       │ EMER     │ 31       │ Pending     │ Awaiting rent…│ 10/28/2026, 11:48 AM │ 24 px row; 36 px with
│    │                  │          │          │             │               │ 3 weeks ago          │   a date's second line
│░░░░│░DOE TEST░░░░░░░░░│░EMER░░░░░│░01I░░░░░░│░Pending░░░░░│░Awaiting rent░│░10/28/2026, 11:48 AM░│ every other row shaded
└────┴──────────────────┴──────────┴──────────┴─────────────┴───────────────┴──────────────────────┘
  ☰ = List menu   ⛛ = Filter (dot + tint when on)   ☆ = Favorites (★ filled when one is in use)   ✨ = Ask AI (gold)
  The first column is a link (brand color, bold) when the list has detail pages. The leftmost unlabeled column holds the
  search toggle 🔍 (and a × "Clear search" while any search is on).
```

**Filtered (breadcrumbs on the toolbar row), and grouped:**

```text
 ☰  ⛛•  ☆  ✨  Orders   Unit is EMER > Status is Pending ×    [Grouped by Unit (12)  Open all  Close all  ×]   Rows …
┌────┬────────────────────────────────────────────────────────────────────────────────────────────┐
│ ▸  │ Unit: EMER (33)                                                                            │ group row (closed)
│ ▾  │ Unit: MUR4MS (3)                                                                           │ (open)
│    │ … the group's rows, shaded within the group …                                              │
│    │ Showing 20. Show all 33                                                                    │ (only when cut short)
└────┴────────────────────────────────────────────────────────────────────────────────────────────┘
   No pager while grouped. Over 200 groups: "Showing the first 200 groups. Filter the list to see the rest."
```

**☰ List menu** (320 px wide):

```text
┌───────────────────────────────────────┐
│ ▥  Choose columns…                    │
│ ⊞  Group by…                          │
│ ⤓  Export CSV                         │
│ ↺  Reset to default                   │  disabled + "You're using it now" when nothing to reset
│ ⚙  Set as default for everyone…       │  admins only
├───────────────────────────────────────┤
│ Row spacing (this browser)            │  label
│ ✓  Compact rows                       │
│    Comfortable rows (tablets, gloves) │
└───────────────────────────────────────┘
```

**Filter builder** (opens under the toolbar, applies only on Run filter):

```text
┌─ ⛛ Filter ───────────────────────────────────────────────────────────────────── × ┐
│ Show rows that match [all of these (AND) ▾]                                          │
│  [Unit        ▾] [contains     ▾] [EMER                       ]  🗑                  │
│  and                                                                                 │
│  [Status      ▾] [is           ▾] [Pending ▾                  ]  🗑                  │
│  and                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │ In this group, match [any of these (OR) ▾]   ☐ Leave these out (NOT)   Remove group │
│  │  [Bed ▾] [starts with ▾] [3X ]  🗑                                            │   │
│  │  [+ Add condition] [+ Add group]                                              │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│  [+ Add condition] [+ Add group]                                                     │
│  [Run filter]  [Clear filter]      Conditions with an empty value are skipped.       │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Column picker (dialog):**

```text
┌ Columns ──────────────────────────────────────────────────────────────────────────┐
│ Select columns and use the arrows, or double-click to move one across. Selected    │
│ columns show left to right in the order listed. Hold Ctrl (⌘ on a Mac) or Shift to │
│ pick several. Only your view changes.                                              │
│  Available (5)               Selected (8)                                          │
│  [Find a column      ]                                                             │
│ ┌──────────────────┐  [▶]  ┌──────────────────┐  [▲]                              │
│ │ CSN              │  [◀]  │ Patient          │  [▼]                              │
│ │ Requisition      │       │ Unit             │                                   │
│ │ …                │       │ …                │                                   │
│ └──────────────────┘       └──────────────────┘                                   │
│                                              [Save columns]  [Cancel]             │
└────────────────────────────────────────────────────────────────────────────────────┘
```

**Right-click a value:**

```text
┌──────────────────────────────┐
│ Unit: EMER                   │  header (for a multi-value cell, one block per value)
│ ⛛  Show matching             │
│ ⊘  Filter out                │
│ ⧉  Copy                      │  only when the cell isn't empty
└──────────────────────────────┘
```

**★ Favorites menu:**

```text
┌──────────────────────────────────────┐
│ Your favorites                       │
│   EMER pending                       │  (or "None yet. Filter the list, then save it here.")
│ Shared with everyone                 │
│   All open orders                    │
├──────────────────────────────────────┤
│ ☆ Save current filter as a favorite… │  disabled + "Filter the list first" when unfiltered
│ 🗑 Remove a favorite…                 │
└──────────────────────────────────────┘
```

**✨ AI panel** (fixed to the right edge, 448 px; full width on phones; covers the list):

```text
┌ ✨ Ask AI about Orders                     🔈  × ┐
│ Ask about the orders matching your current filter.│
│ I can count, compare, chart, and build filters…   │
│  [Summarize these orders                     ]    │  suggestion buttons
│  [How many orders per unit? Show a chart     ]    │
│  …                                                 │
│ ── after a question ──                             │
│                      ┌───────────────────────┐    │
│                      │ How many per unit?     │    │  person's question, right, muted
│                      └───────────────────────┘    │
│ EMER has the most, with 33 of 54…                  │  answer (markdown)
│ ┌ chart ─────────────────────────── Show table ┐  │
│ │ EMER   ████████████████████ 33               │  │
│ └──────────────────────────────────────────────┘  │
│ ┌ ⛛ Orders in EMER that are pending ────────────┐ │  proposed filter card
│ │ [Apply filter]                                 │ │
│ └────────────────────────────────────────────────┘ │
│ 🔈 Read aloud                                       │
├────────────────────────────────────────────────────┤
│ [Ask about these orders…                ] 🎤 [➤]   │
│ ◉ Talk with AI (voice conversation)      Voice ▾   │
└────────────────────────────────────────────────────┘
```

**Phones and tablets (below 1024 px):**

```text
 ☰ ⛛ ☆ ✨ Orders          [🔍 Search]
 Sort by [Ordered (newest first) ▾]
┌──────────────────────────────┐
│ SMITH TEST                   │  card title = first visible column (link if the list has detail pages)
│ Unit      EMER               │  the rest as label / value; "—" when empty
│ Status    Pending            │
│ Ordered   10/28/2026, 11:48 AM│
└──────────────────────────────┘
```

---

## 4. Anatomy

**Toolbar**, one row (`flex flex-wrap items-center gap-x-2 gap-y-1`), in this order:
1. **☰ List menu** (section 12).
2. **⛛ Filter** (funnel): opens/closes the builder. While a filter is on: a 8 px brand dot at its top right, the icon in brand color with a light fill, and the name "Filter (on)".
3. **☆ Favorites** (saved filters). Brand color and a filled star while a saved filter is in use.
4. **✨ Ask AI** (gold sparkle).
5. **Title** (`h1`) = the list's title.
6. A screen-reader-only live status: "Updating…" / "9 of 54 match" / "54 orders".
7. **Breadcrumbs** (only while filtered; full width on phones, inline on desktop).
8. **"Grouped by" chip** (only while grouped).
9. Pushed to the right (`ml-auto`): the **pager**, then the page's **actions** (e.g. "Add person") at the far right.

**The count never sits next to the title**; it's in the pager ("1–50 of 54 orders").

**Table** (desktop): header row (2 px rule beneath), search row (open by default), body rows. Every row starts with a narrow unlabeled column (48 px) that holds the search toggle in the header and the "Clear search" × in the search row.

**Cards** (phones and tablets): see section 3.

---

## 5. Sizes and spacing

| Element | Compact (default) | Comfortable | Classes |
|---|---|---|---|
| Toolbar title | 24 px, heading font, regular weight | same | `font-heading text-2xl font-normal text-heading` |
| Toolbar icon buttons (☰ ⛛ ☆ ✨) | 32 × 32 px, 20 px icons | same | `size-8`, icon `size-5` |
| Pager arrows, page numbers, Rows select | 32 px tall | same | `size-8` / `h-8 min-w-8 px-1.5` / `h-8 w-auto` |
| Header row | 32 px (28 px sort buttons) + 2 px rule | about 60 px (44 px sort buttons) | `min-h-7` / `min-h-11` |
| Search row | 32 px (28 px boxes, at least 64 px wide) | about 68 px (44 px boxes, at least 96 px wide) | `h-7 min-w-16 px-2` / default `h-11 min-w-24` |
| Body row | **24 px**; 36 px when a date shows its second line; + 1 px rule | about 48 px; 56 px with a date; long text wraps | `py-0.5 pr-2 leading-5 whitespace-nowrap` / `py-3 pr-4` |
| Body text | 16 px | 16 px | `text-base` |
| Dates | 14 px, then 12 px "3 weeks ago" | same | `text-sm leading-4` / `text-xs leading-4 text-muted-foreground` |
| Long text (compact, text columns over 40 characters) | cut at 448 px with "…", full text on hover | wraps | `block max-w-[28rem] truncate` + `title` |
| Group row | 32 px toggle, 20 px chevron | same | `min-h-8`, chevron `size-5` |
| Breadcrumb steps / remove | 36 px tall / 36 × 36 px | same | `min-h-9` / `size-9` |
| Menus (☰ ★) | 320 px wide | same | `w-80` |
| Right-click menu items | 36 px tall, 20 px icons, at least 256 px wide | same | `min-h-9` |
| Filter builder fields, column picker arrows | 44 px (gloves) | same | shadcn defaults |
| Filter builder Run / Clear | 48 px | same | `size="lg"` |
| AI panel | 448 px wide, full height, right edge | same | `fixed inset-y-0 right-0 max-w-md` |

**Compact is the default.** These lists are read on desktops and laptops; wasted vertical space costs rows on screen. Comfortable is for touch screens and gloved hands, chosen in the ☰ menu and remembered per browser. Text stays 16 px in both.

---

## 6. Colors

Use the app's tokens only. Brand roles take each app's palette; the AI gold is the same in every LLUH app.

| Role | Token / class |
|---|---|
| Body text | `--foreground` |
| Secondary text (relative dates, counts, hints, joiners) | `--muted-foreground` |
| Header rule | `border-input` (2 px) |
| Row rules | `--border` (1 px) |
| Shaded rows | `bg-muted/40` on every other row (counted within each group) |
| Search row, group rows | `bg-muted/50`, `bg-muted` |
| Hover row | `hover:bg-accent` |
| First-column links, breadcrumb steps, small actions, current page number, filter dot | `--primary` |
| Destructive (remove) | `--destructive` |
| **Charts** | `--chart-1` … `--chart-5` (the app's brand-derived palette, colorblind-checked; the 5th is a neutral gray for "Other") |
| **AI sparkle** (universal) | `--ai-glow #fff6d6`, `--ai-gold #f2b705`, `--ai-gold-deep #e0a100`, `--ai-outline #b7791f`; inline SVG, 20 px in toolbars, 24 px in panel headers |

Never put the brand color on ordinary cell text or whole-row backgrounds.

---

## 7. Wording (use exactly; `{noun}` = the list's noun, e.g. "orders"/"order")

| Where | Text |
|---|---|
| Toolbar buttons (name and tooltip) | "List menu" · "Filter" / "Filter (on)" · "Favorites" / tooltip "Favorite: {name}", name "Favorites (showing {name})" · "Ask AI" / tooltip "Ask AI about this list" |
| Live status (screen readers) | "Updating…" · "{m} of {t} match" · "{t} {noun}" |
| Group chip | "Grouped by **{column}** ({groups})" · "Open all" · "Close all" · × "Stop grouping" |
| Group row | "{column}: **{value}** ({count})", "(empty)" for blanks · "Showing {n}. Show all {count}" |
| Too many groups | "Showing the first 200 groups. Filter the list to see the rest." |
| Search toggle | "Search columns" / "Hide column search" |
| Search box | name "Search {column}"; placeholder = the column's hint or "Search"; tooltip "Press Enter to search. Text is found anywhere. * = any text (7C* starts with 7C), ? = one character, =EMER exactly, = empty, ! = not (!EMER, !=EMER, != not empty)." |
| Clear searches | "Clear search" |
| Sort header | tooltip "Sort by {column}"; screen readers ", sorted A to Z" / ", sorted Z to A" / ", select to sort" |
| Phones | "Search" / "Hide search" · "Search" / "Searching…" · "Clear search" · help "Press Enter or Search. Rows must match every box you fill in; capitals don't matter." · "Sort by" with "{column} (A to Z)" / "(Z to A)" / "(oldest first)" / "(newest first)" |
| Breadcrumbs | region "Active filter"; separator ">" ("or" when matching any); "not" before excluded groups; remove "Remove “{step}” from the filter" (tooltip "Remove"); dates as "Oct 28, 2026" |
| Empty | "No {noun} yet" / "{Noun} will appear here once they're added." · "No {noun} match" / "Check the spelling, or remove part of the filter or search." / button "Show all {noun}" · loading "Loading {noun}…" |
| ☰ menu | "Choose columns…" · "Group by…" · "Export CSV" · "Reset to default" (sub-line "You're using it now") · "Set as default for everyone…" · "Row spacing (this browser)" · "Compact rows" · "Comfortable rows (tablets, gloves)" |
| ☰ confirmations (screen readers) | "Your columns, sort and filter are back to the default." · "Saved as the default for everyone." |
| Default dialog | "Set as default for everyone?" / "Everyone who opens {title} will start with your current columns, sort, filter and grouping. People who have changed their own view keep theirs until they choose Reset to default." / "Set as default for everyone" · "Cancel" |
| Group dialog | "Group by" / "Rows are shown in groups, one for each value of the column, with how many rows each group has." / field "Column": "No grouping", "{column}" (" (by day)" for dates) / "Group" or "Show without groups" · "Cancel" |
| Column picker | see the wireframe; buttons "Add selected columns" (tooltip "Add"), "Remove selected columns" ("Remove"), "Move selected columns up (left)" ("Move up"), "Move selected columns down (right)" ("Move down"), "Save columns", "Cancel"; find box "Find a column" |
| Filter builder | "Filter" · "Close filter" · "Show rows that match" / "In this group, match" · "all of these (AND)" / "any of these (OR)" · "Leave these out (NOT)" · "Remove group" · joiners "and"/"or" · "Add condition" · "Add group" · fields "Column", "How to compare {column}", "Value for {column} {comparison}", "Choose…" · remove "Remove condition: {column} {comparison}" · "Run filter" / "Filtering…" · "Clear filter" · "Conditions with an empty value are skipped." |
| Comparisons | contains · doesn't contain · is · is not · starts with · ends with · is empty · is not empty · on · before · after · includes · doesn't include |
| ★ menu | "Your favorites" ("None yet. Filter the list, then save it here.") · "Shared with everyone" · "Save current filter as a favorite…" ("Filter the list first") · "Remove a favorite…" |
| Save dialog | "Save as a favorite" / "It will be listed under ★ Favorites so you can use it again with one click." / "Name" (max 60) / "Share with everyone" — "Everyone who uses this list will see it." (admins) / "Save favorite" · "Saving…" |
| Remove dialog | "Remove a favorite" / "Removing takes it off ★ Favorites (for everyone, if it's shared). It doesn't change any data." / "Shared with everyone" / "Remove" → "Yes, remove “{name}”" · "Keep" / "You have no favorites to remove." |
| Right-click | "{column}: {value}" ("(empty)") · "Show matching" · "Filter out" · "Copy" · with no value: "Right-click a value to filter by it." |
| Pager | region "Pages" · "Rows" · "{from}–{to} of {matching} {noun}" · "First page" · "Previous page" · "Page {n}" · "Next page" · "Last page ({pages})" |
| Errors | "You don't have access to this list." · "Only admins can set the default for everyone." · "Give the favorite a name, for example “Emergency orders”." · "Build a filter first. There's nothing to save yet." · "Only admins can share favorites with everyone." · "There's already a filter called “{name}”. Choose another name." (shared: "a shared filter") · "You can only delete your own saved filters." · "Couldn't save the filter. Try again." |
| AI panel | see section 14.7 |

---

## 8. Table behavior

- **Sort:** select a header to sort; select again to reverse. **Only the sorted column shows an arrow** (↑/↓), with `aria-sort`. Dates start newest first; text and choices start A to Z. Text and choices sort ignoring capitals; empty values last; the row id breaks ties. Phones and tablets get a "Sort by" select offering every column.
- **Shaded rows:** every other row (`bg-muted/40`), in both densities, counted within each group. Cards aren't shaded.
- **Long text:** compact rows cut text columns longer than 40 characters at 448 px with "…" and show the full text on hover; comfortable rows wrap.
- **Empty values** show "—".
- **First column** links to the row's detail page when the list has one (brand color, bold; underline on hover).
- **Dates:** formatted on the server in the app's time zone as "10/28/2026, 11:48 AM" (`Intl.DateTimeFormat` en-US, 2-digit month/day, numeric year/hour, 2-digit minute). Beneath, the relative time is worked out in the browser and refreshed every 60 seconds (one shared timer): "just now" (< 1 min), "N min(s) ago", "N hour(s) ago" (< 24 h), "N day(s) ago" (< 14 days), "N week(s) ago" (< 60 days), "N month(s) ago" (< 2 years), then years; "in …" for the future. It renders empty until the browser takes over (no mismatch). A date in a linked first column shows without the relative line.
- **Wide lists** scroll sideways inside the table (`overflow-x-auto`), never the page.

---

## 9. Column search

Plain text means **contains**. That's the default and must stay the default.

| Input | Meaning |
|---|---|
| `text` | contains |
| `*` or `%` | any text; with a wildcard the term matches the **whole** value: `7C*` (starts with), `*-01` (ends with), `7*01` |
| `?` | any single character |
| `=EMER` | exactly |
| `=` | is empty |
| `!EMER` | does not contain |
| `!=EMER` | is not exactly |
| `!=` | is not empty |
| `!7C*` | not matching the pattern |

- Capitals never matter. Values are trimmed, spaces collapsed, at most 100 characters.
- Works on every column type and **matches the words people see**: dates against their displayed text (`10/28` or `10/28*`), choices and multi-value columns against their labels (never database codes). For choices, a label that matches nothing returns no rows (a "not" search adds no condition).
- **"Not" searches keep rows whose value is empty.**
- **Desktop:** boxes under the headers, open by default; the 🔍 toggle hides/shows the row. **Enter** runs the search (a hidden submit button); there is no visible Search button. While any search is on, a × "Clear search" in the first column clears **all** searches. Searches aren't breadcrumbs and aren't saved in the person's view (they're in the URL).
- **Phones/tablets:** a "Search" button opens the same fields stacked, with visible **Search** and **Clear search** buttons and the help text.

---

## 10. Filter builder

- Opens under the toolbar with the funnel. If no filter is on, it starts with one empty condition on the first column. **Changes apply only on Run filter.** Clear filter removes it. × closes without applying.
- "Show rows that match **all of these (AND)** / **any of these (OR)**". Each condition is *column + comparison + value*. **Add group** nests a group (which starts with the opposite match of its parent); any group can be **Leave these out (NOT)**. Limits: **3 levels and 30 conditions** (Add group hidden at the 3rd level; both Add buttons disabled at 30). The server enforces the same limits.
- **Comparisons by column type:**

| Type | Comparisons | Value |
|---|---|---|
| text | contains, doesn't contain, is, is not, starts with, ends with, is empty, is not empty | text, max 200 characters |
| date | on, before, after, is empty, is not empty | date picker; compared by the day in the app's time zone |
| choice | is, is not, is empty, is not empty | one of the column's options |
| multi | includes, doesn't include, is empty, is not empty | one of the column's options |

- Conditions with an empty value are skipped. Switching to another text column keeps the value; switching to another type clears it.
- **Negations keep rows whose value is empty** ("Leave out bed 3x" keeps rows with no bed; "Unit is not EMER" keeps rows with no unit).

---

## 11. Breadcrumbs, grouping and right-click

**Breadcrumbs** (only while a filter is on):
- Each top-level condition or group is one step ("Unit contains EMER", "(A and B)", "not (…)"); separator ">" for AND, "or" for OR.
- Selecting a step keeps the filter up to that step and drops the later ones; the last step is the current one (`aria-current`). Each step has a × to remove just it. There's no "All" step; the funnel's Clear filter (or removing the last step) shows everything.

**Group by** (☰ → Group by…):
- One column (not multi-value columns). Dates group by day in the app's time zone. Group rows show "{column}: **{value}** ({count})" with a chevron; they start open and open/close on select (not remembered; Close all folds every group). The chip offers **Open all**, **Close all** and × (stop grouping).
- No pager while grouped. At most **200 groups** and **1,000 rows** in total; a group cut short shows "Showing {n}. Show all {count}", which filters to that group.
- On phones, cards are grouped under plain headings (no open/close).

**Right-click a value** (desktop table):
- **Show matching** adds "is this value" (text: exact, ignoring capitals; date: "on" that day; multi: "includes", one entry per value; empty: "is empty").
- **Filter out** adds the opposite ("is not", "doesn't include", "is not empty"; for a date, a NOT group around "on that day").
- **Copy** copies the displayed text (only offered for non-empty cells).
- A new step is appended to a plain AND filter; otherwise the old filter and the step are wrapped in a new AND group. It applies at once (and shows in the breadcrumbs).

---

## 12. Your view, defaults, saved filters, spacing and the URL

**The URL holds the view**, so it can be bookmarked or shared and Back works:

| Parameter | Value |
|---|---|
| `filter` | the filter as JSON, or `all` for no filter |
| `sort` | `<column>.<asc|desc>` |
| `group` | `<column>` or `none` |
| `rows` | rows per page |
| `q_<column>` | one per column search |
| `page` | page number (only when above 1) |

Columns are never in the URL (they're part of the person's saved view).

**Opening a list:** each of filter, sort, group and rows comes from the URL if present, otherwise from the person's saved view, otherwise the admin default, otherwise the registry's built-in default (rows: 50). Columns always come from the saved view → admin default → built-in. A filter in the URL that isn't valid falls back to the saved one.

**Saved automatically:** every change to the filter, sort, grouping or rows per page is saved to the person's view on the server (no Save button). Columns are saved with **Save columns**. Searches and the page number are never saved. A person's saved view is a full copy made at their first change, so a later admin default reaches them only after **Reset to default** (which deletes their saved view).

**Set as default for everyone…** (admins, with confirmation) saves the current columns, sort, filter and grouping as the starting point for everyone who hasn't changed their own view (not rows per page).

**Saved filters (★):** "Save current filter as a favorite…" names it (max 60 characters, required; the filter must have at least one condition); admins can tick **Share with everyone**. Names are unique (ignoring capitals) among a person's own filters, and among shared filters. Choosing a saved filter applies it. "Remove a favorite…" lists the ones you may remove (yours; shared ones if you're an admin) and confirms each. Shared filters are listed first, then by name.

**Row spacing:** Compact (default) or Comfortable, in the ☰ menu, remembered **per browser** (`<app>:list-density`, one setting for every list).

---

## 13. CSV export

- ☰ → Export CSV downloads **every row matching** the current filter and searches (not just the page), **up to 10,000 rows**, in the person's columns and sort (grouping ignored).
- UTF-8 with a byte-order mark, CRLF line endings, every cell in double quotes (`"` doubled), header row = column labels, values as displayed (dates formatted, choices as labels, multi-values joined).
- **Formula-safe:** a value starting with `= + - @`, tab or carriage return gets a leading `'`.
- File name `<app>-<list>-<YYYY-MM-DD>.csv` (today in the app's time zone); `Cache-Control: no-store`.
- The export route checks sign-in and the list's permission itself (401/403), and re-validates the filter.

---

## 14. The AI assistant (✨)

### 14.1 The panel
- The gold ✨ button opens a panel fixed to the right edge (448 px; full width on phones) over the list. Closing it clears the conversation. The list's current filter, sort and searches go with every question.
- Empty panel: the intro (naming the list's private columns: "… {Patient, MRN …} are never sent to the AI."), and suggestion buttons fitted to the list: "Summarize these {noun}", "How many {noun} per {first choice or text column}? Show a chart", "Show {noun} over time by week" (lists with a date), "Build a filter for {noun} that…" (a suggestion ending in "…" fills the box instead of asking).
- Answers stream in as markdown, with charts, proposed filters and status lines ("Thinking…", "Counting…", "Looking at rows…", "Building a filter…", "Drawing a chart…", "Working…") in the order they arrive. While answering, the send button becomes **Stop**.

### 14.2 What it can do
- **Analyze:** count, compare, find the largest groups and trends. **Every number comes from a real database query**, never from the model reading rows. If it can't be counted, it isn't answered.
- **Chart:** horizontal bars (groups) or a line (over time), in the chart palette, with hover values, a legend, and **Show table / Show chart**. Up to 4 series and 60 categories.
- **Propose a filter:** "EMER orders not in bed 3x" produces a card describing the filter with **Apply filter**. **Nothing is applied unless the person selects Apply.** Applied, it replaces the filter and behaves like any other (breadcrumbs, saving).

### 14.3 Tools (run by the app's server, never by the model)
| Tool | Does | Limits |
|---|---|---|
| `count_rows` | Counts over the current filter + searches, plus an optional extra filter; optionally grouped by 1–2 columns (dates by day/week/month) | up to 50 groups (+ "truncated"); sorted by date if grouping by a date, else largest first |
| `list_rows` | Example rows, chosen non-private columns | 1–25 rows (default 10), up to 12 columns; also returns the matching count |
| `propose_filter` | Validates a filter and shows it as a card with Apply | refuses private columns; explanation ≤ 300 characters |
| `show_chart` | Validates a chart spec and draws it | ≤ 60 categories, ≤ 4 series, one value per category, non-numbers become 0 |

### 14.4 Privacy (absolute rules)
- **Mark every patient or person identifier column `private: true` in the registry.** (CS Tracker Orders: Patient, MRN, CSN, Requisition, Notes, Date of birth.)
- **Nothing from a private column reaches the model:** not in tool results (`list_rows` omits them), not as a filter or grouping (tools refuse them), **and not in the description of what the person is looking at.** When the person has filtered or searched on a private column, the conditions and search text on it are removed before the view is described; the model is told only that "the filter also has conditions on hidden columns" / "there are also searches on hidden columns", so its counts still make sense (the server still applies them). *(v1.0 described the full filter and searches; fixed in v1.1.)*
- The model sees: the list's public columns (key, label, type, choice labels, comparisons), the names of the hidden columns (so it can explain why it can't use them), today's date, how many rows match out of the total, the public part of the filter and searches, and whatever its tools return.
- The assistant inherits the list's permission: the API route checks sign-in and permission on every request (401/403).
- **Before any real patient data:** a BAA or approved data terms covering the model provider, and a fresh review of which columns are private.

### 14.5 Models and the request
- Typed questions: the app's standard reasoning model (CS Tracker: Claude Opus 5.5, effort medium). Spoken questions (`voice: true`): a faster model at low effort (Claude Sonnet 5.5, effort low) with a "spoken conversation" instruction: one to three short plain sentences, no markdown, and a three-to-six-word lead-in before any tool use.
- The provider's refusal fallback is on (`fallbacks: "default"`), so a declined request retries on the recommended fallback model.
- System prompt (role, rules, columns, filter format) is cached; up to 8 tool steps per question; the last 20 turns of history, each at most 4,000 characters.
- `{ warm: true }` (sent when voice starts) makes a one-token call with the same instructions so the first spoken answer is faster; returns 204.

### 14.6 The event stream
`POST /api/lists/<list>/ai` with `{ messages, filter, sort, search, voice? }` returns newline-separated JSON events:

| Event | Meaning |
|---|---|
| `{type:"text", text}` | the next piece of the answer (markdown) |
| `{type:"status", text}` | what it's doing ("Counting…") |
| `{type:"chart", chart}` | a validated chart to draw |
| `{type:"filter", filter, description, explanation}` | a proposed filter (shown with Apply) |
| `{type:"link", href, label, description}` | a button to open a filtered list (whole-app assistant) |
| `{type:"error", message}` | a plain-words error |
| `{type:"done"}` | the end |

### 14.7 Wording in the panel
Heading "Ask AI about {title}" · "Read answers aloud" · "Close" · input "Your question", placeholder "Ask about these {noun}…" · "Ask" · "Speak your question" / "Stop listening" · "Stop answering" (tooltip "Stop") · "Apply filter" · "Read aloud" / "Stop reading" · "Reading the answer aloud…" + "Stop" · "Talk with AI (voice conversation)" / "End voice conversation".
Errors: "The AI assistant isn't set up yet. An admin needs to add the Anthropic API key in Vercel." · "The AI service is busy. Wait a moment and try again." · "The AI key in Vercel isn't working. An admin needs to check ANTHROPIC_API_KEY." · "Something went wrong with the AI assistant. Try again." · "The assistant couldn't help with that request." · "The answer was too long. Try a narrower question." · "(Stopped: that took too many steps. Try a simpler question.)" · "The AI assistant isn't available right now."

### 14.8 Voice (optional; specified so apps match)
- **Microphone:** speak one question; a spoken question always gets a spoken answer. **Talk with AI:** a hands-free conversation.
- **Prefer an enterprise speech service in the organization's own tenant** (Azure AI Speech, keys only on the server, a 10-minute browser token renewed every 8 minutes). Without the key, fall back to the browser's built-in speech (which sends audio to the browser vendor).
- **Azure path:** a phrase ends after **0.6 s** of quiet; the microphone stays on while the assistant thinks and talks, and **two or more words interrupt it** (stop the voice, cancel the answer, ask the new question); microphone input matching what was just said (during and 1.5 s after) is ignored as echo; each sentence is spoken as soon as it's written, the first one already at its first comma once it has four words; if the model goes straight to a lookup, the panel says a short filler ("One moment." / "Let me check." / "Checking now."). Neural voice streamed from Azure straight to the browser.
- **Browser path:** a phrase ends after 1.5 s; no interruption; a voice picker (natural voices first).
- Talk ends after 30 s with nothing said. Listening shows a pulsing dot and live level bars.

### 14.9 Degrading well
With no API key the panel still opens and answers with "The AI assistant isn't set up yet…". An assistant failure never breaks the list.

---

## 15. Data model and server actions

```sql
create table list_layouts (
  id serial primary key,
  list_id text not null,
  user_id integer references users(id) on delete cascade,   -- null = the default for everyone
  columns jsonb not null,          -- column keys, in order
  sort jsonb not null,             -- {"column":"ordered","dir":"desc"}
  filter jsonb not null,           -- the filter group
  group_by text,                   -- column key or null
  page_size integer,               -- rows per page or null
  updated_at timestamptz not null default now(),
  updated_by integer references users(id) on delete set null,
  constraint list_layouts_list_user unique nulls not distinct (list_id, user_id)
);

create table saved_filters (
  id serial primary key,
  list_id text not null,
  name text not null,              -- max 60, unique (ignoring capitals) per owner, and among shared
  filter jsonb not null,
  owner_id integer references users(id) on delete cascade,
  shared boolean not null default false,
  created_at timestamptz not null default now()
);
```

Every action first checks sign-in and the list's permission ("You don't have access to this list.") and re-validates what it's given against the registry. Results are `{ ok: true } | { ok: false, error }`.

| Action | Does | Rules |
|---|---|---|
| `saveMyView(list, {filter, sort, groupBy?, pageSize?})` | Saves the person's view (called on every change) | First change copies the effective layout, then applies the change |
| `saveMyColumns(list, columns)` | Saves the person's columns | Unknown keys dropped; none left = the default columns |
| `resetMyLayout(list)` | Deletes the person's saved view | — |
| `setDefaultLayout(list, {columns, sort, filter, groupBy})` | Saves the default for everyone | Admin permission (`lists.setDefaults`) |
| `saveFilter(list, {name, filter, shared})` | Saves a named filter | Name required (≤ 60); filter not empty; sharing needs the admin permission; no duplicate names |
| `deleteFilter(list, id)` | Removes one | Owner, or the admin permission for a shared one |

---

## 16. The registry: adding a list

```ts
type ColumnType = "text" | "date" | "choice" | "multi";
type ColumnMeta = {
  key: string;                                // id in the URL (q_<key>), layouts and filters
  label: string;                              // header, filter, breadcrumb text
  type: ColumnType;                           // picks comparisons, matching and display
  options?: { value: string; label: string }[]; // choice/multi: stored code and the words people see
  searchHint?: string;                        // search box placeholder, e.g. "e.g. EMER"
  private?: boolean;                          // patient/person identifier: never reaches the AI
};
type ListMeta = { id: string; title: string; noun: { one: string; many: string }; columns: ColumnMeta[]; defaultLayout: Layout };
type Layout = { columns: string[]; sort: { column: string; dir: "asc" | "desc" }; filter: Group; groupBy?: string | null; pageSize?: number };
type ListSource = {                           // server side
  meta: ListMeta;
  path: string;                               // the list's page, e.g. "/lists/orders"
  permission?: Permission;                    // required for the page, actions, export and AI
  table: PgTable; id: AnyPgColumn;            // FROM table and row id (tie-break sort, row key)
  columns: Record<string, SQL | AnyPgColumn>; // per key: text/choice as the WORDS people see, a timestamp for dates, text[] for multi
  rowHref?: (id: number) => string;           // makes the first column a link
};
```

- **Text and choice columns must be SQL expressions that already produce the words people see** (e.g. `awaiting_rental` → "Awaiting rental"), so searches, sorting and export match what's on screen.
- A list's page is one component and no table code:

```tsx
<main className="w-full min-w-0 flex-1 px-4 py-2 sm:px-6">
  <Suspense fallback={<ListLoading noun="orders" />}>
    <ListPage listId="orders" searchParams={searchParams} actions={/* optional buttons */} />
  </Suspense>
</main>
```

---

## 17. Adapting to other stacks

- **Next.js App Router + Tailwind v4 + shadcn/ui:** copy Appendix A; adapt imports, the registry, permission names (`can(user, …)`), the time zone constant, the storage-key prefix and the model names.
- **Other React setups:** keep the components; replace `next/navigation` with the router's equivalents, server actions with API endpoints that check the session, and Drizzle with the app's database layer (keep every value parameterized).
- **No Drizzle / Postgres:** keep the same tables and rules; `unique nulls not distinct` can be a unique index on `(list_id, coalesce(user_id, 0))`.
- **No Tailwind:** reproduce the sizes in section 5 and the colors in section 6 as CSS.
- **Another AI provider:** keep the tool contract (14.3), the privacy rules (14.4) and the event stream (14.6).

---

## 18. Accessibility (must)

- The table has a caption (screen readers) with the list's title; sortable headers use `aria-sort` and say how to sort.
- Every search box, select and filter field has a name; breadcrumbs are a labelled navigation ("Active filter"); remove buttons say what they remove.
- Result changes are announced (`aria-live`): "Updating…", "9 of 54 match".
- Every icon button has an accessible name and a tooltip.
- A designed empty state with a way back to everything.
- Wide-reaching or destructive actions confirm: setting the default for everyone, removing a saved filter.
- Column order changes with buttons (and double-click), not drag and drop: easier with keyboards and gloves.
- Errors in plain words. Nothing relies on color alone (the filter "on" state also changes the name; the current page number is bold).

---

## 19. Build order (for agents)

1. Tables (migration) and the shared types/validation (`types.ts`): filters, sort, search parsing, URL format.
2. The registry with the app's lists; mark private columns.
3. Server: query (filter, search, sort, page, group), effective layout, saved filters; actions with permission checks.
4. The page wrapper and the list view: toolbar, table, search row, cards, pager, density.
5. Filter builder, breadcrumbs, column picker, ☰ menu, group by, right-click menu, ★ saved filters.
6. CSV export route.
7. The AI assistant: route, tools, system prompt (private rules), panel, charts. Then voice if wanted.
8. Check section 21 at 1440 px and 390 px wide, keyboard only, and report.

---

## 20. Don'ts

- Don't build a one-off table for a list. Declare its columns in the registry.
- Don't put the row count next to the title; it belongs in the pager.
- Don't trust anything that arrived from the browser: re-validate every filter, sort, column and search on the server, and pass values to the database as parameters.
- Don't apply an AI-proposed filter without the person selecting Apply.
- Don't let anything from a private column reach the model: not a value, not a filter condition, not a search.
- Don't let the model produce numbers it didn't get from a query.
- Don't drop below 16 px body text to fit more in; use Compact rows.
- Don't add a Search button on desktop; Enter runs searches.

---

## 21. Conformance checklist (report each as pass/fail)

- [ ] One shared list view; a new list is a registry entry plus a one-component page.
- [ ] Toolbar order ☰ ⛛ ☆ ✨ title … pager, actions; icon buttons 32 px; title 24 px; no count beside the title.
- [ ] ☰ menu items and order as in section 3; Set as default (admins, confirmed); Reset.
- [ ] Compact rows 24 px (36 px with dates) by default; Comfortable option remembered per browser; 16 px text; shaded rows.
- [ ] Column search with the full operator set, matching displayed words; Enter runs it; Clear search; "not" keeps empty.
- [ ] Filter builder: AND/OR/NOT, nested to 3 levels, 30 conditions, comparisons per type; applies on Run filter; enforced on the server.
- [ ] Breadcrumbs with select-to-cut and per-step remove.
- [ ] Sort with one arrow; phones get Sort by.
- [ ] Group by with group rows, counts, Open all / Close all / stop, 200-group cap, "Show all".
- [ ] Right-click Show matching / Filter out / Copy with the rules in section 11.
- [ ] Saved filters per person; admin sharing; unique names; confirm on remove.
- [ ] View saved automatically per person; columns saved per person; admin default; precedence as in section 12.
- [ ] URL carries filter, sort, group, rows, searches, page; Back works.
- [ ] Pager in the toolbar; 10/20/50/100/500, default 50; hidden while grouped.
- [ ] CSV: all matching rows up to 10,000, formula-safe, permission-checked.
- [ ] Dates with the relative line, refreshed every minute.
- [ ] AI: analyze, chart, propose filter with Apply; every number from a query; event stream as in 14.6.
- [ ] **Private columns never reach the model: tools, results, and the described filter and searches** (test: search a private column, then ask a question, and confirm the value isn't in the request to the model).
- [ ] Phones/tablets: cards, Search panel, Sort by; no sideways page scrolling.
- [ ] All wording matches section 7 and 14.7.
- [ ] Accessibility items in section 18 pass.

---

<!-- reference-code:start (generated by scripts/standards.mjs; don't edit by hand) -->

## Appendix A. Reference code (CS Tracker)

The list view as built in CS Tracker: Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui tokens and components, `lucide-react` icons, `radix-ui`, Drizzle ORM on Postgres, `react-markdown` + `remark-gfm` (AI answers), `@anthropic-ai/sdk` (the assistant) and `microsoft-cognitiveservices-speech-sdk` (optional Azure voice). **Copy it and adapt only what the notes say.** For other stacks, reproduce the same markup, classes and behavior (section 17).

App helpers it uses: `cn()` (clsx + tailwind-merge, from shadcn), `getDb()` / `schema` (Drizzle), `requireUser()` / `findCurrentUser()` (the signed-in user), `can(user, permission)`.

### Design tokens it uses (in the global CSS)

```css
  --chart-1: #a30234;
  --chart-2: #337bb5;
  --chart-3: #c65319;
  --chart-4: #15875e;
  --chart-5: #7a7a7a;
  --ai-glow: #fff6d6;
  --ai-gold: #f2b705;
  --ai-gold-deep: #e0a100;
  --ai-outline: #b7791f;
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
```

### Tables (Drizzle schema)

```ts
/**
 * List view layouts (docs/features/list-views.md): the columns, sort and filter
 * a person last used on a list. A row with no user_id is the default for
 * everyone, set by an admin. Values are checked against the list's columns
 * every time they're read (src/lib/list-view/types.ts), so a removed column
 * can't break a saved layout.
 */
export const listLayouts = pgTable(
  "list_layouts",
  {
    id: serial("id").primaryKey(),
    /** e.g. "orders", "people". */
    listId: text("list_id").notNull(),
    /** The person this layout belongs to; null = the default for everyone. */
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    columns: jsonb("columns").notNull(),
    sort: jsonb("sort").notNull(),
    filter: jsonb("filter").notNull(),
    /** Column key the list is grouped by, or null for no grouping. */
    groupBy: text("group_by"),
    /** Rows per page (10, 20, 50, 100 or 500); null = the default, 50. */
    pageSize: integer("page_size"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: integer("updated_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [unique("list_layouts_list_user").on(t.listId, t.userId).nullsNotDistinct()],
);

/** Named filters people save on a list. Shared ones (admins only) show for everyone. */
export const savedFilters = pgTable("saved_filters", {
  id: serial("id").primaryKey(),
  listId: text("list_id").notNull(),
  name: text("name").notNull(),
  filter: jsonb("filter").notNull(),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "cascade" }),
  shared: boolean("shared").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### Registry: every list and its columns: `src/lib/lists/registry.ts`

Replace the lists with the app's own. **Mark every patient or person identifier `private: true`.** Keep the shape.

```ts
import "server-only";
import { sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { schema } from "@/db";
import type { ListSource } from "@/lib/list-view/server";
import { ROLES } from "@/lib/roles";

/**
 * Every list that uses the shared list view. To add one: give it columns here
 * (label, type and database expression), a default layout, and a page that
 * renders <ListPage>. Record it in docs/features/list-views.md.
 */

/** "awaiting_rental" → "Awaiting rental", in the database, so filters and searches match what's shown. */
function words(column: AnyPgColumn): SQL {
  return sql`upper(left(${column}, 1)) || replace(substr(${column}, 2), '_', ' ')`;
}

const o = schema.orders;
const orders: ListSource = {
  path: "/lists/orders",
  table: o,
  id: o.id,
  rowHref: (id) => `/lists/orders/${id}`,
  meta: {
    id: "orders",
    title: "Orders",
    noun: { one: "order", many: "orders" },
    columns: [
      { key: "patientName", label: "Patient", type: "text", searchHint: "e.g. Smith", private: true },
      { key: "mrn", label: "MRN", type: "text", private: true },
      { key: "csn", label: "CSN", type: "text", private: true },
      { key: "unit", label: "Unit", type: "text", searchHint: "e.g. EMER" },
      { key: "room", label: "Room", type: "text" },
      { key: "bed", label: "Bed", type: "text", searchHint: "e.g. 7C 724" },
      { key: "location", label: "Location", type: "text" },
      { key: "status", label: "Status", type: "text", searchHint: "e.g. pending" },
      { key: "substatus", label: "Substatus", type: "text", searchHint: "e.g. awaiting rental" },
      { key: "assignedTo", label: "Assigned to", type: "text" },
      { key: "requisition", label: "Requisition", type: "text", private: true },
      { key: "notes", label: "Notes", type: "text", private: true },
      { key: "sex", label: "Sex", type: "text" },
      { key: "dob", label: "Date of birth", type: "text", private: true },
      { key: "ordered", label: "Ordered", type: "date", searchHint: "e.g. 10/28" },
      { key: "admitted", label: "Admitted", type: "date" },
      { key: "discharged", label: "Discharged", type: "date" },
      { key: "completed", label: "Completed", type: "date" },
      { key: "updated", label: "Updated", type: "date" },
      { key: "updatedBy", label: "Updated by", type: "text" },
    ],
    defaultLayout: {
      columns: ["patientName", "mrn", "csn", "unit", "bed", "status", "substatus", "ordered"],
      sort: { column: "ordered", dir: "desc" },
      filter: { kind: "group", match: "all", items: [] },
    },
  },
  columns: {
    patientName: o.patientName,
    mrn: o.mrn,
    csn: o.csn,
    unit: o.unit,
    room: o.room,
    bed: o.bed,
    location: o.location,
    status: words(o.orderStatus),
    substatus: words(o.substatus),
    assignedTo: o.assignedTo,
    requisition: o.requisition,
    notes: o.notes,
    sex: o.sex,
    dob: o.dob,
    ordered: o.sourceCreatedAt,
    admitted: o.admittedAt,
    discharged: o.dischargedAt,
    completed: o.completedAt,
    updated: o.sourceUpdatedAt,
    updatedBy: o.sourceUpdatedBy,
  },
};

const u = schema.users;
const people: ListSource = {
  path: "/admin/people",
  permission: "people.manage",
  table: u,
  id: u.id,
  rowHref: (id) => `/admin/people/${id}`,
  meta: {
    id: "people",
    title: "People and roles",
    noun: { one: "person", many: "people" },
    columns: [
      { key: "name", label: "Name", type: "text", searchHint: "e.g. Jane" },
      { key: "email", label: "Email", type: "text", searchHint: "e.g. jdoe" },
      { key: "jobTitle", label: "Title", type: "text" },
      { key: "department", label: "Department", type: "text" },
      {
        key: "roles",
        label: "Roles",
        type: "multi",
        options: Object.entries(ROLES).map(([value, role]) => ({ value, label: role.label })),
        searchHint: "e.g. admin",
      },
      {
        key: "access",
        label: "Access",
        type: "choice",
        options: [
          { value: "on", label: "On" },
          { value: "off", label: "Off" },
        ],
        searchHint: "on or off",
      },
      { key: "lastSignIn", label: "Last sign-in", type: "date" },
      { key: "added", label: "Added", type: "date" },
    ],
    defaultLayout: {
      columns: ["name", "email", "jobTitle", "roles", "access", "lastSignIn"],
      sort: { column: "name", dir: "asc" },
      filter: { kind: "group", match: "all", items: [] },
    },
  },
  columns: {
    name: u.displayName,
    email: u.email,
    jobTitle: u.jobTitle,
    department: u.department,
    roles: u.roles,
    access: sql`case when ${u.active} then 'on' else 'off' end`,
    lastSignIn: u.lastSignInAt,
    added: u.createdAt,
  },
};

export const LISTS: Record<string, ListSource> = { orders, people };

export function listSource(id: string): ListSource | undefined {
  return Object.hasOwn(LISTS, id) ? LISTS[id] : undefined;
}
```

### Shared types, URL format and filter validation: `src/lib/list-view/types.ts`

Copy as is. Used on both server and browser.

```ts
/**
 * The shared list view (docs/features/list-views.md): what a list's columns are,
 * how filters are built, and how a person's layout is described. Used by both
 * the server (queries) and the browser (filter builder), so nothing here touches
 * the database.
 */

/** text: free text. date: a date-time, shown in Pacific time. choice: one of a few values. multi: a list of values (e.g. roles). */
export type ColumnType = "text" | "date" | "choice" | "multi";

export type ColumnMeta = {
  key: string;
  label: string;
  type: ColumnType;
  /** For choice and multi columns: the values and what people see. */
  options?: { value: string; label: string }[];
  /** Example shown in the column's search box. */
  searchHint?: string;
  /**
   * Patient identifiers and free text that may hold them. Never sent to the AI
   * assistant, and it can't group, filter or show them (docs/features/ai-assistant.md).
   */
  private?: boolean;
};

export type Operator =
  | "contains"
  | "notContains"
  | "is"
  | "isNot"
  | "startsWith"
  | "endsWith"
  | "on"
  | "before"
  | "after"
  | "includes"
  | "notIncludes"
  | "empty"
  | "notEmpty";

export const OPERATORS: Record<ColumnType, { op: Operator; label: string }[]> = {
  text: [
    { op: "contains", label: "contains" },
    { op: "notContains", label: "doesn't contain" },
    { op: "is", label: "is" },
    { op: "isNot", label: "is not" },
    { op: "startsWith", label: "starts with" },
    { op: "endsWith", label: "ends with" },
    { op: "empty", label: "is empty" },
    { op: "notEmpty", label: "is not empty" },
  ],
  date: [
    { op: "on", label: "on" },
    { op: "before", label: "before" },
    { op: "after", label: "after" },
    { op: "empty", label: "is empty" },
    { op: "notEmpty", label: "is not empty" },
  ],
  choice: [
    { op: "is", label: "is" },
    { op: "isNot", label: "is not" },
    { op: "empty", label: "is empty" },
    { op: "notEmpty", label: "is not empty" },
  ],
  multi: [
    { op: "includes", label: "includes" },
    { op: "notIncludes", label: "doesn't include" },
    { op: "empty", label: "is empty" },
    { op: "notEmpty", label: "is not empty" },
  ],
};

export function needsValue(op: Operator) {
  return op !== "empty" && op !== "notEmpty";
}

export type Condition = { kind: "condition"; column: string; op: Operator; value?: string };
/** match "all" = AND, "any" = OR. exclude = NOT (rows matching the group are left out). */
export type Group = { kind: "group"; match: "all" | "any"; exclude?: boolean; items: (Condition | Group)[] };
export type Sort = { column: string; dir: "asc" | "desc" };
/** groupBy: a column key to group rows by (ServiceNow "Group by"), or null. */
export type Layout = { columns: string[]; sort: Sort; filter: Group; groupBy?: string | null; pageSize?: number };

export type ListMeta = {
  id: string;
  title: string;
  noun: { one: string; many: string };
  columns: ColumnMeta[];
  defaultLayout: Layout;
};

export type SavedFilter = { id: number; name: string; shared: boolean; mine: boolean; filter: Group };
export type ListRow = {
  id: number;
  href?: string;
  /** What each column shows, as text. */
  cells: Record<string, string>;
  /** Date columns as ISO times, for "31 mins ago". */
  dates?: Record<string, string>;
  /** In a grouped list: the group this row belongs to (null = empty). */
  group?: string | null;
};

/** Rows per page: 50 unless the person picks another size (Ryan, 2026-11-18). */
export const PAGE_SIZE = 50;
export const PAGE_SIZES = [10, 20, 50, 100, 500] as const;

export function cleanPageSize(input: unknown): number {
  const n = Number(input);
  return (PAGE_SIZES as readonly number[]).includes(n) ? n : PAGE_SIZE;
}
export const MAX_DEPTH = 3;
export const MAX_CONDITIONS = 30;
const MAX_VALUE = 200;

export const EMPTY_FILTER: Group = { kind: "group", match: "all", items: [] };

export function columnOf(meta: ListMeta, key: string) {
  return meta.columns.find((c) => c.key === key);
}

/**
 * Checks a filter that came from a URL, the browser or the database, and keeps
 * only what's valid for this list: known columns, operators that fit the column,
 * sensible values, at most 3 levels and 30 conditions. Never trust a filter
 * without passing it through here.
 */
export function cleanFilter(meta: ListMeta, input: unknown): Group {
  let count = 0;
  function group(value: unknown, depth: number): Group | null {
    if (!value || typeof value !== "object" || (value as Group).kind !== "group") return null;
    const g = value as Group;
    const items: (Condition | Group)[] = [];
    for (const item of Array.isArray(g.items) ? g.items : []) {
      if (count >= MAX_CONDITIONS) break;
      if (item && (item as Group).kind === "group") {
        if (depth >= MAX_DEPTH) continue;
        const child = group(item, depth + 1);
        if (child && child.items.length) items.push(child);
      } else {
        const c = condition(item);
        if (c) {
          items.push(c);
          count++;
        }
      }
    }
    return { kind: "group", match: g.match === "any" ? "any" : "all", ...(g.exclude ? { exclude: true } : {}), items };
  }
  function condition(value: unknown): Condition | null {
    if (!value || typeof value !== "object") return null;
    const c = value as Condition;
    if (c.kind !== "condition" || typeof c.column !== "string") return null;
    const column = columnOf(meta, c.column);
    if (!column || !OPERATORS[column.type].some((o) => o.op === c.op)) return null;
    if (!needsValue(c.op)) return { kind: "condition", column: c.column, op: c.op };
    const raw = typeof c.value === "string" ? c.value.trim().slice(0, MAX_VALUE) : "";
    if (!raw) return null;
    if (column.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    if ((column.type === "choice" || column.type === "multi") && !column.options?.some((o) => o.value === raw)) {
      return null;
    }
    return { kind: "condition", column: c.column, op: c.op, value: raw };
  }
  return group(input, 1) ?? EMPTY_FILTER;
}

export function cleanSort(meta: ListMeta, input: unknown): Sort {
  const s = input as Sort | null;
  if (s && typeof s === "object" && columnOf(meta, s.column)) {
    return { column: s.column, dir: s.dir === "desc" ? "desc" : "asc" };
  }
  return meta.defaultLayout.sort;
}

export function cleanColumns(meta: ListMeta, input: unknown): string[] {
  const keys = Array.isArray(input) ? input.filter((k): k is string => typeof k === "string") : [];
  const known = [...new Set(keys)].filter((k) => columnOf(meta, k));
  return known.length ? known : meta.defaultLayout.columns;
}

/** "sort=ordered.desc" in the page address. */
/** Adds a step to a filter: appended when the filter is a plain "all of these", otherwise combined with AND. */
export function addFilterStep(filter: Group, step: Condition | Group): Group {
  if (filter.match === "all" && !filter.exclude) return { ...filter, items: [...filter.items, step] };
  return { kind: "group", match: "all", items: [filter, step] };
}

/** Columns a list can be grouped by. Lists (e.g. Roles) can't: a row would belong to several groups. */
export function canGroupBy(column: ColumnMeta | undefined) {
  return !!column && column.type !== "multi";
}

export function cleanGroupBy(meta: ListMeta, input: unknown): string | null {
  return typeof input === "string" && canGroupBy(columnOf(meta, input)) ? input : null;
}

/** A group in a grouped list: the value (null = empty), what people see, and how many rows it has. */
export type ListGroup = { value: string | null; label: string; count: number };

/** The filter step that keeps only one group's rows (for "Show all" on a group). */
export function groupCondition(meta: ListMeta, groupBy: string, value: string | null): Condition | null {
  const column = columnOf(meta, groupBy);
  if (!column) return null;
  if (value === null) return { kind: "condition", column: groupBy, op: "empty" };
  if (column.type === "date") return { kind: "condition", column: groupBy, op: "on", value };
  return { kind: "condition", column: groupBy, op: "is", value };
}

export function parseSort(meta: ListMeta, value: string | undefined): Sort | null {
  if (!value) return null;
  const [column, dir] = value.split(".");
  return columnOf(meta, column) ? { column, dir: dir === "desc" ? "desc" : "asc" } : null;
}

export function sortParam(sort: Sort) {
  return `${sort.column}.${sort.dir}`;
}

/**
 * What a column search box means (ServiceNow-style, Ryan 2026-11-18). Plain text
 * means "contains" (the default). * or % = any text, ? = any one character
 * (then the text is matched as a whole: "7C*" starts with 7C, "*01" ends with 01).
 * "=EMER" = exactly; "=" alone = empty. A leading "!" means NOT: "!EMER" doesn't
 * contain, "!=EMER" is not exactly, "!=" is not empty. Capitals never matter.
 */
export type SearchTerm = { not: boolean; kind: "contains" | "pattern" | "exact" | "empty"; text: string };

export function parseSearch(raw: string): SearchTerm | null {
  let text = raw.trim();
  let not = false;
  if (text.startsWith("!")) {
    not = true;
    text = text.slice(1).trim();
  }
  if (text.startsWith("=")) {
    text = text.slice(1).trim();
    return text ? { not, kind: "exact", text } : { not, kind: "empty", text: "" };
  }
  if (!text) return null;
  return { not, kind: /[*%?]/.test(text) ? "pattern" : "contains", text };
}

/** The search as a SQL LIKE pattern (for contains and wildcard searches). */
export function searchLike(term: SearchTerm) {
  if (term.kind === "contains") return `%${term.text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  return term.text.replace(/[\\_*%?]/g, (c) => (c === "*" || c === "%" ? "%" : c === "?" ? "_" : `\\${c}`));
}

/** Whether a shown value (e.g. a choice label) matches the search, ignoring capitals. */
export function searchMatches(term: SearchTerm, value: string) {
  const v = value.toLowerCase();
  const t = term.text.toLowerCase();
  let hit: boolean;
  if (term.kind === "empty") hit = v === "";
  else if (term.kind === "exact") hit = v === t;
  else if (term.kind === "contains") hit = v.includes(t);
  else {
    const re = t
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/[*%]/g, ".*")
      .replace(/\?/g, ".");
    hit = new RegExp(`^${re}$`).test(v);
  }
  return term.not ? !hit : hit;
}

/** Column search boxes live in the address as q_<column>=text. */
export function readSearch(meta: ListMeta, params: Record<string, string | string[] | undefined>) {
  const search: Record<string, string> = {};
  for (const column of meta.columns) {
    const raw = params[`q_${column.key}`];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim().replace(/\s+/g, " ").slice(0, 100);
    if (value) search[column.key] = value;
  }
  return search;
}

/** The list's page address for a given filter, sort, search and page. */
export function listHref(
  path: string,
  state: {
    filter: Group;
    sort: Sort;
    search?: Record<string, string>;
    page?: number;
    groupBy?: string | null;
    pageSize?: number;
  },
) {
  const params = new URLSearchParams();
  params.set("filter", state.filter.items.length ? JSON.stringify(state.filter) : "all");
  params.set("sort", sortParam(state.sort));
  if (state.groupBy !== undefined) params.set("group", state.groupBy ?? "none");
  if (state.pageSize !== undefined) params.set("rows", String(state.pageSize));
  for (const [key, value] of Object.entries(state.search ?? {})) if (value) params.set(`q_${key}`, value);
  if (state.page && state.page > 1) params.set("page", String(state.page));
  return `${path}?${params}`;
}

/** Plain-language text for breadcrumbs, e.g. "Unit contains EMER". */
export function describe(meta: ListMeta, item: Condition | Group): string {
  if (item.kind === "group") {
    const inner = item.items.map((i) => describe(meta, i)).join(item.match === "any" ? " or " : " and ");
    const text = item.items.length > 1 ? `(${inner})` : inner;
    return item.exclude ? `not ${text}` : text;
  }
  const column = columnOf(meta, item.column);
  const op = column ? OPERATORS[column.type].find((o) => o.op === item.op)?.label : item.op;
  if (!needsValue(item.op)) return `${column?.label ?? item.column} ${op}`;
  let value = item.value ?? "";
  if (column?.options) value = column.options.find((o) => o.value === value)?.label ?? value;
  if (column?.type === "date") value = formatDay(value);
  return `${column?.label ?? item.column} ${op} ${value}`;
}

export function formatDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
```

### Server: queries, layouts, saved filters: `src/lib/list-view/server.ts`

Copy; adapt the time zone constant and database access.

```ts
import "server-only";
import { and, asc, count, desc, eq, isNull, not, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { getDb, schema } from "@/db";
import type { Permission } from "@/lib/roles";
import {
  EMPTY_FILTER,
  PAGE_SIZE,
  cleanColumns,
  cleanFilter,
  cleanGroupBy,
  cleanPageSize,
  formatDay,
  parseSearch,
  searchLike,
  searchMatches,
  cleanSort,
  columnOf,
  type ColumnMeta,
  type Condition,
  type Group,
  type Layout,
  type ListGroup,
  type ListMeta,
  type ListRow,
  type SavedFilter,
  type Sort,
} from "./types";

/**
 * A list on the server: its columns as database expressions. Text and choice
 * columns are text expressions (already in the words people see, so filters and
 * searches match what's on screen), dates are timestamps, multi columns are
 * text arrays.
 */
export type ListSource = {
  meta: ListMeta;
  /** The page the list lives on. */
  path: string;
  /** Needed to see the list at all; omit if every signed-in person may. */
  permission?: Permission;
  table: PgTable;
  id: AnyPgColumn;
  columns: Record<string, SQL | AnyPgColumn>;
  /** Where selecting a row goes, if anywhere. */
  rowHref?: (id: number) => string;
};

/** Grouped lists show at most this many groups, and this many rows in all. */
const MAX_GROUPS = 200;
const GROUPED_ROWS = 1000;
/** Most rows one CSV export holds. */
const EXPORT_LIMIT = 10_000;
const TZ = "America/Los_Angeles";
/** How dates look in lists, e.g. "10/28/2026, 11:48 AM" (Pacific time). Search boxes match this text. */
const PG_DATE_FORMAT = "MM/DD/YYYY, FMHH12:MI AM";
const dateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** % and _ typed by people are matched literally. */
function like(text: string) {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function conditionSql(source: ListSource, c: Condition): SQL | undefined {
  const column = columnOf(source.meta, c.column);
  const expr = source.columns[c.column];
  if (!column || !expr) return undefined;
  const v = c.value ?? "";
  switch (column.type) {
    case "text":
      switch (c.op) {
        case "contains":
          return sql`${expr} ilike ${`%${like(v)}%`}`;
        case "notContains":
          return sql`(${expr} is null or ${expr} not ilike ${`%${like(v)}%`})`;
        case "is":
          return sql`lower(${expr}) = lower(${v})`;
        case "isNot":
          return sql`(${expr} is null or lower(${expr}) <> lower(${v}))`;
        case "startsWith":
          return sql`${expr} ilike ${`${like(v)}%`}`;
        case "endsWith":
          return sql`${expr} ilike ${`%${like(v)}`}`;
        case "empty":
          return sql`coalesce(${expr}, '') = ''`;
        case "notEmpty":
          return sql`coalesce(${expr}, '') <> ''`;
      }
      break;
    case "choice":
      switch (c.op) {
        case "is":
          return sql`${expr} = ${v}`;
        case "isNot":
          return sql`${expr} is distinct from ${v}`;
        case "empty":
          return sql`${expr} is null`;
        case "notEmpty":
          return sql`${expr} is not null`;
      }
      break;
    case "multi":
      switch (c.op) {
        case "includes":
          return sql`${v} = any(${expr})`;
        case "notIncludes":
          return sql`not (${v} = any(coalesce(${expr}, '{}'::text[])))`;
        case "empty":
          return sql`coalesce(cardinality(${expr}), 0) = 0`;
        case "notEmpty":
          return sql`coalesce(cardinality(${expr}), 0) > 0`;
      }
      break;
    case "date": {
      const day = sql`(${expr} at time zone ${TZ})::date`;
      switch (c.op) {
        case "on":
          return sql`${day} = ${v}::date`;
        case "before":
          return sql`${day} < ${v}::date`;
        case "after":
          return sql`${day} > ${v}::date`;
        case "empty":
          return sql`${expr} is null`;
        case "notEmpty":
          return sql`${expr} is not null`;
      }
    }
  }
  return undefined;
}

export function filterSql(source: ListSource, group: Group): SQL | undefined {
  const parts = group.items
    .map((item) => (item.kind === "group" ? filterSql(source, item) : conditionSql(source, item)))
    .filter((p): p is SQL => !!p);
  if (!parts.length) return undefined;
  const joined = group.match === "any" ? or(...parts) : and(...parts);
  // NOT treats "unknown" (empty values) as not matching, so those rows stay in.
  return group.exclude ? not(sql`coalesce(${joined}, false)`) : joined;
}

/** Column search boxes: every filled box must match. Each matches text as shown in the list, ignoring capitals. */
export function searchSql(source: ListSource, search: Record<string, string>): SQL | undefined {
  const parts: SQL[] = [];
  for (const [key, raw] of Object.entries(search)) {
    const column = columnOf(source.meta, key);
    const expr = source.columns[key];
    const term = parseSearch(raw);
    if (!column || !expr || !term) continue;

    if (column.type === "text" || column.type === "date") {
      // Dates are searched as shown, e.g. "10/28/2026, 11:48 AM".
      const target =
        column.type === "date" ? sql`to_char(${expr} at time zone ${TZ}, ${PG_DATE_FORMAT})` : sql`${expr}`;
      let match: SQL;
      if (term.kind === "empty") match = sql`coalesce(${target}, '') = ''`;
      else if (term.kind === "exact") match = sql`lower(${target}) = lower(${term.text})`;
      else match = sql`${target} ilike ${searchLike(term)}`;
      parts.push(term.not ? sql`not coalesce(${match}, false)` : match);
      continue;
    }

    // Choices and lists are matched on the words people see (e.g. "On", "Admin").
    const positive = { ...term, not: false };
    if (term.kind === "empty") {
      const empty = column.type === "choice" ? sql`${expr} is null` : sql`coalesce(cardinality(${expr}), 0) = 0`;
      parts.push(term.not ? sql`not (${empty})` : empty);
      continue;
    }
    const values = (column.options ?? []).filter((o) => searchMatches(positive, o.label));
    if (!values.length) {
      if (!term.not) parts.push(sql`false`);
      continue;
    }
    const list = sql.join(
      values.map((o) => sql`${o.value}`),
      sql`, `,
    );
    const match = column.type === "choice" ? sql`${expr} in (${list})` : sql`${expr} && array[${list}]::text[]`;
    parts.push(term.not ? sql`not coalesce(${match}, false)` : match);
  }
  return parts.length ? and(...parts) : undefined;
}

function orderBy(source: ListSource, sort: Sort) {
  const column = columnOf(source.meta, sort.column);
  let expr = source.columns[sort.column];
  if (column?.type === "multi") expr = sql`array_to_string(${expr}, ', ')`;
  if (column?.type === "text" || column?.type === "choice") expr = sql`lower(${expr})`;
  const by = sort.dir === "desc" ? sql`${expr} desc nulls last` : sql`${expr} asc nulls last`;
  return [by, sort.dir === "desc" ? desc(source.id) : asc(source.id)];
}

/** The value a row is grouped on, as text: the date (Pacific day) for date columns; empty becomes null. */
function groupSql(source: ListSource, column: ColumnMeta): SQL {
  const expr = source.columns[column.key];
  // The time zone is a fixed constant written into the SQL, so SELECT and GROUP BY are the same expression.
  return column.type === "date"
    ? sql`((${expr} at time zone ${sql.raw(`'${TZ}'`)})::date)::text`
    : sql`nullif((${expr})::text, '')`;
}

function groupLabel(column: ColumnMeta, value: string | null) {
  if (value === null) return "(empty)";
  if (column.type === "date") return formatDay(value);
  return column.options?.find((o) => o.value === value)?.label ?? value;
}

export function formatCell(column: ColumnMeta, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (column.type === "date") {
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? "" : dateFormat.format(date);
  }
  const label = (v: string) => column.options?.find((o) => o.value === v)?.label ?? v;
  if (column.type === "multi") {
    const values = Array.isArray(value)
      ? value
      : String(value)
          .replace(/^\{|\}$/g, "")
          .split(",")
          .filter(Boolean);
    return values.map((v) => label(String(v))).join(", ");
  }
  if (column.type === "choice") return label(String(value));
  return String(value);
}

/** Rows for one page, the number that match, and the total in the list. */
/** Rows matching a filter and the column searches, as a WHERE clause. */
export function whereFor(source: ListSource, filter: Group, search: Record<string, string> = {}) {
  return and(filterSql(source, filter), searchSql(source, search));
}

const BUCKETS = { day: "day", week: "week", month: "month" } as const;

/**
 * Counts rows by up to two columns (dates by day, week or month), for the AI
 * assistant. Groups are sorted by date when the first column is a date,
 * otherwise biggest first.
 */
export async function aggregateList(
  source: ListSource,
  where: SQL | undefined,
  groupBy: string[],
  bucket: keyof typeof BUCKETS = "day",
  limit = 50,
) {
  const columns = groupBy.map((key) => columnOf(source.meta, key)).filter((c): c is ColumnMeta => !!c);
  const exprs = columns.map((column) => {
    const expr = source.columns[column.key];
    if (column.type === "date") {
      return sql`(date_trunc(${sql.raw(`'${BUCKETS[bucket] ?? "day"}'`)}, ${expr} at time zone ${sql.raw(`'${TZ}'`)})::date)::text`;
    }
    if (column.type === "multi") return sql`nullif(array_to_string(${expr}, ', '), '')`;
    return sql`nullif((${expr})::text, '')`;
  });
  const fields: Record<string, SQL> = { count: sql<number>`count(*)::int` };
  exprs.forEach((e, i) => (fields[`g${i}`] = e));
  const firstIsDate = columns[0]?.type === "date";
  const rows = (await getDb()
    .select(fields)
    .from(source.table)
    .where(where)
    .groupBy(...exprs)
    .orderBy(...(firstIsDate ? [sql`${exprs[0]} asc nulls last`] : [sql`count(*) desc`]))
    .limit(limit + 1)) as Record<string, unknown>[];
  const label = (column: ColumnMeta, value: unknown) => {
    if (value === null || value === undefined) return "(empty)";
    const text = String(value);
    if (column.type === "choice" || column.type === "multi") {
      return text
        .split(", ")
        .map((v) => column.options?.find((o) => o.value === v)?.label ?? v)
        .join(", ");
    }
    return text;
  };
  return {
    groups: rows.slice(0, limit).map(
      (r) =>
        ({
          ...Object.fromEntries(columns.map((c, i) => [c.label, label(c, r[`g${i}`])])),
          count: Number(r.count),
        }) as Record<string, string> & { count: number },
    ),
    truncated: rows.length > limit,
  };
}

export async function queryList(
  source: ListSource,
  state: {
    columns: string[];
    sort: Sort;
    filter: Group;
    search: Record<string, string>;
    page?: number;
    all?: boolean;
    groupBy?: string | null;
    pageSize?: number;
  },
) {
  const db = getDb();
  const where = and(filterSql(source, state.filter), searchSql(source, state.search));
  const fields: Record<string, SQL | AnyPgColumn> = { __id: source.id };
  for (const key of state.columns) if (source.columns[key]) fields[key] = source.columns[key];

  const page = Math.max(1, state.page ?? 1);
  const pageSize = state.pageSize ?? PAGE_SIZE;
  const groupColumn = state.groupBy ? columnOf(source.meta, state.groupBy) : undefined;
  const group = groupColumn && !state.all ? groupSql(source, groupColumn) : undefined;
  if (group) fields.__group = group;
  let rowsQuery = db
    .select(fields)
    .from(source.table)
    .where(where)
    .orderBy(...(group ? [sql`${group} asc nulls last`] : []), ...orderBy(source, state.sort))
    .$dynamic();
  rowsQuery = state.all
    ? rowsQuery.limit(EXPORT_LIMIT)
    : group
      ? rowsQuery.limit(GROUPED_ROWS)
      : rowsQuery.limit(pageSize).offset((page - 1) * pageSize);
  const groupsQuery =
    group && groupColumn
      ? db
          .select({ value: group, count: count() })
          .from(source.table)
          .where(where)
          .groupBy(group)
          .orderBy(sql`${group} asc nulls last`)
          .limit(MAX_GROUPS + 1)
      : Promise.resolve([]);

  const [raw, [{ matching }], [{ total }], rawGroups] = await Promise.all([
    rowsQuery,
    db.select({ matching: count() }).from(source.table).where(where),
    db.select({ total: count() }).from(source.table),
    groupsQuery,
  ]);
  const groups: ListGroup[] | undefined = groupColumn
    ? (rawGroups as { value: unknown; count: number }[]).slice(0, MAX_GROUPS).map((g) => {
        const value = g.value === null || g.value === undefined ? null : String(g.value);
        return { value, label: groupLabel(groupColumn, value), count: Number(g.count) };
      })
    : undefined;

  const rows: ListRow[] = raw.map((r) => {
    const id = Number(r.__id);
    const cells: Record<string, string> = {};
    const dates: Record<string, string> = {};
    for (const key of state.columns) {
      const column = columnOf(source.meta, key);
      if (!column) continue;
      cells[key] = formatCell(column, r[key]);
      if (column.type === "date" && r[key]) {
        const date = r[key] instanceof Date ? r[key] : new Date(String(r[key]));
        if (!Number.isNaN(date.getTime())) dates[key] = date.toISOString();
      }
    }
    const row: ListRow = { id, href: source.rowHref?.(id), cells, dates };
    if (group) row.group = r.__group === null || r.__group === undefined ? null : String(r.__group);
    return row;
  });
  return { rows, matching, total, page, groups, moreGroups: rawGroups.length > MAX_GROUPS };
}

type StoredLayout = typeof schema.listLayouts.$inferSelect;

function toLayout(meta: ListMeta, row: StoredLayout): Layout {
  return {
    columns: cleanColumns(meta, row.columns),
    sort: cleanSort(meta, row.sort),
    filter: cleanFilter(meta, row.filter),
    groupBy: cleanGroupBy(meta, row.groupBy),
    pageSize: cleanPageSize(row.pageSize),
  };
}

/**
 * The layout this person sees when they open the list: their own if they've
 * changed it, otherwise the admin-set default, otherwise the list's built-in one.
 */
export async function effectiveLayout(meta: ListMeta, userId: number) {
  const rows = await getDb()
    .select()
    .from(schema.listLayouts)
    .where(
      and(
        eq(schema.listLayouts.listId, meta.id),
        or(eq(schema.listLayouts.userId, userId), isNull(schema.listLayouts.userId)),
      ),
    );
  const personal = rows.find((r) => r.userId === userId);
  const shared = rows.find((r) => r.userId === null);
  if (personal) return { layout: toLayout(meta, personal), from: "personal" as const };
  if (shared) return { layout: toLayout(meta, shared), from: "default" as const };
  return {
    layout: { ...meta.defaultLayout, filter: meta.defaultLayout.filter ?? EMPTY_FILTER },
    from: "built-in" as const,
  };
}

/** Saves part of a layout: for one person, or (userId null) as the default for everyone. */
export async function saveLayout(meta: ListMeta, userId: number | null, changes: Partial<Layout>, by: number) {
  const db = getDb();
  const t = schema.listLayouts;
  const match = and(eq(t.listId, meta.id), userId === null ? isNull(t.userId) : eq(t.userId, userId));
  const [existing] = await db.select().from(t).where(match);
  if (existing) {
    await db
      .update(t)
      .set({ ...changes, updatedAt: new Date(), updatedBy: by })
      .where(eq(t.id, existing.id));
    return;
  }
  // First change: start from what they see now.
  const base = userId === null ? meta.defaultLayout : (await effectiveLayout(meta, userId)).layout;
  await db
    .insert(t)
    .values({ listId: meta.id, userId, ...base, ...changes, updatedBy: by })
    .onConflictDoNothing();
}

export async function resetLayout(listId: string, userId: number) {
  const t = schema.listLayouts;
  await getDb()
    .delete(t)
    .where(and(eq(t.listId, listId), eq(t.userId, userId)));
}

/** This person's saved filters plus everyone's shared ones. */
export async function savedFiltersFor(meta: ListMeta, userId: number): Promise<SavedFilter[]> {
  const t = schema.savedFilters;
  const rows = await getDb()
    .select()
    .from(t)
    .where(and(eq(t.listId, meta.id), or(eq(t.ownerId, userId), eq(t.shared, true))))
    .orderBy(desc(t.shared), asc(sql`lower(${t.name})`));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    shared: r.shared,
    mine: r.ownerId === userId,
    filter: cleanFilter(meta, r.filter),
  }));
}
```

### Server actions (layouts, defaults, saved filters): `src/lib/list-view/actions.ts`

Adapt the permission names to the app's roles.

```ts
"use server";

import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireUser } from "@/lib/dal";
import { listSource } from "@/lib/lists/registry";
import { can } from "@/lib/roles";
import { resetLayout, saveLayout } from "./server";
import { cleanColumns, cleanFilter, cleanGroupBy, cleanPageSize, cleanSort } from "./types";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** The list and the signed-in person, if they may use it. */
async function open(listId: string) {
  const user = await requireUser();
  const source = listSource(listId);
  if (!source || (source.permission && !can(user, source.permission))) return null;
  return { user, source };
}

const NO_ACCESS: ActionResult = { ok: false, error: "You don't have access to this list." };

/** Remembers the filter and sort someone last used, so the list opens that way next time. */
export async function saveMyView(
  listId: string,
  view: { filter: unknown; sort: unknown; groupBy?: unknown; pageSize?: unknown },
): Promise<ActionResult> {
  const ctx = await open(listId);
  if (!ctx) return NO_ACCESS;
  const { meta } = ctx.source;
  await saveLayout(
    meta,
    ctx.user.id,
    {
      filter: cleanFilter(meta, view.filter),
      sort: cleanSort(meta, view.sort),
      ...(view.groupBy !== undefined ? { groupBy: cleanGroupBy(meta, view.groupBy) } : {}),
      ...(view.pageSize !== undefined ? { pageSize: cleanPageSize(view.pageSize) } : {}),
    },
    ctx.user.id,
  );
  return { ok: true };
}

export async function saveMyColumns(listId: string, columns: unknown): Promise<ActionResult> {
  const ctx = await open(listId);
  if (!ctx) return NO_ACCESS;
  await saveLayout(ctx.source.meta, ctx.user.id, { columns: cleanColumns(ctx.source.meta, columns) }, ctx.user.id);
  return { ok: true };
}

export async function resetMyLayout(listId: string): Promise<ActionResult> {
  const ctx = await open(listId);
  if (!ctx) return NO_ACCESS;
  await resetLayout(listId, ctx.user.id);
  return { ok: true };
}

/** Admins: make these columns, sort and filter the starting point for everyone. */
export async function setDefaultLayout(
  listId: string,
  layout: { columns: unknown; sort: unknown; filter: unknown; groupBy?: unknown },
): Promise<ActionResult> {
  const ctx = await open(listId);
  if (!ctx) return NO_ACCESS;
  if (!can(ctx.user, "lists.setDefaults")) return { ok: false, error: "Only admins can set the default for everyone." };
  const { meta } = ctx.source;
  await saveLayout(
    meta,
    null,
    {
      columns: cleanColumns(meta, layout.columns),
      sort: cleanSort(meta, layout.sort),
      filter: cleanFilter(meta, layout.filter),
      groupBy: cleanGroupBy(meta, layout.groupBy),
    },
    ctx.user.id,
  );
  return { ok: true };
}

export async function saveFilter(
  listId: string,
  input: { name: unknown; filter: unknown; shared: unknown },
): Promise<ActionResult> {
  const ctx = await open(listId);
  if (!ctx) return NO_ACCESS;
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ").slice(0, 60) : "";
  if (!name) return { ok: false, error: "Give the favorite a name, for example “Emergency orders”." };
  const filter = cleanFilter(ctx.source.meta, input.filter);
  if (!filter.items.length) return { ok: false, error: "Build a filter first. There's nothing to save yet." };
  const shared = input.shared === true;
  if (shared && !can(ctx.user, "lists.setDefaults"))
    return { ok: false, error: "Only admins can share favorites with everyone." };
  const t = schema.savedFilters;
  const [same] = await getDb()
    .select({ id: t.id })
    .from(t)
    .where(
      and(
        eq(t.listId, listId),
        eq(t.shared, shared),
        shared ? undefined : eq(t.ownerId, ctx.user.id),
        sql`lower(${t.name}) = lower(${name})`,
      ),
    );
  if (same) {
    return {
      ok: false,
      error: `There's already a ${shared ? "shared " : ""}filter called “${name}”. Choose another name.`,
    };
  }
  await getDb().insert(schema.savedFilters).values({ listId, name, filter, ownerId: ctx.user.id, shared });
  return { ok: true };
}

/** Your own saved filters, or (admins) shared ones. */
export async function deleteFilter(listId: string, id: number): Promise<ActionResult> {
  const ctx = await open(listId);
  if (!ctx) return NO_ACCESS;
  const t = schema.savedFilters;
  const [row] = await getDb()
    .select()
    .from(t)
    .where(and(eq(t.id, id), eq(t.listId, listId)));
  if (!row) return { ok: true };
  const allowed = row.ownerId === ctx.user.id || (row.shared && can(ctx.user, "lists.setDefaults"));
  if (!allowed) return { ok: false, error: "You can only delete your own saved filters." };
  await getDb().delete(t).where(eq(t.id, id));
  return { ok: true };
}
```

### Page wrapper: `src/components/list-view/list-page.tsx`

What a list's page renders. A new list = a registry entry + a page that renders this.

```tsx
import {
  EMPTY_FILTER,
  cleanFilter,
  cleanGroupBy,
  cleanPageSize,
  parseSort,
  readSearch,
  listHref,
  type Group,
} from "@/lib/list-view/types";
import { effectiveLayout, queryList, savedFiltersFor } from "@/lib/list-view/server";
import { requireUser } from "@/lib/dal";
import { listSource } from "@/lib/lists/registry";
import { can } from "@/lib/roles";
import { NoAccess } from "@/components/no-access";
import { ListView } from "./list-view";

type Params = Record<string, string | string[] | undefined>;

/** Reads the filter from the page address: "all" means no filter; missing means "use the saved layout". */
function filterFromParams(params: Params): Group | null | "invalid" {
  const raw = Array.isArray(params.filter) ? params.filter[0] : params.filter;
  if (raw === undefined) return null;
  if (raw === "all" || raw === "") return EMPTY_FILTER;
  try {
    return JSON.parse(raw) as Group;
  } catch {
    return "invalid";
  }
}

/**
 * A list page on the server: checks access, works out this person's columns,
 * sort and filter (address first, then their saved layout, then the default),
 * runs the query and hands everything to <ListView>. Render inside <Suspense>.
 */
export async function ListPage({
  listId,
  searchParams,
  actions,
}: {
  listId: string;
  searchParams: Promise<Params>;
  /** Page buttons shown at the right of the list's bar, e.g. "Add person". */
  actions?: React.ReactNode;
}) {
  const user = await requireUser();
  const source = listSource(listId);
  if (!source) throw new Error(`Unknown list ${listId}`);
  if (source.permission && !can(user, source.permission)) return <NoAccess />;

  const { meta } = source;
  const params = await searchParams;
  const { layout, from } = await effectiveLayout(meta, user.id);
  const fromUrl = filterFromParams(params);
  const filter = fromUrl && fromUrl !== "invalid" ? cleanFilter(meta, fromUrl) : layout.filter;
  const sort = parseSort(meta, typeof params.sort === "string" ? params.sort : undefined) ?? layout.sort;
  const search = readSearch(meta, params);
  // "group=none" turns grouping off; no "group" uses the saved layout.
  const groupParam = typeof params.group === "string" ? params.group : undefined;
  const pageSize = typeof params.rows === "string" ? cleanPageSize(params.rows) : (layout.pageSize ?? 50);
  const groupBy = groupParam === undefined ? (layout.groupBy ?? null) : cleanGroupBy(meta, groupParam);
  const page = Math.max(1, Math.floor(Number(params.page) || 1));

  const [result, saved] = await Promise.all([
    queryList(source, { columns: layout.columns, sort, filter, search, page, groupBy, pageSize }),
    savedFiltersFor(meta, user.id),
  ]);

  return (
    <ListView
      meta={meta}
      path={source.path}
      columns={layout.columns}
      sort={sort}
      filter={filter}
      search={search}
      page={result.page}
      rows={result.rows}
      matching={result.matching}
      total={result.total}
      saved={saved}
      layoutFrom={from}
      isAdmin={can(user, "lists.setDefaults")}
      groupBy={groupBy}
      pageSize={pageSize}
      groups={result.groups}
      moreGroups={result.moreGroups}
      title={meta.title}
      actions={actions}
      exportHref={listHref(`/api/lists/${meta.id}/export`, { filter, sort, search })}
    />
  );
}
```

### Example list page (Orders): `src/app/(app)/lists/orders/page.tsx`

A complete list page: one component, no table code.

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { ListLoading } from "@/components/list-view/list-loading";
import { ListPage } from "@/components/list-view/list-page";

export const metadata: Metadata = { title: "Orders" };

/** Every order, on the shared list view (docs/features/orders.md, list-views.md). */
export default function OrdersPage({ searchParams }: PageProps<"/lists/orders">) {
  return (
    <main className="w-full min-w-0 flex-1 px-4 py-2 sm:px-6">
      <Suspense fallback={<ListLoading noun="orders" />}>
        <ListPage listId="orders" searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
```

### The list view (toolbar, table, search, grouping, density): `src/components/list-view/list-view.tsx`

Copy as is; change only imports and the storage key prefix (`cs-tracker:`).

```tsx
"use client";

import { Fragment, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Columns3,
  Download,
  Filter,
  Group as GroupIcon,
  Menu,
  RotateCcw,
  Search as SearchIcon,
  Settings2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { saveMyColumns, setDefaultLayout } from "@/lib/list-view/actions";
import {
  addFilterStep,
  canGroupBy,
  columnOf,
  groupCondition,
  describe,
  type ColumnMeta,
  type Group,
  type ListGroup,
  type ListMeta,
  type ListRow,
  type SavedFilter,
  type Sort,
} from "@/lib/list-view/types";
import { cn } from "@/lib/utils";
import { AiSparkle } from "@/components/ai-sparkle";
import { AiPanel } from "./ai-panel";
import { CellMenu } from "./cell-menu";
import { ColumnPicker } from "./column-picker";
import { FilterBuilder } from "./filter-builder";
import { FavoritesMenu } from "./favorites-menu";
import { Pager } from "./pager";
import { RelativeTime } from "./relative-time";
import { useListNav } from "./use-list-nav";

export type Density = "compact" | "comfortable";
const DENSITY_KEY = "cs-tracker:list-density";

/**
 * Row spacing. Compact (Ryan's preference, the default) fits more rows; comfortable
 * gives bigger rows for tablets and gloves. Remembered in this browser only.
 */
const densityListeners = new Set<() => void>();
let densityFallback: Density = "compact";

function readDensity(): Density {
  try {
    return localStorage.getItem(DENSITY_KEY) === "comfortable" ? "comfortable" : "compact";
  } catch {
    return densityFallback; // Storage blocked: the choice lasts until the page is reloaded.
  }
}

function useDensity() {
  const density = useSyncExternalStore(
    (onChange) => {
      densityListeners.add(onChange);
      window.addEventListener("storage", onChange);
      return () => {
        densityListeners.delete(onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    readDensity,
    () => "compact" as Density,
  );
  function choose(next: Density) {
    densityFallback = next;
    try {
      localStorage.setItem(DENSITY_KEY, next);
    } catch {
      // Storage blocked: densityFallback keeps it for now.
    }
    densityListeners.forEach((listener) => listener());
  }
  return [density, choose] as const;
}

export type ListViewProps = {
  meta: ListMeta;
  path: string;
  columns: string[];
  sort: Sort;
  filter: Group;
  search: Record<string, string>;
  page: number;
  rows: ListRow[];
  matching: number;
  total: number;
  saved: SavedFilter[];
  /** Where this person's columns, sort and filter came from. */
  layoutFrom: "personal" | "default" | "built-in";
  isAdmin: boolean;
  exportHref: string;
  /** Column the list is grouped by, its groups (with counts), and whether there were too many to show. */
  groupBy: string | null;
  /** Rows per page (10, 20, 50, 100 or 500). */
  pageSize: number;
  groups?: ListGroup[];
  moreGroups?: boolean;
  /** Shown in the bar next to the menu and filter icons, e.g. "Orders". */
  title: string;
  /** Page buttons at the right end of the bar, e.g. "Add person". */
  actions?: ReactNode;
};

/**
 * The shared list view (docs/features/list-views.md), modelled on ServiceNow:
 * choose columns, a search box under each column, a filter builder with
 * AND/OR/NOT, breadcrumbs, sorting, saved filters, CSV export and paging.
 * Large screens get a table; phones and tablets get one card per row.
 */
export function ListView(props: ListViewProps) {
  const { meta, path, columns, sort, filter, search, page, rows, matching, total } = props;
  const { groupBy, groups } = props;
  const nav = useListNav(meta.id, path, { filter, sort, search, page, groupBy, pageSize: props.pageSize });
  const groupColumn = groupBy ? columnOf(meta, groupBy) : undefined;
  const groupKey = (value: string | null) => value ?? "\u0000empty";
  // Groups start open; "Close all" or a group's header closes them. Reset when the grouping changes.
  const [closedState, setClosedState] = useState<{ groupBy: string | null; keys: Set<string> }>({
    groupBy,
    keys: new Set(),
  });
  const closed = closedState.groupBy === groupBy ? closedState.keys : new Set<string>();
  const setClosed = (update: Set<string> | ((prev: Set<string>) => Set<string>)) =>
    setClosedState((prev) => {
      const base = prev.groupBy === groupBy ? prev.keys : new Set<string>();
      return { groupBy, keys: typeof update === "function" ? update(base) : update };
    });
  const toggleGroup = (value: string | null) =>
    setClosed((prev) => {
      const next = new Set(prev);
      const key = groupKey(value);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const [builderOpen, setBuilderOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [density, setDensity] = useDensity();
  const compact = density === "compact";
  const visible = columns.map((key) => columnOf(meta, key)).filter((c): c is ColumnMeta => !!c);
  const searching = Object.keys(search).length > 0;
  const filtering = filter.items.length > 0;

  /** Alternating shading on every list (Ryan), counted within each group. */
  function renderRow(row: ListRow, index: number) {
    return (
      <tr key={row.id} className={cn("border-b align-top hover:bg-accent", index % 2 === 1 && "bg-muted/40")}>
        <td />
        {visible.map((column, i) => (
          <td
            key={column.key}
            data-row={row.id}
            data-col={column.key}
            className={compact ? "py-0.5 pr-2 leading-5 whitespace-nowrap" : "py-3 pr-4"}
          >
            <Cell row={row} column={column} first={i === 0} compact={compact} />
          </td>
        ))}
      </tr>
    );
  }

  if (total === 0) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-normal text-heading">{props.title}</h1>
          {props.actions && <div className="ml-auto flex items-center gap-2">{props.actions}</div>}
        </div>
        <EmptyBox title={`No ${meta.noun.many} yet`}>
          {meta.noun.many.charAt(0).toUpperCase() + meta.noun.many.slice(1)} will appear here once they&apos;re added.
        </EmptyBox>
      </>
    );
  }

  return (
    <div className={cn("transition-opacity", nav.pending && "opacity-70")} aria-busy={nav.pending}>
      {/* One slim bar: list menu, filter, title, count, breadcrumbs, page actions */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <ListMenu {...props} nav={nav} density={density} onDensity={setDensity} />
        <Button
          variant={builderOpen ? "secondary" : "ghost"}
          size="icon"
          aria-expanded={builderOpen}
          aria-label={filtering ? "Filter (on)" : "Filter"}
          title={filtering ? "Filter (on)" : "Filter"}
          onClick={() => setBuilderOpen(!builderOpen)}
          className={cn("relative size-8", filtering && "text-primary")}
        >
          <Filter aria-hidden className={cn("size-5", filtering && "fill-primary/20")} />
          {filtering && <span aria-hidden className="absolute top-1 right-1 size-2 rounded-full bg-primary" />}
        </Button>
        <FavoritesMenu
          listId={meta.id}
          saved={props.saved}
          filter={filter}
          isAdmin={props.isAdmin}
          onApply={(f) => nav.go({ filter: f })}
          onChanged={(task) => nav.refresh(task)}
        />
        <Button
          variant={aiOpen ? "secondary" : "ghost"}
          size="icon"
          className="size-8"
          aria-expanded={aiOpen}
          aria-label="Ask AI"
          title="Ask AI about this list"
          onClick={() => setAiOpen(!aiOpen)}
        >
          <AiSparkle className="size-5" />
        </Button>
        <h1 className="mr-1 font-heading text-2xl font-normal text-heading">{props.title}</h1>
        {/* Not shown (Ryan, 2026-11-18): the pager shows the count. Kept for screen readers. */}
        <p role="status" className="sr-only">
          {nav.pending
            ? "Updating…"
            : filtering || searching
              ? `${matching} of ${total} match`
              : `${total} ${total === 1 ? meta.noun.one : meta.noun.many}`}
        </p>
        {filtering && <Breadcrumbs meta={meta} filter={filter} onChange={(f) => nav.go({ filter: f })} />}
        {groupColumn && groups && (
          <span className="flex items-center gap-1 rounded-lg bg-muted pl-3 text-base">
            Grouped by <strong className="font-semibold">{groupColumn.label}</strong>
            <span className="text-muted-foreground">({groups.length})</span>
            <button
              type="button"
              className="ml-2 min-h-9 rounded-lg px-2 font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
              onClick={() => setClosed(new Set())}
            >
              Open all
            </button>
            <button
              type="button"
              className="min-h-9 rounded-lg px-2 font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
              onClick={() => setClosed(new Set(groups.map((g) => groupKey(g.value))))}
            >
              Close all
            </button>
            <button
              type="button"
              onClick={() => nav.go({ groupBy: null })}
              aria-label="Stop grouping"
              title="Stop grouping"
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
            >
              <X aria-hidden className="size-4" />
            </button>
          </span>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {/* Pagination at the top right (Ryan, 2026-11-18); grouped lists don't page. */}
          {!groupColumn && (
            <Pager
              page={page}
              pageSize={props.pageSize}
              matching={matching}
              noun={meta.noun.many}
              onPage={(p) => nav.go({ page: p })}
              onPageSize={(n) => nav.go({ pageSize: n })}
            />
          )}
          {props.actions}
        </div>
      </div>
      <MobileSort meta={meta} sort={sort} onSort={(s) => nav.go({ sort: s })} />
      {aiOpen && (
        <AiPanel
          endpoint={`/api/lists/${meta.id}/ai`}
          context={{ filter, sort, search }}
          title={meta.title}
          intro={aiIntro(meta)}
          suggestions={aiSuggestions(meta)}
          placeholder={`Ask about these ${meta.noun.many}…`}
          onApplyFilter={(f) => nav.go({ filter: f })}
          onClose={() => setAiOpen(false)}
        />
      )}

      {builderOpen && (
        <FilterBuilder
          key={JSON.stringify(filter)}
          meta={meta}
          filter={filter}
          pending={nav.pending}
          onClose={() => setBuilderOpen(false)}
          onRun={(f) => nav.go({ filter: f })}
        />
      )}

      {/* Phones and tablets: search boxes one under another */}
      <div className="lg:hidden">
        <StackedSearch meta={meta} columns={visible} search={search} onSearch={(s) => nav.go({ search: s })} />
      </div>

      {matching === 0 ? (
        <EmptyBox title={`No ${meta.noun.many} match`}>
          Check the spelling, or remove part of the filter or search.{" "}
          <button
            type="button"
            className="font-medium text-primary underline underline-offset-4"
            onClick={() => nav.go({ filter: { kind: "group", match: "all", items: [] }, search: {} })}
          >
            Show all {meta.noun.many}
          </button>
        </EmptyBox>
      ) : null}

      {/* Large screens: table */}
      <div className={cn("hidden overflow-x-auto lg:block", compact ? "mt-1" : "mt-4")}>
        <table className="w-full border-collapse text-left text-base">
          <caption className="sr-only">{meta.title}</caption>
          <TableHead
            meta={meta}
            columns={visible}
            sort={sort}
            search={search}
            onSort={(s) => nav.go({ sort: s })}
            onSearch={(s) => nav.go({ search: s })}
            pending={nav.pending}
            compact={compact}
          />
          <CellMenu meta={meta} rows={rows} filter={filter} onFilter={(f) => nav.go({ filter: f })}>
            <tbody>
              {groupColumn && groups
                ? groups.map((g) => {
                    const inGroup = rows.filter((r) => (r.group ?? null) === g.value);
                    const open = !closed.has(groupKey(g.value));
                    const step = groupCondition(meta, groupColumn.key, g.value);
                    return (
                      <Fragment key={groupKey(g.value)}>
                        <tr className="border-b bg-muted">
                          <td colSpan={visible.length + 1} className="py-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                aria-expanded={open}
                                onClick={() => toggleGroup(g.value)}
                                className="flex min-h-8 items-center gap-1.5 rounded-lg px-1 text-left outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
                              >
                                <ChevronRight
                                  aria-hidden
                                  className={cn("size-5 shrink-0 transition-transform", open && "rotate-90")}
                                />
                                <span className="text-muted-foreground">{groupColumn.label}:</span>
                                <span className="font-semibold">{g.label}</span>
                                <span className="text-muted-foreground">({g.count})</span>
                              </button>
                              {open && inGroup.length < g.count && step && (
                                <button
                                  type="button"
                                  onClick={() => nav.go({ filter: addFilterStep(filter, step) })}
                                  className="min-h-8 rounded-lg px-2 font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
                                >
                                  Showing {inGroup.length}. Show all {g.count}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {open && inGroup.map(renderRow)}
                      </Fragment>
                    );
                  })
                : rows.map(renderRow)}
            </tbody>
          </CellMenu>
        </table>
      </div>

      {/* Phones and tablets: cards */}
      <ul className="mt-4 grid gap-3 lg:hidden">
        {rows.map((row, i) => (
          <Fragment key={row.id}>
            {groupColumn && groups && (i === 0 || rows[i - 1].group !== row.group) && (
              <li className="mt-2 text-lg font-semibold">
                {groupColumn.label}: {groups.find((g) => g.value === (row.group ?? null))?.label ?? "(empty)"} (
                {groups.find((g) => g.value === (row.group ?? null))?.count ?? 0})
              </li>
            )}
            <li className="rounded-xl border p-4 text-base">
              <p className="text-lg font-semibold">
                <Cell row={row} column={visible[0]} first />
              </p>
              {visible.length > 1 && (
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  {visible.slice(1).map((column) => (
                    <div key={column.key} className="contents">
                      <dt className="text-muted-foreground">{column.label}</dt>
                      <dd className="break-words">{row.cells[column.key] || "—"}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          </Fragment>
        ))}
      </ul>

      {groupColumn && props.moreGroups && (
        <p className="mt-3 text-base text-muted-foreground">
          Showing the first 200 groups. Filter the list to see the rest.
        </p>
      )}
    </div>
  );
}

function Cell({
  row,
  column,
  first,
  compact,
}: {
  row: ListRow;
  column: ColumnMeta;
  first: boolean;
  compact?: boolean;
}) {
  const text = row.cells[column.key] || "—";
  // Compact rows stay one line: long text is cut short, and the full text shows on hover.
  const cut = compact && column.type === "text" && text.length > 40;
  const iso = column.type === "date" ? row.dates?.[column.key] : undefined;
  if (iso && !(first && row.href)) {
    // ServiceNow style: the date and time, with "31 mins ago" under it.
    return (
      <time dateTime={iso} className="block text-sm leading-4 whitespace-nowrap">
        {text}
        <span className="block text-xs leading-4 text-muted-foreground">
          <RelativeTime iso={iso} />
        </span>
      </time>
    );
  }
  if (first && row.href) {
    return (
      <Link
        href={row.href}
        className="font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
      >
        {text}
      </Link>
    );
  }
  return (
    <span
      title={cut ? text : undefined}
      className={cn(
        first && "font-semibold",
        column.type === "date" && "whitespace-nowrap",
        cut && "block max-w-[28rem] truncate",
      )}
    >
      {text}
    </span>
  );
}

/**
 * Column headers: select one to sort by it (again to reverse). The search
 * button before the first header shows a search box under each column; the
 * search runs on Enter or Search, and rows must match every filled box.
 */
const SEARCH_TIP =
  "Press Enter to search. Text is found anywhere. * = any text (7C* starts with 7C), ? = one character, =EMER exactly, = empty, ! = not (!EMER, !=EMER, != not empty).";

function TableHead({
  meta,
  columns,
  sort,
  search,
  onSort,
  onSearch,
  pending,
  compact,
}: {
  meta: ListMeta;
  columns: ColumnMeta[];
  sort: Sort;
  search: Record<string, string>;
  onSort: (sort: Sort) => void;
  onSearch: (search: Record<string, string>) => void;
  pending: boolean;
  compact: boolean;
}) {
  const active = Object.keys(search).length > 0;
  // Open from the start, as in ServiceNow (Ryan, 2026-11-18). The magnifying glass hides it.
  const [open, setOpen] = useState(true);
  const [openedByClick, setOpenedByClick] = useState(false);
  const formId = `${meta.id}-column-search`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: Record<string, string> = {};
    // Keep searches on columns that are hidden right now.
    for (const [key, value] of Object.entries(search)) if (!columns.some((c) => c.key === key)) next[key] = value;
    for (const c of columns) {
      const value = String(data.get(c.key) ?? "").trim();
      if (value) next[c.key] = value;
    }
    onSearch(next);
  }

  return (
    <thead>
      <tr className="border-b-2 border-input">
        <th scope="col" className={cn("w-12 pr-2", compact ? "py-0.5" : "py-2")}>
          <Button
            type="button"
            variant={open ? "secondary" : "ghost"}
            size="icon"
            aria-expanded={open}
            aria-controls={`${formId}-row`}
            style={compact ? { width: "1.75rem", height: "1.75rem" } : undefined}
            aria-label={open ? "Hide column search" : "Search columns"}
            title={open ? "Hide column search" : "Search columns"}
            onClick={() => {
              setOpen(!open);
              setOpenedByClick(!open);
            }}
            className={cn(active && "text-primary")}
          >
            <SearchIcon aria-hidden className="size-5" />
          </Button>
        </th>
        {columns.map((column) => {
          const sorted = sort.column === column.key ? sort.dir : null;
          // Only the sorted column shows an arrow (Ryan, 2026-11-18); the header still sorts when selected.
          const Icon = sorted === "asc" ? ArrowUp : ArrowDown;
          return (
            <th
              key={column.key}
              scope="col"
              aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
              className={compact ? "py-0 pr-1" : "py-1 pr-2"}
            >
              <button
                type="button"
                title={`Sort by ${column.label}`}
                onClick={() =>
                  onSort({
                    column: column.key,
                    dir:
                      sorted === "asc" ? "desc" : sorted === "desc" ? "asc" : column.type === "date" ? "desc" : "asc",
                  })
                }
                className={cn(
                  "-ml-2 flex cursor-pointer items-center gap-1.5 rounded-lg px-2 text-left font-semibold whitespace-nowrap outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring",
                  compact ? "min-h-7" : "min-h-11",
                )}
              >
                {column.label}
                {sorted && <Icon aria-hidden className="size-4 shrink-0" />}
                <span className="sr-only">
                  {sorted === "asc" ? ", sorted A to Z" : sorted === "desc" ? ", sorted Z to A" : ", select to sort"}
                </span>
              </button>
            </th>
          );
        })}
      </tr>
      {open && (
        <>
          <tr id={`${formId}-row`} className="bg-muted/50">
            <td className={compact ? "py-0.5 pr-2" : "py-3 pr-2"}>
              {/* The boxes below belong to this form through their `form` attribute. Enter searches. */}
              <form id={formId} onSubmit={submit} role="search" aria-label={`Search ${meta.title}`}>
                {/* Needed for Enter to submit a form with several boxes; screen-reader users can use it too. */}
                <button type="submit" className="sr-only">
                  Search
                </button>
              </form>
              {active && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  onClick={() => onSearch({})}
                  disabled={pending}
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X aria-hidden className="size-5" />
                </Button>
              )}
            </td>
            {columns.map((column, i) => (
              <td key={column.key} className={compact ? "py-0.5 pr-2" : "py-3 pr-4"}>
                <Input
                  form={formId}
                  name={column.key}
                  type="search"
                  autoComplete="off"
                  spellCheck={false}
                  defaultValue={search[column.key]}
                  placeholder={column.searchHint ?? "Search"}
                  title={SEARCH_TIP}
                  aria-label={`Search ${column.label}`}
                  className={cn("bg-background", compact ? "h-7 min-w-16 px-2" : "min-w-24")}
                  autoFocus={i === 0 && openedByClick}
                />
              </td>
            ))}
          </tr>
        </>
      )}
    </thead>
  );
}

function StackedSearch({
  meta,
  columns,
  search,
  onSearch,
}: {
  meta: ListMeta;
  columns: ColumnMeta[];
  search: Record<string, string>;
  onSearch: (search: Record<string, string>) => void;
}) {
  const active = Object.keys(search).length > 0;
  const [open, setOpen] = useState(active);
  const formId = `${meta.id}-stacked-search`;
  return (
    <div className="mt-2">
      <Button
        type="button"
        variant={open ? "secondary" : "outline"}
        aria-expanded={open}
        aria-controls={formId}
        onClick={() => setOpen(!open)}
        className={cn(active && "text-primary")}
      >
        <SearchIcon aria-hidden className="size-5" />
        {open ? "Hide search" : "Search"}
      </Button>
      {open && (
        <form
          id={formId}
          role="search"
          aria-label={`Search ${meta.title}`}
          className="mt-3 grid gap-4 rounded-xl border bg-muted/50 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const next: Record<string, string> = {};
            for (const c of columns) {
              const value = String(data.get(c.key) ?? "").trim();
              if (value) next[c.key] = value;
            }
            onSearch(next);
          }}
        >
          {columns.map((c) => (
            <div key={c.key} className="grid gap-1">
              <label htmlFor={`${formId}-${c.key}`} className="text-base font-medium">
                {c.label}
              </label>
              <Input
                id={`${formId}-${c.key}`}
                name={c.key}
                type="search"
                autoComplete="off"
                spellCheck={false}
                defaultValue={search[c.key]}
                placeholder={c.searchHint}
                className="bg-background"
              />
            </div>
          ))}
          <SearchActions formId={formId} active={active} pending={false} onClear={() => onSearch({})} />
        </form>
      )}
    </div>
  );
}

function SearchActions({
  formId,
  active,
  pending,
  onClear,
  compact = false,
}: {
  formId: string;
  active: boolean;
  pending: boolean;
  onClear: () => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap items-center", compact ? "gap-2" : "gap-3")}>
      <Button type="submit" form={formId} disabled={pending} className={cn(compact && "h-9")}>
        <SearchIcon aria-hidden className="size-5" />
        {pending ? "Searching…" : "Search"}
      </Button>
      {active && (
        <Button type="button" variant="outline" onClick={onClear} disabled={pending} className={cn(compact && "h-9")}>
          <X aria-hidden className="size-5" />
          Clear search
        </Button>
      )}
      <p className="text-base text-muted-foreground">
        {compact
          ? "Press Enter or Search. Rows must match every filled box."
          : "Press Enter or Search. Rows must match every box you fill in; capitals don't matter."}
      </p>
    </div>
  );
}

/** Phones and tablets have no column headers, so sorting is a dropdown. */
function MobileSort({ meta, sort, onSort }: { meta: ListMeta; sort: Sort; onSort: (sort: Sort) => void }) {
  return (
    <label className="flex w-full items-center gap-2 text-base sm:w-auto lg:hidden">
      <span className="font-medium whitespace-nowrap">Sort by</span>
      <NativeSelect
        value={`${sort.column}.${sort.dir}`}
        onChange={(e) => {
          const [column, dir] = e.target.value.split(".");
          onSort({ column, dir: dir === "desc" ? "desc" : "asc" });
        }}
      >
        {meta.columns.flatMap((c) => [
          <option key={`${c.key}.asc`} value={`${c.key}.asc`}>
            {c.label} {c.type === "date" ? "(oldest first)" : "(A to Z)"}
          </option>,
          <option key={`${c.key}.desc`} value={`${c.key}.desc`}>
            {c.label} {c.type === "date" ? "(newest first)" : "(Z to A)"}
          </option>,
        ])}
      </NativeSelect>
    </label>
  );
}

/**
 * The active filter as a trail: "All > Unit contains EMER > Status is Pending".
 * Select a step to go back to it (later steps are removed); × removes one step.
 */
function Breadcrumbs({ meta, filter, onChange }: { meta: ListMeta; filter: Group; onChange: (filter: Group) => void }) {
  const crumb =
    "min-h-9 rounded-lg px-2 text-base font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring";
  const separator = filter.match === "any" ? "or" : ">";
  return (
    <nav aria-label="Active filter" className="basis-full lg:basis-auto">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1">
        {filter.exclude && filter.items.length > 0 && <li className="px-1 text-base font-semibold">not</li>}
        {filter.items.map((item, i) => {
          const text = describe(meta, item);
          const last = i === filter.items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && (
                <span aria-hidden className="px-1 text-muted-foreground">
                  {separator}
                </span>
              )}
              {last ? (
                <span className="px-2 text-base" aria-current="true">
                  {text}
                </span>
              ) : (
                <button
                  type="button"
                  className={crumb}
                  onClick={() => onChange({ ...filter, items: filter.items.slice(0, i + 1) })}
                >
                  {text}
                </button>
              )}
              <button
                type="button"
                onClick={() => onChange({ ...filter, items: filter.items.filter((_, j) => j !== i) })}
                aria-label={`Remove “${text}” from the filter`}
                title="Remove"
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
              >
                <X aria-hidden className="size-4" />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

type Nav = ReturnType<typeof useListNav>;

/**
 * The ☰ list menu: group by, columns, export, reset, row spacing and
 * (admins) the default for everyone. Kept behind one icon so the list starts
 * high on the screen (Ryan, 2026-11-18).
 */
function ListMenu(props: ListViewProps & { nav: Nav; density: Density; onDensity: (density: Density) => void }) {
  const { meta, layoutFrom, isAdmin, nav, density, onDensity } = props;
  const [dialog, setDialog] = useState<"columns" | "group" | "default" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const set = (d: typeof dialog) => (open: boolean) => setDialog(open ? d : null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="List menu" title="List menu">
            <Menu aria-hidden className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[80dvh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto">
          <DropdownMenuItem onSelect={() => setDialog("columns")}>
            <Columns3 aria-hidden />
            Choose columns…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("group")}>
            <GroupIcon aria-hidden />
            Group by…
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={props.exportHref} download>
              <Download aria-hidden />
              Export CSV
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={layoutFrom !== "personal"}
            onSelect={() => {
              nav.reset();
              setMessage("Your columns, sort and filter are back to the default.");
            }}
          >
            <RotateCcw aria-hidden />
            <span>
              Reset to default
              {layoutFrom !== "personal" && (
                <span className="block text-muted-foreground">You&apos;re using it now</span>
              )}
            </span>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onSelect={() => setDialog("default")}>
              <Settings2 aria-hidden />
              Set as default for everyone…
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-muted-foreground">Row spacing (this browser)</DropdownMenuLabel>
          {(["compact", "comfortable"] as const).map((d) => (
            <DropdownMenuItem key={d} onSelect={() => onDensity(d)} aria-checked={density === d} role="menuitemradio">
              {density === d ? <Check aria-hidden /> : <span aria-hidden className="size-5" />}
              {d === "compact" ? "Compact rows" : "Comfortable rows (tablets, gloves)"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {message && (
        <p role="status" className="sr-only">
          {message}
        </p>
      )}

      {dialog === "group" && (
        <GroupByDialog
          meta={meta}
          groupBy={props.groupBy}
          setOpen={set("group")}
          onChoose={(g) => nav.go({ groupBy: g })}
        />
      )}
      {dialog === "columns" && (
        <ColumnPicker
          meta={meta}
          columns={props.columns}
          pending={nav.pending}
          open
          setOpen={set("columns")}
          onSave={(cols) => nav.refresh(() => saveMyColumns(meta.id, cols))}
        />
      )}
      <Dialog open={dialog === "default"} onOpenChange={set("default")}>
        <DialogContent>
          <DialogTitle>Set as default for everyone?</DialogTitle>
          <DialogDescription>
            Everyone who opens {meta.title} will start with your current columns, sort, filter and grouping. People who
            have changed their own view keep theirs until they choose Reset to default.
          </DialogDescription>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => {
                setDialog(null);
                nav.refresh(() =>
                  setDefaultLayout(meta.id, {
                    columns: props.columns,
                    sort: props.sort,
                    filter: props.filter,
                    groupBy: props.groupBy,
                  }),
                );
                setMessage("Saved as the default for everyone.");
              }}
            >
              Set as default for everyone
            </Button>
            <Button size="lg" variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** ☰ → Group by…: pick a column to group the list by, or no grouping. */
function GroupByDialog({
  meta,
  groupBy,
  setOpen,
  onChoose,
}: {
  meta: ListMeta;
  groupBy: string | null;
  setOpen: (open: boolean) => void;
  onChoose: (groupBy: string | null) => void;
}) {
  const [choice, setChoice] = useState(groupBy ?? "");
  return (
    <Dialog open onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>Group by</DialogTitle>
        <DialogDescription>
          Rows are shown in groups, one for each value of the column, with how many rows each group has.
        </DialogDescription>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
            onChoose(choice || null);
          }}
        >
          <label className="grid gap-2">
            <span className="font-medium">Column</span>
            <NativeSelect value={choice} onChange={(e) => setChoice(e.target.value)}>
              <option value="">No grouping</option>
              {meta.columns.filter(canGroupBy).map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                  {c.type === "date" ? " (by day)" : ""}
                </option>
              ))}
            </NativeSelect>
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg">
              {choice ? "Group" : "Show without groups"}
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmptyBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6 flex max-w-xl flex-col items-start gap-2 rounded-xl border border-dashed border-input p-6">
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-base text-muted-foreground">{children}</p>
    </div>
  );
}

/** The ✨ panel's opening text for a list, naming its private columns (never sent to the AI). */
function aiIntro(meta: ListMeta) {
  const hidden = meta.columns.filter((c) => c.private).map((c) => c.label);
  const names =
    hidden.length > 1 ? `${hidden.slice(0, -1).join(", ")} and ${hidden[hidden.length - 1]}` : (hidden[0] ?? "");
  return `Ask about the ${meta.noun.many} matching your current filter. I can count, compare, chart, and build filters for you.${
    names ? ` ${names} ${hidden.length > 1 ? "are" : "is"} never sent to the AI.` : ""
  }`;
}

/** Starter questions that fit the list: grouped by its first choice (else text) column, over time by its first date. */
function aiSuggestions(meta: ListMeta) {
  const open = meta.columns.filter((c) => !c.private);
  const choice = open.find((c) => c.type === "choice") ?? open.find((c) => c.type === "text");
  const date = open.find((c) => c.type === "date");
  return [
    `Summarize these ${meta.noun.many}`,
    ...(choice ? [`How many ${meta.noun.many} per ${choice.label.toLowerCase()}? Show a chart`] : []),
    ...(date ? [`Show ${meta.noun.many} over time by week`] : []),
    `Build a filter for ${meta.noun.many} that…`,
  ];
}
```

### URL navigation helper: `src/components/list-view/use-list-nav.ts`

```ts
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetMyLayout, saveMyView } from "@/lib/list-view/actions";
import { listHref, type Group, type Sort } from "@/lib/list-view/types";

export type ListState = {
  filter: Group;
  sort: Sort;
  search: Record<string, string>;
  page: number;
  groupBy: string | null;
  pageSize: number;
};

/**
 * Moves the list to a new filter, sort, search or page by changing the page
 * address (so Back works and a view can be shared). Filter and sort changes are
 * also remembered as the person's own view, so the list opens that way next time.
 */
export function useListNav(listId: string, path: string, current: ListState) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go(changes: Partial<ListState>) {
    const next: ListState = { ...current, page: 1, ...changes };
    const remember = "filter" in changes || "sort" in changes || "groupBy" in changes || "pageSize" in changes;
    startTransition(async () => {
      if (remember)
        await saveMyView(listId, {
          filter: next.filter,
          sort: next.sort,
          groupBy: next.groupBy,
          pageSize: next.pageSize,
        });
      router.push(listHref(path, next), { scroll: false });
    });
  }

  function refresh(task?: () => Promise<unknown>) {
    startTransition(async () => {
      await task?.();
      router.refresh();
    });
  }

  /** Back to the default layout, with no filter or sort in the address. */
  function reset() {
    startTransition(async () => {
      await resetMyLayout(listId);
      router.push(path, { scroll: false });
      router.refresh();
    });
  }

  return { go, refresh, reset, pending };
}
```

### Pager: `src/components/list-view/pager.tsx`

```tsx
"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { PAGE_SIZES } from "@/lib/list-view/types";
import { cn } from "@/lib/utils";

/**
 * Pagination in the list's top bar, at the right (Ryan, 2026-11-18): rows per page (10, 20, 50, 100, 500;
 * remembered per person), which rows are showing, and First / Previous / page
 * numbers / Next / Last.
 */
export function Pager({
  page,
  pageSize,
  matching,
  noun,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  matching: number;
  noun: string;
  onPage: (page: number) => void;
  onPageSize: (pageSize: number) => void;
}) {
  if (matching === 0) return null;
  const pages = Math.max(1, Math.ceil(matching / pageSize));
  const current = Math.min(page, pages);
  const from = (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, matching);
  // Up to 5 page numbers around the current page.
  const start = Math.max(1, Math.min(current - 2, pages - 4));
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);
  const icon = "size-8";

  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base">
      <label className="flex items-center gap-2">
        <span className="whitespace-nowrap text-muted-foreground">Rows</span>
        <NativeSelect className="h-8 w-auto" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </NativeSelect>
      </label>
      <p className="whitespace-nowrap text-muted-foreground">
        {from}–{to} of {matching} {noun}
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={icon}
            disabled={current <= 1}
            onClick={() => onPage(1)}
            aria-label="First page"
            title="First page"
          >
            <ChevronsLeft aria-hidden className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={icon}
            disabled={current <= 1}
            onClick={() => onPage(current - 1)}
            aria-label="Previous page"
            title="Previous page"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </Button>
          {numbers.map((n) => (
            <Button
              key={n}
              variant={n === current ? "secondary" : "ghost"}
              className={cn("h-8 min-w-8 px-1.5", n === current && "font-semibold text-primary")}
              aria-current={n === current ? "page" : undefined}
              aria-label={`Page ${n}`}
              onClick={() => onPage(n)}
            >
              {n}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className={icon}
            disabled={current >= pages}
            onClick={() => onPage(current + 1)}
            aria-label="Next page"
            title="Next page"
          >
            <ChevronRight aria-hidden className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={icon}
            disabled={current >= pages}
            onClick={() => onPage(pages)}
            aria-label={`Last page (${pages})`}
            title={`Last page (${pages})`}
          >
            <ChevronsRight aria-hidden className="size-5" />
          </Button>
        </div>
      )}
    </nav>
  );
}
```

### Column picker (slush bucket): `src/components/list-view/column-picker.tsx`

```tsx
"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ListMeta } from "@/lib/list-view/types";

/**
 * Choose columns ServiceNow "slush bucket" style (Ryan, 2026-11-18): Available on
 * the left, Selected on the right in display order. Select one or more, then
 * Add / Remove / Move up / Move down; double-click moves a column across.
 * Saved for this person only. Mount it when opening, so it starts from the
 * current columns.
 */
export function ColumnPicker({
  meta,
  columns,
  onSave,
  pending,
  open,
  setOpen,
}: {
  meta: ListMeta;
  columns: string[];
  onSave: (columns: string[]) => void;
  pending: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [shown, setShown] = useState(columns);
  const [pickAvailable, setPickAvailable] = useState<string[]>([]);
  const [pickSelected, setPickSelected] = useState<string[]>([]);
  const [find, setFind] = useState("");
  const label = (key: string) => meta.columns.find((c) => c.key === key)?.label ?? key;
  const available = meta.columns
    .filter((c) => !shown.includes(c.key))
    .filter((c) => c.label.toLowerCase().includes(find.trim().toLowerCase()))
    .sort((a, b) => a.label.localeCompare(b.label));

  function add(keys = pickAvailable) {
    setShown([...shown, ...keys.filter((k) => !shown.includes(k))]);
    setPickSelected(keys);
    setPickAvailable([]);
  }
  function remove(keys = pickSelected) {
    const next = shown.filter((k) => !keys.includes(k));
    if (!next.length) return; // keep at least one column
    setShown(next);
    setPickAvailable(keys);
    setPickSelected([]);
  }
  function move(by: -1 | 1) {
    const next = [...shown];
    const order = by === -1 ? [...next.keys()] : [...next.keys()].reverse();
    for (const i of order) {
      const j = i + by;
      if (pickSelected.includes(next[i]) && j >= 0 && j < next.length && !pickSelected.includes(next[j])) {
        [next[i], next[j]] = [next[j], next[i]];
      }
    }
    setShown(next);
  }
  const selectedValues = (el: HTMLSelectElement) => [...el.selectedOptions].map((o) => o.value);
  const canUp = pickSelected.length > 0 && !pickSelected.includes(shown[0]);
  const canDown = pickSelected.length > 0 && !pickSelected.includes(shown[shown.length - 1]);
  const box =
    "h-72 w-full rounded-lg border border-input bg-background p-1 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring [&>option]:rounded [&>option]:px-2 [&>option]:py-1";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl">
        <DialogTitle>Columns</DialogTitle>
        <DialogDescription>
          Select columns and use the arrows, or double-click to move one across. Selected columns show left to right in
          the order listed. Hold Ctrl (⌘ on a Mac) or Shift to pick several. Only your view changes.
        </DialogDescription>

        <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
          <div className="grid gap-2">
            <label htmlFor="columns-available" className="font-medium">
              Available ({meta.columns.length - shown.length})
            </label>
            <Input
              type="search"
              placeholder="Find a column"
              aria-label="Find an available column"
              value={find}
              onChange={(e) => setFind(e.target.value)}
              className="h-9"
            />
            <select
              id="columns-available"
              multiple
              className={box}
              value={pickAvailable}
              onChange={(e) => setPickAvailable(selectedValues(e.currentTarget))}
              onDoubleClick={(e) => {
                const option = (e.target as HTMLElement).closest("option");
                if (option) add([option.value]);
              }}
            >
              {available.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center gap-2 sm:flex-col">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!pickAvailable.length}
              onClick={() => add()}
              aria-label="Add selected columns"
              title="Add"
            >
              <ChevronRight aria-hidden className="size-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!pickSelected.length || pickSelected.length >= shown.length}
              onClick={() => remove()}
              aria-label="Remove selected columns"
              title="Remove"
            >
              <ChevronLeft aria-hidden className="size-5" />
            </Button>
          </div>

          <div className="grid gap-2">
            <label htmlFor="columns-selected" className="font-medium">
              Selected ({shown.length})
            </label>
            <div className="h-9" aria-hidden />
            <select
              id="columns-selected"
              multiple
              className={box}
              value={pickSelected}
              onChange={(e) => setPickSelected(selectedValues(e.currentTarget))}
              onDoubleClick={(e) => {
                const option = (e.target as HTMLElement).closest("option");
                if (option) remove([option.value]);
              }}
            >
              {shown.map((key) => (
                <option key={key} value={key}>
                  {label(key)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center gap-2 sm:flex-col">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!canUp}
              onClick={() => move(-1)}
              aria-label="Move selected columns up (left)"
              title="Move up"
            >
              <ArrowUp aria-hidden className="size-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!canDown}
              onClick={() => move(1)}
              aria-label="Move selected columns down (right)"
              title="Move down"
            >
              <ArrowDown aria-hidden className="size-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            disabled={pending}
            onClick={() => {
              onSave(shown);
              setOpen(false);
            }}
          >
            Save columns
          </Button>
          <Button size="lg" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Filter builder: `src/components/list-view/filter-builder.tsx`

```tsx
"use client";

import { useState } from "react";
import { Filter, FolderPlus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  MAX_CONDITIONS,
  MAX_DEPTH,
  OPERATORS,
  columnOf,
  needsValue,
  type Condition,
  type Group,
  type ListMeta,
  type Operator,
} from "@/lib/list-view/types";

/**
 * The filter builder (funnel button): conditions joined by "all" (AND) or "any"
 * (OR), with groups for mixing the two and "Leave these out" for NOT.
 * Changes stay in the builder until Run filter.
 */
export function FilterBuilder({
  meta,
  filter,
  onRun,
  onClose,
  pending,
}: {
  meta: ListMeta;
  filter: Group;
  onRun: (filter: Group) => void;
  onClose: () => void;
  pending: boolean;
}) {
  const [draft, setDraft] = useState<Group>(() =>
    filter.items.length ? filter : { ...filter, items: [newCondition(meta)] },
  );
  const total = countConditions(draft);

  return (
    <section aria-labelledby="filter-builder-title" className="mt-4 rounded-xl border bg-muted/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 id="filter-builder-title" className="flex items-center gap-2 text-lg font-semibold">
          <Filter aria-hidden className="size-5" />
          Filter
        </h2>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close filter">
          <X aria-hidden className="size-6" />
        </Button>
      </div>
      <form
        className="mt-3 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onRun(draft);
        }}
      >
        <GroupEditor meta={meta} group={draft} depth={1} canAdd={total < MAX_CONDITIONS} onChange={setDraft} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={pending}>
            <Filter aria-hidden className="size-5" />
            {pending ? "Filtering…" : "Run filter"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => onRun({ kind: "group", match: "all", items: [] })}
            disabled={pending}
          >
            Clear filter
          </Button>
          <p className="text-base text-muted-foreground">Conditions with an empty value are skipped.</p>
        </div>
      </form>
    </section>
  );
}

function GroupEditor({
  meta,
  group,
  depth,
  canAdd,
  onChange,
  onRemove,
}: {
  meta: ListMeta;
  group: Group;
  depth: number;
  canAdd: boolean;
  onChange: (group: Group) => void;
  onRemove?: () => void;
}) {
  const update = (i: number, item: Condition | Group | null) =>
    onChange({
      ...group,
      items: item ? group.items.map((x, j) => (j === i ? item : x)) : group.items.filter((_, j) => j !== i),
    });

  return (
    <fieldset className={depth > 1 ? "grid gap-3 rounded-lg border border-input bg-background p-3" : "grid gap-3"}>
      <legend className="sr-only">{depth > 1 ? "Group of conditions" : "Conditions"}</legend>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 text-base">
          <span className="font-medium">{depth > 1 ? "In this group, match" : "Show rows that match"}</span>
          <NativeSelect
            className="w-auto"
            value={group.match}
            onChange={(e) => onChange({ ...group, match: e.target.value === "any" ? "any" : "all" })}
          >
            <option value="all">all of these (AND)</option>
            <option value="any">any of these (OR)</option>
          </NativeSelect>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-base">
          <input
            type="checkbox"
            className="size-6 accent-primary"
            checked={!!group.exclude}
            onChange={(e) => onChange({ ...group, exclude: e.target.checked || undefined })}
          />
          Leave these out (NOT)
        </label>
        {onRemove && (
          <Button type="button" variant="ghost" onClick={onRemove} className="ml-auto">
            <Trash2 aria-hidden className="size-5" />
            Remove group
          </Button>
        )}
      </div>

      <ol className="grid gap-3">
        {group.items.map((item, i) => (
          <li key={i} className="grid gap-2">
            {i > 0 && (
              <span className="text-base font-semibold text-muted-foreground">
                {group.match === "any" ? "or" : "and"}
              </span>
            )}
            {item.kind === "group" ? (
              <GroupEditor
                meta={meta}
                group={item}
                depth={depth + 1}
                canAdd={canAdd}
                onChange={(g) => update(i, g)}
                onRemove={() => update(i, null)}
              />
            ) : (
              <ConditionEditor
                meta={meta}
                condition={item}
                onChange={(c) => update(i, c)}
                onRemove={() => update(i, null)}
              />
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!canAdd}
          onClick={() => onChange({ ...group, items: [...group.items, newCondition(meta)] })}
        >
          <Plus aria-hidden className="size-5" />
          Add condition
        </Button>
        {depth < MAX_DEPTH && (
          <Button
            type="button"
            variant="outline"
            disabled={!canAdd}
            onClick={() =>
              onChange({
                ...group,
                items: [
                  ...group.items,
                  { kind: "group", match: group.match === "all" ? "any" : "all", items: [newCondition(meta)] },
                ],
              })
            }
          >
            <FolderPlus aria-hidden className="size-5" />
            Add group
          </Button>
        )}
      </div>
    </fieldset>
  );
}

function ConditionEditor({
  meta,
  condition,
  onChange,
  onRemove,
}: {
  meta: ListMeta;
  condition: Condition;
  onChange: (c: Condition) => void;
  onRemove: () => void;
}) {
  const column = columnOf(meta, condition.column) ?? meta.columns[0];
  const ops = OPERATORS[column.type];
  const label = `${column.label} ${ops.find((o) => o.op === condition.op)?.label ?? ""}`;

  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(10rem,1fr)_minmax(9rem,auto)_minmax(10rem,1.5fr)_auto] sm:items-center">
      <NativeSelect
        aria-label="Column"
        value={column.key}
        onChange={(e) => {
          const next = columnOf(meta, e.target.value) ?? column;
          const keepOp = OPERATORS[next.type].some((o) => o.op === condition.op);
          onChange({
            kind: "condition",
            column: next.key,
            op: keepOp ? condition.op : OPERATORS[next.type][0].op,
            value: next.type === column.type && next.type === "text" ? condition.value : "",
          });
        }}
      >
        {meta.columns.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label={`How to compare ${column.label}`}
        value={condition.op}
        onChange={(e) => onChange({ ...condition, op: e.target.value as Operator })}
      >
        {ops.map((o) => (
          <option key={o.op} value={o.op}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
      {needsValue(condition.op) ? (
        column.options ? (
          <NativeSelect
            aria-label={`Value for ${label}`}
            value={condition.value ?? ""}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
          >
            <option value="">Choose…</option>
            {column.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        ) : (
          <Input
            aria-label={`Value for ${label}`}
            type={column.type === "date" ? "date" : "text"}
            value={condition.value ?? ""}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            autoComplete="off"
            className="bg-background"
          />
        )
      ) : (
        <span className="hidden sm:block" />
      )}
      <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label={`Remove condition: ${label}`}>
        <Trash2 aria-hidden className="size-5" />
      </Button>
    </div>
  );
}

function newCondition(meta: ListMeta): Condition {
  const column = meta.columns[0];
  return { kind: "condition", column: column.key, op: OPERATORS[column.type][0].op, value: "" };
}

function countConditions(group: Group): number {
  return group.items.reduce((n, item) => n + (item.kind === "group" ? countConditions(item) : 1), 0);
}
```

### Right-click menu: `src/components/list-view/cell-menu.tsx`

```tsx
"use client";

import { useState, type ReactElement } from "react";
import { ContextMenu } from "radix-ui";
import { Copy, Filter, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addFilterStep,
  type ColumnMeta,
  type Condition,
  type Group,
  type ListMeta,
  type ListRow,
} from "@/lib/list-view/types";

type Choice = { value: string; match: Condition | Group; out: Condition | Group };
type Target = { column: ColumnMeta; text: string; choices: Choice[] };

/**
 * Right-click a value in the table: "Show matching" keeps only rows with that
 * value, "Filter out" removes them (as in ServiceNow). Either adds a step to the
 * current filter, shown in the breadcrumbs. Wraps the table's <tbody>; each
 * data cell carries data-row and data-col.
 */
export function CellMenu({
  meta,
  rows,
  filter,
  onFilter,
  children,
}: {
  meta: ListMeta;
  rows: ListRow[];
  filter: Group;
  onFilter: (filter: Group) => void;
  children: ReactElement;
}) {
  const [target, setTarget] = useState<Target | null>(null);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        asChild
        onContextMenu={(event) => {
          const cell = (event.target as HTMLElement).closest<HTMLElement>("td[data-col]");
          const row = rows.find((r) => String(r.id) === cell?.dataset.row);
          const column = meta.columns.find((c) => c.key === cell?.dataset.col);
          setTarget(
            row && column ? { column, text: row.cells[column.key] ?? "", choices: choicesFor(column, row) } : null,
          );
        }}
      >
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="z-50 min-w-64 max-w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-lg border bg-popover p-1 text-base text-popover-foreground shadow-lg">
          {!target ? (
            <ContextMenu.Label className="px-3 py-2 text-muted-foreground">
              Right-click a value to filter by it.
            </ContextMenu.Label>
          ) : (
            <>
              <ContextMenu.Label className="truncate px-3 py-1.5 text-muted-foreground">
                {target.column.label}: {target.text || "(empty)"}
              </ContextMenu.Label>
              {target.choices.map((choice) => (
                <div key={choice.value}>
                  {target.choices.length > 1 && (
                    <ContextMenu.Label className="px-3 pt-1 text-sm font-semibold">{choice.value}</ContextMenu.Label>
                  )}
                  <Item onSelect={() => onFilter(addFilterStep(filter, choice.match))}>
                    <Filter aria-hidden />
                    Show matching
                  </Item>
                  <Item onSelect={() => onFilter(addFilterStep(filter, choice.out))}>
                    <FilterX aria-hidden />
                    Filter out
                  </Item>
                </div>
              ))}
              {target.text && (
                <>
                  <ContextMenu.Separator className="-mx-1 my-1 h-px bg-border" />
                  <Item onSelect={() => navigator.clipboard?.writeText(target.text).catch(() => {})}>
                    <Copy aria-hidden />
                    Copy
                  </Item>
                </>
              )}
            </>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

function Item({ className, ...props }: React.ComponentProps<typeof ContextMenu.Item>) {
  return (
    <ContextMenu.Item
      className={cn(
        "flex min-h-9 cursor-pointer items-center gap-3 rounded-md px-3 outline-none select-none focus:bg-accent [&_svg]:size-5 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

const pacificDay = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" });

/** The filter steps for the value in one cell. A list cell (e.g. Roles) offers each of its values. */
function choicesFor(column: ColumnMeta, row: ListRow): Choice[] {
  const text = row.cells[column.key] ?? "";
  const cond = (op: Condition["op"], value?: string): Condition => ({
    kind: "condition",
    column: column.key,
    op,
    value,
  });
  const empty: Choice = { value: "(empty)", match: cond("empty"), out: cond("notEmpty") };

  switch (column.type) {
    case "text":
      return text ? [{ value: text, match: cond("is", text), out: cond("isNot", text) }] : [empty];
    case "choice": {
      const option = column.options?.find((o) => o.label === text);
      return option ? [{ value: text, match: cond("is", option.value), out: cond("isNot", option.value) }] : [empty];
    }
    case "multi": {
      const values = text ? text.split(", ") : [];
      const options = values.map((label) => column.options?.find((o) => o.label === label)).filter((o) => !!o);
      if (!options.length) return [empty];
      return options.map((o) => ({
        value: o.label,
        match: cond("includes", o.value),
        out: cond("notIncludes", o.value),
      }));
    }
    case "date": {
      const iso = row.dates?.[column.key];
      if (!iso) return [empty];
      const on = cond("on", pacificDay.format(new Date(iso)));
      return [{ value: text, match: on, out: { kind: "group", match: "all", exclude: true, items: [on] } }];
    }
  }
}
```

### Saved filters menu (★): `src/components/list-view/favorites-menu.tsx`

```tsx
"use client";

import { useState } from "react";
import { Star, StarOff, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Group, SavedFilter } from "@/lib/list-view/types";
import { cn } from "@/lib/utils";
import { DeleteFiltersDialog, SaveFilterDialog } from "./saved-filters";

/**
 * ★ Favorites in the list bar (Ryan, 2026-11-18): filters people save for
 * themselves, plus ones admins share with everyone. Pick one to apply it.
 * The star is filled when the current filter is one of them.
 */
export function FavoritesMenu({
  listId,
  saved,
  filter,
  isAdmin,
  onApply,
  onChanged,
}: {
  listId: string;
  saved: SavedFilter[];
  filter: Group;
  isAdmin: boolean;
  onApply: (filter: Group) => void;
  onChanged: (task?: () => Promise<unknown>) => void;
}) {
  const [dialog, setDialog] = useState<"save" | "delete" | null>(null);
  const mine = saved.filter((f) => !f.shared);
  const shared = saved.filter((f) => f.shared);
  const current = filter.items.length ? JSON.stringify(filter) : null;
  const active = saved.find((f) => current && JSON.stringify(f.filter) === current);
  const canDelete = saved.some((f) => f.mine || (f.shared && isAdmin));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8", active && "text-primary")}
            aria-label={active ? `Favorites (showing ${active.name})` : "Favorites"}
            title={active ? `Favorite: ${active.name}` : "Favorites"}
          >
            <Star aria-hidden className={cn("size-5", active && "fill-current")} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[80dvh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto">
          <DropdownMenuLabel className="text-muted-foreground">Your favorites</DropdownMenuLabel>
          {mine.length === 0 && (
            <DropdownMenuLabel className="font-normal text-muted-foreground">
              None yet. Filter the list, then save it here.
            </DropdownMenuLabel>
          )}
          {mine.map((f) => (
            <DropdownMenuItem key={f.id} onSelect={() => onApply(f.filter)}>
              <Star aria-hidden className={cn(active?.id === f.id && "fill-current text-primary")} />
              {f.name}
            </DropdownMenuItem>
          ))}
          {shared.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-muted-foreground">Shared with everyone</DropdownMenuLabel>
              {shared.map((f) => (
                <DropdownMenuItem key={f.id} onSelect={() => onApply(f.filter)}>
                  <Users aria-hidden className={cn(active?.id === f.id && "text-primary")} />
                  {f.name}
                </DropdownMenuItem>
              ))}
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!filter.items.length || !!active} onSelect={() => setDialog("save")}>
            <Star aria-hidden />
            <span>
              Save current filter as a favorite…
              {!filter.items.length && <span className="block text-muted-foreground">Filter the list first</span>}
            </span>
          </DropdownMenuItem>
          {canDelete && (
            <DropdownMenuItem onSelect={() => setDialog("delete")}>
              <StarOff aria-hidden />
              Remove a favorite…
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <SaveFilterDialog
        listId={listId}
        filter={filter}
        canShare={isAdmin}
        open={dialog === "save"}
        setOpen={(o) => setDialog(o ? "save" : null)}
        onSaved={() => onChanged()}
      />
      <DeleteFiltersDialog
        listId={listId}
        saved={saved}
        canShare={isAdmin}
        open={dialog === "delete"}
        setOpen={(o) => setDialog(o ? "delete" : null)}
        onChanged={(task) => onChanged(task)}
      />
    </>
  );
}
```

### Saved filters dialogs: `src/components/list-view/saved-filters.tsx`

```tsx
"use client";

import { useState } from "react";
import { CircleAlert, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { deleteFilter, saveFilter } from "@/lib/list-view/actions";
import type { Group, SavedFilter } from "@/lib/list-view/types";

/** "Save current filter…" from the list menu. Admins can share the filter with everyone. */
export function SaveFilterDialog({
  listId,
  filter,
  canShare,
  open,
  setOpen,
  onSaved,
}: {
  listId: string;
  filter: Group;
  canShare: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSaved: () => void;
}) {
  return (
    <SaveDialog
      open={open}
      onOpenChange={setOpen}
      canShare={canShare}
      onSave={async (name, share) => {
        const result = await saveFilter(listId, { name, filter, shared: share });
        if (result.ok) {
          setOpen(false);
          onSaved();
        }
        return result;
      }}
    />
  );
}

/** "Delete a saved filter…" from the list menu: your own, or (admins) shared ones. Asks before deleting. */
export function DeleteFiltersDialog({
  listId,
  saved,
  canShare,
  open,
  setOpen,
  onChanged,
}: {
  listId: string;
  saved: SavedFilter[];
  canShare: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  onChanged: (task: () => Promise<unknown>) => void;
}) {
  const deletable = saved.filter((s) => s.mine || (s.shared && canShare));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>Remove a favorite</DialogTitle>
        <DialogDescription>
          Removing takes it off ★ Favorites{canShare ? " (for everyone, if it's shared)" : ""}. It doesn&apos;t change
          any data.
        </DialogDescription>
        {deletable.length === 0 ? (
          <p>You have no favorites to remove.</p>
        ) : (
          <ul className="grid gap-2">
            {deletable.map((s) => (
              <DeleteRow key={s.id} filter={s} onDelete={() => onChanged(() => deleteFilter(listId, s.id))} />
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SaveDialog({
  open,
  onOpenChange,
  canShare,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canShare: boolean;
  onSave: (name: string, share: boolean) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setError(null);
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogTitle>Save as a favorite</DialogTitle>
        <DialogDescription>
          It will be listed under ★ Favorites so you can use it again with one click.
        </DialogDescription>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setSaving(true);
            const result = await onSave(String(data.get("name") ?? ""), data.get("share") === "on");
            setSaving(false);
            setError(result.ok ? null : (result.error ?? "Couldn't save the filter. Try again."));
          }}
        >
          {error && (
            <Alert variant="destructive">
              <CircleAlert aria-hidden />
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <label htmlFor="saved-filter-name" className="text-base font-medium">
              Name
            </label>
            <Input id="saved-filter-name" name="name" maxLength={60} autoComplete="off" required />
          </div>
          {canShare && (
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3">
              <input type="checkbox" name="share" className="mt-0.5 size-6 accent-primary" />
              <span>
                <span className="block font-medium">Share with everyone</span>
                <span className="block text-muted-foreground">Everyone who uses this list will see it.</span>
              </span>
            </label>
          )}
          <div className="flex gap-3">
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? "Saving…" : "Save favorite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteRow({ filter, onDelete }: { filter: SavedFilter; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border p-2 pl-3">
      <span className="flex-1">
        {filter.name}
        {filter.shared && <span className="block text-muted-foreground">Shared with everyone</span>}
      </span>
      {confirming ? (
        <>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 aria-hidden className="size-5" />
            Yes, remove “{filter.name}”
          </Button>
          <Button variant="outline" onClick={() => setConfirming(false)}>
            Keep
          </Button>
        </>
      ) : (
        <Button variant="outline" onClick={() => setConfirming(true)}>
          <Trash2 aria-hidden className="size-5" />
          Remove
        </Button>
      )}
    </li>
  );
}
```

### Relative time ("3 weeks ago"): `src/components/list-view/relative-time.tsx`

```tsx
"use client";

import { useSyncExternalStore } from "react";

/** One clock for every "… ago" on the page, ticking once a minute. */
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let minute = 0;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (!timer) {
    minute = Math.floor(Date.now() / 60_000);
    timer = setInterval(() => {
      minute = Math.floor(Date.now() / 60_000);
      listeners.forEach((l) => l());
    }, 60_000);
  }
  return () => {
    listeners.delete(onChange);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const getMinute = () => minute || Math.floor(Date.now() / 60_000);

/**
 * "31 mins ago", "5 hours ago", "3 days ago", like ServiceNow. Worked out in the
 * browser (so it's always current), and empty until then.
 */
export function RelativeTime({ iso }: { iso: string }) {
  const now = useSyncExternalStore(subscribe, getMinute, () => null);
  if (now === null) return null;
  return <>{ago(new Date(iso).getTime(), now * 60_000)}</>;
}

function ago(then: number, now: number) {
  const future = then > now;
  const minutes = Math.round(Math.abs(now - then) / 60_000);
  const say = (n: number, unit: string) => {
    const text = `${n} ${unit}${n === 1 ? "" : "s"}`;
    return future ? `in ${text}` : `${text} ago`;
  };
  if (minutes < 1) return "just now";
  if (minutes < 60) return say(minutes, "min");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return say(hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 14) return say(days, "day");
  if (days < 60) return say(Math.round(days / 7), "week");
  if (days < 730) return say(Math.round(days / 30.44), "month");
  return say(Math.round(days / 365.25), "year");
}
```

### Loading skeleton: `src/components/list-view/list-loading.tsx`

```tsx
/** Placeholder while a list loads, about the size of the real thing. */
export function ListLoading({ noun }: { noun: string }) {
  return (
    <div role="status">
      <div aria-hidden className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-11 w-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <p className="mt-4 text-lg text-muted-foreground">Loading {noun}…</p>
      <div aria-hidden className="mt-4 grid gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
```

### CSV export route: `src/app/api/lists/[id]/export/route.ts`

Checks sign-in and the list's permission; exports every matching row; formula-safe.

```ts
import type { NextRequest } from "next/server";
import { findCurrentUser } from "@/lib/dal";
import { effectiveLayout, queryList } from "@/lib/list-view/server";
import { EMPTY_FILTER, cleanFilter, columnOf, parseSort, readSearch } from "@/lib/list-view/types";
import { listSource } from "@/lib/lists/registry";
import { can } from "@/lib/roles";

/**
 * Export CSV: every row matching the list's current filter, search and sort
 * (not just the page on screen), with the person's columns in their order.
 * Opens in Excel.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/lists/[id]/export">) {
  const user = await findCurrentUser();
  if (!user) return new Response("Sign in to CS Tracker first.", { status: 401 });
  const source = listSource((await ctx.params).id);
  if (!source) return new Response("Not found", { status: 404 });
  if (source.permission && !can(user, source.permission)) {
    return new Response("You don't have access to this list.", { status: 403 });
  }

  const { meta } = source;
  const url = request.nextUrl.searchParams;
  const params = Object.fromEntries(url.entries());
  const { layout } = await effectiveLayout(meta, user.id);
  let filter = layout.filter;
  if (url.has("filter")) {
    try {
      filter = url.get("filter") === "all" ? EMPTY_FILTER : cleanFilter(meta, JSON.parse(url.get("filter")!));
    } catch {
      filter = EMPTY_FILTER;
    }
  }
  const sort = parseSort(meta, url.get("sort") ?? undefined) ?? layout.sort;
  const search = readSearch(meta, params);

  const { rows } = await queryList(source, { columns: layout.columns, sort, filter, search, all: true });
  const columns = layout.columns.map((key) => columnOf(meta, key)!).filter(Boolean);
  const lines = [
    columns.map((c) => csvCell(c.label)).join(","),
    ...rows.map((row) => columns.map((c) => csvCell(row.cells[c.key] ?? "")).join(",")),
  ];
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  // The byte-order mark makes Excel read the file as UTF-8.
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cs-tracker-${meta.id}-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Quotes a value for CSV, and stops Excel from running text that starts like a formula. */
function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
```

### AI assistant: route: `src/app/api/lists/[id]/ai/route.ts`

Checks sign-in and the list's permission on every request; streams newline-separated JSON events.

```ts
import type { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { count } from "drizzle-orm";
import { getDb } from "@/db";
import {
  aiConfigured,
  runListAssistant,
  warmListAssistant,
  type AiEvent,
  type ChatTurn,
} from "@/lib/ai/list-assistant";
import { findCurrentUser } from "@/lib/dal";
import { whereFor } from "@/lib/list-view/server";
import { cleanFilter, cleanSort, readSearch } from "@/lib/list-view/types";
import { listSource } from "@/lib/lists/registry";
import { can } from "@/lib/roles";

/**
 * POST: one question to the list's AI assistant. Body: { messages, filter, sort, search, voice }.
 * Body { warm: true }: warm-up as a voice conversation starts (no answer; 204).
 * Streams newline-separated JSON events (AiEvent) as the answer is written.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/lists/[id]/ai">) {
  const user = await findCurrentUser();
  if (!user) return Response.json({ error: "Sign in to CS Tracker first." }, { status: 401 });
  const source = listSource((await ctx.params).id);
  if (!source) return Response.json({ error: "Not found" }, { status: 404 });
  if (source.permission && !can(user, source.permission)) {
    return Response.json({ error: "You don't have access to this list." }, { status: 403 });
  }
  if (!aiConfigured()) {
    return Response.json(
      { error: "The AI assistant isn't set up yet. An admin needs to add the Anthropic API key in Vercel." },
      { status: 503 },
    );
  }

  let body: { messages?: unknown; filter?: unknown; sort?: unknown; search?: unknown; voice?: unknown; warm?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  if (body.warm === true) {
    await warmListAssistant(
      { source, filter: cleanFilter(source.meta, undefined), sort: source.meta.defaultLayout.sort, search: {} },
      request.signal,
    ).catch((error) => console.error("AI warm-up failed", error));
    return new Response(null, { status: 204 });
  }
  const turns = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  const history: ChatTurn[] = turns
    .filter(
      (t): t is ChatTurn =>
        !!t &&
        (t.role === "user" || t.role === "assistant") &&
        typeof t.content === "string" &&
        t.content.trim() !== "",
    )
    .map((t) => ({ role: t.role, content: t.content.slice(0, 4000) }));
  if (history[history.length - 1]?.role !== "user")
    return Response.json({ error: "Ask a question first." }, { status: 400 });
  // The API expects the conversation to start with the person.
  while (history[0]?.role === "assistant") history.shift();

  const { meta } = source;
  const filter = cleanFilter(meta, body.filter);
  const sort = cleanSort(meta, body.sort);
  const search = readSearch(
    meta,
    body.search && typeof body.search === "object"
      ? Object.fromEntries(
          Object.entries(body.search as Record<string, unknown>).map(([k, v]) => [`q_${k}`, String(v)]),
        )
      : {},
  );
  const db = getDb();
  const [[{ matching }], [{ total }]] = await Promise.all([
    db
      .select({ matching: count() })
      .from(source.table)
      .where(whereFor(source, filter, search)),
    db.select({ total: count() }).from(source.table),
  ]);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: AiEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        await runListAssistant(
          { source, filter, sort, search, matching, total },
          history,
          emit,
          request.signal,
          body.voice === true,
        );
      } catch (error) {
        if (!request.signal.aborted) {
          console.error("AI assistant failed", error instanceof Anthropic.APIError ? error.status : "", error);
          const message =
            error instanceof Anthropic.RateLimitError
              ? "The AI service is busy. Wait a moment and try again."
              : error instanceof Anthropic.AuthenticationError
                ? "The AI key in Vercel isn't working. An admin needs to check ANTHROPIC_API_KEY."
                : "Something went wrong with the AI assistant. Try again.";
          emit({ type: "error", message });
        }
      }
      emit({ type: "done" });
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
```

### AI assistant: system prompt, tools and tool loop: `src/lib/ai/list-assistant.ts`

Adapt the model names to what the app's Anthropic account offers. **Keep the private-column rules.**

```ts
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { count } from "drizzle-orm";
import { getDb } from "@/db";
import { aggregateList, queryList, whereFor, type ListSource } from "@/lib/list-view/server";
import {
  OPERATORS,
  cleanFilter,
  columnOf,
  describe,
  type ColumnMeta,
  type Condition,
  type Group,
  type ListMeta,
  type Sort,
} from "@/lib/list-view/types";

/**
 * The ✨ AI assistant on list views (docs/features/ai-assistant.md). Claude
 * answers questions about the rows matching the person's current filter, using
 * tools that run real database queries, and can propose a filter or a chart.
 * Columns marked `private` (patient identifiers) are never sent to Claude and
 * can't be used in its tools.
 */

const MODEL = "claude-opus-5-5";
const MAX_TURNS = 8;
/** Spoken conversations use a faster model at low effort (Ryan, 2026-11-18); typed questions stay on Opus. */
const VOICE_MODEL = "claude-sonnet-5-5";
const VOICE_STYLE = `

This is a spoken conversation: your words are read aloud the moment you write them, and the person may interrupt. Answer in one to three short, natural sentences of plain speech, most important point first. No markdown, symbols, lists, headings or tables. Only draw a chart or propose a filter if the person asks for one.
Before you use a tool, always first say a very short, natural lead-in of three to six words that fits the question (for example "Let me count those." or "Checking the orders now."), so the person isn't left in silence while you look. Don't repeat it afterwards; go straight to the answer.`;

export type { AiEvent, ChartSpec, ChatTurn } from "./types";
import type { AiEvent, ChartSpec, ChatTurn } from "./types";

export function aiConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export const publicColumns = (meta: ListMeta) => meta.columns.filter((c) => !c.private);

/** True when a filter only uses columns the assistant may see. */
function onlyPublic(meta: ListMeta, item: Condition | Group): boolean {
  if (item.kind === "group") return item.items.every((i) => onlyPublic(meta, i));
  return !columnOf(meta, item.column)?.private;
}

/**
 * The filter with every condition on a private column taken out (and any group
 * left empty), so what the person typed into a hidden column (a name, an MRN…)
 * never reaches the model. `hidden` says whether anything was removed.
 */
export function withoutPrivate(meta: ListMeta, group: Group): { filter: Group; hidden: boolean } {
  let hidden = false;
  const strip = (g: Group): Group => ({
    ...g,
    items: g.items.flatMap((item): (Condition | Group)[] => {
      if (item.kind === "group") {
        const inner = strip(item);
        return inner.items.length ? [inner] : [];
      }
      if (columnOf(meta, item.column)?.private) {
        hidden = true;
        return [];
      }
      return [item];
    }),
  });
  return { filter: strip(group), hidden };
}

/** Stable per list, so it can be cached: the assistant's role, rules and the list's columns. */
function systemPrompt(meta: ListMeta) {
  const columns = publicColumns(meta).map((c: ColumnMeta) => ({
    key: c.key,
    label: c.label,
    type: c.type,
    ...(c.options ? { values: c.options.map((o) => ({ value: o.value, label: o.label })) } : {}),
    comparisons: OPERATORS[c.type].map((o) => o.op),
  }));
  const hidden = meta.columns.filter((c) => c.private).map((c) => c.label);
  return `You are the data assistant in CS Tracker, the Central Services (sterile processing) app at Loma Linda University Health. You help staff understand and filter the "${meta.title}" list. The people asking are busy and not data specialists.

How to answer:
- Get every number from the tools. Never estimate or make up counts. count_rows works on all rows matching the person's current filter, not just the page on screen.
- To find or narrow rows ("show me…", "only…", "filter to…"), call propose_filter. The person sees your filter and decides whether to apply it; say in one sentence what it will show.
- When a chart helps (comparisons across groups, change over time), call show_chart with numbers you got from count_rows. Use "bar" for groups and "line" for dates. Keep to 4 series or fewer and about 30 categories or fewer (group the rest as "Other").
- Answers are short and plain: a sentence or two, then a few bullets or a small table if needed. Answers may be read aloud, so don't rely on symbols or long tables.
- If something can't be answered from these columns, say so and suggest what could.

Privacy: patient identifiers (${hidden.join(", ") || "none"}) are deliberately hidden from you. Never ask for them, guess them or filter on them. If asked, explain that the person can use the search boxes under the column headers instead.

The list's columns (use the key in tools; dates are Pacific time; filter values for dates are YYYY-MM-DD):
${JSON.stringify(columns)}

Filter format (used by propose_filter and the optional "filter" of other tools):
{"kind":"group","match":"all"|"any","exclude"?:true,"items":[ condition or group, ... ]}
condition: {"kind":"condition","column":"<key>","op":"<one of the column's comparisons>","value":"<text, a listed value, or YYYY-MM-DD>"} ("empty"/"notEmpty" take no value). Groups nest up to 3 levels; "exclude": true means NOT.`;
}

const filterSchema = {
  type: "object",
  description:
    'A filter group, e.g. {"kind":"group","match":"all","items":[{"kind":"condition","column":"unit","op":"is","value":"EMER"}]}',
  properties: {
    kind: { type: "string", enum: ["group"] },
    match: { type: "string", enum: ["all", "any"] },
    exclude: { type: "boolean" },
    items: { type: "array", items: { type: "object" } },
  },
  required: ["kind", "match", "items"],
};

export const tools: Anthropic.Beta.BetaTool[] = [
  {
    name: "count_rows",
    description:
      "Count rows matching the person's current filter (plus an optional extra filter), optionally grouped by one or two columns. Date columns group by day, week or month. Returns up to 50 groups.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        group_by: {
          type: "array",
          items: { type: "string" },
          maxItems: 2,
          description: "Column keys to group by (0-2).",
        },
        date_bucket: { type: "string", enum: ["day", "week", "month"], description: "How to group date columns." },
        filter: { ...filterSchema, description: "Optional extra filter, combined with the current one (AND)." },
      },
    },
  },
  {
    name: "list_rows",
    description:
      "Look at individual rows matching the current filter (plus an optional extra filter): up to 25 rows, chosen columns only. Patient identifiers are never included.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        columns: { type: "array", items: { type: "string" }, description: "Column keys to include." },
        filter: { ...filterSchema, description: "Optional extra filter, combined with the current one (AND)." },
        sort_column: { type: "string" },
        sort_dir: { type: "string", enum: ["asc", "desc"] },
        limit: { type: "integer", minimum: 1, maximum: 25 },
      },
    },
  },
  {
    name: "propose_filter",
    description:
      "Show the person a filter for the list with an Apply button. It replaces their current filter if they apply it, so include any current conditions they still want.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        filter: filterSchema,
        explanation: { type: "string", description: "One plain sentence: what the filter shows." },
      },
      required: ["filter", "explanation"],
    },
  },
  {
    name: "show_chart",
    description: "Draw a chart in the conversation from numbers you got with count_rows.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["bar", "line"] },
        title: { type: "string" },
        categories: { type: "array", items: { type: "string" }, description: "X-axis labels, in order." },
        series: {
          type: "array",
          maxItems: 4,
          items: {
            type: "object",
            properties: { name: { type: "string" }, values: { type: "array", items: { type: "number" } } },
            required: ["name", "values"],
          },
        },
        x_label: { type: "string" },
        y_label: { type: "string" },
      },
      required: ["kind", "title", "categories", "series"],
    },
  },
];

export type Ctx = { source: ListSource; filter: Group; sort: Sort; search: Record<string, string> };

/** The person's filter plus an extra one from Claude, validated. Error text when the extra one isn't usable. */
function combined(ctx: Ctx, extra: unknown): { filter: Group } | { error: string } {
  if (extra === undefined || extra === null) return { filter: ctx.filter };
  const clean = cleanFilter(ctx.source.meta, extra);
  if (!onlyPublic(ctx.source.meta, clean)) return { error: "That filter uses a hidden column (patient identifier)." };
  if (!clean.items.length)
    return { error: "The extra filter had no valid conditions. Check column keys, comparisons and values." };
  return { filter: ctx.filter.items.length ? { kind: "group", match: "all", items: [ctx.filter, clean] } : clean };
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/** Runs one tool. Returns the text Claude sees, and maybe an event for the browser. */
export type ToolOutcome = { result: string; event?: AiEvent; isError?: boolean };

export async function runTool(
  ctx: Ctx,
  name: string,
  input: Record<string, unknown>,
): Promise<{ result: string; event?: AiEvent; isError?: boolean }> {
  const { meta } = ctx.source;
  const bad = (message: string) => ({ result: message, isError: true });

  if (name === "count_rows") {
    const groupBy = input.group_by === undefined ? [] : input.group_by;
    if (!isStringArray(groupBy) || groupBy.length > 2) return bad("group_by must be a list of 0-2 column keys.");
    for (const key of groupBy) {
      const column = columnOf(meta, key);
      if (!column) return bad(`Unknown column "${key}".`);
      if (column.private) return bad(`"${column.label}" is a hidden column (patient identifier).`);
    }
    const bucket = input.date_bucket === "week" || input.date_bucket === "month" ? input.date_bucket : "day";
    const f = combined(ctx, input.filter);
    if ("error" in f) return bad(f.error);
    const where = whereFor(ctx.source, f.filter, ctx.search);
    if (!groupBy.length) {
      const [{ n }] = await getDb().select({ n: count() }).from(ctx.source.table).where(where);
      return { result: JSON.stringify({ count: n }) };
    }
    return { result: JSON.stringify(await aggregateList(ctx.source, where, groupBy, bucket)) };
  }

  if (name === "list_rows") {
    const wanted = input.columns === undefined ? publicColumns(meta).map((c) => c.key) : input.columns;
    if (!isStringArray(wanted)) return bad("columns must be a list of column keys.");
    const columns = wanted.filter((k) => columnOf(meta, k) && !columnOf(meta, k)!.private).slice(0, 12);
    if (!columns.length) return bad("No usable columns. Patient identifiers are hidden.");
    const f = combined(ctx, input.filter);
    if ("error" in f) return bad(f.error);
    const sortColumn =
      typeof input.sort_column === "string" && columnOf(meta, input.sort_column) ? input.sort_column : null;
    const sort: Sort = sortColumn ? { column: sortColumn, dir: input.sort_dir === "desc" ? "desc" : "asc" } : ctx.sort;
    const limit = Math.min(25, Math.max(1, Number(input.limit) || 10));
    const { rows, matching } = await queryList(ctx.source, {
      columns,
      sort,
      filter: f.filter,
      search: ctx.search,
      pageSize: limit,
    });
    return {
      result: JSON.stringify({
        matching,
        rows: rows.map((r) => Object.fromEntries(columns.map((k) => [columnOf(meta, k)!.label, r.cells[k] || null]))),
      }),
    };
  }

  if (name === "propose_filter") {
    const filter = cleanFilter(meta, input.filter);
    if (!filter.items.length)
      return bad("The filter had no valid conditions. Check column keys, comparisons and values.");
    if (!onlyPublic(meta, filter)) return bad("Filters can't use hidden columns (patient identifiers).");
    const description = filter.items.map((i) => describe(meta, i)).join(filter.match === "any" ? " or " : " and ");
    const explanation = typeof input.explanation === "string" ? input.explanation.slice(0, 300) : "";
    return {
      result: `Shown to the person as: ${description}. They decide whether to apply it.`,
      event: { type: "filter", filter, description, explanation },
    };
  }

  if (name === "show_chart") {
    const kind = input.kind === "line" ? "line" : "bar";
    const categories = isStringArray(input.categories) ? input.categories.slice(0, 60) : null;
    const series = Array.isArray(input.series)
      ? (input.series as { name?: unknown; values?: unknown }[]).slice(0, 4).map((s) => ({
          name: typeof s.name === "string" ? s.name.slice(0, 60) : "Series",
          values: Array.isArray(s.values)
            ? s.values.map((v) => (typeof v === "number" && Number.isFinite(v) ? v : 0))
            : [],
        }))
      : null;
    if (!categories?.length || !series?.length || series.some((s) => s.values.length !== categories.length)) {
      return bad("Each series needs one number per category.");
    }
    const chart: ChartSpec = {
      kind,
      title: typeof input.title === "string" ? input.title.slice(0, 120) : "Chart",
      categories,
      series,
      xLabel: typeof input.x_label === "string" ? input.x_label.slice(0, 60) : undefined,
      yLabel: typeof input.y_label === "string" ? input.y_label.slice(0, 60) : undefined,
    };
    return { result: "The chart is shown to the person.", event: { type: "chart", chart } };
  }

  return bad(`Unknown tool ${name}.`);
}

export const STATUS: Record<string, string> = {
  count_rows: "Counting…",
  list_rows: "Looking at rows…",
  propose_filter: "Building a filter…",
  show_chart: "Drawing a chart…",
  open_list: "Building a filter…",
};

/**
 * Runs one assistant turn: streams Claude's answer and tool activity to `emit`.
 * History is plain text (earlier answers); the person's current view goes in front
 * of the newest question.
 */
/** Warm-up before a voice conversation (docs/features/ai-assistant.md → Voice). */
export function warmListAssistant(ctx: Ctx, signal?: AbortSignal) {
  return warmUp({ system: systemPrompt(ctx.source.meta), tools, signal });
}

export async function runListAssistant(
  ctx: Ctx & { matching: number; total: number },
  history: ChatTurn[],
  emit: (event: AiEvent) => void,
  signal: AbortSignal,
  voice = false,
) {
  const { meta } = ctx.source;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  // Never describe filter conditions or searches on private columns: their values
  // are exactly the patient details the model must not see. The tools still apply
  // them on the server, so counts stay right; the model is only told they exist.
  const { filter: shown, hidden: hiddenFilter } = withoutPrivate(meta, ctx.filter);
  const searches = Object.entries(ctx.search).filter(([k]) => !columnOf(meta, k)?.private);
  const hiddenSearch = searches.length < Object.keys(ctx.search).length;
  const view = [
    `Today is ${today} (Pacific).`,
    `The person is looking at ${ctx.matching} of ${ctx.total} ${meta.noun.many}.`,
    shown.items.length
      ? `Current filter: ${shown.items.map((i) => describe(meta, i)).join(shown.match === "any" ? " or " : " and ")} (as JSON: ${JSON.stringify(shown)})`
      : hiddenFilter
        ? "Current filter: only on hidden columns."
        : "No filter: all rows.",
    hiddenFilter && shown.items.length ? "The filter also has conditions on hidden columns (not shown to you)." : "",
    searches.length
      ? `Column searches: ${searches.map(([k, v]) => `${columnOf(meta, k)?.label ?? k} "${v}"`).join(", ")}`
      : "",
    hiddenSearch ? "There are also searches on hidden columns (not shown to you)." : "",
  ]
    .filter(Boolean)
    .join("\n");

  const messages: Anthropic.Beta.BetaMessageParam[] = history
    .slice(0, -1)
    .map((t) => ({ role: t.role, content: t.content }));
  const question = history[history.length - 1]?.content ?? "";
  messages.push({ role: "user", content: `<current_view>\n${view}\n</current_view>\n\n${question}` });

  await runToolLoop({
    system: systemPrompt(meta),
    tools,
    messages,
    execute: (name, input) => runTool(ctx, name, input),
    emit,
    signal,
    voice,
  });
}

/**
 * The shared Claude loop for the assistants: streams text to `emit`, runs the
 * tools Claude asks for with `execute`, and stops on an answer, a refusal, an
 * over-long reply or after 8 steps.
 */
/** The model settings every assistant call shares; voice turns are faster and spoken-style. */
function requestBase(system: string, tools: Anthropic.Beta.BetaTool[], voice: boolean) {
  return {
    model: voice ? VOICE_MODEL : MODEL,
    output_config: { effort: voice ? ("low" as const) : ("medium" as const) },
    // If a safety check declines, Anthropic re-runs it on its recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default" as const,
    system: [
      {
        type: "text" as const,
        text: voice ? system + VOICE_STYLE : system,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    tools,
  };
}

/**
 * Voice warm-up, sent when a voice conversation starts: a one-token call with the same
 * instructions and tools, so the first real question finds them already cached by
 * Anthropic (a faster first word) and this server already awake.
 */
export async function warmUp({
  system,
  tools,
  signal,
}: {
  system: string;
  tools: Anthropic.Beta.BetaTool[];
  signal?: AbortSignal;
}) {
  await new Anthropic().beta.messages.create(
    { ...requestBase(system, tools, true), max_tokens: 1, messages: [{ role: "user", content: "Hello" }] },
    { signal },
  );
}

export async function runToolLoop({
  system,
  tools,
  messages,
  execute,
  emit,
  signal,
  voice = false,
}: {
  /** A spoken turn: faster model, low effort, short spoken answers. */
  voice?: boolean;
  system: string;
  tools: Anthropic.Beta.BetaTool[];
  messages: Anthropic.Beta.BetaMessageParam[];
  execute: (name: string, input: Record<string, unknown>) => Promise<ToolOutcome>;
  emit: (event: AiEvent) => void;
  signal: AbortSignal;
}) {
  const client = new Anthropic();
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const stream = client.beta.messages.stream(
      {
        ...requestBase(system, tools, voice),
        max_tokens: 16000,
        messages,
      },
      { signal },
    );
    stream.on("text", (text) => emit({ type: "text", text }));

    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal") {
      emit({ type: "error", message: "The assistant couldn't help with that request." });
      return;
    }
    const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (message.stop_reason === "max_tokens" && toolUses.length) {
      emit({ type: "error", message: "The answer was too long. Try a narrower question." });
      return;
    }
    if (message.stop_reason !== "tool_use" || !toolUses.length) return;

    messages.push({ role: "assistant", content: message.content });
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const use of toolUses) {
      emit({ type: "status", text: STATUS[use.name] ?? "Working…" });
      const input = use.input && typeof use.input === "object" ? (use.input as Record<string, unknown>) : {};
      try {
        const { result, event, isError } = await execute(use.name, input);
        if (event) emit(event);
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: result,
          ...(isError ? { is_error: true } : {}),
        });
      } catch (error) {
        console.error("AI tool failed", use.name, error);
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: "The query failed. Try another way.",
          is_error: true,
        });
      }
    }
    messages.push({ role: "user", content: results });
  }
  emit({ type: "text", text: "\n\n(Stopped: that took too many steps. Try a simpler question.)" });
}
```

### AI assistant: shared event and chart types: `src/lib/ai/types.ts`

```ts
/** Shared by the AI assistant's server code and the browser panel (no server imports here). */
import type { Group } from "@/lib/list-view/types";

export type ChartSpec = {
  kind: "bar" | "line";
  title: string;
  categories: string[];
  series: { name: string; values: number[] }[];
  xLabel?: string;
  yLabel?: string;
};

/** What the browser receives, one JSON object per line. */
export type AiEvent =
  | { type: "text"; text: string }
  | { type: "status"; text: string }
  | { type: "chart"; chart: ChartSpec }
  | { type: "filter"; filter: Group; description: string; explanation: string }
  | { type: "link"; href: string; label: string; description: string }
  | { type: "error"; message: string }
  | { type: "done" };

export type ChatTurn = { role: "user" | "assistant"; content: string };
```

### AI assistant: panel (chat, charts, proposed filters, voice): `src/components/list-view/ai-panel.tsx`

````tsx
"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AudioLines,
  CircleAlert,
  Filter,
  LoaderCircle,
  Mic,
  MicOff,
  Send,
  Square,
  Timer,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AiEvent, ChartSpec, ChatTurn } from "@/lib/ai/types";
import type { Group } from "@/lib/list-view/types";
import { cn } from "@/lib/utils";
import { AiSparkle } from "@/components/ai-sparkle";
import { AiChart } from "./ai-chart";
import { MicLevel } from "./mic-level";
import { pickVoice, saveVoiceName, useVoices } from "./voices";
import { AzureListener, AzureSpeaker, SentenceSplitter, azureSpeechAvailable, isEcho } from "./azure-voice";

/** An answer's pieces in the order they arrived: text, charts and proposed filters. */
type Part =
  | { type: "text"; text: string }
  | { type: "link"; href: string; label: string; description: string }
  | { type: "chart"; chart: ChartSpec }
  | { type: "filter"; filter: Group; description: string; explanation: string };
type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  parts: Part[];
  status?: string;
  error?: string;
  done: boolean;
  /** Voice answers: how long each step took (docs/features/ai-assistant.md → Voice timing). */
  timing?: string;
};

// --- Browser speech (Web Speech API). Recognition sends audio to the browser maker's service (Google in Chrome, Microsoft in Edge); read-back runs on the computer. ---
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onaudiostart?: (() => void) | null;
  onsoundstart?: (() => void) | null;
  onspeechstart?: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};
type RecognitionCtor = new () => Recognition;
function recognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}
const noop = () => () => {};
const useCanListen = () =>
  useSyncExternalStore(
    noop,
    () => !!recognitionCtor(),
    () => false,
  );
const useCanSpeak = () =>
  useSyncExternalStore(
    noop,
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => false,
  );

/** Said while Claude looks something up, if it didn't say a lead-in itself. */
const FILLERS = ["One moment.", "Let me check.", "Checking now."];

/** Markdown into something that sounds right when read aloud. */
function speakable(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\|/g, " ")
    .replace(/[*_`#>]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/-{3,}/g, "")
    .trim();
}

/**
 * ✨ Ask AI about the list (docs/features/ai-assistant.md). Questions go to Claude
 * with the person's current filter; answers stream in with charts and proposed
 * filters (applied only when the person selects Apply). Voice: the microphone
 * dictates a question, "Read answers aloud" speaks answers, and Talk runs a
 * hands-free loop: listen, answer aloud, listen again.
 */
export function AiPanel({
  endpoint,
  context,
  title,
  intro,
  suggestions,
  placeholder,
  onApplyFilter,
  onClose,
  autoAsk,
}: {
  /** Where questions go, e.g. /api/lists/orders/ai or /api/ai. */
  endpoint: string;
  /** Sent with every question, e.g. the list's current filter. */
  context?: Record<string, unknown>;
  title: string;
  intro: string;
  suggestions: string[];
  placeholder: string;
  /** Lists: apply a proposed filter here. */
  onApplyFilter?: (filter: Group) => void;
  onClose: () => void;
  /** Ask this as soon as the panel opens (e.g. "Hear an update"); speak: read the answer aloud. */
  autoAsk?: { text: string; speak: boolean };
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  // The level bars start only once the recognizer has the microphone, so they never compete for it.
  const [micReady, setMicReady] = useState(false);
  // Talk mode: sessions in a row where speech was detected but no words came back.
  const emptySpeech = useRef(0);
  const [readAloud, setReadAloud] = useState(false);
  const [talking, setTalking] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // Azure AI Speech (natural voice, interruptions) when it's set up; else the browser's own speech.
  const [azure, setAzure] = useState(false);
  useEffect(() => {
    let live = true;
    void azureSpeechAvailable().then((ok) => live && setAzure(ok));
    return () => {
      live = false;
    };
  }, []);
  const [speaker] = useState(() => new AzureSpeaker());
  const [listener] = useState(() => new AzureListener());
  useEffect(
    () => () => {
      speaker.dispose();
      listener.stop();
    },
    [speaker, listener],
  );
  // Voice warm-up, once per panel: open the Azure voice connection and wake our server and
  // Claude (instructions cached), so the first spoken answer doesn't pay for any of it.
  const warmed = useRef(false);
  function warmVoice() {
    speaker.warm();
    if (warmed.current) return;
    warmed.current = true;
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...context, warm: true }),
    }).catch(() => {});
  }
  const azureListening = useRef(false);
  // A question spoken while the previous answer was still being cancelled.
  const pending = useRef<string | null>(null);
  const canListen = useCanListen() || azure;
  const canSpeak = useCanSpeak() || azure;
  const nextId = useRef(1);
  const abort = useRef<AbortController | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const talkingRef = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);
  // "Hear an update" and similar: ask once when the panel opens.
  const asked = useRef(false);
  useEffect(() => {
    if (autoAsk && !asked.current) {
      asked.current = true;
      void ask(autoAsk.text, autoAsk.speak);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on open
  }, []);

  // Voice callbacks run later, so they read the latest conversation and settings from refs.
  const latest = useRef({ messages, busy, readAloud });
  useEffect(() => {
    latest.current = { messages, busy, readAloud };
  });

  const update = (id: number, change: (m: Message) => Message) =>
    setMessages((all) => all.map((m) => (m.id === id ? change(m) : m)));
  const scrollDown = () =>
    requestAnimationFrame(() =>
      scroller.current?.scrollTo({
        top: scroller.current.scrollHeight,
        behavior: "smooth",
      }),
    );

  // --- Read-back. Spoken a sentence or two at a time: Chrome cuts off long speech after about
  // 15 s and can drop the "finished" event, which used to stall the voice conversation. ---
  const speechQueue = useRef<{
    chunks: string[];
    id: number;
    after?: () => void;
  } | null>(null);
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null); // kept so Chrome doesn't drop its events

  function speak(id: number, text: string, after?: () => void) {
    if (azure) {
      stopSpeaking();
      setSpeakingId(id);
      const splitter = new SentenceSplitter((s) => speaker.say(speakable(s)));
      splitter.push(text);
      splitter.flush();
      speaker.end(() => {
        setSpeakingId(null);
        after?.();
      });
      return;
    }
    if (!canSpeak) return after?.();
    window.speechSynthesis.cancel();
    const chunks = (speakable(text).match(/[^.!?\n]+[.!?]*\s*/g) ?? [])
      .map((c) => c.trim())
      .filter(Boolean)
      .reduce<string[]>((acc, c) => {
        if (acc.length && acc[acc.length - 1].length + c.length < 400) acc[acc.length - 1] += ` ${c}`;
        else acc.push(c);
        return acc;
      }, []);
    if (!chunks.length) return after?.();
    speechQueue.current = { chunks, id, after };
    setSpeakingId(id);
    // A short pause after cancel(): Chrome can ignore speak() called right after it.
    setTimeout(speakNext, 60);
  }

  function speakNext() {
    const queue = speechQueue.current;
    if (!queue) return;
    const chunk = queue.chunks.shift();
    if (chunk === undefined) {
      speechQueue.current = null;
      currentUtterance.current = null;
      setSpeakingId(null);
      queue.after?.();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = "en-US";
    // The person's chosen voice, else the best natural-sounding English voice (voices.ts).
    const voice = pickVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.onend = speakNext;
    utterance.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") return;
      setVoiceError(
        e.error === "not-allowed"
          ? "The browser blocked reading aloud. Click anywhere in the panel, then select Read aloud on the answer."
          : `Couldn't read the answer aloud (${e.error}). Check the computer's sound and volume.`,
      );
      speakNext();
    };
    currentUtterance.current = utterance;
    // Chrome can get stuck "paused" after a while; resume() wakes it up.
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    speechQueue.current = null;
    currentUtterance.current = null;
    speaker.stop();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
  }

  // --- Azure listening: one recognizer that keeps running while the AI answers, so the
  // person can interrupt (like Claude's voice mode). A phrase ends after ~0.6 s of quiet. ---
  function resetIdle() {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (talkingRef.current && !latest.current.busy && !speaker.speaking) {
        setVoiceError("Voice conversation ended: nothing was heard for 30 seconds.");
        stopTalking();
      } else if (talkingRef.current) resetIdle();
    }, 30_000);
  }

  /** The person started talking over the AI: stop speaking and stop the answer in progress. */
  function interrupt() {
    stopSpeaking();
    abort.current?.abort();
  }

  async function azureListen() {
    if (azureListening.current) return;
    warmVoice();
    azureListening.current = true;
    listeningRef.current = true;
    setVoiceError(null);
    setListening(true);
    const conversation = talkingRef.current;
    if (conversation) resetIdle();
    let started = false;
    try {
      started = await listener.start({
        onPartial: (text) => {
          if (speaker.audible && isEcho(text, speaker.recent)) return; // the AI's own voice
          if (conversation) resetIdle();
          const words = text.trim().split(/\s+/).length;
          if (conversation && words >= 2 && (speaker.speaking || latest.current.busy)) interrupt();
          setInput(text);
        },
        onFinal: (text) => {
          if (speaker.audible && isEcho(text, speaker.recent)) return;
          setInput("");
          if (!conversation) stopListening();
          if (speaker.speaking || latest.current.busy) interrupt();
          if (latest.current.busy) pending.current = text;
          else void ask(text, true);
        },
        onError: (message) => {
          setVoiceError(message);
          stopTalking();
        },
      });
      setMicReady(started);
    } catch {
      setVoiceError(
        "Couldn't start listening. Check the microphone (the mic icon in the address bar), then try again.",
      );
    }
    if (!started) {
      azureListening.current = false;
      listeningRef.current = false;
      setListening(false);
      if (talkingRef.current) stopTalking();
    }
  }

  function stopAzureListening() {
    listener.stop();
    azureListening.current = false;
    listeningRef.current = false;
    setListening(false);
    setMicReady(false);
  }

  // --- Listening. The mic button takes one question; Talk keeps listening through pauses and
  // sends after about 1.5 s of quiet once something was said. ---
  const listeningRef = useRef(false);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    silenceTimer.current = idleTimer.current = null;
  }

  function listen() {
    if (azure) {
      stopSpeaking();
      void azureListen();
      return;
    }
    const Ctor = recognitionCtor();
    if (!Ctor || listeningRef.current) return;
    setVoiceError(null);
    stopSpeaking();
    const conversation = talkingRef.current;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = conversation;
    let heard = "";
    // How far the browser got, to explain a silent failure.
    const stage = { audio: false, speech: false, error: "" };
    rec.onaudiostart = () => {
      stage.audio = true;
      setMicReady(true);
    };
    rec.onsoundstart = () => (stage.audio = true);
    rec.onspeechstart = () => (stage.speech = true);
    let sent = false;

    const send = () => {
      if (sent) return;
      sent = true;
      clearTimers();
      rec.stop();
    };
    if (conversation) {
      // Nothing said for 30 seconds ends the conversation.
      idleTimer.current = setTimeout(() => {
        if (!heard.trim()) {
          setVoiceError("Voice conversation ended: nothing was heard for 30 seconds.");
          stopTalking();
        }
      }, 30_000);
    }

    rec.onresult = (event) => {
      heard = Array.from(event.results)
        .map((r) => r[0]?.transcript ?? "")
        .join("");
      setInput(heard);
      if (conversation) {
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(send, 1500);
      }
    };
    rec.onerror = (event) => {
      stage.error = event.error;
      if (event.error === "not-allowed") {
        setVoiceError(
          "The browser blocked the microphone. Allow it in the address bar (the camera/mic icon), then try again.",
        );
        stopTalking();
      } else if (event.error === "service-not-allowed") {
        setVoiceError(
          "The browser's speech-to-text service is turned off on this computer (often by IT policy), so it can't turn your voice into words. You can still type your question.",
        );
        stopTalking();
      } else if (event.error === "language-not-supported") {
        setVoiceError(
          "The browser's speech service doesn't support English (US) here. You can still type your question.",
        );
        stopTalking();
      } else if (event.error === "audio-capture") {
        setVoiceError("No microphone was found. Check that one is connected.");
        stopTalking();
      } else if (event.error === "network") {
        setVoiceError("Speech recognition needs an internet connection to the browser's speech service.");
        stopTalking();
      }
      // "no-speech" and "aborted" are normal pauses: onend handles them.
    };
    rec.onend = () => {
      listeningRef.current = false;
      recognition.current = null;
      setMicReady(false);
      const noWordsBack =
        "Edge heard you speaking, but its speech service sent back no words. This usually means Windows' online speech recognition is off: Windows Settings → Privacy & security → Speech → Online speech recognition → On (on an LLU computer, IT may control this). You can still type your question.";
      if (!heard.trim() && stage.speech && talkingRef.current && ++emptySpeech.current >= 2) {
        setVoiceError(`${noWordsBack} (code: ${stage.error || "no-result"})`);
        stopTalking();
        return;
      }
      if (heard.trim()) emptySpeech.current = 0;
      if (heard.trim()) {
        clearTimers();
        setListening(false);
        void ask(heard, true);
      } else if (talkingRef.current) {
        // The browser stopped on its own during a pause: keep listening.
        setTimeout(() => {
          if (talkingRef.current) listen();
        }, 150);
      } else {
        clearTimers();
        setListening(false);
        setVoiceError(
          stage.speech
            ? `${noWordsBack} (code: ${stage.error || "no-result"})`
            : stage.audio
              ? `I didn't hear any speech. Check that the right microphone is selected (the mic icon in the address bar) and speak after “Listening…” appears. (code: ${stage.error || "no-speech"})`
              : `The speech service never started listening. Check your internet connection, or try again. (code: ${stage.error || "no-audio"})`,
        );
      }
    };
    recognition.current = rec;
    listeningRef.current = true;
    setListening(true);
    try {
      rec.start();
    } catch {
      listeningRef.current = false;
      setListening(false);
    }
  }

  function stopListening() {
    if (azureListening.current) stopAzureListening();
    else recognition.current?.stop();
  }

  function startTalking() {
    if (azure) warmVoice();
    talkingRef.current = true;
    setTalking(true);
    setReadAloud(true);
    listen();
  }

  function stopTalking() {
    talkingRef.current = false;
    setTalking(false);
    clearTimers();
    recognition.current?.abort?.();
    recognition.current = null;
    if (azureListening.current) stopAzureListening();
    listeningRef.current = false;
    setListening(false);
    pending.current = null;
    stopSpeaking();
  }

  /** byVoice: the question was spoken, so the answer is read aloud too. */
  async function ask(raw: string, byVoice = false) {
    const question = raw.trim();
    if (!question || latest.current.busy) return;
    latest.current.busy = true;
    setInput("");
    const userMsg: Message = {
      id: nextId.current++,
      role: "user",
      text: question,
      parts: [],
      done: true,
    };
    const reply: Message = {
      id: nextId.current++,
      role: "assistant",
      text: "",
      parts: [],
      status: "Thinking…",
      done: false,
    };
    const history: ChatTurn[] = [...latest.current.messages, userMsg]
      .filter((m) => m.text.trim() || m.role === "user")
      .map((m) => ({
        role: m.role,
        content: m.text || "(answered with a chart or filter)",
      }));
    setMessages((all) => [...all, userMsg, reply]);
    setBusy(true);
    scrollDown();

    const controller = new AbortController();
    abort.current = controller;
    let answer = "";
    // Azure: speak each sentence the moment it arrives instead of waiting for the whole answer.
    // Checked here too: a question asked as the panel opens (Hear an update) can come before the state is set.
    const useAzure = azure || (await azureSpeechAvailable());
    const live = useAzure && (byVoice || latest.current.readAloud || talkingRef.current);
    if (live) speaker.warm();
    let spoken = false;
    const say = (s: string) => {
      if (controller.signal.aborted) return;
      spoken = true;
      setSpeakingId(reply.id);
      speaker.say(speakable(s));
    };
    const splitter = live ? new SentenceSplitter(say) : null;
    if (live) stopSpeaking();
    // Voice timing, measured from the moment the question was sent (just after the
    // person stopped talking and the 0.6 s pause was detected).
    const started = performance.now();
    const marks: { words?: number; voice?: number; lookups: number; lookupFrom?: number } = { lookups: 0 };
    const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
    const showTiming = () => {
      if (!(live && byVoice)) return;
      const parts = [
        marks.words !== undefined && `first words ${secs(marks.words)}`,
        marks.voice !== undefined && `voice ${secs(marks.voice)}`,
        marks.lookups >= 100 && `lookups ${secs(marks.lookups)}`,
      ].filter(Boolean);
      if (parts.length) update(reply.id, (m) => ({ ...m, timing: parts.join(" · ") }));
    };
    if (live)
      speaker.onChange = (on) => {
        if (on && marks.voice === undefined && !controller.signal.aborted) {
          marks.voice = performance.now() - started;
          showTiming();
        }
      };
    let afterTool = false;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // voice: a quicker model and short, spoken-style answers (docs/features/ai-assistant.md).
        body: JSON.stringify({ ...context, messages: history, voice: byVoice }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "The AI assistant isn't available right now.");
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as AiEvent;
          if (event.type === "text") {
            if (marks.lookupFrom !== undefined) {
              marks.lookups += performance.now() - marks.lookupFrom;
              marks.lookupFrom = undefined;
            }
            if (marks.words === undefined) {
              marks.words = performance.now() - started;
              showTiming();
            }
            // Text after a lookup starts a new paragraph ("Let me check." / "There are 54…").
            const piece = afterTool && answer.trim() ? `\n\n${event.text.trimStart()}` : event.text;
            afterTool = false;
            event.text = piece;
            answer += event.text;
            splitter?.push(event.text);
            update(reply.id, (m) => {
              const last = m.parts[m.parts.length - 1];
              const parts: Part[] =
                last?.type === "text"
                  ? [...m.parts.slice(0, -1), { type: "text", text: last.text + event.text }]
                  : [...m.parts, { type: "text", text: event.text }];
              return {
                ...m,
                text: m.text + event.text,
                parts,
                status: undefined,
              };
            });
          } else if (event.type === "status") {
            afterTool = true;
            marks.lookupFrom ??= performance.now();
            if (splitter) {
              // Say the lead-in now (it has no following text yet), or a short filler if
              // Claude went straight to a lookup, so the person never waits in silence.
              splitter.flush();
              if (!spoken) say(FILLERS[Math.floor(Math.random() * FILLERS.length)]);
            }
            update(reply.id, (m) => ({ ...m, status: event.text }));
          } else if (event.type === "chart")
            update(reply.id, (m) => ({
              ...m,
              parts: [...m.parts, { type: "chart", chart: event.chart }],
            }));
          else if (event.type === "filter")
            update(reply.id, (m) => ({
              ...m,
              parts: [...m.parts, { ...event, type: "filter" }],
            }));
          else if (event.type === "link")
            update(reply.id, (m) => ({
              ...m,
              parts: [...m.parts, { ...event, type: "link" }],
            }));
          else if (event.type === "error") update(reply.id, (m) => ({ ...m, error: event.message }));
          scrollDown();
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        update(reply.id, (m) => ({
          ...m,
          error: error instanceof Error ? error.message : "Something went wrong.",
        }));
      }
    } finally {
      update(reply.id, (m) => ({ ...m, done: true, status: undefined }));
      setBusy(false);
      abort.current = null;
      scrollDown();
    }
    latest.current.busy = false;
    // Someone spoke over the last answer: answer them now.
    const next = pending.current;
    pending.current = null;
    if (next) return void ask(next, true);
    showTiming();
    if (live) {
      if (!controller.signal.aborted) {
        splitter?.flush();
        speaker.end(() => setSpeakingId(null));
      }
      // Azure keeps listening throughout a conversation; nothing to restart.
      return;
    }
    if ((byVoice || latest.current.readAloud || talkingRef.current) && answer.trim()) {
      speak(reply.id, answer, () => {
        if (talkingRef.current) listen();
      });
    } else if (talkingRef.current) listen();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(input);
  }

  return (
    <aside
      aria-label={`Ask AI about ${title}`}
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l bg-background shadow-xl"
    >
      <header className="flex items-center gap-2 border-b px-3 py-2">
        <AiSparkle className="size-6" />
        <h2 className="flex-1 text-lg font-semibold">Ask AI about {title}</h2>
        {canSpeak && (
          <Button
            variant={readAloud ? "secondary" : "ghost"}
            size="icon"
            className="size-9"
            aria-pressed={readAloud}
            aria-label="Read answers aloud"
            title={readAloud ? "Reading answers aloud (select to stop)" : "Read answers aloud"}
            onClick={() => {
              if (readAloud) stopSpeaking();
              setReadAloud(!readAloud);
            }}
          >
            {readAloud ? <Volume2 aria-hidden className="size-5" /> : <VolumeX aria-hidden className="size-5" />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label="Close"
          title="Close"
          onClick={() => {
            stopTalking();
            abort.current?.abort();
            onClose();
          }}
        >
          <X aria-hidden className="size-5" />
        </Button>
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto px-3 py-3" aria-live="polite">
        {messages.length === 0 ? (
          <div className="grid gap-3">
            <p className="text-base text-muted-foreground">{intro}</p>
            <ul className="grid gap-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => (s.endsWith("…") ? setInput(s.slice(0, -1)) : void ask(s))}
                    className="w-full rounded-lg border px-3 py-2 text-left text-base outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className="grid gap-4">
            {messages.map((m) =>
              m.role === "user" ? (
                <li key={m.id} className="ml-8 rounded-xl bg-muted px-3 py-2 text-base">
                  {m.text}
                </li>
              ) : (
                <li key={m.id} className="text-base">
                  {m.parts.map((part, i) =>
                    part.type === "text" ? (
                      <div key={i} className={cn("grid gap-2", i > 0 && "mt-2")}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN}>
                          {part.text}
                        </ReactMarkdown>
                      </div>
                    ) : part.type === "chart" ? (
                      <AiChart key={i} chart={part.chart} />
                    ) : part.type === "link" ? (
                      <div key={i} className="mt-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                        <p className="flex items-start gap-2 font-medium">
                          <Filter aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                          {part.description}
                        </p>
                        <Button asChild size="sm" className="mt-2 h-8 px-3 text-sm">
                          <Link href={part.href}>{part.label}</Link>
                        </Button>
                      </div>
                    ) : (
                      <div key={i} className="mt-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                        <p className="flex items-start gap-2 font-medium">
                          <Filter aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                          {part.description}
                        </p>
                        {part.explanation && <p className="mt-1 text-sm text-muted-foreground">{part.explanation}</p>}
                        <Button
                          size="sm"
                          className="mt-2 h-8 px-3 text-sm"
                          onClick={() => onApplyFilter?.(part.filter)}
                        >
                          Apply filter
                        </Button>
                      </div>
                    ),
                  )}
                  {m.status && !m.done && (
                    <p role="status" className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <LoaderCircle aria-hidden className="size-4 animate-spin" />
                      {m.status}
                    </p>
                  )}
                  {m.error && (
                    <p
                      role="alert"
                      className="mt-2 flex items-start gap-2 rounded-lg border-l-4 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive"
                    >
                      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                      {m.error}
                    </p>
                  )}
                  {m.timing && (
                    <p
                      className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"
                      title="How long after you finished talking each step took (POC diagnostic)"
                    >
                      <Timer aria-hidden className="size-3.5" />
                      <span className="sr-only">Voice timing: </span>
                      {m.timing}
                    </p>
                  )}
                  {m.done && m.text && canSpeak && (
                    <button
                      type="button"
                      onClick={() => (speakingId === m.id ? stopSpeaking() : speak(m.id, m.text))}
                      className="mt-1 inline-flex items-center gap-1 rounded px-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
                    >
                      {speakingId === m.id ? (
                        <Square aria-hidden className="size-3.5" />
                      ) : (
                        <Volume2 aria-hidden className="size-3.5" />
                      )}
                      {speakingId === m.id ? "Stop reading" : "Read aloud"}
                    </button>
                  )}
                </li>
              ),
            )}
          </ol>
        )}
      </div>

      <form onSubmit={submit} className="border-t p-3">
        {voiceError && (
          <p role="alert" className="mb-2 text-sm text-destructive">
            {voiceError}
          </p>
        )}
        {listening && (
          <div
            role="status"
            className="mb-2 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
          >
            <span aria-hidden className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-3 rounded-full bg-primary" />
            </span>
            <span className="flex-1 text-sm font-medium">
              {input.trim()
                ? "Hearing you…"
                : azure && talking
                  ? busy
                    ? "Thinking… (talk any time to interrupt)"
                    : speakingId !== null
                      ? "Answering… (talk any time to interrupt)"
                      : "Listening — talk any time, even while I'm answering"
                  : "Listening… speak now"}
            </span>
            {micReady && <MicLevel />}
          </div>
        )}
        {speakingId !== null && !talking && (
          <div role="status" className="mb-2 flex items-center gap-3 rounded-lg border bg-muted/60 px-3 py-2">
            <Volume2 aria-hidden className="size-4 animate-pulse text-primary" />
            <span className="flex-1 text-sm font-medium">Reading the answer aloud…</span>
            <button
              type="button"
              onClick={stopSpeaking}
              className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-sm font-medium text-primary outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
            >
              <Square aria-hidden className="size-3.5" />
              Stop
            </button>
          </div>
        )}
        {talking && !listening && (
          <p role="status" className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <AudioLines aria-hidden className="size-4" />
            {busy
              ? "Thinking…"
              : speakingId
                ? "Answering aloud… (I'll listen again when I finish)"
                : "Voice conversation on"}
          </p>
        )}
        <div className="flex items-end gap-2">
          <label htmlFor="ai-question" className="sr-only">
            Your question
          </label>
          <textarea
            id="ai-question"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void ask(input);
              }
            }}
            placeholder={listening ? "Listening…" : placeholder}
            className="min-h-11 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring"
          />
          {canListen && (
            <Button
              type="button"
              variant={listening ? "secondary" : "ghost"}
              size="icon"
              className={cn("size-11", listening && "text-primary")}
              aria-label={listening ? "Stop listening" : "Speak your question"}
              title={listening ? "Stop listening" : "Speak your question"}
              onClick={() => (listening ? stopListening() : listen())}
              disabled={busy}
            >
              {listening ? <MicOff aria-hidden className="size-5" /> : <Mic aria-hidden className="size-5" />}
            </Button>
          )}
          {busy ? (
            <Button
              type="button"
              size="icon"
              className="size-11"
              aria-label="Stop answering"
              title="Stop"
              onClick={() => abort.current?.abort()}
            >
              <Square aria-hidden className="size-5" />
            </Button>
          ) : (
            <Button type="submit" size="icon" className="size-11" aria-label="Ask" title="Ask" disabled={!input.trim()}>
              <Send aria-hidden className="size-5" />
            </Button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          {canListen && canSpeak && (
            <button
              type="button"
              onClick={() => (talking ? stopTalking() : startTalking())}
              className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-primary outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
            >
              <AudioLines aria-hidden className="size-4" />
              {talking ? "End voice conversation" : "Talk with AI (voice conversation)"}
            </button>
          )}
          {canSpeak && !azure && <VoicePicker />}
        </div>
      </form>
    </aside>
  );
}

const MARKDOWN = {
  p: (props: React.ComponentProps<"p">) => <p className="leading-6" {...props} />,
  ul: (props: React.ComponentProps<"ul">) => <ul className="list-disc space-y-1 pl-5" {...props} />,
  ol: (props: React.ComponentProps<"ol">) => <ol className="list-decimal space-y-1 pl-5" {...props} />,
  strong: (props: React.ComponentProps<"strong">) => <strong className="font-semibold" {...props} />,
  h1: (props: React.ComponentProps<"h3">) => <h3 className="font-semibold" {...props} />,
  h2: (props: React.ComponentProps<"h3">) => <h3 className="font-semibold" {...props} />,
  h3: (props: React.ComponentProps<"h3">) => <h3 className="font-semibold" {...props} />,
  table: (props: React.ComponentProps<"table">) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" {...props} />
    </div>
  ),
  th: (props: React.ComponentProps<"th">) => <th className="border-b py-1 pr-2 font-semibold" {...props} />,
  td: (props: React.ComponentProps<"td">) => <td className="border-b py-0.5 pr-2" {...props} />,
  a: (props: React.ComponentProps<"a">) => (
    <a className="text-primary underline" target="_blank" rel="noreferrer" {...props} />
  ),
};

/** Choose the read-aloud voice (remembered in this browser); plays a short sample. */
function VoicePicker() {
  const { voices, chosen } = useVoices();
  if (!voices.length) return null;
  return (
    <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Volume2 aria-hidden className="size-4" />
      <span className="sr-only">Read-aloud voice</span>
      <select
        value={chosen}
        onChange={(e) => {
          saveVoiceName(e.target.value);
          const voice = voices.find((v) => v.name === e.target.value);
          if (voice) {
            window.speechSynthesis.cancel();
            const sample = new SpeechSynthesisUtterance("This is how answers will sound.");
            sample.voice = voice;
            sample.lang = voice.lang;
            window.speechSynthesis.speak(sample);
          }
        }}
        className="h-8 max-w-48 rounded-md border border-input bg-background px-1 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring"
        title="Read-aloud voice"
      >
        {voices.map((v) => (
          <option key={v.name} value={v.name}>
            {v.name.replace(/^Microsoft\s+|\s+Online\s*\(Natural\).*$/g, "")}
            {/natural|neural|premium|enhanced/i.test(v.name) ? " ★" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
````

### AI assistant: charts: `src/components/list-view/ai-chart.tsx`

```tsx
"use client";

import { useState } from "react";
import type { ChartSpec } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

/** Series colors in fixed order (tokens in globals.css, validated palette; docs/brand.md). */
const SERIES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

/**
 * A chart the AI assistant asked for: horizontal bars for groups, a line for
 * dates. Thin marks, recessive grid, value labels, a legend for 2+ series, a
 * hover tooltip on every mark, and a table view.
 */
export function AiChart({ chart }: { chart: ChartSpec }) {
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  return (
    <figure className="relative mt-2 rounded-lg border bg-background p-3">
      <figcaption className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold">{chart.title}</span>
        <button
          type="button"
          onClick={() => setTable(!table)}
          className="shrink-0 rounded px-1 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
        >
          {table ? "Show chart" : "Show table"}
        </button>
      </figcaption>
      {chart.series.length > 1 && (
        <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground" aria-label="Legend">
          {chart.series.map((s, i) => (
            <li key={s.name} className="flex items-center gap-1.5">
              <span aria-hidden className="inline-block size-2.5 rounded-sm" style={{ background: SERIES[i] }} />
              {s.name}
            </li>
          ))}
        </ul>
      )}
      {table ? (
        <DataTable chart={chart} />
      ) : (
        <div className="relative" onMouseLeave={() => setHover(null)}>
          {chart.kind === "line" ? (
            <Line chart={chart} onHover={setHover} />
          ) : (
            <Bars chart={chart} onHover={setHover} />
          )}
          {hover && (
            <div
              role="tooltip"
              className="pointer-events-none absolute z-10 rounded-md border bg-popover px-2 py-1 text-sm whitespace-nowrap text-popover-foreground shadow-md"
              style={{ left: hover.x, top: hover.y, transform: "translate(-50%, -110%)" }}
            >
              {hover.text}
            </div>
          )}
        </div>
      )}
    </figure>
  );
}

type HoverFn = (h: { x: number; y: number; text: string } | null) => void;

function tip(event: React.MouseEvent<SVGElement>, text: string, onHover: HoverFn) {
  const box = (event.currentTarget.ownerSVGElement ?? event.currentTarget).parentElement!.getBoundingClientRect();
  onHover({ x: event.clientX - box.left, y: event.clientY - box.top, text });
}

/** Horizontal bars: one row per category, grouped when there are several series. */
function Bars({ chart, onHover }: { chart: ChartSpec; onHover: HoverFn }) {
  const max = Math.max(1, ...chart.series.flatMap((s) => s.values));
  const labelW = 120;
  const width = 360;
  const plotW = width - labelW - 44;
  const barH = chart.series.length > 1 ? 10 : 14;
  const rowH = chart.series.length * (barH + 2) + 8;
  const height = chart.categories.length * rowH + 4;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full" role="img" aria-label={`${chart.title}, bar chart`}>
      {chart.categories.map((category, ci) => {
        const y0 = ci * rowH + 4;
        return (
          <g key={category}>
            <text x={labelW - 6} y={y0 + (rowH - 8) / 2 + 4} textAnchor="end" className="fill-foreground text-[11px]">
              {category.length > 18 ? `${category.slice(0, 17)}…` : category}
            </text>
            {chart.series.map((s, si) => {
              const value = s.values[ci] ?? 0;
              const w = Math.max(value > 0 ? 2 : 0, (value / max) * plotW);
              const y = y0 + si * (barH + 2);
              const text = `${category}${chart.series.length > 1 ? ` · ${s.name}` : ""}: ${fmt(value)}`;
              return (
                <g key={s.name}>
                  {/* Hit target taller than the bar */}
                  <rect
                    x={labelW}
                    y={y - 1}
                    width={plotW + 40}
                    height={barH + 2}
                    fill="transparent"
                    onMouseMove={(e) => tip(e, text, onHover)}
                  />
                  <rect x={labelW} y={y} width={w} height={barH} rx={4} fill={SERIES[si]} pointerEvents="none" />
                  <text
                    x={labelW + w + 4}
                    y={y + barH - 2}
                    className="fill-muted-foreground text-[10px]"
                    pointerEvents="none"
                  >
                    {fmt(value)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
      <line x1={labelW} x2={labelW} y1={0} y2={height} className="stroke-border" />
    </svg>
  );
}

/** A line per series over the categories (usually dates). */
function Line({ chart, onHover }: { chart: ChartSpec; onHover: HoverFn }) {
  const width = 360;
  const height = 200;
  const pad = { l: 34, r: 8, t: 8, b: 28 };
  const max = niceMax(Math.max(1, ...chart.series.flatMap((s) => s.values)));
  const n = chart.categories.length;
  const x = (i: number) => pad.l + (n === 1 ? (width - pad.l - pad.r) / 2 : (i / (n - 1)) * (width - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (height - pad.t - pad.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const every = Math.max(1, Math.ceil(n / 6));
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-2 w-full"
      role="img"
      aria-label={`${chart.title}, line chart`}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
          <text x={pad.l - 4} y={y(t) + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
            {fmt(t)}
          </text>
        </g>
      ))}
      {chart.categories.map((c, i) =>
        i % every === 0 || i === n - 1 ? (
          <text key={c} x={x(i)} y={height - 10} textAnchor="middle" className="fill-muted-foreground text-[10px]">
            {c.length > 10 ? `${c.slice(0, 9)}…` : c}
          </text>
        ) : null,
      )}
      {chart.series.map((s, si) => (
        <g key={s.name}>
          <polyline
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            fill="none"
            stroke={SERIES[si]}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {s.values.map((v, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(v)} r={4} fill={SERIES[si]} className="stroke-background" strokeWidth={2} />
              <circle
                cx={x(i)}
                cy={y(v)}
                r={10}
                fill="transparent"
                onMouseMove={(e) =>
                  tip(e, `${chart.categories[i]}${chart.series.length > 1 ? ` · ${s.name}` : ""}: ${fmt(v)}`, onHover)
                }
              />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

function DataTable({ chart }: { chart: ChartSpec }) {
  return (
    <div className="mt-2 max-h-64 overflow-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-1 pr-2 font-semibold">
              {chart.xLabel ?? ""}
            </th>
            {chart.series.map((s) => (
              <th key={s.name} scope="col" className="py-1 pr-2 text-right font-semibold">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.categories.map((c, i) => (
            <tr key={c} className={cn("border-b", i % 2 === 1 && "bg-muted/40")}>
              <th scope="row" className="py-0.5 pr-2 font-normal">
                {c}
              </th>
              {chart.series.map((s) => (
                <td key={s.name} className="py-0.5 pr-2 text-right tabular-nums">
                  {fmt(s.values[i] ?? 0)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function niceMax(v: number) {
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v) ?? v;
}
```

### AI sparkle icon (gold, universal across LLUH apps): `src/components/ai-sparkle.tsx`

```tsx
import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The universal AI icon for LLUH apps (Ryan, 2026-11-18): a gold guiding star
 * with two small sparkles, like the star in LLUH's Project Horizon and Northstar
 * art. The same in every LLUH app, never recolored to an app's brand color.
 * Gold is a deliberate exception to the LLUH palette, for this icon only
 * (tokens --ai-* in globals.css; spec in docs/brand.md).
 *
 * Inline SVG (about 1 KB, no image file), so it costs nothing to load.
 * Decorative: pair it with a label or an aria-label on the button.
 */
export function AiSparkle({ className }: { className?: string }) {
  const id = `ai-sparkle-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5 shrink-0", className)}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx="10" cy="12" r="11">
          <stop offset="0" style={{ stopColor: "var(--ai-glow)" }} />
          <stop offset="0.35" style={{ stopColor: "var(--ai-gold)" }} />
          <stop offset="1" style={{ stopColor: "var(--ai-gold-deep)" }} />
        </radialGradient>
      </defs>
      {/* The outline keeps the gold visible on white (3.6:1); the fill pops on the red banner (4.4:1). */}
      <g fill={`url(#${id})`} strokeWidth="0.9" strokeLinejoin="round" style={{ stroke: "var(--ai-outline)" }}>
        <path d="M10 1.5C10.7 1.5 11 10 18.5 12C11 14 10.7 22.5 10 22.5C9.3 22.5 9 14 1.5 12C9 10 9.3 1.5 10 1.5Z" />
        <path d="M19.5 1.5C19.9 1.5 20 4.4 22.6 5C20 5.6 19.9 8.5 19.5 8.5C19.1 8.5 19 5.6 16.4 5C19 4.4 19.1 1.5 19.5 1.5Z" />
        <path d="M19.5 16C19.8 16 19.9 18 21.6 18.4C19.9 18.8 19.8 20.8 19.5 20.8C19.2 20.8 19.1 18.8 17.4 18.4C19.1 18 19.2 16 19.5 16Z" />
      </g>
    </svg>
  );
}
```

### Voice (optional): Azure speech in the browser: `src/components/list-view/azure-voice.ts`

```ts
"use client";

/**
 * Claude-style voice with Azure AI Speech (docs/features/ai-assistant.md → Voice):
 * - Listener: streaming recognition that keeps listening while the AI talks, so
 *   people can interrupt; a turn ends after ~0.6 s of quiet.
 * - Speaker: sentences are streamed from Azure's neural voice straight to the
 *   browser over a connection opened in advance; audio plays as it arrives and
 *   stop() cuts off at once.
 * Both are optional: if Azure isn't set up (no key in Vercel), callers fall back
 * to the browser's built-in speech.
 */

type Token = { token: string; region: string };

async function fetchToken(): Promise<Token | null> {
  try {
    const res = await fetch("/api/speech/token", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Token;
  } catch {
    return null;
  }
}

let availability: Promise<boolean> | null = null;
/** Whether Azure speech is set up (checked once per page). */
export function azureSpeechAvailable() {
  availability ??= fetchToken().then((t) => !!t);
  return availability;
}

export type ListenerHandlers = {
  /** Words heard so far in the current phrase (updates as the person speaks). */
  onPartial: (text: string) => void;
  /** A finished phrase (after a short pause). */
  onFinal: (text: string) => void;
  onError: (message: string) => void;
};

export class AzureListener {
  private recognizer: {
    close: () => void;
    stopContinuousRecognitionAsync: (a?: () => void) => void;
    authorizationToken: string;
  } | null = null;
  private refresh: ReturnType<typeof setInterval> | null = null;

  /** Starts listening. Resolves false when Azure isn't available. */
  async start(handlers: ListenerHandlers): Promise<boolean> {
    const token = await fetchToken();
    if (!token) return false;
    const sdk = await import("microsoft-cognitiveservices-speech-sdk");
    const config = sdk.SpeechConfig.fromAuthorizationToken(token.token, token.region);
    config.speechRecognitionLanguage = "en-US";
    // End a phrase after ~0.6 s of quiet (Azure's default is longer).
    config.setProperty(sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, "600");
    const recognizer = new sdk.SpeechRecognizer(config, sdk.AudioConfig.fromDefaultMicrophoneInput());
    recognizer.recognizing = (_s, e) => handlers.onPartial(e.result.text);
    recognizer.recognized = (_s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text.trim())
        handlers.onFinal(e.result.text);
    };
    recognizer.canceled = (_s, e) => {
      if (e.reason === sdk.CancellationReason.Error) {
        handlers.onError(
          /permission|NotAllowed/i.test(e.errorDetails)
            ? "The browser blocked the microphone. Allow it in the address bar, then try again."
            : "The speech service stopped listening. Select Talk with AI to start again.",
        );
      }
    };
    await new Promise<void>((resolve, reject) =>
      recognizer.startContinuousRecognitionAsync(resolve, (err) => reject(new Error(err))),
    );
    this.recognizer = recognizer;
    // Tokens last 10 minutes; renew before they run out.
    this.refresh = setInterval(
      async () => {
        const next = await fetchToken();
        if (next && this.recognizer) this.recognizer.authorizationToken = next.token;
      },
      8 * 60 * 1000,
    );
    return true;
  }

  stop() {
    if (this.refresh) clearInterval(this.refresh);
    this.refresh = null;
    const r = this.recognizer;
    this.recognizer = null;
    r?.stopContinuousRecognitionAsync(() => r.close());
  }
}

const VOICE_NAME = "en-US-AvaMultilingualNeural";
type Sdk = typeof import("microsoft-cognitiveservices-speech-sdk");
type Synth = { sdk: Sdk; synth: InstanceType<Sdk["SpeechSynthesizer"]> };

/** Plays one answer's audio. */
interface Player {
  write(chunk: ArrayBuffer): void;
  /** One sentence's audio is complete. */
  sentenceEnd(): void;
  /** No more sentences are coming. */
  finish(): void;
  stop(): void;
}

/**
 * Plays MP3 audio while it is still arriving (Media Source Extensions), so a
 * sentence starts as soon as its first bytes come in, and sentences follow
 * each other with no gaps. If Claude is still writing, playback simply waits.
 */
class StreamPlayer implements Player {
  private audio = new Audio();
  private media = new MediaSource();
  private buffer: SourceBuffer | null = null;
  private queue: ArrayBuffer[] = [];
  private started = false;
  private ended = false;
  private over = false;
  constructor(
    onPlaying: () => void,
    private onDone: () => void,
  ) {
    this.audio.src = URL.createObjectURL(this.media);
    this.media.addEventListener(
      "sourceopen",
      () => {
        this.buffer = this.media.addSourceBuffer("audio/mpeg");
        this.buffer.mode = "sequence";
        this.buffer.addEventListener("updateend", () => this.pump());
        this.pump();
      },
      { once: true },
    );
    this.audio.addEventListener("playing", onPlaying);
    this.audio.addEventListener("ended", () => this.done());
  }
  write(chunk: ArrayBuffer) {
    this.queue.push(chunk);
    if (!this.started) {
      this.started = true;
      this.audio.play().catch(() => this.done());
    }
    this.pump();
  }
  sentenceEnd() {}
  finish() {
    this.ended = true;
    if (!this.started) this.done();
    else this.pump();
  }
  private pump() {
    const b = this.buffer;
    if (!b || b.updating || this.over) return;
    const next = this.queue.shift();
    if (next) {
      try {
        b.appendBuffer(next);
      } catch {
        this.queue.unshift(next);
      }
    } else if (this.ended && this.media.readyState === "open") this.media.endOfStream();
  }
  stop() {
    this.over = true;
    this.audio.pause();
    URL.revokeObjectURL(this.audio.src);
  }
  private done() {
    if (this.over) return;
    this.stop();
    this.onDone();
  }
}

/** For browsers without Media Source Extensions: each sentence plays once its audio is complete. */
class ClipPlayer implements Player {
  private parts: ArrayBuffer[] = [];
  private clips: string[] = [];
  private audio: HTMLAudioElement | null = null;
  private ended = false;
  private over = false;
  constructor(
    private onPlaying: () => void,
    private onDone: () => void,
  ) {}
  write(chunk: ArrayBuffer) {
    this.parts.push(chunk);
  }
  sentenceEnd() {
    if (!this.parts.length) return;
    this.clips.push(URL.createObjectURL(new Blob(this.parts, { type: "audio/mpeg" })));
    this.parts = [];
    this.next();
  }
  finish() {
    this.ended = true;
    this.next();
  }
  private next() {
    if (this.audio || this.over) return;
    const url = this.clips.shift();
    if (!url) {
      if (this.ended) {
        this.over = true;
        this.onDone();
      }
      return;
    }
    const audio = new Audio(url);
    this.audio = audio;
    const after = () => {
      URL.revokeObjectURL(url);
      this.audio = null;
      this.next();
    };
    audio.onplaying = this.onPlaying;
    audio.onended = audio.onerror = after;
    audio.play().catch(after);
  }
  stop() {
    this.over = true;
    this.audio?.pause();
    this.clips.forEach((u) => URL.revokeObjectURL(u));
    this.clips = [];
  }
}

/**
 * Speaks sentences in a neural voice, streamed straight from Azure to the
 * browser over a connection opened in advance (warm()), with no stop at our
 * server. Audio starts on the first bytes; stop() cuts off at once.
 */
export class AzureSpeaker {
  private synth: Promise<Synth | null> | null = null;
  private refresh: ReturnType<typeof setInterval> | null = null;
  private player: Player | null = null;
  private generation = 0;
  private outstanding = 0;
  private ending = false;
  private finished: (() => void) | null = null;
  /** Everything said recently, to tell the AI's own voice (echo) from the person. */
  recent = "";
  speaking = false;
  onChange: (speaking: boolean) => void = () => {};

  /** Opens the connection to Azure now, so the first sentence doesn't wait for it. */
  warm() {
    void this.synthesizer();
  }

  private synthesizer() {
    this.synth ??= (async () => {
      const token = await fetchToken();
      if (!token) return null;
      const sdk = await import("microsoft-cognitiveservices-speech-sdk");
      const config = sdk.SpeechConfig.fromAuthorizationToken(token.token, token.region);
      config.speechSynthesisVoiceName = VOICE_NAME;
      config.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;
      const synth = new sdk.SpeechSynthesizer(config, null); // null: we play the audio ourselves
      sdk.Connection.fromSynthesizer(synth).openConnection();
      // Tokens last 10 minutes; renew before they run out.
      this.refresh ??= setInterval(
        async () => {
          const next = await fetchToken();
          const current = await this.synth;
          if (next && current) current.synth.authorizationToken = next.token;
        },
        8 * 60 * 1000,
      );
      return { sdk, synth };
    })().catch(() => null);
    return this.synth;
  }

  /** Queue a sentence; it starts playing as soon as its first audio arrives. */
  say(text: string) {
    const clean = text.trim();
    if (!clean) return;
    this.recent = `${this.recent} ${clean}`.slice(-600);
    const gen = this.generation;
    if (!this.player) {
      const onPlaying = () => gen === this.generation && this.setSpeaking(true);
      const onDone = () => gen === this.generation && this.done();
      this.player =
        typeof MediaSource !== "undefined" && MediaSource.isTypeSupported("audio/mpeg")
          ? new StreamPlayer(onPlaying, onDone)
          : new ClipPlayer(onPlaying, onDone);
    }
    const player = this.player;
    this.outstanding++;
    void this.synthesizer().then((s) => {
      if (gen !== this.generation) return;
      if (!s) return this.sentenceDone(gen, player);
      const isCurrent = () => gen === this.generation;
      class Sink extends s.sdk.PushAudioOutputStreamCallback {
        write(chunk: ArrayBuffer) {
          if (isCurrent()) player.write(chunk);
        }
        close() {}
      }
      s.synth.speakTextAsync(
        clean,
        () => this.sentenceDone(gen, player),
        () => this.sentenceDone(gen, player),
        new Sink(),
      );
    });
  }

  private sentenceDone(gen: number, player: Player) {
    if (gen !== this.generation) return;
    this.outstanding--;
    player.sentenceEnd();
    if (this.ending && this.outstanding === 0) player.finish();
  }

  /** Call when no more sentences are coming; `then` runs after the last one has played. */
  end(then?: () => void) {
    this.finished = then ?? null;
    this.ending = true;
    if (!this.player) return this.done();
    if (this.outstanding === 0) this.player.finish();
  }

  private done() {
    this.player = null;
    this.ending = false;
    this.setSpeaking(false);
    const then = this.finished;
    this.finished = null;
    then?.();
  }

  /** Stop at once (the person interrupted, or closed the panel). */
  stop() {
    this.generation++;
    this.player?.stop();
    this.player = null;
    this.ending = false;
    this.finished = null;
    this.setSpeaking(false);
    if (this.outstanding > 0) {
      // Azure would finish the queued sentences first; start a fresh connection instead.
      const old = this.synth;
      this.synth = null;
      void old?.then((s) => s?.synth.close());
      this.warm();
    }
    this.outstanding = 0;
  }

  /** The panel closed: stop and hang up. */
  dispose() {
    this.stop();
    if (this.refresh) clearInterval(this.refresh);
    this.refresh = null;
    const old = this.synth;
    this.synth = null;
    void old?.then((s) => s?.synth.close());
  }

  /** True while speaking and for a moment after (the microphone can still hear the tail end). */
  get audible() {
    return this.speaking || Date.now() - this.endedAt < 1500;
  }
  private endedAt = 0;

  private setSpeaking(on: boolean) {
    if (this.speaking !== on) {
      this.speaking = on;
      if (!on) this.endedAt = Date.now();
      this.onChange(on);
    }
  }
}

/** True when what the microphone heard is mostly the AI's own voice coming back through the speakers. */
export function isEcho(heard: string, recent: string) {
  const words = (s: string) => s.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  const h = words(heard);
  if (!h.length) return true;
  const said = new Set(words(recent));
  const overlap = h.filter((w) => said.has(w)).length / h.length;
  return h.length >= 2 ? overlap >= 0.8 : said.has(h[0]!);
}

/** Splits streamed text into speakable sentences; keeps the unfinished tail. */
export class SentenceSplitter {
  private buffer = "";
  private first = true;
  constructor(private out: (sentence: string) => void) {}
  push(text: string) {
    this.buffer += text;
    // A sentence ends at punctuation followed by a space (so "3.5" isn't split), or a line break.
    const re = /[.!?]+["')\]]?\s+|\n+/g;
    let last = 0;
    for (const m of this.buffer.matchAll(re)) {
      const end = m.index + m[0].length;
      this.emit(this.buffer.slice(last, end));
      last = end;
    }
    this.buffer = this.buffer.slice(last);
    // Start talking sooner: the very first phrase goes out at a comma, colon,
    // semicolon or dash once it has a few words ("There are 54 orders, …").
    if (this.first) {
      const phrase = /^(.*?\S.*?[,;:\u2013\u2014])\s+/.exec(this.buffer);
      if (phrase && phrase[1].trim().split(/\s+/).length >= 4) {
        this.emit(phrase[0]);
        this.buffer = this.buffer.slice(phrase[0].length);
      }
    }
  }
  private emit(sentence: string) {
    if (!sentence.trim()) return;
    this.first = false;
    this.out(sentence);
  }
  flush() {
    this.emit(this.buffer);
    this.buffer = "";
  }
}
```

### Voice (optional): Azure token route: `src/app/api/speech/token/route.ts`

```ts
import { findCurrentUser } from "@/lib/dal";
import { issueToken } from "@/lib/speech/azure";

/** GET: a 10-minute Azure Speech token for the browser to listen with. 503 when Azure isn't set up. */
export async function GET() {
  if (!(await findCurrentUser())) return Response.json({ error: "Sign in first." }, { status: 401 });
  try {
    const token = await issueToken();
    if (!token) return Response.json({ configured: false }, { status: 503 });
    return Response.json(token, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Azure speech token failed", error);
    return Response.json({ error: "The speech service didn't respond." }, { status: 502 });
  }
}
```

### Voice (optional): Azure settings (server): `src/lib/speech/azure.ts`

```ts
import "server-only";

/**
 * Azure AI Speech (docs/features/ai-assistant.md → Voice): neural voices and
 * streaming speech recognition, the same on every browser and computer. The
 * key stays on the server; browsers get a 10-minute token and talk to Azure
 * directly for listening and speaking.
 */
export function speechSettings() {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  return key && region ? { key, region: region.trim().toLowerCase() } : null;
}

/** A short-lived token the browser's Speech SDK uses to listen. */
export async function issueToken() {
  const s = speechSettings();
  if (!s) return null;
  const res = await fetch(`https://${s.region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
    method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": s.key, "Content-Length": "0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Azure token request failed: ${res.status}`);
  return { token: await res.text(), region: s.region };
}
```

### Voice (optional): browser voice picker: `src/components/list-view/voices.ts`

```ts
"use client";

import { useSyncExternalStore } from "react";

/**
 * Choosing a good read-aloud voice from the ones the computer and browser offer.
 * macOS lists novelty voices first ("Albert", "Bad News", "Bells"…), which made
 * answers sound robotic; prefer natural/neural voices, then known good ones.
 */
const NOVELTY = new Set(
  "Albert,Bad News,Bahh,Bells,Boing,Bubbles,Cellos,Good News,Jester,Organ,Superstar,Trinoids,Whisper,Wobble,Zarvox,Junior,Ralph,Fred,Kathy,Grandma,Grandpa,Rocko,Shelley,Flo,Eddy,Reed,Sandy"
    .split(",")
    .map((n) => n.toLowerCase()),
);
const GOOD = [
  "natural",
  "neural",
  "premium",
  "enhanced",
  "google us english",
  "samantha",
  "ava",
  "allison",
  "jenny",
  "aria",
  "zoe",
  "susan",
  "karen",
  "daniel",
  "moira",
  "tessa",
];

function baseName(v: SpeechSynthesisVoice) {
  return v.name
    .replace(/\s*\(.*\)\s*$/, "")
    .trim()
    .toLowerCase();
}

function score(v: SpeechSynthesisVoice) {
  if (NOVELTY.has(baseName(v))) return -1;
  const name = v.name.toLowerCase();
  let s = v.lang === "en-US" ? 5 : v.lang?.startsWith("en") ? 2 : 0;
  GOOD.forEach((g, i) => {
    if (name.includes(g)) s += 40 - i;
  });
  return s;
}

/** English voices worth offering, best first. */
export function englishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang?.toLowerCase().startsWith("en") && score(v) >= 0)
    .sort((a, b) => score(b) - score(a));
}

const KEY = "cs-tracker:voice";
const listeners = new Set<() => void>();
let fallback = "";

export function savedVoiceName() {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return fallback;
  }
}

export function saveVoiceName(name: string) {
  fallback = name;
  try {
    localStorage.setItem(KEY, name);
  } catch {
    // Storage blocked: lasts until reload.
  }
  listeners.forEach((l) => l());
}

/** The voice to read with: the person's choice, else the best English voice. */
export function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = englishVoices();
  return voices.find((v) => v.name === savedVoiceName()) ?? voices[0];
}

// Browsers load their voice list late (Chrome fires "voiceschanged"); re-render when it arrives.
let version = 0;
function subscribe(cb: () => void) {
  listeners.add(cb);
  const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
  const onChange = () => {
    version++;
    listeners.forEach((l) => l());
  };
  synth?.addEventListener?.("voiceschanged", onChange);
  return () => {
    listeners.delete(cb);
    synth?.removeEventListener?.("voiceschanged", onChange);
  };
}

/** [voices, chosen name] that update when the browser finishes loading its voices. */
export function useVoices() {
  const key = useSyncExternalStore(
    subscribe,
    () => `${version}|${englishVoices().length}|${savedVoiceName()}`,
    () => "",
  );
  void key;
  const voices = englishVoices();
  return { voices, chosen: pickVoice()?.name ?? "" };
}
```

### Voice (optional): microphone level bars: `src/components/list-view/mic-level.tsx`

```tsx
"use client";

import { useEffect, useRef } from "react";

const BARS = 7;

/**
 * Live microphone indicator: bars that move with the person's voice while the AI
 * is listening. Reads the level in the browser only (nothing is recorded or
 * sent) and releases the microphone when listening stops. If the browser won't
 * share the level, the bars pulse gently instead.
 */
export function MicLevel() {
  const bars = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    let frame = 0;
    let stopped = false;

    const pulse = () => {
      const t = performance.now() / 300;
      bars.current.forEach((bar, i) => {
        if (bar) bar.style.transform = `scaleY(${0.25 + 0.2 * (1 + Math.sin(t + i))})`;
      });
      frame = requestAnimationFrame(pulse);
    };

    if (!navigator.mediaDevices?.getUserMedia) {
      pulse();
    } else {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((s) => {
          if (stopped) return s.getTracks().forEach((t) => t.stop());
          stream = s;
          context = new AudioContext();
          const analyser = context.createAnalyser();
          analyser.fftSize = 256;
          context.createMediaStreamSource(s).connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);
          const draw = () => {
            analyser.getByteFrequencyData(data);
            const band = Math.floor(data.length / (BARS + 4)); // voice sits in the lower frequencies
            bars.current.forEach((bar, i) => {
              let sum = 0;
              for (let k = 0; k < band; k++) sum += data[(i + 1) * band + k];
              const level = Math.min(1, sum / band / 160);
              if (bar) bar.style.transform = `scaleY(${0.25 + level * 0.75})`;
            });
            frame = requestAnimationFrame(draw);
          };
          draw();
        })
        .catch(() => {
          if (!stopped) pulse();
        });
    }

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
      void context?.close();
    };
  }, []);

  return (
    <span aria-hidden className="flex h-6 items-center gap-0.5">
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            bars.current[i] = el;
          }}
          className="h-full w-1.5 origin-center rounded-full bg-primary transition-transform duration-75"
          style={{ transform: "scaleY(0.25)" }}
        />
      ))}
    </span>
  );
}
```

<!-- reference-code:end -->
