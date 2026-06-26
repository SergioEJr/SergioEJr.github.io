# CLAUDE.md

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

## Conventions & non-obvious facts

- Commit only when asked; don't push
  unless asked.
- **Dark mode** = `data-theme="dark"` on `<html>`; colors are CSS vars
  (`--color-*`) in `src/styles/global.css`.
- **`position: sticky` + horizontal overflow don't mix.** A sticky-navbar
  failure almost always means something overflows horizontally. Fix with
  `overflow-x: clip` (NOT `hidden`/`auto`, which create a scroll container and
  break sticky).
- **Dev HMR can serve stale inlined CSS** on client-side (ClientRouter)
  navigation — a style looks wrong on nav but right after a hard refresh. This is
  dev-only; verify CSS changes on `npm run preview` before trusting them.
- The MDX VS Code language server is **disabled** (`mdx.server.enable: false`)
  because it false-flags KaTeX braces. See README "Editor notes".

## Content collections (`src/content.config.ts`)

- **blog** (`src/content/blog/`, `.md`/`.mdx`) — Journal posts. Key fields:
  `category` (news/math/physics/notes), `draft` (excludes from everything),
  `externalUrl`/`linkTo`/`noLink` (pointer/update posts with no detail page),
  `heroImage` (off by default; lives in `src/assets/blog/`).
- **projects** (`src/content/projects/`) — `categories` (Technical/Teaching),
  `image` (card thumbnail in `public/projects/`, gets pill overlay),
  `articleImage` (in-article, no overlay), `order` (optional manual override;
  default sort is reverse-chronological).
- **research** (`src/content/research/`) — `abstract` (inline dropdown, supports
  LaTeX), `paper`/`poster`/`code` (button links), `bibtex` (inline dropdown).
  Sorted reverse-chronological; **no `order` field**.

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
- **`src/utils/posts.ts`** — `getPublishedPosts()` (filters drafts in prod, keeps
  them in dev). Use instead of `getCollection('blog')` for anything user-facing.
- **`src/utils/categories.ts`** — shared category colors (Journal + Projects + OG).
- **`src/components/SideNote.astro`** — margin notes (`.mdx` only); inline math
  works, display math doesn't (MDX limitation).
- **`src/components/Figure.astro`** — diagrams that adapt to light/dark
  (adaptive `currentColor` SVG, light/dark image pair, or single-image card).

## Math in MDX

`remark-math`/`rehype-katex` are registered on **both** the Markdown processor
and the `mdx()` integration (`astro.config.mjs`), so commas in braces like
`$2^{10,000}$` build correctly. `mdx.config.mjs` mirrors this for tooling.

## Visual verification

Use the **`visual-check` skill** (`.claude/skills/visual-check/`) to screenshot
the dev server with Playwright instead of guessing at CSS. It reuses a running
dev server (never `pkill` astro), measures exact positions, and notes the
dev-vs-preview CSS gotcha. Helper: `scripts/shot.mjs`.
