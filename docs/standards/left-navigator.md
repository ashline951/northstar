# Standard: left-hand navigator (look, feel and behavior)

**Status:** LLUH app standard, **v1.3** (2026-11-18). Owner: Ryan Ashline. Reference build: CS Tracker. The full reference code is in **Appendix A** at the end of this file.

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-18 | First version: layout, type, colors, collapse, menu, favorites (described only). |
| 1.1 | 2026-11-18 | History tab, icon tabs, data model, exact classes, agent checklist. |
| 1.2 | 2026-11-18 | Much more detail: wireframes, every text string, step-by-step build order, favorites and history in full, adapting to other stacks, and the complete reference code (Appendix A). |
| 1.3 | 2026-11-18 | **Drag to resize** (200–400 px, 240 px default, remembered per browser, double-click resets). The phone/tablet drawer always shows the full navigator, even when the desktop one is collapsed. |

---

## 0. Read this first (instructions for coding agents)

You are adding the standard LLUH left-hand navigator to an app. Staff move between LLUH apps all day; the navigator must look and work **exactly** the same in each one. Apps built from earlier versions of this file came out "close but different" and skipped favorites, so follow these rules:

1. **Build everything in section 1.** Nothing there is optional. Favorites and History need two database tables and server actions (section 10); create them with the app's normal migration process.
2. **Start from the reference code in Appendix A.** If the app uses Next.js App Router + Tailwind v4 + shadcn/ui tokens, copy those files and change only what each file's note says (imports, menu items, storage-key prefix, app name). For other stacks, reproduce the same markup, classes and behavior (section 15). Do not redesign, simplify, or "improve" it.
3. **Use the app's own brand color** through its `--primary` token (section 6). Everything else (sizes, neutral text colors, behavior, wording) is fixed.
4. **Follow the build order in section 16**, then **report every item of the checklist in section 18** as pass or fail to the person you're working with, with a screenshot of each tab and the collapsed state.
5. If something in the app makes a rule impossible, stop and ask the person; don't quietly leave it out. Record any agreed exception in the app's docs.

**What is standard and what isn't.** Layout, sizes, type, text colors, states, behavior and wording are the same in every LLUH app. **Brand color is not set here:** each app uses its own palette from the LLUH style guide through `--primary`. Never hard-code a brand color in the navigator.

---

## 1. Required features (all must be built)

| # | Feature | Summary |
|---|---|---|
| 1 | **Collapse to an icon rail, and drag to resize** | 240 px by default ↔ 56 px; drag the right edge to 200–400 px; both remembered per browser, no flicker on page load. |
| 2 | **Search** | One box that filters whichever tab is showing. |
| 3 | **Three tabs** | Menu, Favorites, History; chosen tab shows icon + name, others icon only; remembered per browser. |
| 4 | **Menu** | Top-level items with icons; one level of collapsible groups, collapsed by default; current page highlighted. |
| 5 | **Favorites** | Per person, saved on the server. ☆ on every menu row; **Add this page** (named, keeps filters); **Edit**: rename, move up/down, remove. |
| 6 | **History** | Per person, saved on the server. Last 30 pages opened, newest first, one entry per page, short times, **Clear history**. |
| 7 | **Phone/tablet drawer** | Below 1024 px, the same navigator in a drawer opened from a Menu button in the top banner. |
| 8 | **Permission-aware menu** | Items a person can't use are hidden; their pages still check permission on the server. |

---

## 2. Where it sits

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ TOP BANNER (app's own: logo + app name on the left, user menu on the right)  │
├────────────────────┬─────────────────────────────────────────────────────────┤
│ NAVIGATOR          ┃ PAGE CONTENT                                            │
│ 240 px (drag ┃ to │ uses all remaining width                                │
│ 200–400), full     │                                                         │
│ height below the   │                                                         │
│ banner, sticky     │                                                         │
│ (scrolls on its    │                                                         │
│ own if long)       │                                                         │
└────────────────────┴─────────────────────────────────────────────────────────┘
```

- Desktop/laptop (1024 px and wider): a column on the left of every signed-in page, under the banner, with a 1 px divider (`border-r`) to the page.
- The column's content is `sticky top-0` with `max-h-dvh` and its own vertical scroll, so the navigator stays in view while the page scrolls.
- Below 1024 px the column is hidden; the drawer replaces it (section 9).
- Not shown on the sign-in page or error pages without a signed-in user.

---

## 3. Wireframes (240 px column; text sizes are real)

**Menu tab** (Orders is the current page, inside the open "List views" group):

```text
┌────────────────────────────┐
│                       [⇤]  │  collapse button, 32×32, right-aligned
│ ┌────────────────────────┐ │
│ │ 🔍 Search the menu     │ │  search, 32 px tall
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │[☰ Menu        ]  ☆   ⟲ │ │  tabs: chosen = icon+name (fills), others icon only (40 px)
│ └────────────────────────┘ │
│  ⌂  Home                   │  rows 28 px, 16 px text, 16 px icons
│  ▦  Dashboards             │
│  ▤  Reports                │
│  ≡  List views          ⌄  │  group, open (chevron turned down)
│        List views overview │  submenu rows indented: text starts at 32 px
│ ▌      Orders            ★ │  CURRENT: brand text, bold, 10% tint, 3 px bar; ★ = a favorite
│  ⛨  Admin               ›  │  group, closed (chevron pointing right)
└────────────────────────────┘
   ☆ appears at the right end of a row on hover/focus; stays (filled) when starred.
```

**Favorites tab:**

```text
│ ┌────────────────────────┐ │
│ │ 🔍 Search favorites    │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ ☰  [☆ Favorites    ]  ⟲ │ │
│ └────────────────────────┘ │
│  ★  EMER orders            │  each row: small filled brand star + the person's name for it
│  ★  People and roles       │
│  [+ Add this page] [✎ Edit]│  14 px brand-colored actions
```

**Favorites tab, "Add this page"** (replaces the action buttons until saved or cancelled):

```text
│ ┌────────────────────────┐ │
│ │ Name this favorite     │ │  14 px label
│ │ ┌────────────────────┐ │ │
│ │ │ Orders             │ │ │  prefilled with the page title, max 60 characters, focused
│ │ └────────────────────┘ │ │
│ │ [✓ Save]  Cancel       │ │  Save = brand button; Cancel = plain
│ └────────────────────────┘ │
```

**Favorites tab, Edit mode:**

```text
│ ┌────────────────────────┐ │
│ │ [EMER orders  ] ↑ ↓ 🗑 │ │  rename box (Enter or leaving the box saves), move up/down, remove
│ └────────────────────────┘ │  (↑ disabled on the first, ↓ on the last; no ↑↓ while searching)
│ ┌────────────────────────┐ │
│ │ [People and r…] ↑ ↓ 🗑 │ │
│ └────────────────────────┘ │
│  [+ Add this page] [✓ Done]│
```

**History tab:**

```text
│ ┌────────────────────────┐ │
│ │ 🔍 Search history      │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ ☰   ☆  [⟲ History     ]│ │
│ └────────────────────────┘ │
│ ▌Orders               now  │  current page highlighted like the menu
│  Home                  5m  │  14 px secondary-color time, right-aligned
│  People and roles      3h  │
│  Order 54              2d  │
│  [🗑 Clear history]        │
```

**Collapsed (icon rail, 56 px):**

```text
┌──────┐
│ [⇥]  │  expand button, centered
│  ⌂   │  only top-level menu icons, centered; name in tooltip + screen-reader text
│  ▦   │  search, tabs, favorites, history, stars and submenus are hidden
│  ▤   │  a group's icon goes straight to the group's overview page
│ ▌≡   │  current page (or its group): same highlight
│  ⛨   │
└──────┘
```

---

## 4. Anatomy, top to bottom

1. **Collapse button** (panel icon), right-aligned; centered when collapsed.
2. **Search box** with a magnifier icon inside on the left.
3. **Tabs** (segmented control): Menu (`Menu` icon ☰), Favorites (`Star` ☆), History (`History`, clock with a back arrow). Lucide icon names given; use the same symbols in other icon sets.
4. **Tab content:** the menu list, the favorites list with its actions, or the history list with Clear history.
5. An **error line** under the tabs when a favorites action fails (section 8).

Nothing else goes in the navigator: no logos, user menus, banners, counts, badges or ads (those belong in the top banner or the page).

---

## 5. Sizes and spacing

| Element | Value | Tailwind |
|---|---|---|
| Column width, open | **240 px by default**; the person can drag it from 200 to 400 px | `w-[var(--nav-width,240px)]` |
| Resize handle | 8 px wide hit area centred on the right edge; a 2 px brand line shows on hover/focus | see section 13 |
| Column width, collapsed | 56 px | `nav-closed:w-14` |
| Column padding | 8 px; 6 px sideways when collapsed | `px-2 py-2 nav-closed:px-1.5` |
| Gap between sections (button, search, tabs, list) | 6 px | `gap-1.5` |
| Collapse button | 32 × 32 px, 20 px icon, 8 px radius | `size-8 rounded-lg`, icon `size-5` |
| Search box | 32 px tall, 6 px radius, text starts 32 px from the left; icon 16 px at 10 px from the left | `h-8 rounded-md pl-8 pr-2`, icon `left-2.5 size-4` |
| Tab track | 2 px padding, 2 px between tabs, 8 px radius | `p-0.5 gap-0.5 rounded-lg` |
| Tabs | 28 px tall; chosen tab fills the rest with 8 px side padding; others 40 px wide | `min-h-7`; `flex-1 px-2`; `w-10` |
| Row | **28 px** minimum, 4 px × 8 px padding, 6 px radius, 8 px icon–text gap | `min-h-7 py-1 px-2 rounded-md gap-2` |
| Gap between rows | 1 px | `gap-px` |
| Submenu row | text starts 32 px from the row edge | `pl-8` |
| Row icon | 16 px | `size-4` |
| Star button | 24 × 24 px, 14 px star, 2 px from the row's right end; row keeps 28 px clear on the right | `size-6 right-0.5`, icon `size-3.5`; row `pr-7` |
| Favorites edit row | bordered card, 4 px padding; rename box 32 px; icon buttons 32 × 32 | `rounded-lg border p-1`; `h-8`; `size-8` |
| Small actions | 32 px tall, 8 px side padding, 16 px icon | `min-h-8 px-2`, icon `size-4` |
| Drawer (phone/tablet) | 288 px wide (max 85% of screen), 16 px padding; Menu/close buttons 44 × 44 | `w-72 max-w-[85vw] p-4`; `size-11` |

28 px rows were chosen by Ryan after trying 15, 24 and 32 px: dense enough to scan, still easy to hit with a mouse. Apps used mostly on touch screens should raise rows to 44 px (and record the exception).

---

## 6. Colors

Use the app's tokens only (shadcn/Tailwind names). **Neutral values are standard** across LLUH apps; **brand roles take each app's own palette**.

| Role | Token / class | Standard value (light) |
|---|---|---|
| Navigator background | `bg-muted/50` | `--muted` `#f3f3f3` at 50% over white |
| Divider to the page | `border-r` | `--border` `#dedede` |
| **Row text** | `--foreground` | **`#333333`** |
| **Secondary text**: placeholder, search icon, unchosen tab icons, hints, empty messages, history times, unstarred ☆, collapse icon | `--muted-foreground` | **`#5c5c5c`** |
| Hover background (rows, actions) | `--accent` | `#f3f3f3` |
| Hover on unchosen tabs | `bg-background/60` | white at 60% |
| Chosen tab | `bg-background` + `shadow-sm` | `#ffffff` |
| Search box | `bg-background`, border `--input` | white, `#7a7a7a` border |
| Focus ring | `--ring`, 3 px | `#333333` |
| Error text | `--destructive` | `#b42318` |
| **Current page: text and icon** | `text-primary` | *the app's brand color* |
| **Current page: background** | `bg-primary/10` (hover `bg-primary/15`) | *brand at 10%* |
| **Current page: left bar** | `shadow-[inset_3px_0_0_var(--primary)]` | *brand, 3 px* |
| **Starred ★, favorite-row stars, "Add this page", "Edit", "Done", "Clear history"** | `text-primary` | *brand* |
| Save button (Add this page) | `bg-primary text-primary-foreground` | *brand* + its foreground |
| Drawer overlay | `bg-foreground/40` | `#333333` at 40% |

Rules:
- Text is never pure black, and never the brand color except for the current page and the small actions above.
- `--primary` **must** reach 4.5:1 contrast on its own 10% tint and on `--muted`. If the app's main brand color doesn't (light or bright palettes), use the palette's darker shade.
- No gradients, images or colored backgrounds in the navigator: color marks only "where you are" and "your favorites".
- Dark mode, if the app has one, uses the same roles with the app's dark tokens.

---

## 7. Typography and wording

- Font: the app's **body (sans) font** from the LLUH style guide. Never the heading/serif font in the navigator.
- Row labels, tab names, search text: **16 px** (`text-base`), line height 20 px (`leading-5`), weight 400.
- Current page, the group containing it, and the chosen tab: weight 600 (`font-semibold`).
- Small actions: 14 px (`text-sm`), weight 500 (`font-medium`). History times and error lines: 14 px, weight 400.
- Labels are sentence case ("List views", not "List Views"), 1–3 words, one line, cut with "…" (`truncate`); the full name is the tooltip (`title`).

**Every visible and spoken string** (use these exactly; replace "<App>" with the app's name):

| Where | Text |
|---|---|
| Collapse button (screen reader / tooltip) | "Collapse menu" / "Expand menu"; tooltip "Collapse or expand the menu" |
| Resize handle | Accessible name "Resize menu"; tooltip "Drag to resize the menu. Double-click to reset." |
| Search placeholder | "Search the menu" · "Search favorites" · "Search history" |
| Search label (screen reader) | "Search the menu" |
| Tabs (names, tooltips, accessible names) | "Menu" · "Favorites" · "History"; tab list label "Navigator" |
| Menu no-match | Nothing in the menu matches “<query>”. |
| Group overview row | "<Group> overview" |
| Star (screen reader) | "Add <page> to favorites" / "Remove <page> from favorites"; tooltip "Add to favorites" / "Remove from favorites" |
| Favorites empty | No favorites yet. Select ☆ next to a menu item, or add the page you're on (with its filter). |
| Favorites no-match | No favorites match “<query>”. |
| Favorites actions | "Add this page" · "Edit" · "Done" |
| Add form | Label "Name this favorite"; buttons "Save" · "Cancel" |
| Edit row (screen reader) | "Name of favorite <name>", "Move <name> up", "Move <name> down", "Remove <name> from favorites"; tooltips "Move up" · "Move down" · "Remove" |
| Favorites errors | "Only pages in <App> can be favorites." · "Give the favorite a name." · "That page is already a favorite." · "You can have up to 50 favorites." · fallback "That didn't work. Try again." |
| History empty | Pages you open will appear here, newest first. |
| History no-match | No pages in your history match “<query>”. |
| History times | "now" (under 1 min) · "5m" · "3h" · "2d"; tooltip: name + full local date and time |
| History action | "Clear history" |
| History loading | "Loading…" |
| Drawer | Open button "Open menu"; title "Menu"; close button "Close menu"; description (screen reader) "Go to a page in <App>." |

---

## 8. States

| State | Look |
|---|---|
| Default row | `--foreground` text, no background |
| Hover | `--accent` background |
| Keyboard focus (everything) | 3 px `--ring` ring (`focus-visible:ring-3 focus-visible:ring-ring`), never removed |
| **Current page** (menu, favorite or history row) | brand text, weight 600, 10% brand background, 3 px brand bar on the left edge, `aria-current="page"` |
| Group containing the current page | brand text, weight 600, no background (open or closed) |
| Chosen tab | white background, small shadow, weight 600, icon + name |
| Unchosen tab | secondary-color icon only; hover: white at 60%, text color |
| Star, not starred | hidden until the row is hovered or the star is focused |
| Star, starred | always visible, filled, brand color |
| Disabled (Move up on the first favorite, Move down on the last) | 30% opacity |
| Saving a favorites change | whole navigator at 80% opacity until the server answers; then the list reloads |
| Favorites action failed | error line (14 px, `--destructive`, `role="alert"`) under the tabs |

---

## 9. Behavior in detail

### 9.1 Collapse ("slide closed")
- The collapse button toggles the column between open (240 px) and an **icon rail** (56 px), animating width over 200 ms.
- Collapsed: rows become centered icons with the name as tooltip and screen-reader text; search, tabs, favorites, history, stars and submenus are hidden; **the menu icons always show, whatever tab was chosen**; a group's icon links straight to the group's overview page and is highlighted when you're anywhere in that group.
- Remembered per browser in localStorage key `<app>:nav` (`"closed"` / `"open"`). A tiny inline script in the layout sets `data-nav="closed"` on `<html>` **before the page paints**, and all collapsed styles use a Tailwind variant that skips the drawer: `@custom-variant nav-closed (&:where([data-nav=closed], [data-nav=closed] *):not(:where([role=dialog], [role=dialog] *)));`. No React state, so no flicker and correct icons before scripts load.
- Icons: `PanelLeftClose` when open, `PanelLeftOpen` when collapsed.
- Collapse applies to the desktop column only. **The drawer always shows the full navigator**, even when the desktop column is collapsed: the `nav-closed` variant must not apply inside the drawer (exclude `[role=dialog]` or `<dialog>`; see section 13).

### 9.1a Resize (drag the edge)
- The open column is **240 px by default**. A handle on its right edge lets the person **drag it to any width from 200 to 400 px**; the page content takes the rest.
- The cursor is `col-resize` over the handle; a 2 px brand-colored line appears on hover and keyboard focus. While dragging, the width follows the pointer exactly (no width animation).
- **Double-click the handle** (or press **Enter** on it) to go back to 240 px. Keyboard: **← / →** move 16 px; **Home** = 200 px; **End** = 400 px.
- Remembered per browser in localStorage key `<app>:nav-width` (removed when back at 240). Applied **before the page paints** by the same inline script as collapse, as the CSS variable `--nav-width` on `<html>`; the column uses `w-[var(--nav-width,240px)]`.
- Hidden while collapsed, and not in the drawer (the drawer has a fixed width).
- Markup: `role="separator"`, `aria-orientation="vertical"`, `aria-label="Resize menu"`, `aria-valuemin=200`, `aria-valuemax=400`, `aria-valuenow=<width>`, `tabIndex=0`, tooltip "Drag to resize the menu. Double-click to reset."

### 9.2 Menu and groups
- Menu items come from one list (`NAV_ITEMS`: title, href, icon, optional children, optional `adminOnly`/permission).
- A top-level item with children is a **group**: a button with the icon, name and a chevron (`ChevronRight`, turns 90° when open), `aria-expanded` and `aria-controls`.
- **Groups start collapsed**, even the one holding the current page (that group is shown in brand color, bold). Opening one doesn't close others. The open/closed state isn't remembered.
- The group's first child is "**<Group> overview**" (the group's own page); it's "current" only on that exact address. Other rows are current on their page and any page beneath it (e.g. `/lists/orders/54` highlights Orders).
- One level of nesting only.

### 9.3 Search
- Filters the chosen tab as you type, case-insensitive "contains" on the visible name.
- Menu: an item matches by its own name; a group matches by its name (all children shown) or by any child (only matching children shown); **groups with matches open while searching** and return to their own state when the search is cleared.
- Favorites: matches the person's names for them. History: matches page names.
- The search text stays when switching tabs (and filters the new tab).

### 9.4 Tabs
- Three tabs; the chosen one is remembered per browser in localStorage key `<app>:nav-tab` (`menu` / `favorites` / `history`), default `menu`. If storage is blocked, it lasts until reload.
- Markup: `role="tablist" aria-label="Navigator"`; each `role="tab"` with `aria-selected`, `aria-label` and `title` set to its name (the unchosen ones show only an icon).

### 9.5 Favorites (per person, saved on the server)
- **Star from the menu:** every menu row and submenu row (including "<Group> overview") has a ☆ at its right end, shown on hover or keyboard focus. Selecting it adds the page with its menu name; selecting a filled ★ removes it.
- **Add this page** (Favorites tab): opens the small form, prefilled with the page title (browser tab title without " · <App>"), focused, max 60 characters. **Save** stores the full address **including the query** (filters, sort, grouping), so "EMER orders" reopens the list filtered. **Cancel** closes the form.
- **Edit** switches every favorite to an edit row: rename box (saves on Enter or leaving the box, if changed and not empty), **Move up / Move down** (hidden while searching), **Remove** (no confirmation; it's easy to add back). **Done** returns to the list.
- Favorite rows: small filled brand star + name; a favorite is "current" when its address has no query and matches the page you're on.
- Limits and rules: up to 50; only addresses inside the app (start with a single `/`); no duplicates (same address); names trimmed, spaces collapsed.
- After every change the server list is reloaded (e.g. `router.refresh()`); the navigator dims to 80% while saving; failures show the error line.

### 9.6 History (per person, saved on the server)
- **Recording:** a small client component in the signed-in layout watches the address (path and query). About 400 ms after each change (so the new page title is set) it calls `recordVisit(title, address)`, then tells the History list to reload (a window event).
- **One entry per page:** keyed by person + path (no query). Visiting a page again moves it to the top and replaces its address and title with the latest, so a list returns with its last filter and filtering doesn't make copies.
- **Kept to 30**, newest first; older entries are deleted when a visit is recorded.
- **Rows:** page name (truncated) and a short time on the right; tooltip with the name and the full date and time. The row for the page you're on is highlighted as current. Selecting a row goes to its saved address.
- **Clear history** removes all of the person's entries at once (no confirmation).
- **Not recorded:** API routes, the sign-in page, addresses outside the app.
- **Page titles are saved**, so **titles must never contain patient or other sensitive details**: use an ID ("Order 54"), never a patient name, MRN or similar.
- The list loads when the History tab opens and refreshes after each recorded visit.

### 9.7 Phones and tablets (below 1024 px)
- A 44 × 44 **Menu** button (☰) at the far left of the top banner opens a drawer from the left: 288 px wide (max 85% of the screen), white, with a dimmed overlay.
- The drawer has a "Menu" title, a 44 × 44 close button (✕), and the **same navigator** (search, tabs, menu, favorites, history; no collapse button).
- Choosing a page closes it; so do ✕, Esc and tapping the overlay. Focus is trapped inside while open and returns to the Menu button when closed (use an accessible dialog component, e.g. Radix Dialog).

### 9.8 Permissions
- Items a person can't use are not shown (e.g. Admin for non-admins). Pages must still check permission on the server; hiding a link is not security.
- Favorites and history only ever read or change the signed-in person's own rows.

---

## 10. Data and server actions

Store favorites and history in the app's database, per signed-in person, **not in the browser**: they follow the person between computers and are never shown to someone else on a shared computer. Every action checks the signed-in user on the server and only touches that user's rows.

```sql
create table nav_favorites (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  label text not null,          -- the person's name for it, max 60
  href text not null,           -- "/path?query", always starts with a single "/"
  position integer not null,    -- order in the list (0, 1, 2…)
  created_at timestamptz not null default now()
);

create table nav_history (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  path text not null,           -- page without query: one row per page
  href text not null,           -- latest full address visited
  label text not null,          -- page title when visited, max 80
  visited_at timestamptz not null default now(),
  unique (user_id, path)
);
```

| Action | Does | Errors / rules |
|---|---|---|
| `favoritesFor(userId)` (server read) | The person's favorites ordered by `position, id`; passed to the navigator by the layout | — |
| `addFavorite(label, href)` | Appends at the end (`position = max + 1`) | Not an app address; empty name; duplicate address; more than 50 |
| `renameFavorite(id, label)` | Sets the name | Empty name |
| `moveFavorite(id, -1 \| 1)` | Swaps with the neighbour and renumbers the person's list | Ignored at the ends |
| `removeFavorite(id)` | Deletes it | — |
| `recordVisit(label, href)` | Upsert on `(user_id, path)` setting `href`, `label`, `visited_at = now()`; then delete all but the newest 30 | Ignores non-app addresses, `/api/…`, sign-in |
| `loadHistory()` | Newest first, at most 30 | — |
| `clearHistory()` | Deletes all the person's history | — |

Address check used everywhere: a string that starts with `/`, not `//`, at most 2000 characters.

---

## 11. Icons

- One line-icon set for the whole app (Lucide in the reference), 16 px in rows (20 px on the collapse button), colored by the row's text color; never multicolor.
- Every top-level menu item has an icon; submenu rows don't. Favorite rows show a 14 px filled star; history rows have no icon.
- Plain, literal icons, the same across LLUH apps: Home = house, Dashboards = layout dashboard, Reports = bar chart, List views = list, Admin = shield check. Tabs: menu (☰ `Menu`), favorites (`Star`), history (`History`).

---

## 12. Accessibility (must)

- The menu is `<nav aria-label="Main">`; favorites and history are regions (`<section aria-label="Favorites">`, `"History"`); lists are real `<ul>`/`<ol>` + `<li>`; destinations are real links (`<a href>`), so open-in-new-tab and copy-link work.
- Current page: `aria-current="page"` (and not by color alone: weight and the left bar too).
- Icon-only controls (collapse, unchosen tabs, stars, edit icons) have accessible names; decorative icons are `aria-hidden`.
- Keyboard only: Tab moves top to bottom; Enter/Space open groups, switch tabs and press buttons; the star becomes visible when focused; focus is always visible.
- Text contrast at least 4.5:1 (the standard neutrals pass on the navigator background).
- Errors use `role="alert"`.

---

## 13. Reference classes (Tailwind v4 + shadcn tokens)

Use these exactly, or their exact CSS equivalents. Every focusable element also has `outline-none focus-visible:ring-3 focus-visible:ring-ring`.

```text
Column (desktop):   relative hidden w-[var(--nav-width,240px)] shrink-0 border-r bg-muted/50 transition-[width] duration-200 lg:block nav-closed:w-14
Resize handle:      absolute inset-y-0 -right-1 z-10 w-2 cursor-col-resize touch-none after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:transition-colors hover:after:bg-primary focus-visible:after:bg-primary nav-closed:hidden
nav-closed variant: @custom-variant nav-closed (&:where([data-nav=closed], [data-nav=closed] *):not(:where([role=dialog], [role=dialog] *)));
Column inner:       sticky top-0 flex max-h-dvh flex-col gap-1.5 overflow-x-hidden overflow-y-auto px-2 py-2 nav-closed:px-1.5
Collapse row:       flex justify-end nav-closed:justify-center
Collapse button:    flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground
Navigator root:     grid min-w-0 grid-cols-1 gap-1.5        (+ opacity-80 while saving)
Search + tabs box:  grid gap-1.5 nav-closed:hidden
Search input:       h-8 w-full rounded-md border border-input bg-background pr-2 pl-8 text-base focus-visible:border-ring
  search icon:      pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground
Tab track:          flex gap-0.5 rounded-lg bg-muted p-0.5
Tab (all):          flex min-h-7 items-center justify-center gap-1.5 rounded-md text-base
  chosen:           flex-1 bg-background px-2 font-semibold shadow-sm        (icon size-4 shrink-0 + <span class="truncate">name</span>)
  not chosen:       w-10 shrink-0 text-muted-foreground hover:bg-background/60 hover:text-foreground   (icon only)
List:               grid gap-px
Row:                flex min-h-7 w-full min-w-0 items-center gap-2 rounded-md px-2 py-1 text-base leading-5 hover:bg-accent nav-closed:justify-center nav-closed:px-0
  current:          bg-primary/10 font-semibold text-primary shadow-[inset_3px_0_0_var(--primary)] hover:bg-primary/15
  label:            truncate nav-closed:sr-only
  menu row wrapper: group relative flex items-center      (row gets pr-7 nav-closed:pr-0)
  submenu row:      + pl-8 (wrapper nav-closed:hidden)
  group button:     row classes + nav-closed:hidden; name flex-1 truncate text-left; chevron size-4 shrink-0 transition-transform (rotate-90 when open)
  group (current):  font-semibold text-primary
Star button:        absolute right-0.5 flex size-6 items-center justify-center rounded-md hover:bg-background nav-closed:hidden
  not starred:      text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100
  starred:          text-primary opacity-100            (star size-3.5 fill-current)
Favorite row:       row classes; star size-3.5 shrink-0 fill-current text-primary; name truncate
Add form:           grid gap-2 rounded-lg border bg-background p-2
  label:            grid gap-1 text-sm font-medium
  input:            h-9 rounded-md border border-input px-2 text-base font-normal
  Save:             inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground
  Cancel:           inline-flex h-9 items-center rounded-md px-3 text-sm hover:bg-accent
Edit row:           flex min-w-0 items-center gap-0.5 rounded-lg border bg-background p-1
  rename input:     h-8 w-0 min-w-0 flex-1 rounded-md px-2 text-base   (size=1 so it can shrink)
  icon buttons:     flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30
History row:        row classes; name min-w-0 flex-1 truncate; time shrink-0 text-sm font-normal text-muted-foreground
Small action:       inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-primary hover:bg-accent   (icon size-4)
Actions row:        flex flex-wrap gap-1
Empty/hint text:    px-1 text-base text-muted-foreground     (menu no-match: px-2 py-1)
Error line:         text-sm text-destructive (role="alert")
Drawer:             fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto bg-background p-4 shadow-xl
  overlay:          fixed inset-0 z-40 bg-foreground/40
```

---

## 14. Don'ts

- Don't redesign, restyle, or simplify the navigator, even if it seems an improvement. Propose changes to the standard's owner instead.
- Don't skip Favorites or History, and don't keep them only in the browser.
- Don't add a second navigation column, mega-menus, or menus that open on hover.
- Don't open groups by default (except while searching), and don't auto-collapse other groups when one opens.
- Don't use the brand color for ordinary row text, the navigator background, or icons of non-current items.
- Don't add counts, badges or alerts without the owners' approval.
- Don't wrap labels to two lines or shrink text below 16 px to fit.
- Don't put patient or other sensitive details in page titles (History saves them).

---

## 15. Adapting to other stacks

- **Next.js App Router + Tailwind v4 + shadcn/ui:** copy Appendix A. Adapt imports (`@/…` paths), the menu list, storage-key prefix, app name in titles, and the sign-in/permission helpers (`requireUser`, `can`) and database access (`getDb`, Drizzle schema) to the app's own.
- **Other React setups:** keep the components; replace `next/link` with the router's link, `usePathname`/`useSearchParams` with the router's equivalents, `router.refresh()` with re-fetching favorites, and server actions with API endpoints that check the session.
- **Tailwind v3:** the classes mostly work; define the `nav-closed` variant with a plugin (`addVariant('nav-closed', ':where([data-nav=closed]) &')`) and replace `ring-3` with `ring` + width as needed.
- **No Tailwind:** reproduce the classes in section 13 as CSS with the same values (sizes in section 5, colors in section 6).
- **No relational database:** keep the same fields and rules (one history row per person + path, 30 kept; favorites ordered by position).

---

## 16. Build order (for agents)

1. Add the `nav-closed` variant (excluding the drawer) and the two tables (migration).
2. Add the server read/actions for favorites and history (section 10), each checking the signed-in user.
3. Add the menu list with the app's pages (icons, groups, permissions).
4. Add the navigator component, collapse button, resize handle and no-flicker script (collapse + width), and put them in the signed-in layout (column under the banner).
5. Add the history recorder to the signed-in layout.
6. Add the drawer and its Menu button in the banner (below 1024 px).
7. Make page titles meaningful and free of sensitive details (they become favorite names and history entries).
8. Check every item in section 18 at 1440 px and 375 px wide, with keyboard only, and report.

---

## 17. Why it looks like this (for reviewers)

- **Dense rows (28 px), 16 px text:** CS staff scan long menus on desktop; tried 15/24/32 px, 28 px won.
- **Icon rail, remembered:** more room for wide list views, without losing the menu.
- **Resizable, 240 px default:** people with long page names or wide screens can widen it (Ryan, 2026-11-18); everyone starts from the same standard width, and one double-click brings it back.
- **Tabs with icon + name only on the chosen one:** three names don't fit in 224 px; this keeps the current tab named and the others one hover away.
- **Server-side favorites and history:** they follow people between workstations and stay private on shared computers.
- **Brand color only for "where you are" and "your favorites":** one meaning per color.

---

## 18. Conformance checklist (report each as pass/fail)

- [ ] All eight required features in section 1 are built.
- [ ] 240 px open by default / 56 px collapsed; collapse remembered per browser with no flicker on load; collapsed shows only menu icons with tooltips.
- [ ] Drag-to-resize from 200 to 400 px, remembered per browser and applied before paint; double-click/Enter resets to 240; arrow keys, Home and End work; handle hidden when collapsed.
- [ ] The phone/tablet drawer shows the full navigator even when the desktop column is collapsed.
- [ ] Rows 28 px; 16 px labels and icons; classes match section 13.
- [ ] Row text `--foreground` (`#333333`); secondary text `--muted-foreground` (`#5c5c5c`); no hard-coded colors; brand only for current page and the actions in section 6.
- [ ] Current page: brand text, weight 600, 10% tint, 3 px left bar, `aria-current="page"`, in menu, favorites and history; brand passes 4.5:1 on its tint.
- [ ] Tabs: chosen shows icon + name; others icon only, with tooltip and accessible name; remembered per browser.
- [ ] Search filters the chosen tab; menu groups start collapsed and open while searching.
- [ ] Favorites on the server: ☆ on menu rows, Add this page (named, keeps the query), rename, move up/down, remove, Done; limits and error messages as in section 7.
- [ ] History on the server: recorded on every page change, last 30, one entry per page with its latest address, short times, current highlighted, search, Clear history.
- [ ] Page titles contain no patient or sensitive details.
- [ ] Phone/tablet drawer from the banner's Menu button, with the same navigator; closes on choosing a page, ✕, Esc, overlay.
- [ ] All wording matches section 7.
- [ ] Keyboard-only and screen-reader checks pass; permission-hidden items are also blocked on the server.

---

<!-- reference-code:start (generated by scripts/standards.mjs; don't edit by hand) -->

## Appendix A. Reference code (CS Tracker)

The navigator as built in CS Tracker: Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui tokens and components, `lucide-react` icons, `radix-ui`, Drizzle ORM on Postgres. **Copy it and adapt only what the notes say.** For other stacks, reproduce the same markup, classes and behavior (section 15).

App helpers it uses: `cn()` (clsx + tailwind-merge, from shadcn), `getDb()` / `schema` (Drizzle), `requireUser()` / `findCurrentUser()` (the signed-in user), `can(user, permission)`.

### Tailwind variant (in the global CSS)

```css
@custom-variant nav-closed (&:where([data-nav=closed], [data-nav=closed] *):not(:where([role=dialog], [role=dialog] *)));
```

### Tables (Drizzle schema)

```ts
/**
 * Each person's favorites in the left-hand navigator (docs/features/navigation.md):
 * a page in the app (path plus any filter in its address), with their own name
 * and order.
 */
export const navFavorites = pgTable("nav_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** What the person called it, e.g. "EMER orders". */
  label: text("label").notNull(),
  /** A page inside the app, e.g. "/lists/orders?filter=…". Always starts with a single "/". */
  href: text("href").notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Navigator History (docs/features/navigation.md): the last pages each person
 * opened, newest first, kept to 30. One row per page (path); visiting it again
 * moves it to the top and remembers the latest address, e.g. the list's filter.
 */
export const navHistory = pgTable(
  "nav_history",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** The page without its query, e.g. "/lists/orders". One row per page. */
    path: text("path").notNull(),
    /** The full address last visited, e.g. "/lists/orders?filter=…". */
    href: text("href").notNull(),
    /** The page's title when visited, e.g. "Orders". */
    label: text("label").notNull(),
    visitedAt: timestamp("visited_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("nav_history_user_path").on(t.userId, t.path)],
);
```

### Menu items: `src/components/nav/nav-items.ts`

Replace NAV_ITEMS with the app's own pages. Keep the shape and isActive().

```ts
import { ChartColumn, House, LayoutDashboard, List, ShieldCheck, type LucideIcon } from "lucide-react";

/**
 * The left-hand navigation. Add pages here as they're built. An item with
 * `children` becomes a group that opens and closes (a submenu); its own `href`
 * is the group's overview page.
 *
 * Dashboards and Reports are placeholders until Ryan and Matt define what goes in
 * them (2026-11-18). Don't add submenu items before they're discussed.
 */
export type NavItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  children?: NavItem[];
  /** Shown only to people with the Admin role. The pages also check on the server. */
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { title: "Home", href: "/", icon: House },
  { title: "Dashboards", href: "/dashboards", icon: LayoutDashboard },
  { title: "Reports", href: "/reports", icon: ChartColumn },
  {
    title: "List views",
    href: "/lists",
    icon: List,
    children: [{ title: "Orders", href: "/lists/orders" }],
  },
  {
    title: "Admin",
    href: "/admin",
    icon: ShieldCheck,
    adminOnly: true,
    children: [{ title: "People and roles", href: "/admin/people" }],
  },
];

/** True when `pathname` is this item's page or one of the pages under it. */
export function isActive(item: NavItem, pathname: string) {
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
```

### Navigator (menu, search, tabs, favorites, history): `src/components/nav/side-nav.tsx`

The whole navigator. Change only imports, the storage key prefix (`cs-tracker:`) and the page-title suffix (` · CS Tracker`).

```tsx
"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  History as HistoryIcon,
  Menu as MenuIcon,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { addFavorite, moveFavorite, removeFavorite, renameFavorite } from "@/lib/nav/actions";
import type { NavFavorite } from "@/lib/nav/favorites";
import { clearHistory, loadHistory, type HistoryEntry } from "@/lib/nav/history";
import { HISTORY_EVENT } from "./history-recorder";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive, type NavItem } from "./nav-items";

type Props = { onNavigate?: () => void; showAdmin?: boolean; favorites?: NavFavorite[] };

/**
 * The left-hand navigator (docs/features/navigation.md), used in the desktop
 * sidebar and the phone/tablet drawer: a search box, Menu / Favorites / History
 * tabs, menu groups that start collapsed, each person's own favorites (☆ on any
 * menu item, or Add this page; rename, reorder, remove), and their recent pages.
 */
export function SideNav(props: Props) {
  return <Navigator pathname={usePathname()} {...props} />;
}

/** Placeholder while the user is checked: same items, nothing highlighted, no URL needed. */
export function SideNavLoading() {
  return <Navigator pathname="" />;
}

// --- Which tab is showing, remembered in this browser. ---
type Tab = "menu" | "favorites" | "history";
const TABS: { id: Tab; label: string; icon: typeof Star }[] = [
  { id: "menu", label: "Menu", icon: MenuIcon },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "history", label: "History", icon: HistoryIcon },
];
const TAB_KEY = "cs-tracker:nav-tab";
const tabListeners = new Set<() => void>();
let tabFallback: Tab = "menu";
function readTab(): Tab {
  try {
    const saved = localStorage.getItem(TAB_KEY);
    return saved === "favorites" || saved === "history" ? saved : "menu";
  } catch {
    return tabFallback;
  }
}
function useTab() {
  const tab = useSyncExternalStore(
    (cb) => {
      tabListeners.add(cb);
      return () => tabListeners.delete(cb);
    },
    readTab,
    () => "menu" as Tab,
  );
  const setTab = (next: Tab) => {
    tabFallback = next;
    try {
      localStorage.setItem(TAB_KEY, next);
    } catch {
      // Storage blocked: lasts until reload.
    }
    tabListeners.forEach((l) => l());
  };
  return [tab, setTab] as const;
}

/** Menu items matching the search; a group matches by its own name or any of its pages. */
function filterItems(items: NavItem[], query: string): NavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.flatMap((item) => {
    if (item.title.toLowerCase().includes(q)) return [item];
    const children = item.children?.filter((c) => c.title.toLowerCase().includes(q));
    return children?.length ? [{ ...item, children }] : [];
  });
}

function Navigator({ pathname, onNavigate, showAdmin = false, favorites = [] }: Props & { pathname: string }) {
  const [tab, setTab] = useTab();
  const [query, setQuery] = useState("");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const all = NAV_ITEMS.filter((item) => showAdmin || !item.adminOnly);
  const items = filterItems(all, query);
  const q = query.trim().toLowerCase();
  const shownFavorites = q ? favorites.filter((f) => f.label.toLowerCase().includes(q)) : favorites;
  const favoriteFor = (href: string) => favorites.find((f) => f.href === href);

  /** Run a favorites action, then reload the list. */
  function run(task: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) setError(result.error ?? "That didn't work. Try again.");
      router.refresh();
    });
  }

  const toggleStar = (title: string, href: string) => {
    const existing = favoriteFor(href);
    run(() => (existing ? removeFavorite(existing.id) : addFavorite(title, href)));
  };

  return (
    <div className={cn("grid min-w-0 grid-cols-1 gap-1.5", pending && "opacity-80")}>
      {/* Search and tabs; hidden when the menu is slid closed to icons. */}
      <div className="grid gap-1.5 nav-closed:hidden">
        <label className="relative block">
          <span className="sr-only">Search the menu</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tab === "menu" ? "the menu" : tab}`}
            className="h-8 w-full rounded-md border border-input bg-background pr-2 pl-8 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring"
          />
        </label>
        {/* Three tabs fit by showing the chosen tab's name and only icons for the others
            (names on hover and for screen readers). Ryan, 2026-11-18. */}
        <div role="tablist" aria-label="Navigator" className="flex gap-0.5 rounded-lg bg-muted p-0.5">
          {TABS.map(({ id, label, icon: Icon }) => {
            const selected = tab === id;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-label={label}
                title={label}
                onClick={() => setTab(id)}
                className={cn(
                  "flex min-h-7 items-center justify-center gap-1.5 rounded-md text-base outline-none focus-visible:ring-3 focus-visible:ring-ring",
                  selected
                    ? "flex-1 bg-background px-2 font-semibold shadow-sm"
                    : "w-10 shrink-0 text-muted-foreground hover:bg-background/60 hover:text-foreground",
                )}
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                {selected && <span className="truncate">{label}</span>}
              </button>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      {/* Menu. Always shown when slid closed (icons), whichever tab is chosen. */}
      <nav aria-label="Main" className={cn(tab !== "menu" && "hidden nav-closed:block")}>
        {items.length === 0 ? (
          <p className="px-2 py-1 text-base text-muted-foreground">Nothing in the menu matches “{query}”.</p>
        ) : (
          <ul className="grid gap-px">
            {items.map((item) => (
              <li key={item.href}>
                {item.children?.length ? (
                  <NavGroup
                    item={item}
                    pathname={pathname}
                    onNavigate={onNavigate}
                    forceOpen={!!q}
                    favoriteFor={favoriteFor}
                    onStar={toggleStar}
                  />
                ) : (
                  <NavRow
                    item={item}
                    pathname={pathname}
                    onNavigate={onNavigate}
                    starred={!!favoriteFor(item.href)}
                    onStar={toggleStar}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </nav>

      {tab === "favorites" && (
        <section aria-label="Favorites" className="nav-closed:hidden">
          <Favorites
            favorites={shownFavorites}
            total={favorites.length}
            query={query}
            pathname={pathname}
            onNavigate={onNavigate}
            run={run}
          />
        </section>
      )}

      {tab === "history" && (
        <section aria-label="History" className="nav-closed:hidden">
          <History query={query} onNavigate={onNavigate} />
        </section>
      )}
    </div>
  );
}

/** "now", "5m", "3h", "2d": short enough to sit beside the page name. */
function shortAgo(iso: string, now: number) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / (60 * 24))}d`;
}

/** The last 30 pages this person opened (stored per person on the server), newest first. */
function History({ query, onNavigate }: { query: string; onNavigate?: () => void }) {
  const [state, setState] = useState<{ entries: HistoryEntry[]; now: number } | null>(null);
  const [here, setHere] = useState("");
  const reload = useCallback(() => {
    loadHistory()
      .then((entries) => {
        setState({ entries, now: Date.now() });
        setHere(`${window.location.pathname}${window.location.search}`);
      })
      .catch(() => setState({ entries: [], now: Date.now() }));
  }, []);
  useEffect(() => {
    reload();
    window.addEventListener(HISTORY_EVENT, reload);
    return () => window.removeEventListener(HISTORY_EVENT, reload);
  }, [reload]);

  if (!state) return <p className="px-1 text-base text-muted-foreground">Loading…</p>;
  const q = query.trim().toLowerCase();
  const entries = q ? state.entries.filter((e) => e.label.toLowerCase().includes(q)) : state.entries;
  return (
    <div className="grid min-w-0 grid-cols-1 gap-1.5">
      {state.entries.length === 0 && (
        <p className="px-1 text-base text-muted-foreground">Pages you open will appear here, newest first.</p>
      )}
      {state.entries.length > 0 && entries.length === 0 && (
        <p className="px-1 text-base text-muted-foreground">No pages in your history match “{query}”.</p>
      )}
      <ol className="grid min-w-0 grid-cols-1 gap-px">
        {entries.map((e) => (
          <li key={e.href}>
            <Link
              href={e.href}
              onClick={onNavigate}
              title={`${e.label}\n${new Date(e.visitedAt).toLocaleString()}`}
              aria-current={e.href === here ? "page" : undefined}
              className={cn(rowClass, e.href === here && currentClass)}
            >
              <span className="min-w-0 flex-1 truncate">{e.label}</span>
              <span className="shrink-0 text-sm font-normal text-muted-foreground">
                {shortAgo(e.visitedAt, state.now)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {state.entries.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => {
              setState({ entries: [], now: Date.now() });
              void clearHistory();
            }}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-primary outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
          >
            <Trash2 aria-hidden className="size-4" />
            Clear history
          </button>
        </div>
      )}
    </div>
  );
}

// When the menu is slid closed (nav-closed), rows become centred icons; names stay for screen readers and tooltips.
const rowClass =
  "flex min-h-7 w-full min-w-0 items-center gap-2 rounded-md px-2 py-1 text-base leading-5 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring nav-closed:justify-center nav-closed:px-0";
const currentClass =
  "bg-primary/10 font-semibold text-primary shadow-[inset_3px_0_0_var(--primary)] hover:bg-primary/15";

/** A menu link with a ☆ to add it to (or remove it from) favorites. */
function NavRow({
  item,
  pathname,
  onNavigate,
  nested = false,
  exact = false,
  starred,
  onStar,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  nested?: boolean;
  exact?: boolean;
  starred: boolean;
  onStar: (title: string, href: string) => void;
}) {
  // A group's Overview link is only "current" on the group's own page, not on its children's.
  const current = exact ? pathname === item.href : isActive(item, pathname);
  const Icon = item.icon;
  return (
    <div className={cn("group relative flex items-center", nested && "nav-closed:hidden")}>
      <Link
        href={item.href}
        onClick={onNavigate}
        title={item.title}
        aria-current={current ? "page" : undefined}
        className={cn(rowClass, "pr-7 nav-closed:pr-0", nested && "pl-8", current && currentClass)}
      >
        {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
        <span className="truncate nav-closed:sr-only">{item.title}</span>
      </Link>
      <StarButton title={item.title} starred={starred} onClick={() => onStar(item.title, item.href)} />
    </div>
  );
}

function StarButton({ title, starred, onClick }: { title: string; starred: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={starred}
      aria-label={starred ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
      title={starred ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "absolute right-0.5 flex size-6 items-center justify-center rounded-md outline-none hover:bg-background focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring nav-closed:hidden",
        starred ? "text-primary opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100",
      )}
    >
      <Star aria-hidden className={cn("size-3.5", starred && "fill-current")} />
    </button>
  );
}

/** A menu with a submenu. Starts collapsed (Ryan, 2026-11-18); opens while searching. */
function NavGroup({
  item,
  pathname,
  onNavigate,
  forceOpen,
  favoriteFor,
  onStar,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  forceOpen: boolean;
  favoriteFor: (href: string) => NavFavorite | undefined;
  onStar: (title: string, href: string) => void;
}) {
  const active = isActive(item, pathname);
  const [openState, setOpen] = useState(false);
  const open = forceOpen || openState;
  const Icon = item.icon;
  const id = `nav-${item.href.replaceAll("/", "-")}`;
  return (
    <>
      {/* Slid closed: the group's icon goes straight to its overview page. */}
      <Link
        href={item.href}
        onClick={onNavigate}
        title={item.title}
        aria-current={pathname === item.href ? "page" : undefined}
        className={cn(rowClass, "hidden nav-closed:flex", active && currentClass)}
      >
        {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
        <span className="sr-only">{item.title}</span>
      </Link>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className={cn(rowClass, "nav-closed:hidden", active && "font-semibold text-primary")}
      >
        {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
        <span className="flex-1 truncate text-left">{item.title}</span>
        <ChevronRight aria-hidden className={cn("size-4 shrink-0 transition-transform", open && "rotate-90")} />
      </button>
      <ul id={id} hidden={!open} className="grid gap-px nav-closed:hidden">
        <li>
          <NavRow
            item={{ title: `${item.title} overview`, href: item.href }}
            pathname={pathname}
            onNavigate={onNavigate}
            nested
            exact
            starred={!!favoriteFor(item.href)}
            onStar={onStar}
          />
        </li>
        {item.children?.map((child) => (
          <li key={child.href}>
            <NavRow
              item={child}
              pathname={pathname}
              onNavigate={onNavigate}
              nested
              starred={!!favoriteFor(child.href)}
              onStar={onStar}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

/** The person's own favorites: open, add this page, and (Edit) rename, reorder, remove. */
function Favorites({
  favorites,
  total,
  query,
  pathname,
  onNavigate,
  run,
}: {
  favorites: NavFavorite[];
  total: number;
  query: string;
  pathname: string;
  onNavigate?: () => void;
  run: (task: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState<{ label: string; href: string } | null>(null);
  const here = () => `${window.location.pathname}${window.location.search}`;

  function startAdd() {
    const title = document.title.replace(/\s*·\s*CS Tracker$/, "").trim() || "This page";
    setAdding({ label: title, href: here() });
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-1.5">
      {total === 0 && !adding && (
        <p className="px-1 text-base text-muted-foreground">
          No favorites yet. Select ☆ next to a menu item, or add the page you&apos;re on (with its filter).
        </p>
      )}
      {total > 0 && favorites.length === 0 && (
        <p className="px-1 text-base text-muted-foreground">No favorites match “{query}”.</p>
      )}

      <ol className="grid min-w-0 grid-cols-1 gap-px">
        {favorites.map((f, i) => {
          const current = `${pathname}` === f.href.split("?")[0] && !f.href.includes("?");
          return (
            <li key={f.id}>
              {editing ? (
                <EditRow
                  favorite={f}
                  first={i === 0}
                  last={i === favorites.length - 1}
                  reorder={!query.trim()}
                  run={run}
                />
              ) : (
                <Link
                  href={f.href}
                  onClick={onNavigate}
                  title={f.label}
                  className={cn(rowClass, current && currentClass)}
                >
                  <Star aria-hidden className="size-3.5 shrink-0 fill-current text-primary" />
                  <span className="truncate">{f.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {adding ? (
        <form
          className="grid gap-2 rounded-lg border bg-background p-2"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            const { label, href } = adding;
            setAdding(null);
            run(() => addFavorite(label, href));
          }}
        >
          <label className="grid gap-1 text-sm font-medium">
            Name this favorite
            <input
              autoFocus
              value={adding.label}
              maxLength={60}
              onChange={(e) => setAdding({ ...adding, label: e.target.value })}
              className="h-9 rounded-md border border-input px-2 text-base font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring"
            >
              <Check aria-hidden className="size-4" />
              Save
            </button>
            <button
              type="button"
              onClick={() => setAdding(null)}
              className="inline-flex h-9 items-center rounded-md px-3 text-sm outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-primary outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
          >
            <Plus aria-hidden className="size-4" />
            Add this page
          </button>
          {total > 0 && (
            <button
              type="button"
              aria-pressed={editing}
              onClick={() => setEditing(!editing)}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-primary outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
            >
              {editing ? <Check aria-hidden className="size-4" /> : <Pencil aria-hidden className="size-4" />}
              {editing ? "Done" : "Edit"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EditRow({
  favorite,
  first,
  last,
  reorder,
  run,
}: {
  favorite: NavFavorite;
  first: boolean;
  last: boolean;
  reorder: boolean;
  run: (task: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [label, setLabel] = useState(favorite.label);
  const save = () => {
    if (label.trim() && label.trim() !== favorite.label) run(() => renameFavorite(favorite.id, label));
  };
  const icon =
    "flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring disabled:opacity-30";
  return (
    <div className="flex min-w-0 items-center gap-0.5 rounded-lg border bg-background p-1">
      <input
        aria-label={`Name of favorite ${favorite.label}`}
        value={label}
        maxLength={60}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        size={1}
        className="h-8 w-0 min-w-0 flex-1 rounded-md px-2 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring"
      />
      {reorder && (
        <>
          <button
            type="button"
            className={icon}
            disabled={first}
            onClick={() => run(() => moveFavorite(favorite.id, -1))}
            aria-label={`Move ${favorite.label} up`}
            title="Move up"
          >
            <ArrowUp aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            className={icon}
            disabled={last}
            onClick={() => run(() => moveFavorite(favorite.id, 1))}
            aria-label={`Move ${favorite.label} down`}
            title="Move down"
          >
            <ArrowDown aria-hidden className="size-4" />
          </button>
        </>
      )}
      <button
        type="button"
        className={icon}
        onClick={() => run(() => removeFavorite(favorite.id))}
        aria-label={`Remove ${favorite.label} from favorites`}
        title="Remove"
      >
        <Trash2 aria-hidden className="size-4" />
      </button>
    </div>
  );
}
```

### Collapse button and no-flicker script: `src/components/nav/sidebar-toggle.tsx`

Change the storage key prefix.

```tsx
"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

const KEY = "cs-tracker:nav";

/**
 * Runs before the page draws (see (app)/layout.tsx), so a menu that was slid
 * closed stays closed, and one dragged to another width keeps it (NavResizer),
 * without a flicker. Remembered per browser.
 */
export const NAV_STATE_SCRIPT = `try{var r=document.documentElement;if(localStorage.getItem("${KEY}")==="closed")r.dataset.nav="closed";var w=Number(localStorage.getItem("${KEY}-width"));if(w>=200&&w<=400)r.style.setProperty("--nav-width",w+"px")}catch(e){}`;

/** Slides the left-hand menu closed (icons only) or open again. */
export function SidebarToggle() {
  return (
    <button
      type="button"
      onClick={() => {
        const root = document.documentElement;
        const closing = root.dataset.nav !== "closed";
        if (closing) root.dataset.nav = "closed";
        else delete root.dataset.nav;
        try {
          localStorage.setItem(KEY, closing ? "closed" : "open");
        } catch {
          // Storage blocked: the choice lasts until the page is reloaded.
        }
      }}
      title="Collapse or expand the menu"
      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
    >
      {/* Like Claude's sidebar: a panel icon at the top. The state is CSS-driven, so the right icon and name show even before React loads. */}
      <PanelLeftClose aria-hidden className="size-5 nav-closed:hidden" />
      <PanelLeftOpen aria-hidden className="hidden size-5 nav-closed:block" />
      <span className="sr-only nav-closed:hidden">Collapse menu</span>
      <span className="hidden nav-closed:sr-only nav-closed:inline">Expand menu</span>
    </button>
  );
}
```

### Resize handle (drag the edge): `src/components/nav/nav-resizer.tsx`

Change the storage key prefix. Goes inside the column (`aside`, which must be `relative`).

```tsx
"use client";

import { useRef, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";

/**
 * Drag handle on the navigator's right edge (docs/standards/left-navigator.md
 * 9.1): drag to any width between 200 and 400px; double-click (or Enter) goes
 * back to the standard 240px. Arrow keys move it 16px. The width is remembered
 * per browser and applied before paint by (app)/layout.tsx, as the --nav-width CSS
 * variable, so there is no jump on load. Hidden while collapsed and in the drawer.
 */
export const NAV_WIDTH = { min: 200, max: 400, standard: 240, step: 16 };
const KEY = "cs-tracker:nav-width";

const listeners = new Set<() => void>();
/** The width on screen once this page has changed it; until then, what was saved. */
let live: number | null = null;
const clamp = (w: number) => Math.round(Math.min(NAV_WIDTH.max, Math.max(NAV_WIDTH.min, w)));

function read(): number {
  try {
    const saved = Number(localStorage.getItem(KEY));
    return saved >= NAV_WIDTH.min && saved <= NAV_WIDTH.max ? saved : NAV_WIDTH.standard;
  } catch {
    return NAV_WIDTH.standard;
  }
}

/** Shows a width now; `save` also remembers it (only at the end of a drag). */
function setWidth(width: number, save: boolean) {
  const w = clamp(width);
  live = w;
  document.documentElement.style.setProperty("--nav-width", `${w}px`);
  if (save) {
    try {
      if (w === NAV_WIDTH.standard) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, String(w));
    } catch {
      // Storage blocked: lasts until reload.
    }
  }
  listeners.forEach((l) => l());
}

export function NavResizer() {
  const width = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => live ?? read(),
    () => NAV_WIDTH.standard,
  );
  const drag = useRef<{ x: number; w: number; aside: HTMLElement } | null>(null);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    const aside = e.currentTarget.parentElement;
    if (!aside || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    aside.style.transition = "none"; // follow the pointer exactly while dragging
    document.body.style.cursor = "col-resize";
    drag.current = { x: e.clientX, w: aside.getBoundingClientRect().width, aside };
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d) setWidth(d.w + e.clientX - d.x, false);
  }
  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    d.aside.style.transition = "";
    document.body.style.cursor = "";
    setWidth(d.w + e.clientX - d.x, true);
  }
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const by = { ArrowLeft: -NAV_WIDTH.step, ArrowRight: NAV_WIDTH.step }[e.key];
    if (by) setWidth(width + by, true);
    else if (e.key === "Home") setWidth(NAV_WIDTH.min, true);
    else if (e.key === "End") setWidth(NAV_WIDTH.max, true);
    else if (e.key === "Enter") setWidth(NAV_WIDTH.standard, true);
    else return;
    e.preventDefault();
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize menu"
      aria-valuemin={NAV_WIDTH.min}
      aria-valuemax={NAV_WIDTH.max}
      aria-valuenow={width}
      tabIndex={0}
      title="Drag to resize the menu. Double-click to reset."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => setWidth(NAV_WIDTH.standard, true)}
      onKeyDown={onKeyDown}
      className="absolute inset-y-0 -right-1 z-10 w-2 cursor-col-resize touch-none outline-none after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:transition-colors hover:after:bg-primary focus-visible:after:bg-primary nav-closed:hidden"
    />
  );
}
```

### History recorder: `src/components/nav/history-recorder.tsx`

Change the page-title suffix.

```tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { recordVisit } from "@/lib/nav/history";

/** Tells the navigator's History list that it changed. */
export const HISTORY_EVENT = "cs-tracker:nav-history";

/**
 * Adds each page the person opens to their navigator History
 * (docs/features/navigation.md). Renders nothing.
 */
export function HistoryRecorder() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    // Wait a moment so the new page's title is in place.
    const timer = setTimeout(() => {
      const label = document.title.replace(/\s*·\s*CS Tracker$/, "").trim();
      const href = search ? `${pathname}?${search}` : pathname;
      recordVisit(label, href)
        .then(() => window.dispatchEvent(new Event(HISTORY_EVENT)))
        .catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [pathname, search]);
  return null;
}
```

### Phone/tablet drawer: `src/components/nav/mobile-nav.tsx`

Used in the top banner, left of the logo.

```tsx
"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { Menu, X } from "lucide-react";
import type { NavFavorite } from "@/lib/nav/favorites";
import { SideNav } from "./side-nav";

/** Phones and tablets: a Menu button in the banner opens the navigation as a drawer. */
export function MobileNav({ showAdmin = false, favorites }: { showAdmin?: boolean; favorites?: NavFavorite[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-lg outline-none hover:bg-primary-foreground/10 focus-visible:ring-3 focus-visible:ring-primary-foreground lg:hidden"
        aria-label="Open menu"
      >
        <Menu aria-hidden className="size-6" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto bg-background p-4 shadow-xl outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:slide-in-from-left">
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-heading text-2xl text-heading">Menu</Dialog.Title>
            <Dialog.Close
              className="flex size-11 items-center justify-center rounded-lg outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
              aria-label="Close menu"
            >
              <X aria-hidden className="size-6" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Go to a page in CS Tracker.</Dialog.Description>
          <SideNav onNavigate={() => setOpen(false)} showAdmin={showAdmin} favorites={favorites} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Signed-in layout (desktop column): `src/app/(app)/layout.tsx`

How the column, collapse button, recorder and navigator fit together. `requireUser`, `can` and `favoritesFor` are the app's own sign-in and permission helpers.

```tsx
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { HistoryRecorder } from "@/components/nav/history-recorder";
import { SideNav, SideNavLoading } from "@/components/nav/side-nav";
import { NavResizer } from "@/components/nav/nav-resizer";
import { NAV_STATE_SCRIPT, SidebarToggle } from "@/components/nav/sidebar-toggle";
import { requireUser } from "@/lib/dal";
import { favoritesFor } from "@/lib/nav/favorites";
import { can } from "@/lib/roles";

/**
 * Every signed-in page: the red banner across the full width, then the left-hand
 * navigation (desktop) beside the page. The navigation slides closed to a strip
 * of icons with the panel button at its top, like Claude (remembered per browser).
 * On phones and tablets the navigation is a drawer opened from the banner's Menu button.
 */
export default function SignedInLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: NAV_STATE_SCRIPT }} />
      <AppHeader />
      {/* Adds each page opened to the navigator's History. */}
      <Suspense fallback={null}>
        <HistoryRecorder />
      </Suspense>
      <div className="flex flex-1">
        <aside className="relative hidden w-[var(--nav-width,240px)] shrink-0 border-r bg-muted/50 transition-[width] duration-200 lg:block nav-closed:w-14">
          <div className="sticky top-0 flex max-h-dvh flex-col gap-1.5 overflow-x-hidden overflow-y-auto px-2 py-2 nav-closed:px-1.5">
            <div className="flex justify-end nav-closed:justify-center">
              <SidebarToggle />
            </div>
            <Suspense fallback={<SideNavLoading />}>
              <SideNavForUser />
            </Suspense>
          </div>
          {/* Drag the right edge to resize (200-400 px; double-click resets to 240). */}
          <NavResizer />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </>
  );
}

/** Adds the Admin section for admins and the person's favorites once the user is known. */
async function SideNavForUser() {
  const user = await requireUser();
  return <SideNav showAdmin={can(user, "people.manage")} favorites={await favoritesFor(user.id)} />;
}
```

### Favorites, read: `src/lib/nav/favorites.ts`

```ts
import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export type NavFavorite = { id: number; label: string; href: string };

/** This person's navigator favorites, in their order. */
export async function favoritesFor(userId: number): Promise<NavFavorite[]> {
  const t = schema.navFavorites;
  return getDb()
    .select({ id: t.id, label: t.label, href: t.href })
    .from(t)
    .where(eq(t.userId, userId))
    .orderBy(asc(t.position), asc(t.id));
}
```

### Favorites, server actions: `src/lib/nav/actions.ts`

```ts
"use server";

import { and, eq, max } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireUser } from "@/lib/dal";
import { favoritesFor } from "./favorites";

export type FavoriteResult = { ok: true } | { ok: false; error: string };
const t = schema.navFavorites;
const MAX = 50;

/** Only pages inside this app: "/something", never "//other-site" or "https://…". */
function cleanHref(href: unknown) {
  if (typeof href !== "string") return null;
  const value = href.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.length > 2000) return null;
  return value;
}

function cleanLabel(label: unknown) {
  return typeof label === "string" ? label.trim().replace(/\s+/g, " ").slice(0, 60) : "";
}

export async function addFavorite(label: unknown, href: unknown): Promise<FavoriteResult> {
  const user = await requireUser();
  const path = cleanHref(href);
  const name = cleanLabel(label);
  if (!path) return { ok: false, error: "Only pages in CS Tracker can be favorites." };
  if (!name) return { ok: false, error: "Give the favorite a name." };
  const existing = await favoritesFor(user.id);
  if (existing.some((f) => f.href === path)) return { ok: false, error: "That page is already a favorite." };
  if (existing.length >= MAX) return { ok: false, error: `You can have up to ${MAX} favorites.` };
  const [{ last }] = await getDb()
    .select({ last: max(t.position) })
    .from(t)
    .where(eq(t.userId, user.id));
  await getDb()
    .insert(t)
    .values({ userId: user.id, label: name, href: path, position: (last ?? 0) + 1 });
  return { ok: true };
}

export async function renameFavorite(id: number, label: unknown): Promise<FavoriteResult> {
  const user = await requireUser();
  const name = cleanLabel(label);
  if (!name) return { ok: false, error: "Give the favorite a name." };
  await getDb()
    .update(t)
    .set({ label: name })
    .where(and(eq(t.id, id), eq(t.userId, user.id)));
  return { ok: true };
}

export async function removeFavorite(id: number): Promise<FavoriteResult> {
  const user = await requireUser();
  await getDb()
    .delete(t)
    .where(and(eq(t.id, id), eq(t.userId, user.id)));
  return { ok: true };
}

/** Move one favorite up or down, renumbering the person's list. */
export async function moveFavorite(id: number, by: -1 | 1): Promise<FavoriteResult> {
  const user = await requireUser();
  const list = await favoritesFor(user.id);
  const i = list.findIndex((f) => f.id === id);
  const j = i + by;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true };
  [list[i], list[j]] = [list[j], list[i]];
  const db = getDb();
  await Promise.all(
    list.map((f, position) =>
      db
        .update(t)
        .set({ position })
        .where(and(eq(t.id, f.id), eq(t.userId, user.id))),
    ),
  );
  return { ok: true };
}
```

### History, server actions: `src/lib/nav/history.ts`

```ts
"use server";

import { and, desc, eq, notInArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireUser } from "@/lib/dal";

/**
 * Navigator History (docs/features/navigation.md): the last pages this person
 * opened, newest first. One entry per page; returning to a page moves it to the
 * top and keeps the latest address (e.g. the list's filter). Kept to 30.
 */
export type HistoryEntry = { href: string; label: string; visitedAt: string };

const t = schema.navHistory;
const KEEP = 30;

function cleanHref(href: unknown) {
  if (typeof href !== "string") return null;
  const value = href.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.length > 2000) return null;
  return value;
}

/** Called by the browser after each page change. */
export async function recordVisit(label: unknown, href: unknown): Promise<void> {
  const user = await requireUser();
  const full = cleanHref(href);
  if (!full) return;
  const path = full.split(/[?#]/)[0] || "/";
  if (path.startsWith("/api/") || path === "/login") return;
  const name = (typeof label === "string" ? label.trim().replace(/\s+/g, " ") : "").slice(0, 80) || path;
  const db = getDb();
  await db
    .insert(t)
    .values({ userId: user.id, path, href: full, label: name })
    .onConflictDoUpdate({
      target: [t.userId, t.path],
      set: { href: full, label: name, visitedAt: sql`now()` },
    });
  // Keep only the newest entries.
  const keep = db.select({ id: t.id }).from(t).where(eq(t.userId, user.id)).orderBy(desc(t.visitedAt)).limit(KEEP);
  await db.delete(t).where(and(eq(t.userId, user.id), notInArray(t.id, keep)));
}

/** This person's history, newest first. */
export async function loadHistory(): Promise<HistoryEntry[]> {
  const user = await requireUser();
  const rows = await getDb()
    .select({ href: t.href, label: t.label, visitedAt: t.visitedAt })
    .from(t)
    .where(eq(t.userId, user.id))
    .orderBy(desc(t.visitedAt))
    .limit(KEEP);
  return rows.map((r) => ({ ...r, visitedAt: r.visitedAt.toISOString() }));
}

export async function clearHistory(): Promise<void> {
  const user = await requireUser();
  await getDb().delete(t).where(eq(t.userId, user.id));
}
```

<!-- reference-code:end -->
