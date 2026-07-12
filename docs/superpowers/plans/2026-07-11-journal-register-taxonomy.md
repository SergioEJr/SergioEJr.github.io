# Journal Register-Taxonomy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the Journal from a mixed subject/mode taxonomy (News/Math/Physics/Notebook) to a register-based one (Updates/Essays/Notebook), with subject moving to tags, register-driven header/pill colors, and an explicit `subject` field coloring Essays rows.

**Architecture:** The category system is config-driven from `src/utils/categories.ts` (colors/labels) + an inline `CATS` object in `src/pages/blog/index.astro` (labels/titles/subtitles/colors + filter logic). Category is a frontmatter enum validated in `content.config.ts`. We rename the three registers, add a `subject` enum, thread a resolved per-row color into the existing `JournalPost` `catColor` prop, and re-categorize all 10 posts' frontmatter. Verification is `npm run build` + visual-check in both themes (no unit-test surface).

**Tech Stack:** Astro content collections, Zod schema, inline `<script>` filter logic, CSS custom properties, the `visual-check` skill.

## Global Constraints

- **Three registers:** `updates`, `essays`, `notebook` (category enum). Default `updates`.
- **Essays subject enum:** `Science`, `Math`, `Ideas` (frontmatter `subject`, optional).
- **Color rule:** register color → Journal header + filter pill (all sections).
  Per-row dot/underline: **Essays** → `ESSAY_SUBJECT_COLORS[subject]` (fallback =
  Essays register color); **Updates/Notebook** → register color.
- **Notebook grouping:** by `topic`; broad groups (Math, Physics, Git, WebDev).
- **Essays:** flat reverse-chron list, NOT grouped.
- **Fresh color sets**, light + dark, legible in both themes; confirm visually.
- **Preserve** the `history.state` fix in `writeHash()` (don't regress the back-button bug).
- OG generator (`*.png.ts`) uses only `PROJECT_CAT_COLORS` — do NOT touch it.
- Commit per task; don't push. Finish with a clean `npm run build`.

## Color values (starting proposal — confirm visually in Task 7)

Registers (header + pill):
| Register | Light | Dark |
|---|---|---|
| updates | `#2563eb` | `#60a5fa` |
| essays | `#db2777` | `#f472b6` |
| notebook | `#d97706` | `#fbbf24` |

Essays subjects (dot/underline):
| Subject | Light | Dark |
|---|---|---|
| Science | `#0d9488` | `#2dd4bf` |
| Math | `#7c3aed` | `#a78bfa` |
| Ideas | `#c2410c` | `#fb923c` |

The TS maps hold both light+dark; rendering uses the matching global CSS vars
(`--cat-*` / `--subj-*`, Task 1) so colors flip with the theme automatically.

---

### Task 1: Category + subject config in `categories.ts`

Rewrite the shared color/label maps for the new registers and add the Essays
subject color map. This is pure data other tasks consume.

**Files:**
- Modify: `src/utils/categories.ts`
- Modify: `src/styles/global.css` (the shared `--cat-*` / `--subj-*` CSS vars)

**Interfaces:**
- Produces: `BLOG_CATEGORY_COLORS` / `BLOG_CATEGORY_LABELS` keyed by
  `updates|essays|notebook`; new `ESSAY_SUBJECT_COLORS` keyed by
  `Science|Math|Ideas`. Each color map value is `{ light: string; dark: string }`.
  Plus global CSS vars `--cat-updates|essays|notebook` and
  `--subj-Science|Math|Ideas` (light + dark), the render-time source of truth.
- Consumed by: Tasks 3 (blog index), 4 (JournalPost caller), 5 (slug/tag pages).

- [ ] **Step 1: Replace the blog category maps and add subject colors**

Replace the `BLOG_CATEGORY_COLORS` and `BLOG_CATEGORY_LABELS` blocks (leave
`PROJECT_CATEGORY_COLORS` untouched) with:

```ts
// Journal registers (organize by reader intent, not subject). The color drives
// the Journal header + filter pill. Each has a light/dark value.
export const BLOG_CATEGORY_COLORS: Record<string, { light: string; dark: string }> = {
	updates: { light: '#2563eb', dark: '#60a5fa' },
	essays: { light: '#db2777', dark: '#f472b6' },
	notebook: { light: '#d97706', dark: '#fbbf24' },
};

export const BLOG_CATEGORY_LABELS: Record<string, string> = {
	updates: 'Updates',
	essays: 'Essays',
	notebook: 'Notebook',
};

// Essays-only subject accent (dot + title underline), from the post's `subject`
// frontmatter. Falls back to the essays register color when absent/unknown.
export const ESSAY_SUBJECT_COLORS: Record<string, { light: string; dark: string }> = {
	Science: { light: '#0d9488', dark: '#2dd4bf' },
	Math: { light: '#7c3aed', dark: '#a78bfa' },
	Ideas: { light: '#c2410c', dark: '#fb923c' },
};
```

- [ ] **Step 2: Add the shared CSS vars to `global.css`**

In `src/styles/global.css`, add to the `:root` block and the `[data-theme="dark"]`
block (these are the render-time source of truth; keep the hexes in sync with the
`categories.ts` maps above):

```css
/* :root (light) */
	--cat-updates: #2563eb;
	--cat-essays: #db2777;
	--cat-notebook: #d97706;
	--subj-Science: #0d9488;
	--subj-Math: #7c3aed;
	--subj-Ideas: #c2410c;
```
```css
/* [data-theme="dark"] */
	--cat-updates: #60a5fa;
	--cat-essays: #f472b6;
	--cat-notebook: #fbbf24;
	--subj-Science: #2dd4bf;
	--subj-Math: #a78bfa;
	--subj-Ideas: #fb923c;
```

- [ ] **Step 3: Typecheck categories.ts compiles**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep categories.ts || echo "no errors in categories.ts"`
Expected: `no errors in categories.ts`. (Consumers still reference old shapes; fixed in later tasks — a full build is NOT expected to pass until Task 6.)

- [ ] **Step 4: Commit**

```bash
git add src/utils/categories.ts src/styles/global.css
git commit -m "Categories: register + essay-subject colors (TS maps + global CSS vars)"
```

---

### Task 2: Schema — category enum + subject field

Update the content collection schema so the new frontmatter validates.

**Files:**
- Modify: `src/content.config.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `category` enum `['updates','essays','notebook']` default `'updates'`;
  optional `subject` enum `['Science','Math','Ideas']`.

- [ ] **Step 1: Update the enum and add subject**

In `src/content.config.ts`, change the blog `category` line:

```ts
category: z.enum(['updates', 'essays', 'notebook']).default('updates'),
```

Add, immediately after the `category` line (matching the surrounding indentation):

```ts
			subject: z.enum(['Science', 'Math', 'Ideas']).optional(),
```

- [ ] **Step 2: Verify schema parses (build will still fail on old frontmatter — expected)**

Run: `node -e "require('zod')" 2>/dev/null; grep -n "updates.*essays.*notebook" src/content.config.ts`
Expected: the grep prints the new enum line. (Full `astro build` will fail until Task 6 fixes frontmatter — don't run it yet.)

- [ ] **Step 3: Commit**

```bash
git add src/content.config.ts
git commit -m "Schema: register category enum + optional essay subject"
```

---

### Task 3: Blog index — registers, filters, grouping, per-row color

The core UI change. Rewrite `CATS`, filter order, all `"notes"` references, and
the per-row color resolution.

**Files:**
- Modify: `src/pages/blog/index.astro`

**Interfaces:**
- Consumes: `BLOG_CATEGORY_COLORS`, `BLOG_CATEGORY_LABELS`, `ESSAY_SUBJECT_COLORS`
  from Task 1.
- Produces: per-row `catColor` (resolved light/dark) passed to `JournalPost`.

- [ ] **Step 1: Import the color maps**

At the top of the frontmatter script in `src/pages/blog/index.astro`, add:

```ts
import { BLOG_CATEGORY_COLORS, BLOG_CATEGORY_LABELS, ESSAY_SUBJECT_COLORS } from '../../utils/categories';
```

- [ ] **Step 2: Replace the `Cat` type and `CATS` config**

Change the `Cat` type (line ~11) to:

```ts
type Cat = 'all' | 'updates' | 'essays' | 'notebook';
```

Replace the `CATS` object so each register uses its label + a `color` pulled from
`BLOG_CATEGORY_COLORS`. Since the header/pill need a single color string that
flips with theme, emit a CSS `light-dark()`-style value via a helper. Use this
pattern (light/dark resolved through a CSS variable set on the row):

```ts
// Render a category color that flips with the theme. We inline both values and
// pick via a data-theme-scoped CSS var (see the <style> block below), so define
// the color as the LIGHT value here and expose the dark value alongside.
const catColorVar = (key: string) => `var(--cat-${key})`;

const CATS: Record<Cat, { label: string; color: string; title: string; subtitle: string }> = {
	updates: {
		label: BLOG_CATEGORY_LABELS.updates,
		color: catColorVar('updates'),
		title: 'Updates',
		subtitle: 'Announcements, milestones, and what I’m up to.',
	},
	essays: {
		label: BLOG_CATEGORY_LABELS.essays,
		color: catColorVar('essays'),
		title: 'Essays',
		subtitle: 'Big-picture ideas in science, math, and life — written to be read by anyone.',
	},
	notebook: {
		label: BLOG_CATEGORY_LABELS.notebook,
		color: catColorVar('notebook'),
		title: 'Things I’m learning',
		subtitle: 'A growing notebook of guides and notes, technical to plain.',
	},
	all: {
		label: 'All',
		color: 'var(--color-accent)',
		title: 'The Journal',
		subtitle: 'Updates, essays & notebook — all in one place.',
	},
};
```

The `--cat-*` / `--subj-*` CSS vars these reference are defined **globally** in
`src/styles/global.css` in Task 1 (they're needed on post + tag pages too),
so `catColorVar` resolves and flips with the theme without page-local definitions.

- [ ] **Step 3: Update `FILTER_ORDER`**

```ts
const FILTER_ORDER: Cat[] = ['updates', 'essays', 'all', 'notebook'];
```

- [ ] **Step 4: Replace all `"notes"` references with `"notebook"`**

In `src/pages/blog/index.astro`, replace every occurrence of the category string
`"notes"` / `'notes'` with `'notebook'`. Locations (verify each):
- `counts.all` guard (`p.data.category !== 'notes'`)
- topic-count loop (`p.data.category === 'notes'`)
- `blogPosts` filter (`!== 'notes'`)
- `noteGroupMap` loop (`!== 'notes'`)
- the sidebar `<aside>` / topic view: `data-filter="notes"` → `data-filter="notebook"`
- inline `<script>` filter logic: `activeCat === 'notes'` (several), `activeCat !== 'notes'`

Run after editing:
`grep -n "'notes'\|\"notes\"" src/pages/blog/index.astro` → expect **no matches**.

- [ ] **Step 5: Resolve per-row color (subject for Essays, register otherwise)**

Replace the existing `catColor`/`catLabel` helpers (lines ~108-110) with (the
`--cat-*` / `--subj-*` vars come from `global.css`, Task 1):

```ts
const catLabel = (c: string) => BLOG_CATEGORY_LABELS[c] ?? c;
// Per-row dot/underline color. Essays rows take their subject color; Updates and
// Notebook take the register color. Returns a theme-flipping CSS var reference.
const rowColor = (post: { data: { category: string; subject?: string } }) => {
	if (post.data.category === 'essays' && post.data.subject && ESSAY_SUBJECT_COLORS[post.data.subject]) {
		return `var(--subj-${post.data.subject})`;
	}
	return `var(--cat-${post.data.category})`;
};
```

Update BOTH `<JournalPost ... catColor={...} />` call sites (the flat blogPosts
map and the notebook group map) to use `rowColor(post)`:

```astro
catColor={rowColor(post)}
catLabel={catLabel(post.data.category)}
```

Note: `blogPosts` (line ~90) currently means "everything except notes". After
rename it should be "everything except notebook" — i.e. Updates + Essays render
in the flat list, Notebook renders grouped. Confirm the filter reads
`p.data.category !== 'notebook'`.

- [ ] **Step 6: Build is still expected to fail (frontmatter) — sanity-check this file only**

Run: `grep -c "rowColor\|--cat-updates\|FILTER_ORDER" src/pages/blog/index.astro`
Expected: ≥ 3 (the new symbols are present). Full build waits for Task 6.

- [ ] **Step 7: Commit**

```bash
git add src/pages/blog/index.astro
git commit -m "Blog index: register filters, notebook rename, per-row subject color"
```

---

### Task 4: JournalPost — rename `isNote` check

`JournalPost` keys "is a notebook entry" off `category === 'notes'`. Update it.
The dot/underline already come from the `catColor` prop (set by Task 3), so no
color logic changes here.

**Files:**
- Modify: `src/components/JournalPost.astro`

**Interfaces:**
- Consumes: `catColor` prop (now theme-flipping var from Task 3).

- [ ] **Step 1: Update the notebook check**

In `src/components/JournalPost.astro`, change:

```ts
const isNote = post.data.category === 'notebook';
```

- [ ] **Step 2: Verify no other `'notes'` category refs remain**

Run: `grep -n "'notes'\|\"notes\"" src/components/JournalPost.astro`
Expected: no matches.

- [ ] **Step 3: Commit**

```bash
git add src/components/JournalPost.astro
git commit -m "JournalPost: key notebook entries off 'notebook' category"
```

---

### Task 5: Slug + tag pages — category color/label lookups

Both pages import `BLOG_CATEGORY_COLORS`/`_LABELS` and index them directly with a
string, expecting a flat string value. Task 1 changed values to `{light,dark}`
objects, so these must resolve a single color. Use the light value as the badge
color base (post header badge already sits on a neutral pill; light hue reads on
both themes) OR emit a theme var. Simplest correct: use a small local resolver.

**Files:**
- Modify: `src/pages/blog/[...slug].astro`
- Modify: `src/pages/tags/[tag].astro`

(The shared `--cat-*` / `--subj-*` vars already exist in `global.css` from Task 1;
this task only consumes them.)

**Interfaces:**
- Consumes: `BLOG_CATEGORY_LABELS`, `ESSAY_SUBJECT_COLORS` from Task 1; the global
  `--cat-*` / `--subj-*` CSS vars.

- [ ] **Step 1: Fix the slug page category badge**

In `src/pages/blog/[...slug].astro`, `categoryBadges` builds `color` from
`BLOG_CATEGORY_COLORS[cat]` (now a `{light,dark}` object — would render `[object
Object]`). Change it to the global theme var (defined in Task 1, resolves on the
post page and flips with theme):

```ts
const categoryBadges = [{
	label: BLOG_CATEGORY_LABELS[post.data.category] ?? post.data.category,
	color: `var(--cat-${post.data.category}, var(--color-accent))`,
}];
```

Remove the now-unused `BLOG_CATEGORY_COLORS` import from this file.

- [ ] **Step 2: Fix the tag page color resolver**

In `src/pages/tags/[tag].astro`, replace:

```ts
const catColor = (c: string) => BLOG_CATEGORY_COLORS[c] ?? 'var(--color-accent)';
```

with a resolver mirroring the blog index (subject for essays, register otherwise):

```ts
import { BLOG_CATEGORY_LABELS, ESSAY_SUBJECT_COLORS } from '../../utils/categories';
const catLabel = (c: string) => BLOG_CATEGORY_LABELS[c] ?? c;
const rowColor = (post: any) =>
	post.data.category === 'essays' && post.data.subject && ESSAY_SUBJECT_COLORS[post.data.subject]
		? `var(--subj-${post.data.subject})`
		: `var(--cat-${post.data.category}, var(--color-accent))`;
```

Update the `<JournalPost ... catColor={catColor(post.data.category)} />` call to
`catColor={rowColor(post)}`. Remove the now-unused `BLOG_CATEGORY_COLORS` import.

- [ ] **Step 3: Commit**

```bash
git add "src/pages/blog/[...slug].astro" "src/pages/tags/[tag].astro"
git commit -m "Post + tag pages: theme-var register/subject colors from globals"
```

---

### Task 6: Re-categorize all post frontmatter

Update `category` on all 10 published posts + 3 draft posts, add `topic` to the
incoming notebook notes, and `subject` to the essays. This makes the build pass.

**Files (frontmatter only):**
- `src/content/blog/news-emory-op-ed.md`
- `src/content/blog/news-mit-admission.md`
- `src/content/blog/news-hello-world.md`
- `src/content/blog/news-pointer-example.md`
- `src/content/blog/news-study-abroad-korea.md`
- `src/content/blog/news-update-example.md`
- `src/content/blog/note-astro.md`, `note-git.md`, `note-webgl.md`
- `src/content/blog/sample-math.md`, `sample-physics.md`
- `src/content/blog/note-product-rule.mdx`
- `src/content/blog/physics-entropy-equation.mdx`

- [ ] **Step 1: Updates (was news) — 6 files**

In each of `news-emory-op-ed.md` is an ESSAY (see Step 2); the rest —
`news-mit-admission.md`, `news-hello-world.md`, `news-pointer-example.md`,
`news-study-abroad-korea.md`, `news-update-example.md` — change `category: news`
→ `category: updates`.

- [ ] **Step 2: Essays — op-ed + entropy**

`news-emory-op-ed.md`: `category: news` → `category: essays`; add `subject: Ideas`.
`physics-entropy-equation.mdx`: `category: physics` → `category: essays`; add
`subject: Science`.

- [ ] **Step 3: Notebook — the math/physics notes + existing notes**

`note-product-rule.mdx`: `category: math` → `category: notebook`; add `topic: Math`.
`sample-math.md`: `category: math` → `category: notebook`; add `topic: Math`.
`sample-physics.md`: `category: physics` → `category: notebook`; add `topic: Physics`.
`note-astro.md`, `note-git.md`, `note-webgl.md`: `category: notes` →
`category: notebook` (keep existing `topic: WebDev`/`Git`).

- [ ] **Step 4: Verify no stale categories remain**

Run: `grep -rn "^category:" src/content/blog/ | grep -Ev "updates|essays|notebook"`
Expected: no output (every post uses a new register).

- [ ] **Step 5: Full build**

Run: `npm run build`
Expected: clean build (schema validates all frontmatter; Pagefind indexes). Fix
any Zod validation errors (typo in category/subject/topic).

- [ ] **Step 6: Commit**

```bash
git add src/content/blog/
git commit -m "Re-categorize posts into Updates/Essays/Notebook registers"
```

---

### Task 7: Visual verification + color tuning (both themes)

Confirm the whole system renders correctly and tune the fresh colors in-context.

**Files:**
- Possibly re-tune hexes in `src/styles/global.css` (+ the page-local dark block if kept).

- [ ] **Step 1: Screenshot the Journal, all filters, both themes**

Use the `visual-check` skill on `/blog/` at width 1000, light + dark. Verify:
- Filter bar reads **Updates · Essays · All · Notebook**, three distinct pill colors.
- Clicking each filter changes the **header color** to that register's color.
- **Essays** rows: entropy dot/underline = Science teal, op-ed = Ideas orange.
- **Updates / Notebook** rows: register color dots.
- **Notebook** grouped by **Math · Physics · Git · WebDev**; product rule under Math.
- No horizontal overflow; navbar stuck.

- [ ] **Step 2: Screenshot a post header + a tag page, both themes**

`visual-check` `/blog/note-product-rule/` and `/tags/calculus`: category badge
color correct and theme-flipping; tag page rows colored correctly.

- [ ] **Step 3: Tune colors if needed**

If any register or subject color is muddy / too close to another / low-contrast on
white or slate, adjust the hex in `src/styles/global.css` (both light + dark
blocks) AND the matching value in `src/utils/categories.ts` (keep in sync).
Re-screenshot until all six colors are distinct and legible in both themes.

- [ ] **Step 4: Back-button regression check**

Confirm the filter → article → back flow still restores the filtered view (the
`history.state` fix). Drive it (Playwright/real browser): `/blog/` → click a
filter → click a post → Back → the filtered list shows (not stale article).

- [ ] **Step 5: Commit any tuning**

```bash
git add src/styles/global.css src/utils/categories.ts
git commit -m "Tune Journal register + subject colors for both themes"
```

---

## Self-Review Notes

- **Spec coverage:** registers (Tasks 1-3,6), subject field + colors (1,2,3,6),
  notebook rename/grouping (3,4,6), header/pill vs subject color rule (3,5),
  post re-sort (6), slug/tag/OG consumers (5; OG untouched per spec), history.state
  preserved (7 step 4), both-theme verification (7). Covered.
- **Sync risk called out:** the register/subject hexes exist in BOTH
  `categories.ts` (TS, for any JS consumer) and `global.css` (CSS vars, for
  rendering). Task 5 centralizes the CSS vars in `global.css`; Task 3's page-local
  copies are removed there to avoid drift. A comment marks the two as
  keep-in-sync. If a future task needs only one source, prefer the CSS vars.
- **Type consistency:** `rowColor(post)`, `catLabel`, `ESSAY_SUBJECT_COLORS`,
  `--cat-<register>`, `--subj-<Subject>` used consistently across Tasks 3 & 5.
- **Placeholder scan:** color hexes are concrete starting values with a Task 7
  visual-tuning gate — not placeholders.
