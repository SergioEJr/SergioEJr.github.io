# Notebook (grouped Notes) view — design

**Date:** 2026-06-29
**Scope:** `src/pages/blog/index.astro` (Journal index) and `src/utils/categories.ts`.

## Problem

In the Journal, the **Notes** category currently behaves like every other
category filter: it sits in the same pill row as News / Math / Physics / All,
and its posts render in one flat date-ordered list. Each note repeats its topic
as a small pill (`.j-topic-tag`), which is redundant when a sidebar of topics
already exists. Notes are conceptually different from the rest of the Journal —
they form a growing notebook of guides — yet they're presented as a peer
category and also dilute the "All" view.

## Goals

1. Rename the **Notes** concept to **Notebook** (display only — the underlying
   `category: notes` value in frontmatter/schema is unchanged).
2. **Exclude notebook posts from "All".** "All" becomes the blog
   (news + math + physics). Notebook is reachable only via its own filter.
3. In the **Notebook** view, group posts under topic headers (e.g.
   `DATA FORMATS  6`), like the reference screenshot, and drop the redundant
   per-post topic pill.
4. **Set the Notebook filter visually apart** from the blog category pills
   (a divider/gap) so it reads as a distinct mode — without adding a top-level
   toggle or extra clicks.

## Non-goals

- No new page or route. Everything stays on `src/pages/blog/index.astro`.
- No change to the blog content schema (`category`/`topic` stay as-is).
- No change to note **detail pages** beyond the badge label (see Rename below).
- Standalone note posts keep their `/blog/<slug>/` detail pages.

## Decisions (from brainstorming)

- "All" = everything **except** notes. The eyebrow "N pieces" reflects that.
- Posts stay **reverse-chronological**: groups ordered by their newest post
  (newest group first), posts within a group newest-first.
- A specific topic selected → **show that single topic's header** above the
  filtered list (not headerless).
- Rename to **Notebook** consistently: the filter pill, the eyebrow label, and
  the category **badge on note detail pages** all read "Notebook".
- Keep a single pill row; separate "Notebook" with a divider/gap (no top-level
  mode switch).

## Design

### 1. Rename Notes → Notebook (display only)

- `src/utils/categories.ts`: `BLOG_CATEGORY_LABELS.notes` → `'Notebook'`.
  This is the shared label, so the badge on a note's detail page
  (`blog/[...slug].astro`) automatically reads "Notebook" too. Color unchanged
  (`#f59e0b`).
- `index.astro` `CATS.notes.label` → `'Notebook'`. The eyebrow label is driven
  by `cats[activeCat].label`, so it follows automatically. `title`/`subtitle`
  text may be lightly adjusted to read naturally with the new name but is not
  required to change.

### 2. "All" excludes notebook posts

- `counts.all` is computed as the number of **non-notes** posts
  (`news + math + physics`), instead of `posts.length`.
- In the client `apply()` filter: when `activeCat === 'all'`, a post is shown
  only if its category is **not** `notes`. (Currently `all` shows everything.)
- Specific blog filters (news/math/physics) are unaffected.

### 3. Notebook view grouped by topic

**Server-side rendering (`index.astro`):**

- Posts already render into a single `.j-list` in reverse-chronological order.
  Split rendering into two contiguous blocks inside the same `.j-list`:
  1. **Blog posts** (category ≠ notes) — unchanged, in current date order.
  2. **Notebook posts** (category = notes) — grouped by `topic`, with a
     `.j-group-header` element emitted before each group's posts.
- **Group ordering:** build groups, then order groups by the `pubDate` of each
  group's newest post, descending (newest group first). Posts within a group
  keep newest-first. This is consistent with reverse-chronological intent and
  matches the screenshot (newest dates near the top).
  - **Sidebar topic order stays alphabetical (unchanged)**; only the grouped
    list uses newest-group-first. The sidebar is a lookup, not a sequence, so
    the two orderings differing is acceptable and keeps the sidebar diff-free.
- Each `.j-group-header` carries:
  - `data-group-topic="<topic>"` for show/hide filtering.
  - The topic name (uppercased via CSS `text-transform`) on the left and the
    group count on the right — mirroring the `DATA FORMATS  6` layout.
- The chronological index numbers (`postNumber`, the `01/02/...` gutter) remain
  tied to each post's global chronological position and stay correct regardless
  of grouping. (Notebook posts will show their own global numbers; that's fine
  and consistent.)

**Per-post topic pill:** stop rendering `.j-topic-tag` for notebook posts (it's
redundant under the header). Since notebook posts are the only ones with a
`topic`, this effectively removes the pill. Keep the `tags` line.

### 4. Filter pill visually set apart

- In the pill row, render the Notebook filter separated from the blog pills by a
  divider/gap (e.g. a thin vertical rule or an explicit gap via a spacer
  element / `margin-left`), so it reads as a distinct mode.
- `FILTER_ORDER` currently is `['news','math','physics','notes','all']`.
  Reorder so blog categories group together and Notebook is visually last after
  the separator: `['news','math','physics','all', <divider>, 'notes']`.
  Implementation: keep the array, insert a separator element in the template
  between the `all` pill and the `notes` pill (or render `notes` in its own
  trailing group). The separator is presentational only.
- **Notebook is not styled as a pill.** It renders as plain text in the same
  typographic style as the filter pills (uppercase, same `font-size`,
  `letter-spacing`, `font-weight`) but with **no border, background, or
  rounded-pill chrome**. Give it a distinct class (e.g. `.j-filter--text`) that
  strips `border`/`background`/`border-radius`/`padding`-pill styling.
  - **Hover/active** use color and/or weight instead of the filled-pill
    background the blog filters use: hover → the notebook accent color
    (`#f59e0b`); active → that color with bolder weight (and optionally an
    underline). It must read as "selected" without a filled background.

### 5. Client `apply()` extension

Extend the existing per-element filter loop (no new framework):

- **Posts:** show rule becomes:
  - `all` → `cat !== 'notes'`
  - `news`/`math`/`physics` → `cat === activeCat`
  - `notes` → `cat === 'notes'` AND (`activeTopic === 'all'` OR
    `topic === activeTopic`)
- **Group headers (`.j-group-header`):** visible only when
  `activeCat === 'notes'` AND (`activeTopic === 'all'` OR
  `data-group-topic === activeTopic`). Hidden in every blog view, and a specific
  topic shows only its own header.
- The sidebar (`#j-notes-side`) `hidden` toggle is unchanged
  (`activeCat !== 'notes'`).
- Reuse the existing `fadeApply()` opacity transition.

## Affected files

- `src/utils/categories.ts` — label rename.
- `src/pages/blog/index.astro` — template (split list + headers + separator),
  counts, and the inline filter script.

## Testing / verification

- `npm run build` clean.
- Visual check (`visual-check` skill) on the Journal index:
  - **All:** no notebook posts present; eyebrow count = non-notes total.
  - **News/Math/Physics:** unchanged.
  - **Notebook (All topic):** topic group headers visible with counts, posts
    grouped, no per-post topic pill, sidebar visible.
  - **Notebook → a topic:** only that topic's header + its posts; sidebar
    selection reflects it.
  - Notebook filter pill visually separated from the blog pills.
  - Light + dark mode.
- Verify a note **detail page** badge now reads "Notebook".

## Risks / notes

- The `.j-filters-bar` is `position: sticky`; per CLAUDE.md, avoid introducing
  horizontal overflow with the separator (use `overflow-x: clip` if a rule
  element ever widens the row). The separator should not add horizontal scroll.
- Dev HMR can serve stale inlined CSS — verify final look on `npm run preview`,
  not just `npm run dev`.
