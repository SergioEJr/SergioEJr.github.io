# Notebook (grouped Notes) View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Journal's "Notes" category into a distinct, topic-grouped "Notebook" mode that is excluded from the "All" blog view, rendered as a plain-text filter set apart from the blog pills.

**Architecture:** All changes are server-rendered Astro template + an inline `<script is:inline>` filter, plus a one-line shared-label rename. The grouped list and topic headers are rendered server-side and shown/hidden by the existing per-element `apply()` filter loop. No framework, no new route, no new dependency.

**Tech Stack:** Astro (static), vanilla inline JS, CSS in a scoped `<style>` block. Build/index via `npm run build` (also runs Pagefind).

## Global Constraints

- **No test runner exists for `.astro` pages.** The verification cycle for every task is `npm run build` (must be clean) plus visual confirmation via the **visual-check skill** (Playwright screenshots of the dev server). Never `pkill` the astro dev server; reuse a running one.
- **Dev HMR serves stale inlined CSS on client-side nav.** Verify final CSS look on `npm run preview`, not just `npm run dev`.
- **`position: sticky` + horizontal overflow don't mix.** The `.j-filters-bar` is sticky; do not introduce horizontal overflow. If a separator widens the row, use `overflow-x: clip` (never `hidden`/`auto`).
- The category value in frontmatter/schema stays `notes`. Only **display labels** change to "Notebook".
- Notebook accent color is `#f59e0b` (unchanged).
- Commit after each task. Do not push.

## File Structure

- `src/utils/categories.ts` — shared category labels. One-line change: `notes` label → `'Notebook'`. (Consumed by note detail-page badge.)
- `src/pages/blog/index.astro` — the entire Journal index: frontmatter data prep, template (filter bar, sidebar, post list), inline filter script, and scoped styles. All grouping, filtering, and styling changes live here.

No files are created. No files are split (the index file is cohesive and within normal size for this repo).

---

### Task 1: Rename Notes → Notebook (display labels)

Rename the display label everywhere it surfaces, so the filter pill, eyebrow, and note detail-page badge all read "Notebook". The underlying `notes` category value is untouched.

**Files:**
- Modify: `src/utils/categories.ts` (the `BLOG_CATEGORY_LABELS.notes` entry)
- Modify: `src/pages/blog/index.astro` (the `CATS.notes.label` entry, ~line 18)

**Interfaces:**
- Consumes: nothing new.
- Produces: `BLOG_CATEGORY_LABELS.notes === 'Notebook'` and `CATS.notes.label === 'Notebook'`, relied on by the badge on note detail pages and by the eyebrow label (driven by `cats[activeCat].label`).

- [ ] **Step 1: Change the shared label**

In `src/utils/categories.ts`, in `BLOG_CATEGORY_LABELS`, change:

```ts
	notes: 'Notes',
```
to:
```ts
	notes: 'Notebook',
```

- [ ] **Step 2: Change the Journal filter label**

In `src/pages/blog/index.astro`, in the `CATS` object (~line 18), change the `label` of the `notes` entry from `'Notes'` to `'Notebook'`. Leave `color`, `title`, `subtitle` as-is:

```ts
	notes: { label: 'Notebook', color: '#f59e0b', title: 'Things I’m learning', subtitle: 'A growing notebook of guides and explainers, written plainly.' },
```

- [ ] **Step 3: Build to verify clean**

Run: `npm run build`
Expected: completes with no errors; Pagefind index runs.

- [ ] **Step 4: Visually verify the label**

Use the visual-check skill to screenshot the Journal index (`/blog/`) and a note detail page (e.g. `/blog/note-git/`).
Expected: the last filter reads "Notebook" (still a pill at this stage); the note detail-page category badge reads "Notebook".

- [ ] **Step 5: Commit**

```bash
git add src/utils/categories.ts src/pages/blog/index.astro
git commit -m "feat: rename Notes category label to Notebook"
```

---

### Task 2: Exclude Notebook posts from "All"

Make "All" mean the blog (news + math + physics). Notebook posts only appear under the Notebook filter.

**Files:**
- Modify: `src/pages/blog/index.astro` — the `counts.all` computation (frontmatter, ~line 37) and the `apply()` show-rule (inline script, ~line 183)

**Interfaces:**
- Consumes: `CATS`, `posts`, `counts` from existing frontmatter.
- Produces: `counts.all` = count of non-notes posts; `apply()` hides notes when `activeCat === 'all'`.

- [ ] **Step 1: Recompute `counts.all` to exclude notes**

In the frontmatter, `counts` is currently:

```ts
const counts: Record<string, number> = { all: posts.length, news: 0, math: 0, physics: 0, notes: 0 };
for (const p of posts) counts[p.data.category] = (counts[p.data.category] || 0) + 1;
```

Replace with a version where `all` excludes notes (initialize `all` to 0 and only count non-notes into it):

```ts
const counts: Record<string, number> = { all: 0, news: 0, math: 0, physics: 0, notes: 0 };
for (const p of posts) {
	counts[p.data.category] = (counts[p.data.category] || 0) + 1;
	if (p.data.category !== 'notes') counts.all++;
}
```

- [ ] **Step 2: Update the client `apply()` show-rule for "all"**

In the inline `<script>`, inside `apply()`, the current rule is:

```js
let show = activeCat === 'all' || cat === activeCat;
```

Change so "all" excludes notes:

```js
let show = activeCat === 'all' ? cat !== 'notes' : cat === activeCat;
```

(The existing `if (show && activeCat === 'notes' && activeTopic !== 'all')` topic-narrowing block below stays unchanged.)

- [ ] **Step 3: Build to verify clean**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 4: Visually verify**

Use the visual-check skill on `/blog/`:
- Default "All" view shows **no** notebook posts; the eyebrow count equals news + math + physics.
- Clicking "Notebook" still shows the notebook posts.
- News/Math/Physics unaffected.

- [ ] **Step 5: Commit**

```bash
git add src/pages/blog/index.astro
git commit -m "feat: exclude Notebook posts from the All view"
```

---

### Task 3: Render Notebook posts grouped with topic headers

Split the post list into a blog block (non-notes, date order — unchanged) followed by a notebook block grouped by topic, with a `.j-group-header` before each group. Drop the per-post topic pill for notes. Extend `apply()` to show/hide headers.

**Files:**
- Modify: `src/pages/blog/index.astro` — frontmatter (build grouped notes structure), template (split list + headers, drop notes pill), inline script (header toggling), styles (header CSS)

**Interfaces:**
- Consumes: `posts` (reverse-chron), `postNumber`, `topicCounts`, `catColor`, `catLabel`, `postLink`, `renderInline` from existing frontmatter.
- Produces: a `blogPosts` array and a `noteGroups` array (`{ topic: string; count: number; posts: Post[] }[]`) ordered newest-group-first; `.j-group-header[data-group-topic]` elements; `apply()` toggles them.

- [ ] **Step 1: Build the split + grouped data in frontmatter**

After the existing `topics`/`topicCounts` block in the frontmatter, add structures that (a) separate blog posts from notes and (b) group notes by topic ordered newest-group-first. `posts` is already reverse-chronological, so iterating it preserves newest-first within each group, and the first time a topic is seen marks its newest post:

```ts
// Blog posts (everything except notes) keep their reverse-chronological order.
const blogPosts = posts.filter((p) => p.data.category !== 'notes');

// Notebook posts grouped by topic. `posts` is newest-first, so the first time a
// topic appears is its newest post — that order is also the group order
// (newest-group-first). Posts within a group stay newest-first.
const noteGroupMap = new Map<string, typeof posts>();
for (const p of posts) {
	if (p.data.category !== 'notes') continue;
	const t = p.data.topic ?? 'Other';
	if (!noteGroupMap.has(t)) noteGroupMap.set(t, []);
	noteGroupMap.get(t)!.push(p);
}
const noteGroups = [...noteGroupMap.entries()].map(([topic, ps]) => ({
	topic,
	count: ps.length,
	posts: ps,
}));
```

- [ ] **Step 2: Create a `JournalPost.astro` child component for the article markup**

The post `<article>` is now rendered from two loops (the blog block and each note group). Astro has no local JSX-style render function, so to keep this DRY extract the `<article>` markup into a small child component and render it from both loops.

Create `src/components/JournalPost.astro`:

```astro
---
import FormattedDate from './FormattedDate.astro';
import { renderInline } from '../utils/inlineText';
import { url } from '../utils/paths';

interface Props {
	post: any;
	number: number;
	catColor: string;
	catLabel: string;
}
const { post, number, catColor, catLabel } = Astro.props;

function postLink(data: any, id: string): { href: string; external: boolean } {
	if (data.externalUrl) return { href: data.externalUrl, external: true };
	if (data.linkTo) return { href: url(data.linkTo), external: false };
	return { href: url(`/blog/${id}/`), external: false };
}
const link = postLink(post.data, post.id);
const isNote = post.data.category === 'notes';
---
<article
	class="j-post"
	data-category={post.data.category}
	data-topic={post.data.topic ?? ''}
	style={`--cat-color:${catColor}`}
>
	<div class="j-index">{String(number).padStart(2, '0')}</div>
	<div class="j-main">
		<div class="j-cat" style={`color:${catColor}`}>● {catLabel}</div>
		{post.data.noLink ? (
			<h2 class="j-post-title j-post-title--static" set:html={renderInline(post.data.title)} />
		) : (
			<h2 class="j-post-title">
				<a
					href={link.href}
					{...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
					data-umami-event="journal-post"
					data-umami-event-title={post.data.title}
					data-umami-event-category={post.data.category}
					data-umami-event-external={link.external ? 'true' : 'false'}
				>
					<span set:html={renderInline(post.data.title)} />
					{link.external && (
						<svg class="j-ext-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"></path><path d="M7 7h10v10"></path></svg>
					)}
				</a>
			</h2>
		)}
		<p class="j-desc">{post.data.description}</p>
		<div class="j-meta">
			<FormattedDate date={post.data.pubDate} />
			{!isNote && post.data.topic && <span class="j-topic-tag">{post.data.topic}</span>}
			{post.data.tags && post.data.tags.length > 0 && (
				<span class="j-tags">{post.data.tags.map((t: string) => `#${t}`).join('  ')}</span>
			)}
		</div>
	</div>
</article>
```

Key change vs. the original: the topic pill is gated with `!isNote &&`, so notebook posts no longer render `.j-topic-tag`. (Notes are the only posts with a topic, so the pill effectively disappears.)

- [ ] **Step 3: Wire the component into the index template**

In `src/pages/blog/index.astro`, import the component at the top of the frontmatter:

```ts
import JournalPost from '../../components/JournalPost.astro';
```

Replace the `.j-list` body with the blog block + grouped note blocks, passing the global chronological number:

```astro
<div class="j-list">
	{blogPosts.map((post) => (
		<JournalPost post={post} number={postNumber.get(post.id) ?? 0} catColor={catColor(post.data.category)} catLabel={catLabel(post.data.category)} />
	))}
	{noteGroups.map((g) => (
		<>
			<div class="j-group-header" data-group-topic={g.topic}>
				<span class="j-group-name">{g.topic}</span>
				<span class="j-group-count">{g.count}</span>
			</div>
			{g.posts.map((post) => (
				<JournalPost post={post} number={postNumber.get(post.id) ?? 0} catColor={catColor(post.data.category)} catLabel={catLabel(post.data.category)} />
			))}
		</>
	))}
</div>
```

The now-unused inline `postLink` in the index frontmatter (moved into the component) can be removed if no longer referenced; verify with a search before deleting.

- [ ] **Step 4: Toggle group headers in `apply()`**

In the inline `<script>`, add a reference to the headers near the other `querySelectorAll` calls:

```js
const groupHeaders = Array.from(document.querySelectorAll('.j-group-header'));
```

Inside `apply()`, after the posts loop, add header visibility logic (a header shows only in Notebook view, and only its own topic when a specific topic is selected):

```js
groupHeaders.forEach((h) => {
	const t = h.getAttribute('data-group-topic');
	const show = activeCat === 'notes' && (activeTopic === 'all' || t === activeTopic);
	h.style.display = show ? '' : 'none';
});
```

- [ ] **Step 5: Add group-header styles**

In the scoped `<style>` block, add (place near `.j-list`/`.j-post` rules):

```css
.j-group-header {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	padding: 1.5rem 0 0.5rem;
	border-bottom: 1px solid var(--color-border);
	margin-bottom: 0.5rem;
}
.j-group-name {
	font-size: 0.8rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: var(--color-text-muted);
}
.j-group-count {
	font-variant-numeric: tabular-nums;
	font-size: 0.8rem;
	color: var(--color-text-muted);
	opacity: 0.6;
}
```

- [ ] **Step 6: Build to verify clean**

Run: `npm run build`
Expected: no errors. (Watch for Astro fragment `<>...</>` support — it is supported; if the build complains, wrap each group in a keyed `<Fragment>` import from `astro/jsx-runtime` is not needed — Astro's built-in `<Fragment>` is available globally.)

- [ ] **Step 7: Visually verify grouping**

Use the visual-check skill on `/blog/`, click "Notebook":
- Topic group headers visible (`GIT`, etc.) with right-aligned counts.
- Posts grouped under the correct header, newest group first.
- **No** per-post topic pill on notebook posts.
- Sidebar still visible; clicking a topic shows only that topic's header + its posts.
- Switch to a blog filter: headers hidden, no notebook posts.

- [ ] **Step 8: Commit**

```bash
git add src/components/JournalPost.astro src/pages/blog/index.astro
git commit -m "feat: group Notebook posts under topic headers"
```

---

### Task 4: Set the Notebook filter apart as plain text

Separate the Notebook filter from the blog pills with a divider, and render it as plain text (no pill chrome) in the same typographic style, with color/weight hover+active states.

**Files:**
- Modify: `src/pages/blog/index.astro` — filter-bar template (~lines 76-88), styles (~lines 261-276)

**Interfaces:**
- Consumes: `FILTER_ORDER`, `CATS`.
- Produces: blog pills + separator + plain-text Notebook filter; `.j-filter--text` styling.

- [ ] **Step 1: Reorder `FILTER_ORDER` so Notebook is last**

In the frontmatter, change:

```ts
const FILTER_ORDER: Cat[] = ['news', 'math', 'physics', 'notes', 'all'];
```
to put the blog filters together and Notebook last:
```ts
const FILTER_ORDER: Cat[] = ['news', 'math', 'physics', 'all', 'notes'];
```

- [ ] **Step 2: Render the separator + plain-text Notebook filter in the template**

Replace the current `.j-filters` map:

```astro
<div class="j-filters">
	{FILTER_ORDER.map((c) => (
		<button
			class:list={['j-filter', { active: c === 'all' }]}
			data-filter={c}
			style={`--f-color:${CATS[c].color}`}
		>
			{CATS[c].label}
		</button>
	))}
</div>
```

with a version that splits blog filters from the Notebook filter, inserting a divider between them:

```astro
<div class="j-filters">
	{FILTER_ORDER.filter((c) => c !== 'notes').map((c) => (
		<button
			class:list={['j-filter', { active: c === 'all' }]}
			data-filter={c}
			style={`--f-color:${CATS[c].color}`}
		>
			{CATS[c].label}
		</button>
	))}
	<span class="j-filter-divider" aria-hidden="true"></span>
	<button
		class="j-filter j-filter--text"
		data-filter="notes"
		style={`--f-color:${CATS.notes.color}`}
	>
		{CATS.notes.label}
	</button>
</div>
```

- [ ] **Step 3: Add divider + plain-text filter styles**

In the `<style>` block, after the existing `.j-filter.active` rule, add:

```css
.j-filter-divider {
	width: 1px;
	align-self: stretch;
	background: var(--color-border);
	margin: 0.1rem 0.4rem;
}
/* Notebook filter: plain text, not a pill */
.j-filter--text {
	border: none;
	background: transparent;
	padding: 0.35rem 0.5rem;
	border-radius: 0;
}
.j-filter--text:hover {
	color: var(--f-color);
	background: transparent;
	border-color: transparent;
}
.j-filter--text.active {
	color: var(--f-color);
	background: transparent;
	border-color: transparent;
	font-weight: 800;
}
```

(The base `.j-filter` already supplies the uppercase, size, letter-spacing, and weight, so the text matches the pills typographically. The overrides above strip the pill chrome and replace the filled-active state with color + bolder weight.)

- [ ] **Step 4: Confirm no horizontal overflow on the sticky bar**

The divider adds 1px + small margins; confirm the filter row does not introduce horizontal scrolling at narrow widths (per the sticky-overflow rule). If `.j-filters` ever overflows, it already `flex-wrap`s, so wrapping — not scrolling — is the expected behavior. No `overflow-x` change should be needed; verify in Step 6.

- [ ] **Step 5: Build to verify clean**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 6: Visually verify the filter treatment**

Use the visual-check skill on `/blog/`, in **both light and dark mode**, and on `npm run preview` (not just dev, per the stale-CSS rule):
- Notebook appears after a vertical divider, as plain text (no pill border/background).
- Hover turns it the notebook accent color; active state is the accent color + bolder, no filled background.
- Blog pills unchanged (still filled when active).
- No horizontal scrollbar on the sticky filter bar; narrow widths wrap.

- [ ] **Step 7: Commit**

```bash
git add src/pages/blog/index.astro
git commit -m "feat: render Notebook filter as plain text set apart from blog pills"
```

---

## Final verification

- [ ] `npm run build` clean.
- [ ] `npm run preview` — walk every filter: All (no notes), News/Math/Physics (unchanged), Notebook (grouped, headers, no pills, divider, plain-text filter), Notebook→topic (single header).
- [ ] Light + dark mode both correct.
- [ ] A note detail page badge reads "Notebook".
