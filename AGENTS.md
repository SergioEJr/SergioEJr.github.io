# AGENTS.md

Guidance for working in this repo. The site is a personal portfolio (research,
projects, Journal) built with **Astro** on the Astro Scholar theme,
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
- **Editing a remark/rehype plugin requires RESTARTING the dev server**, and a
  dev server left running while you edit one will actively poison the build.
  Plugins are loaded once at server start, so a running server keeps re-rendering
  with the old module — and it writes those stale renders into
  `.astro/data-store.json`, which is shared, so a *freshly started* second server
  reads the stale entry too and looks equally broken. Symptom: `npm run build`
  is correct while dev shows the raw `> [!callout]` source. Fix: kill every
  `astro dev`, `rm .astro/data-store.json`, restart.
- The MDX VS Code language server is **disabled** (`mdx.server.enable: false`)
  because it false-flags KaTeX braces. See README "Editor notes".

## Big rename, 2026-07-28 — older docs reference paths that no longer exist

Routes, directories and the content collection were renamed so the URL, the
nav label and the collection name all agree. **`docs/superpowers/plans/` and
`docs/superpowers/specs/` still use the old names on purpose** — they are dated
records of work already done, and editing them to match would falsify what the
tree looked like at the time. Read them for *intent*, never for current paths;
about 19 of them mention something below. Same for older git commit messages.

| Old | New |
| --- | --- |
| `/publications/`, `src/pages/publications{.astro,/}` | `/research/`, `src/pages/research{.astro,/}` |
| `/blog/`, `src/pages/blog/` | `/journal/`, `src/pages/journal/` |
| `src/content/blog/` (flat) | `src/content/journal/{essays,notes,updates}/` |
| `src/assets/blog/` (flat: figures + photos + a stray logo) | split by lifecycle into `src/assets/diagrams/` and `src/assets/photos/` |
| collection `blog` (`getCollection`, `CollectionEntry<>`) | `journal` |

Deleted outright — do not try to restore or "fix" references to them:

- `/tags/<tag>` pages and `src/pages/tags/[tag].astro` (see the tags section below)
- `src/components/JournalPost.astro`, the pre-redesign one-size-fits-all row

Post slugs also changed, so `/blog/note-astro/` → `/journal/what-is-astro/`,
`physics-entropy-equation` → `entropy-arrow-of-time`, `physics-why-ice-melts` →
`why-ice-melts`, `note-product-rule` → `product-rule`, `sample-physics` →
`random-walks-sqrt-t`, `essay-i-love-you-bro` → `i-love-you-bro`, and the
`news-` prefixes are gone. Nothing external linked to the old URLs, so there are
deliberately **no redirects**; old paths 404.

Still named for the old scheme, deliberately: `src/layouts/BlogPost.astro` is the
shared article layout for About, Projects, Research *and* Journal, so its name is
a separate misnomer from this rename (its internal classes are `.article-*`).

## Assets: split by lifecycle, not by collection

```
src/assets/diagrams/   generated theme-aware SVGs — 1:1 with figures/*.tex
src/assets/photos/     photographs — hand-managed originals
public/                only what needs a stable URL: favicon, fonts, PDFs
```

The split answers the question you actually ask of an asset: **can I delete
this, and will it come back?**

- **`diagrams/`** is output. `./fig.sh <name>` writes here from
  `figures/<name>.tex`, and `scripts/check-figures.mjs` scans this directory for
  theme-locked hexes. Never hand-edit an SVG here — regenerate it. (Pointing the
  checker at a dedicated folder also stops it theme-checking SVGs that aren't
  figures; it used to scan a stray `logo.svg`.)

  `fig.sh` also emits **`<name>.json`** beside each SVG, carrying the figure's
  `alt` text and default `width`. Both come from the `.tex`:

  ```tex
  % alt: A rectangle of area f·g with two thin strips added along its edges
  %   continuation lines start with a percent and THREE spaces
  % width: 360
  ```

  Alt text describes the DRAWING, not the article — it is the same wherever the
  figure is used, and long enough to wreck the prose if inlined. A `.tex` with
  no `% alt:` line is a **hard error**: shipping an inaccessible figure should
  not be possible by forgetting a line. The continuation marker is explicit
  because alt prose legitimately contains colons and a "next comment line"
  heuristic would truncate on them.

  **`fig.sh` is byte-idempotent, and a sort step is what makes it so.** dvisvgm
  emits a figure's `@font-face` blocks in a varying order between runs, so
  regenerating an unchanged figure used to produce a spurious diff and bury real
  changes in review noise. The final `perl -0777` stage sorts those blocks
  inside the `<![CDATA[...]]>`; they are order-independent (each binds one
  font-family to one woff2 payload), and the `text.f*` rules after them are
  already emitted in index order and left alone. **Don't remove that stage** —
  regenerating any figure will start producing phantom diffs again.
- **`photos/`** is irreplaceable input. **Downscale before committing**: heroes
  render at `width={1020}` with `densities={[1,2]}`, so Astro never emits a
  variant wider than **2040px** and anything above that is discarded at build
  time. 2560px wide is the house default — 25% headroom over the ceiling, and
  measurably indistinguishable from a full-resolution source at the size the
  site actually serves. A 9.4 MB camera export costs visitors nothing and the
  repo everything, permanently.
- **`public/`** bypasses Astro's image pipeline entirely — files there ship at
  exactly the bytes committed. Project cards, About images and author avatars
  still live there (all ≤118 KB, so it isn't urgent); moving them would mean
  changing `image: z.string()` to `image()` in the schema.

## Content collections (`src/content.config.ts`)

- **journal** (`src/content/journal/`, `.md`/`.mdx`) — Journal posts. Key fields:
  `category` (`updates`/`essays`/`notebook` — the reader's *register*, not the
  subject), `topic` (groups Notebook posts: Math, Physics, Git, …), `subject`
  (`Science`/`Math`/`Ideas` — Essays dot/underline color), `draft` (excludes
  from everything), `externalUrl`/`linkTo`/`noLink` (pointer/update posts with
  no detail page — link resolution + the has-detail-page rule live in
  `postLink()`/`postHasDetailPage()` in `posts.ts`), `heroImage` (off by
  default; lives in `src/assets/photos/`), `keywords` (descriptors, not routes —
  see below; the field was called `tags` until 2026-09-03).
- **projects** (`src/content/projects/`) — `categories` (Technical/Teaching),
  `image` (card thumbnail in `public/projects/`, gets pill overlay),
  `articleImage` (in-article, no overlay), `order` (optional manual override;
  default sort is reverse-chronological).
- **research** (`src/content/research/`) — `abstract` (inline dropdown, supports
  LaTeX), `paper`/`poster`/`code` (button links), `bibtex` (inline dropdown).
  Sorted reverse-chronological; **no `order` field**.

## Keywords, not tags (and the Pagefind rules that shape them)

Journal `keywords` are **descriptors, not routes**. There are no `/tags/<tag>`
pages — they were deleted because 16 of 20 sat on exactly one post, so every one
was a dead end. They now do the two jobs they're actually good at: saying what a
piece covers before the reader commits, and carrying **search terms the prose
never spells out** ("thermodynamics" appears zero times in the body of *Why does
ice melt?*). Clicking one opens the site search prefilled — the result set is
live, so it's a superset of what a tag page could have listed.

Rendered by **`src/components/Keywords.astro`**: in the post-detail footer (all
registers, indexed) and on Notebook rows inside a topic group (`ignore` →
`data-pagefind-ignore`, so the index page doesn't outrank the post for its own
keywords). Essays and Updates rows deliberately show none.

**The field is `keywords`, not `tags`, and the name is load-bearing.** Obsidian
treats a frontmatter key named `tags` as a *typed* tag field where spaces are
invalid, so 10 of these — `quantum field theory`, `visual proofs`, `statistical
inference` — rendered red and struck through in the Properties panel, and were
at risk of being rewritten on edit. Hyphenating them would have degraded the
site, where they render as human-readable prose. Renaming the key sidesteps
Obsidian's validation entirely and matches what this section already said they
were. Projects and research still use `tags` (their values have spaces too, so
they show the same warning; they are not authored in Obsidian).

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
indexed page: `.j-views` (`journal/index.astro`), `.home-rows` + `.home-rail-list`
(`index.astro` — there are two kinds of list on the home page, don't fix one and
miss the other), `.publication-list`, `.projects-grid`. Before this, one search
for "calculus" returned the note plus `/journal/` twice (Pagefind sub-results split
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
- **`src/plugins/remark-wikilink.mjs`** — Obsidian-style `[[slug]]` /
  `[[slug|alias]]` links in post bodies, resolved to `/journal/<slug>/`.
  Registered on BOTH pipelines via `contentRemarkPlugins` in `astro.config.mjs`.
  Unresolved targets (never written, or `draft: true`) render as **plain text**,
  not broken links — see the Obsidian section below.
- **`src/plugins/remark-callout-components.mjs`** — compiles Obsidian callouts
  into the site's article components. Runs BEFORE `remark-wikilink` (so it can
  claim the `[[...]]` inside a figure embed) and AFTER `remark-math`. Today it
  handles `[!figure]`; an unrecognised callout type passes through as the
  ordinary blockquote it already is.

## Math in MDX

`remark-math`/`rehype-katex` are registered on **both** the Markdown processor
and the `mdx()` integration (`astro.config.mjs`), so commas in braces like
`$2^{10,000}$` build correctly. `mdx.config.mjs` mirrors this for tooling.

**No KaTeX macros — write standard LaTeX.** `katexMacros` in `astro.config.mjs`
(and its mirror in `inlineText.ts`) is deliberately empty. A `\bs` ->
`\boldsymbol` shorthand lived there until 2026-09-03 and was removed because
post math now has three readers and the macro was invisible to two of them:
Obsidian renders with MathJax and never loads it, and math pasted into Overleaf
carries no preamble. Adding a macro back means also giving Obsidian a matching
MathJax preamble and the figure preamble a matching `\newcommand` — which is
the cost that retired the last one.

## Visual verification

Use the **`visual-check` skill** (`.claude/skills/visual-check/`) to screenshot
the dev server with Playwright instead of guessing at CSS. It reuses a running
dev server (never `pkill` astro), measures exact positions, and notes the
dev-vs-preview CSS gotcha. Helper: `scripts/shot.mjs`.


## Authoring in Obsidian (the vault IS this repo)

The Journal is written in Obsidian, pointed at this repo as its vault, so the
files Obsidian edits are the files Astro builds. There is no sync step and no
second copy — that was considered and rejected (a two-way `.md`/`.mdx` transform
means the file you edit is not the file that ships). `.obsidian/` is gitignored.

**Prefer `.md`; reach for `.mdx` only when a post needs a component.** Obsidian
cannot open `.mdx` at all without a plugin, and a spike on 2026-09-03 measured
what the `registerExtensions(['mdx'],'markdown')` plugins actually buy: the file
becomes *editable*, but Obsidian's metadata cache still ignores it, so `.mdx`
posts are **not** wikilink targets, **not** in full-text search, and **not** in
the graph. Clicking `[[some-mdx-post]]` silently creates a stray empty file
instead of resolving. (The two MDX plugins are also mutually exclusive — both
claim the extension, so you get editing or preview, never both.) Math needs no
`.mdx`: `remark-math` is registered on the Markdown processor too. Six posts are
`.mdx` today because they use `Figure`/`SideNote`/`Derivation`/`Cite`.

**Placeholder notes are the point.** Typing `[[an idea]]` mid-sentence and
clicking it later is the capture gesture this whole setup exists to support, so
prose will routinely reference notes that don't exist yet. Those render as plain
text on the site rather than as visibly-broken "unwritten" links, because the
Journal reads as a finished publication rather than a public garden. A link
starts working on its own the day its target is published.

**Figures are authored as callouts, not components:**

```markdown
> [!figure] Entropy essentially counts the arrows into each bin.
> ![[coin-macrostates.svg|400]]
```

Obsidian renders a callout containing the real diagram (theme-aware for free —
`fig.sh` passes `--currentcolor`); the site emits the same `<figure>` markup
`Figure.astro` produces. `|400` is Obsidian's native image-width syntax, in CSS
pixels, numerically identical to the old `width` prop; omit it to take the
figure's default from its sidecar. Captions go through the normal pipeline, so
`$...$` and `*emphasis*` work — no `renderInline` bypass.

**Converting a component to a callout exposes its contents to the rehype
plugins for the first time.** rehype runs on hast, and an MDX component is an
`mdxJsxTextElement`, so `rehype-math-punctuation`, `rehype-eqref` and friends
walked straight past anything inside `<SideNote>`, `<Figure caption>` or
`<Derivation>`. Compiling those to real elements lets the plugins reach them —
usually right, occasionally not: `.math-punct`'s nowrap is correct in a 760px
column but forbids a needed break in a 266px margin note, which is why
`.sidenote__body .math-punct` overrides it. **Expect one of these per phase**
and check narrow containers after each conversion.

**Link between posts with `[[wikilinks]]`, not site-absolute paths.** A
`[Title](/journal/slug/)` link works on the site but is dead in Obsidian, which
cannot resolve `/journal/...` as a vault path and offers to CREATE a note
instead. `[[slug|Title]]` resolves in both. Emphasis wraps it fine:
`_[[slug|Title]]_`.

**Derivations are `> [!derivation]- Label`**, where Obsidian's fold marker IS
the open/closed state: `-` collapses (the component's `open={false}` default),
bare or `+` stays open. Nesting works — the figure inside one is authored as
`> > [!figure]`. The toggle script lives in `BlogPost.astro`, not the component,
because derivations now come from two places and the handler is delegated and
idempotent; it also defines `window.__openDerivationFor`, which the eqref jump
handlers call to reveal an equation inside a collapsed block.

**Side notes are callouts too**, `> [!aside] label` for the margin-floating kind
and `> [!note] label` for the in-column (`inline`) kind; the title is the label,
defaulting to "Note". One caveat with no fix: `SideNote` renders as `<span>`s so
it could sit INSIDE a paragraph, and a callout is block-level. A note that was
mid-sentence has to be lifted out to a paragraph boundary, which moves where it
floats — check the result at ≥1200px rather than assuming.

The reasoning, and why this is NOT `remark-directive`, is in
`docs/superpowers/specs/2026-09-04-markdown-as-ground-truth-design.md`. Short
version: a callout is a blockquote and degrades gracefully in any renderer;
`:::figure` renders as literal text everywhere that has not opted in, Obsidian
included.

**Not yet done** (deliberate; revisit when revising an `.mdx` post gets
annoying): porting the four components to remark/rehype plugins so every post
can be `.md`. That is a real cost — `.md` cannot invoke Astro components, so
each one must be reimplemented to emit its own HTML, with a permanent tax on
every future component. A generic `> [!callout]` bridge would cover the wrapper
components (`SideNote`, `Derivation`) in one plugin; only `Figure` and `Cite`
do enough real work to need bespoke code.
