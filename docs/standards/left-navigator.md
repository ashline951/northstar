# Standard: left-hand navigator (look, feel and behavior)

**Status:** LLUH app standard, v1.1 (2026-11-18). Owner: Ryan Ashline. Reference build: CS Tracker (`src/components/nav/side-nav.tsx`, `history-recorder.tsx`, `sidebar-toggle.tsx`, `src/app/(app)/layout.tsx`, `src/lib/nav/`).

**How to use this file.** Copy it into any LLUH app repo (e.g. `docs/standards/left-navigator.md`) and point the app's AI instructions at it, for example a line `@docs/standards/left-navigator.md` in `CLAUDE.md` or `AGENTS.md`. Coding agents must treat every **must** below as a requirement and every **should** as the default unless the app's owners decide otherwise (record that decision in the app's docs).

**Instructions for coding agents.**
1. Build **every feature in section 1**. None is optional: favorites and history need database tables and server actions (section 8); create them with the app's normal migration process.
2. Use the **exact sizes and classes in section 11** (Tailwind) or their exact equivalents in the app's CSS. Don't approximate; "close" is what makes apps feel different.
3. When done, go through the **checklist in section 12** and report each item as pass or fail to the person you're working with.

**What is standard and what isn't.** Layout, sizes, type, text colors, states and behavior are the same in every LLUH app, so staff who learn one app know them all. **Brand color is not set here:** each app uses its own palette (from the LLUH style guide) through its `--primary` token. Never hard-code a brand color in the navigator.

---

## 1. Required features (all must be built)

1. **Collapse to an icon rail** and back, remembered per browser, with no flicker on load.
2. **Search box** that filters the current tab.
3. **Three tabs: Menu, Favorites, History**, the chosen one remembered per browser.
4. **Menu** with icons, one level of **collapsible groups** (collapsed by default), and current-page highlight.
5. **Favorites**, per person, saved on the server: ☆ on every menu row, **Add this page** (with a name), **Edit** (rename, move up/down, remove).
6. **History**, per person, saved on the server: the last 30 pages opened, newest first, one entry per page, with **Clear history**.
7. **Phone/tablet drawer** with the same navigator, opened from a Menu button in the top banner.
8. **Permission-aware menu**: items a person can't use are hidden (and their pages still check on the server).

## 2. Anatomy

From top to bottom, inside a column on the left edge of the page, below the app's top banner:

1. **Collapse button** (panel icon), right-aligned; centered when collapsed.
2. **Search box:** "Search the menu" / "Search favorites" / "Search history".
3. **Tabs** (segmented control): the chosen tab shows **icon + name** and fills the remaining width; the other two show **icon only** (40 px wide) with the name as tooltip and accessible name. Icons: menu = ☰ (`Menu`), favorites = ☆ (`Star`), history = clock with arrow (`History`) (Lucide names).
4. **Menu list:** top-level items, each with an icon. An item with a submenu is a **group** with a chevron.
5. **Favorites list** (Favorites tab): the person's shortcuts, then **Add this page** and **Edit**.
6. **History list** (History tab): recent pages with a short time on the right, then **Clear history**.

Nothing else goes in the navigator (no logos, user menus, banners or ads; those belong in the top banner).

## 3. Size and spacing

| Element | Value |
|---|---|
| Width, open | 240 px (`w-60`) |
| Width, collapsed | 56 px (`w-14`); icons only |
| Column padding | 8 px (`px-2 py-2`); 6 px collapsed |
| Gap between sections | 6 px (`gap-1.5`) |
| Row height | **28 px** minimum (`min-h-7`), padding 4 px × 8 px (`py-1 px-2`) |
| Gap between rows | 1 px (`gap-px`) |
| Submenu indent | text starts 32 px from the row edge (`pl-8`) |
| Row corner radius | 6 px (`rounded-md`) |
| Search box height | 32 px (`h-8`), search icon inside at left, text starts at 32 px |
| Tab track | 2 px padding, 2 px gap, 8 px radius; tabs 28 px tall; unchosen tabs 40 px wide |
| Collapse button | 32 × 32 px, 20 px icon |
| Row icons | 16 px (`size-4`), 8 px gap to the label |
| Star (favorite) button | 24 × 24 px with a 14 px star, inside the row's right end |

28 px rows were chosen by Ryan after trying 15, 24 and 32 px: dense enough to scan, still easy to hit with a mouse. Apps used mostly on touch screens should raise rows to 44 px (and record it).

## 4. Typography

- Font: the app's body (sans) font from the LLUH style guide. Never the heading/serif font.
- Row labels, tabs, search text: **16 px** (`text-base`), line height 20 px (`leading-5`), weight 400.
- **Current page:** weight 600 (`font-semibold`). The group that contains the current page: weight 600 too.
- Chosen tab: weight 600.
- Small actions ("Add this page", "Edit", "Done", "Clear history") and messages: 14 px (`text-sm`), weight 500 for actions.
- History times ("now", "5m", "3h", "2d"): 14 px, weight 400, secondary text color.
- Labels are sentence case ("List views", not "List Views"), short (1–3 words), and never wrap: one line, cut with "…" (`truncate`); the full name shows as a tooltip.

## 5. Color roles

Use the app's tokens only (shadcn/Tailwind names). The **neutral** values are standard across LLUH apps; the **brand** roles take each app's own palette.

| Role | Token | Standard value (light) |
|---|---|---|
| Navigator background | `bg-muted/50` (half-strength muted over the page) | `--muted` `#f3f3f3` |
| Divider to the page | `border-r` | `--border` `#dedede` |
| **Row text** | `--foreground` | **`#333333`** |
| **Secondary text** (placeholder, search icon, unchosen tab icons, hints, empty messages, history times, unstarred star, collapse icon) | `--muted-foreground` | **`#5c5c5c`** |
| Hover background | `--accent` | `#f3f3f3` (on the search box and tabs: `--background` white) |
| Chosen-tab background | `--background` + small shadow | `#ffffff` |
| Focus ring | `--ring`, 3 px | `#333333` |
| Error text | `--destructive` | `#b42318` |
| **Current page: text and icon** | `--primary` | *the app's brand color* |
| **Current page: background** | `--primary` at 10% (`bg-primary/10`; hover 15%) | *from the brand color* |
| **Current page: left bar** | 3 px inset bar in `--primary` | *from the brand color* |
| **Starred star, favorite icons, "Add this page"/"Edit"/"Clear history"** | `--primary` | *from the brand color* |

Rules:
- Text is never pure black, and never the brand color except for the current page and the small actions.
- The app's `--primary` **must** reach 4.5:1 contrast on its own 10% tint and on `--muted`. If it doesn't (light or bright palettes), use the palette's darker shade for `--primary` in the navigator.
- No gradients, images or colored backgrounds in the navigator; color marks only "where you are" and "your favorites".
- Dark mode, if the app has one, uses the same roles with the app's dark tokens.

## 6. States

| State | Look |
|---|---|
| Default | `--foreground` text, no background |
| Hover | `--accent` background |
| Keyboard focus | 3 px `--ring` ring, always visible (`focus-visible`) |
| **Current page** (menu, favorites or history row) | brand text, weight 600, 10% brand background, 3 px brand bar on the left edge; `aria-current="page"` |
| Group containing the current page | brand text, weight 600, no background |
| Disabled | 30% opacity (only Move up/down at the ends of the favorites list) |
| Saving (favorites) | whole navigator at 80% opacity until done |

## 7. Behavior

**Collapse ("slide closed")**
- The collapse button toggles between open (240 px) and an **icon rail** (56 px), animated over 200 ms (width only).
- Collapsed: rows become centered icons with the name as tooltip and screen-reader text; search, tabs, favorites, history, stars and submenus are hidden; the menu's icons always show, whatever tab was chosen; a group's icon goes straight to the group's overview page.
- Remembered per browser (localStorage key `<app>:nav`) and applied **before the page paints**: a tiny inline script sets `data-nav="closed"` on `<html>`, and styles use a `nav-closed:` variant (`@custom-variant nav-closed (&:where([data-nav=closed], [data-nav=closed] *));`), so there is no flicker.
- Icons: panel-close when open, panel-open when collapsed. Accessible names "Collapse menu" / "Expand menu".

**Groups (submenus)**
- Groups **start collapsed**. Selecting the group row opens/closes it (chevron rotates 90°); `aria-expanded` and `aria-controls` are set.
- The first child is "**<Group> overview**" (the group's own page). It is "current" only on that exact page.
- Only one level of nesting. If an app needs more, it needs a different page design, not a deeper menu.

**Search**
- Filters the chosen tab as you type, case-insensitive "contains". In the menu, a group matches by its own name or any child, and matching groups open while searching.
- No match: "Nothing in the menu matches "…"" (or "No favorites / No pages in your history match …") in secondary text.

**Tabs**
- Menu / Favorites / History; the chosen tab is remembered per browser (`<app>:nav-tab`). `role="tablist"`, `role="tab"`, `aria-selected`; every tab has `aria-label` and `title` with its name (the unchosen ones show only an icon).

**Favorites (per person, saved on the server)**
- Every menu row shows a ☆ on hover or keyboard focus (always visible when starred: filled, brand color) to add or remove it.
- **Add this page** saves the current page including its query (filters, sort), after asking for a name (prefilled with the page title, max 60 characters).
- **Edit** shows each favorite with a rename box (saves on Enter or leaving the box), Move up / Move down, and Remove (trash icon); **Done** ends editing. Reordering is off while searching.
- Up to 50 favorites. Only pages inside the app (addresses that start with a single `/`).
- Empty state: "No favorites yet. Select ☆ next to a menu item, or add the page you're on (with its filter)."

**History (per person, saved on the server)**
- After each page change (path or query), the app records the page: its **title** (the browser tab title without the app name) and full address. Wait ~400 ms so the new title is in place.
- **One entry per page (path)**: visiting it again moves it to the top and keeps the latest address, so a list comes back with its last filter, and filtering doesn't create copies.
- Shows the **last 30**, newest first; older entries are deleted. Each row: title (truncated) and a short time on the right ("now", "5m", "3h", "2d"); full date and time in the tooltip. The page you're on is highlighted as current.
- **Clear history** deletes all of the person's entries.
- Never record API routes or the sign-in page. **Page titles are saved, so they must never contain patient or other sensitive details** (e.g. "Order 54", not a patient's name).
- Empty state: "Pages you open will appear here, newest first."

**Phones and tablets** (below 1024 px): the navigator is not shown as a column; the same navigator opens as a drawer from a **Menu** button in the top banner and closes after a page is chosen, on Esc, or on tapping outside.

**Permissions**
- Items a person can't use are not shown (e.g. Admin for non-admins). The page itself must still check permission on the server; hiding a link is not security.

## 8. Data and server actions

Store favorites and history in the app's database, per signed-in person (not in the browser: they follow the person between computers and are never shown to someone else using the same computer). Every action checks the signed-in user on the server and only touches that user's rows.

```sql
-- Favorites
create table nav_favorites (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  label text not null,          -- the person's name for it, max 60
  href text not null,           -- "/path?query", always starts with a single "/"
  position integer not null,    -- order in the list
  created_at timestamptz not null default now()
);

-- History
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

Actions (server-side; names are a suggestion):
- Favorites: `addFavorite(label, href)` (reject duplicates and non-app addresses; max 50), `renameFavorite(id, label)`, `moveFavorite(id, -1 | 1)` (renumber positions), `removeFavorite(id)`, and a `favoritesFor(userId)` read for the layout.
- History: `recordVisit(label, href)` (upsert on `(user_id, path)` setting `href`, `label`, `visited_at = now()`, then delete all but the newest 30), `loadHistory()` (newest first), `clearHistory()`.
- A small client component in the signed-in layout calls `recordVisit` on every path/query change and tells the History list to reload (e.g. a window event).

## 9. Icons

- One line-icon set for the whole app (CS Tracker: Lucide), 16 px in rows, colored by the text color of the row (never multicolor).
- Every top-level item has an icon; submenu items, favorites (which show a small filled star) and history rows don't.
- Pick plain, literal icons (house = Home, list = List views, shield = Admin). Same meaning → same icon across LLUH apps.

## 10. Accessibility (must)

- Wrap the menu in `<nav aria-label="Main">`; favorites and history are labelled regions; lists are real `<ul>/<ol>` + `<li>`; links are real links (`<a href>`), so open-in-new-tab works.
- Icon-only controls (collapse, unchosen tabs, star, edit icons) have accessible names; decorative icons are `aria-hidden`.
- Everything works with keyboard only: Tab order is top to bottom; Enter/Space open groups and tabs; focus is always visible.
- Text contrast at least 4.5:1 (the standard neutrals above pass on the navigator background).
- Nothing relies on color alone: the current page also has the bold weight, the left bar and `aria-current`.

## 11. Reference classes (Tailwind v4 + shadcn tokens)

Use these exactly, or their exact CSS equivalents.

```text
Column (desktop):   hidden w-60 shrink-0 border-r bg-muted/50 transition-[width] duration-200 lg:block nav-closed:w-14
Column inner:       sticky top-0 flex max-h-dvh flex-col gap-1.5 overflow-x-hidden overflow-y-auto px-2 py-2 nav-closed:px-1.5
Collapse button:    flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring
Search input:       h-8 w-full rounded-md border border-input bg-background pr-2 pl-8 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring
  (icon: absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground)
Tab track:          flex gap-0.5 rounded-lg bg-muted p-0.5
Tab (all):          flex min-h-7 items-center justify-center gap-1.5 rounded-md text-base focus-visible:ring-3 focus-visible:ring-ring
  chosen:           flex-1 bg-background px-2 font-semibold shadow-sm          (icon size-4 + name)
  not chosen:       w-10 shrink-0 text-muted-foreground hover:bg-background/60 hover:text-foreground   (icon size-4 only)
Row:                flex min-h-7 w-full min-w-0 items-center gap-2 rounded-md px-2 py-1 text-base leading-5 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring nav-closed:justify-center nav-closed:px-0
  current:          bg-primary/10 font-semibold text-primary shadow-[inset_3px_0_0_var(--primary)] hover:bg-primary/15
  submenu row:      + pl-8
  row with star:    + pr-7 (star sits at the right end)
Star button:        absolute right-0.5 flex size-6 items-center justify-center rounded-md hover:bg-background
  not starred:      text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100
  starred:          text-primary opacity-100 (icon filled)
History time:       shrink-0 text-sm font-normal text-muted-foreground
Small action:       inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-primary hover:bg-accent
Empty/hint text:    px-1 text-base text-muted-foreground
```

## 12. Don'ts

- Don't add a second navigation column, mega-menus, or menus that open on hover.
- Don't open groups by default (except while searching), and don't auto-collapse other groups when one opens.
- Don't use the brand color for ordinary row text, the navigator's background, or icons of non-current items.
- Don't put counts, badges or alerts in the navigator unless the app's owners approve and document it.
- Don't make labels wrap to two lines or shrink the font below 16 px to fit.
- Don't keep favorites or history only in the browser.

## 13. Conformance checklist

Agents: report each item as pass or fail when you finish.

- [ ] All eight required features in section 1 are built.
- [ ] 240 px open / 56 px collapsed; collapse remembered per browser with no flicker on load.
- [ ] Rows 28 px (or 44 px for touch-first apps, documented); 16 px labels; 16 px icons; classes match section 11.
- [ ] Row text `--foreground` (`#333333`); secondary text `--muted-foreground` (`#5c5c5c`); no hard-coded colors.
- [ ] Current page: brand text, weight 600, 10% tint, 3 px left bar, `aria-current="page"`, in menu, favorites and history; brand color passes 4.5:1 on its tint.
- [ ] Tabs: chosen tab shows icon + name, others icon only with tooltip and accessible name; remembered per browser.
- [ ] Search filters the chosen tab; groups start collapsed and open while searching.
- [ ] Favorites per person on the server with ☆ on menu rows, Add this page (named), rename, reorder, remove.
- [ ] History per person on the server: last 30, one entry per page, newest first, short times, Clear history; page titles contain no patient details.
- [ ] Phone/tablet drawer from the banner's Menu button.
- [ ] Keyboard-only and screen-reader checks pass; permission-hidden items are also blocked on the server.
