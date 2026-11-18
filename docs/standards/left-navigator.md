# Standard: left-hand navigator (look, feel and behavior)

**Status:** LLUH app standard, v1.0 (2026-11-18). Owner: Ryan Ashline. Reference build: CS Tracker (`src/components/nav/side-nav.tsx`, `sidebar-toggle.tsx`, `src/app/(app)/layout.tsx`).

**How to use this file.** Copy it into any LLUH app repo (e.g. `docs/standards/left-navigator.md`) and point the app's AI instructions at it, for example a line `@docs/standards/left-navigator.md` in `CLAUDE.md` or `AGENTS.md`. Coding agents must treat every **must** below as a requirement and every **should** as the default unless the app's owners decide otherwise (record that decision in the app's docs).

**What is standard and what isn't.** Layout, sizes, type, text colors, states and behavior are the same in every LLUH app, so staff who learn one app know them all. **Brand color is not set here:** each app uses its own palette (from the LLUH style guide) through its `--primary` token. Never hard-code a brand color in the navigator.

---

## 1. Anatomy

From top to bottom, inside a column on the left edge of the page, below the app's top banner:

1. **Collapse button** (panel icon), right-aligned; centered when collapsed.
2. **Search box:** "Search the menu" / "Search favorites".
3. **Tabs:** **Menu** | **★ Favorites** (two equal halves of a segmented control).
4. **Menu list:** top-level items, each with an icon. An item with a submenu is a **group** with a chevron.
5. **Favorites list** (when its tab is chosen): the person's own shortcuts, plus **Add this page** and **Edit**.

Nothing else goes in the navigator (no logos, user menus, banners or ads; those belong in the top banner).

## 2. Size and spacing

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
| Tab height | 28 px (`min-h-7`), inside a 2 px padded track |
| Collapse button | 32 × 32 px, 20 px icon |
| Row icons | 16 px (`size-4`), 8 px gap to the label |
| Star (favorite) button | 24 × 24 px with a 14 px star, inside the row's right end |

28 px rows were chosen by Ryan after trying 15, 24 and 32 px: dense enough to scan, still easy to hit with a mouse. Apps used mostly on touch screens should raise rows to 44 px (and record it).

## 3. Typography

- Font: the app's body (sans) font from the LLUH style guide. Never the heading/serif font.
- Row labels, tabs, search text: **16 px** (`text-base`), line height 20 px (`leading-5`), weight 400.
- **Current page:** weight 600 (`font-semibold`). The open group that contains the current page: weight 600 too.
- Selected tab: weight 600.
- Small actions in Favorites ("Add this page", "Edit", "Done") and messages: 14 px (`text-sm`), weight 500 for actions.
- Labels are sentence case ("List views", not "List Views"), short (1–3 words), and never wrap: one line, cut with "…" (`truncate`); the full name shows as a tooltip.

## 4. Color roles

Use the app's tokens only (shadcn/Tailwind names). The **neutral** values are standard across LLUH apps; the **brand** roles take each app's own palette.

| Role | Token | Standard value (light) |
|---|---|---|
| Navigator background | `bg-muted/50` (half-strength muted over the page) | `--muted` `#f3f3f3` |
| Divider to the page | `border-r` | `--border` `#dedede` |
| **Row text** | `--foreground` | **`#333333`** |
| **Secondary text** (placeholder, search icon, unselected tab, hints, empty messages, unstarred star, collapse icon) | `--muted-foreground` | **`#5c5c5c`** |
| Hover background | `--accent` | `#f3f3f3` (on the search box and tabs: `--background` white) |
| Selected-tab background | `--background` + small shadow | `#ffffff` |
| Focus ring | `--ring`, 3 px | `#333333` |
| Error text | `--destructive` | `#b42318` |
| **Current page: text and icon** | `--primary` | *the app's brand color* |
| **Current page: background** | `--primary` at 10% (`bg-primary/10`; hover 15%) | *from the brand color* |
| **Current page: left bar** | 3 px inset bar in `--primary` | *from the brand color* |
| **Starred star, favorite icons, "Add this page"/"Edit"** | `--primary` | *from the brand color* |

Rules:
- Text is never pure black, and never the brand color except for the current page and favorites actions.
- The app's `--primary` **must** reach 4.5:1 contrast on its own 10% tint and on `--muted`. If it doesn't (light or bright palettes), use the palette's darker shade for `--primary` in the navigator.
- No gradients, images or colored backgrounds in the navigator; color marks only "where you are" and "your favorites".
- Dark mode, if the app has one, uses the same roles with the app's dark tokens.

## 5. States

| State | Look |
|---|---|
| Default | `--foreground` text, no background |
| Hover | `--accent` background |
| Keyboard focus | 3 px `--ring` ring, always visible (`focus-visible`) |
| **Current page** | brand text, weight 600, 10% brand background, 3 px brand bar on the left edge; `aria-current="page"` |
| Group containing the current page (closed or open) | brand text, weight 600, no background |
| Disabled | 30% opacity (only for Move up/down at the ends of the favorites list) |
| Saving (favorites) | whole navigator at 80% opacity until done |

## 6. Behavior

**Collapse ("slide closed")**
- The collapse button toggles between open (240 px) and an **icon rail** (56 px), animated over 200 ms (width only).
- Collapsed: rows become centered icons with the name as tooltip and screen-reader text; search, tabs, favorites, stars and submenus are hidden; a group's icon goes straight to the group's overview page.
- The choice is remembered per browser (localStorage key `<app>:nav`) and applied **before the page paints** (a tiny inline script sets `data-nav="closed"` on `<html>`; styles use a `nav-closed:` variant), so there is no flicker.
- Icons: panel-close when open, panel-open when collapsed. Accessible names "Collapse menu" / "Expand menu".

**Groups (submenus)**
- Groups **start collapsed**. Selecting the group row opens/closes it (chevron rotates 90°); `aria-expanded` and `aria-controls` are set.
- The first child is "**<Group> overview**" (the group's own page). It is "current" only on that exact page.
- Only one level of nesting. If an app needs more, it needs a different page design, not a deeper menu.

**Search**
- Filters as you type, case-insensitive "contains". A group matches by its own name or any child; matching groups open automatically while searching.
- In the Favorites tab it searches favorites. No match: "Nothing in the menu matches "…"" in secondary text.

**Tabs**
- Menu / Favorites; the chosen tab is remembered per browser (`<app>:nav-tab`). Use `role="tablist"`, `role="tab"`, `aria-selected`.

**Favorites (per person, stored on the server)**
- Every menu row shows a ☆ on hover (always visible when starred, filled, brand color) to add or remove it.
- **Add this page** saves the current page including its filters, after asking for a name (prefilled with the page title, max 60 characters).
- **Edit** shows each favorite with a rename box, Move up / Move down, and Remove (trash icon); **Done** ends editing. Reordering is off while searching.
- Empty state explains how to add one. Errors appear as a short message under the tabs.
- Favorites are per person, stored in the app's database (not the browser), so they follow the person between computers.

**Phones and tablets** (below 1024 px): the navigator is not shown as a column; the same navigator opens as a drawer from a **Menu** button in the top banner and closes after a page is chosen.

**Permissions**
- Items a person can't use are not shown (e.g. Admin for non-admins). The page itself must still check permission on the server; hiding a link is not security.

## 7. Icons

- One line-icon set for the whole app (CS Tracker: Lucide), 16 px in rows, 1.5–2 px stroke, colored by the text color of the row (never multicolor).
- Every top-level item has an icon; submenu items don't.
- Pick plain, literal icons (house = Home, list = List views, shield = Admin). Same meaning → same icon across LLUH apps.

## 8. Accessibility (must)

- Wrap the menu in `<nav aria-label="Main">`; lists are real `<ul>/<li>`; links are real links (`<a href>`), so open-in-new-tab works.
- Icon-only controls (collapse, star, edit icons) have accessible names; decorative icons are `aria-hidden`.
- Everything works with keyboard only: Tab order is top to bottom; Enter/Space open groups; focus is always visible.
- Text contrast at least 4.5:1 (the standard neutrals above pass on the navigator background).
- Nothing relies on color alone: the current page also has the bold weight, the left bar and `aria-current`.

## 9. Don'ts

- Don't add a second navigation column, mega-menus, or menus that open on hover.
- Don't open groups by default (except while searching), and don't auto-collapse other groups when one opens.
- Don't use the brand color for ordinary row text, backgrounds of the whole navigator, or icons of non-current items.
- Don't put counts, badges or alerts in the navigator unless the app's owners approve and document it.
- Don't make labels wrap to two lines or shrink the font below 16 px to fit.

## 10. Conformance checklist

An app's navigator passes when:

- [ ] 240 px open / 56 px collapsed; collapse remembered per browser with no flicker on load.
- [ ] Rows 28 px (or 44 px for touch-first apps, documented); 16 px labels; 16 px icons.
- [ ] Row text `#333333`-equivalent `--foreground`; secondary text `--muted-foreground`; no hard-coded colors.
- [ ] Current page: brand text, weight 600, 10% tint, 3 px left bar, `aria-current="page"`; brand color passes 4.5:1 on its tint.
- [ ] Search filters menu and favorites; groups start collapsed and open while searching.
- [ ] Menu / Favorites tabs remembered per browser; favorites per person on the server with add, rename, reorder, remove.
- [ ] Phone/tablet drawer from the banner's Menu button.
- [ ] Keyboard-only and screen-reader checks pass; permission-hidden items are also blocked on the server.
