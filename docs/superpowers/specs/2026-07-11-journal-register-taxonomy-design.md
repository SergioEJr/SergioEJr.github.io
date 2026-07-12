# Journal taxonomy: reorganize by register (Updates · Essays · Notebook)

**Date:** 2026-07-11

## Problem

The Journal's four categories (News, Math, Physics, Notebook) mix two axes:
News/Notebook are organized by *mode/purpose* while Math/Physics are organized by
*subject*. They aren't parallel, so a post like the product-rule note has a
legitimate claim on both "Math" (subject) and "Notebook" (a short explainer),
which is the source of the "where does this go?" confusion.

## Resolution

Reorganize the categories around a single axis: **register / reader intent**.
Subject moves to **tags** (already implemented and clickable).

Three parallel, non-overlapping buckets:

- **Updates** — the timeline. Announcements, milestones, chapters of life.
  (Reader tracing Sergio's story.) *Was: News.*
- **Essays** — pop-sci / pop-math. Big-picture, accessible, "inspiration and
  a-ha connections," light on machinery. (Reader wants understanding without the
  technical detail.) *New bucket.*
- **Notebook** — traditional notes on a topic being learned or explored; ranges
  technical → simple explainers (short ones in the style of the product-rule
  post). (Reader wants to actually understand the thing, some detail included.)
  *Was: Notebook (notes), now also absorbs the standalone Math/Physics notes.*

The distinguishing test: *Am I telling a story (Updates), inviting someone into a
big idea (Essays), or writing up a topic to understand it (Notebook)?* Subject is
irrelevant to the bucket — it lives in tags.

## Post re-sort (all current published posts)

| Post | Old category | New category | Notebook topic |
|---|---|---|---|
| Admitted to MIT … | news | **updates** | — |
| Graduated from Emory | news | **updates** | — |
| Op-Ed: passion for grades | news | **essays** | — |
| The Entropy Equation | physics | **essays** | — |
| A picture proof of the product rule | math | **notebook** | Math |
| A tiny note on the Gaussian integral | math | **notebook** | Math |
| Why random walks spread like √t | physics | **notebook** | Physics |
| What is Astro? | notes | **notebook** | WebDev (unchanged) |
| What is WebGL? | notes | **notebook** | WebDev (unchanged) |
| Rebase vs. merge, briefly | notes | **notebook** | Git (unchanged) |

Draft/unpublished news posts (Hello world, competition front, Korea) → **updates**.

**Notebook grouping = broad subject groups**: the incoming math/physics notes get
`topic: Math` / `topic: Physics` (coarse, not "Calculus"). Existing Git/WebDev
topics stay.

## Color scheme

Two color sources, deliberately:

1. **Register color** — each of the 3 categories has its own unique color, driving
   the **Journal header color** and the **filter pill color** (exactly as the
   category color does today). Pick a **fresh 3-color set**, legible in both
   themes. Proposed (to be visually confirmed):
   - Updates → blue `#3b82f6` (light) / `#60a5fa` (dark)
   - Essays → rose/amber-warm, distinct from the others, e.g. `#e11d48` (light) /
     `#fb7185` (dark)  *(final hue confirmed visually)*
   - Notebook → amber `#f59e0b` (light) / `#fbbf24` (dark)
2. **Subject accent** — the per-row **category dot + title underline** color comes
   from the post's **subject**, but **only in the Essays section**. In Updates and
   Notebook the dot/underline uses the register color (current behavior). Subject→
   color map reuses the old subject hues (e.g. calculus/math purple `#8b5cf6`,
   thermodynamics/physics green `#10b981`), keyed off the post's primary tag or
   topic. Essays posts with no recognized subject fall back to the Essays register
   color.

## Files to change

1. **`src/utils/categories.ts`** — rename `BLOG_CATEGORY_COLORS`/`_LABELS` keys
   `news`→`updates`, drop `math`/`physics`, keep/rename `notes`→`notebook`, add
   `essays`. Add a **subject→color map** (new export) for the Essays dots. Keep OG
   consumers working.
2. **`src/content.config.ts`** — category enum
   `['news','math','physics','notes']` → `['updates','essays','notebook']`,
   default `'updates'`. (Add topic to schema if not already free-form — it is a
   string already.)
3. **`src/pages/blog/index.astro`** — the big one:
   - `Cat` type + `CATS` config: three registers + `all`, new labels
     (Updates/Essays/Notebook), titles/subtitles, register colors.
   - `FILTER_ORDER` → `['updates','essays','all','notebook']` (or chosen order).
   - Replace every hardcoded `"notes"` with `"notebook"` (grouping, filter, hash,
     sidebar visibility).
   - Notebook grouping: unchanged mechanism, now keyed on `notebook`.
   - Per-row dot/underline color: for `essays` posts, resolve subject color;
     else register color. Pass the resolved color to `JournalPost` as `catColor`.
4. **`src/components/JournalPost.astro`** — `isNote` check `=== 'notes'` →
   `=== 'notebook'`. (The dot/underline already come from the `catColor` prop, so
   the subject-vs-register logic lives in the caller.)
5. **`src/pages/blog/[...slug].astro`** and **`src/pages/tags/[tag].astro`** —
   category-color lookups updated to the new keys / new helper.
6. **OG image generator (`src/pages/[...route].png.ts`)** — if it maps category→
   color, update keys.
7. **Post frontmatter** — update `category:` on all 10 posts per the table, and add
   `topic: Math` / `topic: Physics` to the three incoming notes.

## Migration / correctness

- The filter **hash** persists `#<category>` in the URL (e.g. `#notes`). After
  rename, old shared links `#notes`/`#math` won't resolve. Acceptable (personal
  site, low external linkage); `readHash()` already falls back to "all" for
  unknown categories, so no breakage — just defaults to All.
- Preserve the `history.state` fix in `writeHash` (don't regress the back-button
  bug).

## Verification

1. `npm run build` clean (enum change + all frontmatter valid).
2. `visual-check` in both themes:
   - Filter bar shows Updates · Essays · Notebook with 3 distinct pill colors;
     header color changes per active filter.
   - Essays rows: dot/underline colored by subject (entropy=green, op-ed=its
     subject or Essays fallback). Updates/Notebook rows: register color.
   - Notebook grouped by Math / Physics / Git / WebDev.
   - Product rule now appears under Notebook › Math.
   - `/tags/<tag>` and post headers still render correct category colors.
3. Back-button: filter → article → back still restores the filtered view (the
   history.state fix must survive).

## Out of scope

- No new "Essays" content is written; entropy + op-ed are the only Essays for now.
- Subject-color for Notebook/Updates rows (intentionally register-colored).
