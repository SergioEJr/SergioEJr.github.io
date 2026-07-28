# AGENTS.md

Guidance for working in this repo. The site is a personal portfolio (research,
projects, blog/"Journal") built with **Astro** on the Astro Scholar theme,
deployed to GitHub Pages via Actions on push to `main`.

## Commands

```sh
npm run dev      # dev server (HMR) — usually http://localhost:4321
npm run build    # production build to ./dist (also runs Pagefind search index)
npm run preview  # serve the production build
```

Always finish a change with `npm run build` and confirm it's clean.

**A clean build is not the CI gate.** `.github/workflows/ci.yml` runs on every
push to a non-`main` branch and also checks types and formatting, neither of
which `astro build` does — a green local build can still fail CI on a stray
line break. Run all three before pushing:

```sh
npm run build         # + Pagefind index
npm run check         # astro check (types)
npm run format:check  # prettier --check .
```

## Conventions & non-obvious facts

- Commit only when asked; don't push
  unless asked.
- **Dark mode** = `data-theme="dark"` on `<html>`; colors are CSS vars
  (`--color-*`) in `src/styles/global.css`.
- **`position: sticky` + horizontal overflow don't mix.** A sticky-navbar
  failure almost always means something overflows horizontally. Fix with
  `overflow-x: clip` (NOT `hidden`/`auto`, which create a scroll container and
  break sticky) — but put the clip on `<html>`/`<body>` ONLY. An overflow clip
  on any other ancestor of a sticky element demotes iOS sticky positioning to
  the main thread: the element visibly jitters against the composited scroll,
  worst while the URL bar animates (root cause of the 2026-07 mobile hero
  jitter).
- **Dev HMR can serve stale inlined CSS** on client-side (ClientRouter)
  navigation — a style looks wrong on nav but right after a hard refresh. This is
  dev-only; verify CSS changes on `npm run preview` before trusting them.
- The MDX VS Code language server is **disabled** (`mdx.server.enable: false`)
  because it false-flags KaTeX braces. See README "Editor notes".

## Content collections (`src/content.config.ts`)

- **blog** (`src/content/blog/`, `.md`/`.mdx`) — Journal posts. Key fields:
  `category` (`updates`/`essays`/`notebook` — the reader's *register*, not the
  subject), `topic` (groups Notebook posts: Math, Physics, Git, …), `subject`
  (`Science`/`Math`/`Ideas` — Essays dot/underline color), `draft` (excludes
  from everything), `externalUrl`/`linkTo`/`noLink` (pointer/update posts with
  no detail page — link resolution + the has-detail-page rule live in
  `postLink()`/`postHasDetailPage()` in `posts.ts`), `heroImage` (off by
  default; lives in `src/assets/blog/`), `tags` (**keywords, not routes** — see
  below).
- **projects** (`src/content/projects/`) — `categories` (Technical/Teaching),
  `image` (card thumbnail in `public/projects/`, gets pill overlay),
  `articleImage` (in-article, no overlay), `order` (optional manual override;
  default sort is reverse-chronological).
- **research** (`src/content/research/`) — `abstract` (inline dropdown, supports
  LaTeX), `paper`/`poster`/`code` (button links), `bibtex` (inline dropdown).
  Sorted reverse-chronological; **no `order` field**.

## Tags = keywords (and the Pagefind rules that shape them)

Blog `tags` are **descriptors, not routes**. There are no `/tags/<tag>` pages —
they were deleted because 16 of 20 tags sat on exactly one post, so every one
was a dead end. Tags now do the two jobs they're actually good at: saying what a
piece covers before the reader commits, and carrying **search terms the prose
never spells out** ("thermodynamics" appears zero times in the body of *Why does
ice melt?*). Clicking one opens the site search prefilled — the result set is
live, so it's a superset of what a tag page could have listed.

Rendered by **`src/components/Keywords.astro`**: in the post-detail footer (all
registers, indexed) and on Notebook rows inside a topic group (`ignore` →
`data-pagefind-ignore`, so the index page doesn't outrank the post for its own
keywords). Essays and Updates rows deliberately show none.

Three Pagefind facts that this markup depends on — **all measured, don't
"simplify" them away**:

1. Pagefind **drops `<button>` subtrees** from the index. The clickable keyword
   is a `<span role="button" tabindex="0">` with hand-wired Enter/Space; a native
   button makes the term invisible to the search it opens.
2. Pagefind **drops `<footer>` elements** wholesale (this is also why the site
   footer's text appears in no page's index). The strip's wrapper is a `<div>`.
3. Pagefind reads the DOM, so **CSS-generated separators create no word
   boundary**. With the `·` coming from `::before`, the strip indexed as one
   run-on token (`Keywordscalculusderivativesvisual proofs`). Real whitespace
   text nodes sit between the terms; `.kw` is flex, so they cost nothing
   visually (whitespace-only anonymous flex items aren't rendered).

Search is **production-only** (`Search.astro` renders a placeholder in DEV), so
keyword clicks are inert under `npm run dev` — verify on `npm run preview`.

**Listings never compete with what they list.** Every aggregate surface carries
`data-pagefind-ignore` on its rows, because each row already exists as its own
indexed page: `.j-views` (`blog/index.astro`), `.home-rows` + `.home-rail-list`
(`index.astro` — there are two kinds of list on the home page, don't fix one and
miss the other), `.publication-list`, `.projects-grid`. Before this, one search
for "calculus" returned the note plus `/blog/` twice (Pagefind sub-results split
it across the Notebook and All views) plus `/` — four hits for one piece of
writing. Each page still indexes its own headings and prose, so `/` is still
findable by its bio copy. **When you add a new listing, ignore its rows.**

Pagefind walks **every** `.html` in `dist`, including pages that are not
destinations — `404.astro` carries `data-pagefind-ignore` on its `<body>` to
stay out of the index entirely (20 pages indexed, not 21).

Still open: the navbar is indexed on all 20 pages, so "Journal"/"Research"/
"Projects" each return everything. One `data-pagefind-ignore` on the `<nav>` in
`Header.astro` would fix it, at the cost of those words no longer finding the
listing pages at all.

## Authoring helpers (use these; don't reinvent)

- **`src/utils/inlineText.ts`** — formatting for frontmatter strings (titles,
  abstracts) that bypass the Markdown pipeline:
  - `renderInline(s, { strike?, math? })` → safe HTML (use with `set:html`).
    `~~text~~` → strikethrough (on by default); `$..$` → inline KaTeX when
    `math: true` (inline only — display `$$..$$` is intentionally unsupported in
    these contexts).
  - `stripInline(s)` → plain text for metadata (`<title>`, OG image, RSS).
  - `escapeHtml(s)`.
    KaTeX CSS is loaded globally in `BaseHead.astro`, so math works on any page.
- **`src/utils/posts.ts`** — `getPublishedPosts()` / `getPublishedProjects()` /
  `getPublishedResearch()` (filter drafts in prod, keep them in dev). Use instead
  of `getCollection(...)` for anything user-facing. Also `postLink(post)` and
  `postHasDetailPage(post)` — the single source of truth for where a Journal post
  links and whether it has a generated detail page.
- **`src/utils/categories.ts`** — canonical Project category colors + labels for
  the Projects page and OG image route. (Journal register/subject colors are CSS
  vars in `global.css` — `--cat-*` / `--subj-*` — not this file.)
- **`src/components/SideNote.astro`** — margin notes (`.mdx` only); inline math
  works, display math doesn't (MDX limitation).
- **`src/components/Figure.astro`** — diagrams that adapt to light/dark
  (adaptive `currentColor` SVG, light/dark image pair, or single-image card).
- **`DESIGN.md`** (repo root) — light/dark color palette and theme-aware SVG
  rules. Read it before generating any diagram, chart, or `.svg`.

## Math in MDX

`remark-math`/`rehype-katex` are registered on **both** the Markdown processor
and the `mdx()` integration (`astro.config.mjs`), so commas in braces like
`$2^{10,000}$` build correctly. `mdx.config.mjs` mirrors this for tooling.

## Visual verification

Use the **`visual-check` skill** (`.claude/skills/visual-check/`) to screenshot
the dev server with Playwright instead of guessing at CSS. It reuses a running
dev server (never `pkill` astro), measures exact positions, and notes the
dev-vs-preview CSS gotcha. Helper: `scripts/shot.mjs`.
