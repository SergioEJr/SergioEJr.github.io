# Footnotes + References for blog posts — design

## Problem

Blog posts currently have one pool of end-of-article notes: GFM `[^1]`
footnotes, whose auto-generated "Footnotes" heading is relabeled via CSS to
read "References" (`BlogPost.astro`, `.prose :global(#footnote-label)`). No
post actually uses this today — the one post with a margin aside
(`physics-entropy-equation.mdx`) uses `<SideNote>` instead, and there is no
citation/bibliography mechanism in blog posts at all (unrelated to the
Research page's bibtex, which is a different, already-working system for a
different content type).

The user wants two *actually separate* systems:

- **Footnotes** — asides, numbered, must support inline KaTeX math.
- **References** — bibliography-style citations, numbered `[n]`, distinct
  from footnotes at the source level (not just a relabel).

Both render at the end of the article, Footnotes then References, and
neither may appear in the Table of Contents.

## Footnotes

Authoring is unchanged — standard GFM syntax, already supported by Astro's
default markdown pipeline:

```md
Some claim.[^1]

[^1]: The aside text, math included: $E = mc^2$.
```

Verified empirically (not assumed): `remark-math`/`rehype-katex` run in the
same pass as GFM footnote parsing, so `$...$` inside a `[^1]:` definition
already renders correctly with the existing plugin config — zero plugin
changes needed for math support.

In-text marker: superscript, e.g. `text¹` (today's GFM default look, kept
as-is).

## References

New `<Cite>` Astro component, defined at first point of use, free-form
children (matches how footnote definitions already work — full markdown
available, no rigid schema):

```mdx
import Cite from '../../components/Cite.astro';

Kardar's textbook.<Cite id="kardar2007">Kardar, M. *Statistical Physics of
Particles*. Cambridge, 2007.</Cite>

...cited again later.<Cite id="kardar2007" />
```

- The **first** `<Cite id="x">...</Cite>` encountered in reading order
  defines that id's bibliography entry content and claims the next
  available number (first-appearance order, standard academic convention).
- A **later** `<Cite id="x" />` (self-closing, no children) re-references
  the same id — reuses its number, does not redefine its content.
- In-text marker renders as bracketed `[n]`, distinct from a footnote's
  superscript at a glance — a reader can tell which kind of note they're
  clicking without reading the label.

### Numbering mechanism

`<Cite>` is a plain Astro component — at render time it has no visibility
into sibling citations, so it cannot know its own number or collect other
entries into a bibliography. The site already solves an identical problem
for KaTeX equation cross-references (`src/plugins/rehype-eqref.mjs`): number
things in document order *after* rendering, by walking the produced HTML,
because that's the only point where full document order is available.

**Revision (2026-07-20, corrects the original design below): this cannot be
a rehype plugin.** That was the original plan, modeled directly on
`rehype-eqref.mjs`, but it does not work for `<Cite>` and was caught only
after implementing and testing it. Root cause, confirmed with direct
evidence (compiling the actual MDX source and inspecting the tree at
rehype-plugin time): a rehype plugin registered in `astro.config.mjs`'s
`contentPlugins` runs *during MDX compilation*, where `<Cite id="x">...</Cite>`
is still an unexpanded `mdxJsxTextElement` node — a reference to the
component, not its output. `rehype-eqref` works because `rehype-katex` is
*itself* a rehype plugin running in that same compile-time pipeline, so
equations are already real HTML by the time `rehype-eqref`'s turn comes.
`<Cite>` has no equivalent earlier-stage expansion: Astro components only
actually execute and produce HTML later, when Astro renders the page — a
phase no rehype plugin ever sees. (Verified directly: `compile()` with a
diagnostic rehype plugin registered found a `mdxJsxTextElement` node named
`Cite`, never a `cite-ref` element, at the point rehype plugins run.)

**Corrected mechanism:** capture the fully-rendered article body as an HTML
string, using Astro's own documented `Astro.slots.render(slotName)` API
(`html = await Astro.slots.render('default')`, official example in Astro's
own type definitions), transform that string, and re-inject it with
`<Fragment set:html={transformed} />`. This runs the numbering pass *after*
`<Cite>` has actually executed and produced real `<sup class="cite-ref">`
markup — the correct point in the pipeline, verified working end-to-end with
a minimal proof (a wrapper component captured a `<Cite>`'s rendered `[?]`
marker via `Astro.slots.render` and successfully rewrote it before the page
served). This lives in `src/layouts/BlogPost.astro`, which already receives
the rendered post body via `<slot />` (see `[...slug].astro`:
`<BlogPost ...><Content /></BlogPost>`) — the numbering transform wraps that
existing slot capture, it does not add a new render phase.

1. `<Cite>` still renders a stable marker element (e.g.
   `<sup class="cite-ref" data-cite-id="kardar2007">[?]</sup>`, plus, only on
   the defining use, `<span class="cite-def" data-cite-id="kardar2007" hidden>`
   wrapping the rendered definition content) with no numbering logic of its
   own — this part of the original design is unchanged and still correct;
   only *how the marker gets numbered* changes.
2. `BlogPost.astro` captures the rendered slot content as an HTML string via
   `Astro.slots.render('default')`, runs a numbering/relocation transform
   over that string, and injects the transformed string with
   `<Fragment set:html={transformed} />` in place of the original `<slot />`.
   The transform: `hast-util-from-html`'s `fromHtml(str, { fragment: true })`
   parses the string to a hast tree (both `hast-util-from-html` and
   `hast-util-to-html` are already transitive dependencies of the
   rehype/remark toolchain already in this project — no new dependency to
   add), the *same* `unist-util-visit` walk originally written for the
   rehype-plugin approach runs unchanged over that tree (the algorithm was
   never the problem — only which pipeline stage it ran in was), and
   `hast-util-to-html`'s `toHtml(tree)` serializes the result back to a
   string. Verified working end-to-end with a minimal round-trip test
   (`fromHtml` → `visit` rewriting a `cite-ref` marker → `toHtml` produced
   the expected transformed HTML) before writing this revision.
3. The transform: assigns `[n]` by first-appearance per unique
   `data-cite-id`, rewrites every marker's visible text from `[?]` to `[n]`,
   collects each unique id's `cite-def` content, deletes the inline
   `cite-def` spans, and appends a References section (same shape as
   before: eyebrow label, `<ol>` of entries, backlinks) to the end of the
   transformed HTML string.
4. Same error behavior as originally specified: throw at *render* time if an
   id is referenced but never defined, or if two definitions for the same id
   have different content. For a PUBLISHED post this fails `astro build`
   (Astro renders each published page during the static build, so the throw
   aborts the build). KNOWN LIMITATION: draft posts (`draft: true`) are
   excluded from the production build's `getStaticPaths` (via
   `getPublishedPosts`), so they are never rendered during `astro build` —
   a citation error in a *draft* therefore does NOT fail `npm run build`. It
   still surfaces in `npm run dev`/preview (drafts render there) and the
   moment the post is published. This is an accepted limitation: a broken
   draft isn't shipping, and the error is caught before it can.

This lives entirely within normal Astro component rendering — no new Astro
integration, no dev-server-specific code path, no build-only hook. It runs
identically in `npm run dev`, `npm run build`, and `npm run preview`, which
was a deciding factor over an `astro:build:done`-based alternative (ruled
out: static builds are prod-only, so that hook has no dev-time equivalent
without also writing Vite dev-middleware — meaningfully more moving parts
for the same result, and no working reference of that pattern exists
anywhere in this codebase to model it on, unlike this slot-capture approach
which is directly demonstrated in Astro's own public API docs).

The transform is no longer a *rehype* plugin (it's never registered in
`astro.config.mjs`'s `contentPlugins`) — it becomes a plain
`(html: string) => string` function, called directly from `BlogPost.astro`.
It lives at `src/utils/numberCitations.ts` (`src/utils/` already holds
render-time helpers like `inlineText.ts` and `posts.ts` — this is the same
kind of unit: a pure function BlogPost.astro calls, not a build-pipeline
plugin, so `src/plugins/` — which otherwise holds only actual rehype/remark
plugins registered in `astro.config.mjs` — is the wrong home for it).

## Placement + TOC exclusion

Both sections render at the end of the article in fixed order: **Footnotes**
first, **References** second. Each gets a small eyebrow-style label
("Footnotes" / "References") using the *same* quiet, muted styling
`BlogPost.astro` already has for the current single "References" block —
identical visual treatment for both sections, distinguished only by their
label text and marker style (superscript vs. bracketed) established above.

Neither section's label may appear in the TOC. The two sections get there
differently, because of how each is built:

- **References** is entirely our own markup (built by the numbering
  transform, `src/utils/numberCitations.ts`), so its "References" label is
  simply never a heading element — a styled
  `<div>`/`<p>` with the eyebrow styling. The TOC only collects real heading
  nodes from the MDX AST (`headings` prop), so a non-heading label is
  automatically invisible to it. No filter needed.
- **Footnotes** is GFM's own output: `remark-gfm` always emits a real
  `<h2 id="footnote-label">Footnotes</h2>`, and `BlogPost.astro` already
  neutralizes its visible text today (`font-size: 0` + `::after { content:
  "Footnotes" }` restyled as the eyebrow label) — that part is unchanged.
  What *does* change: `TableOfContents.astro` currently filters this heading
  out AND relabels its TOC text to "References" (`heading.slug ===
  'footnote-label' ? {...heading, text: 'References'} : heading`), because
  today's single section is misleadingly titled "References" in the CSS.
  Since Footnotes is now genuinely just footnotes, that relabel is wrong and
  gets deleted — the fix simplifies to an unconditional exclude:
  `.filter((h) => h.depth > 1 && h.depth < 4 && h.slug !== 'footnote-label')`.

Both sections render with the same quiet, muted visual styling (eyebrow
label, numbered list, backlink arrows) that `BlogPost.astro` already applies
to the current single block — distinguished only by label text and the
in-text marker style (superscript vs. bracketed) established above.

## Files touched

- `src/components/Cite.astro` — new. Renders the stable marker element
  described above; no numbering logic. (Unaffected by the numbering-
  mechanism revision above — its render contract was already correct.)
- `src/utils/numberCitations.ts` — new. A plain string-in/string-out HTML
  transform function (`(html: string) => string`), no longer a rehype
  plugin, no longer registered in `astro.config.mjs`.
- `src/layouts/BlogPost.astro` — calls `Astro.slots.render('default')`,
  passes the result through the numbering transform, renders it with
  `<Fragment set:html={...} />` in place of the existing `<slot />`; also
  styles the new References section (mirrors existing `.footnotes` styling)
  and adjusts the Footnotes section styling only if needed for the
  bracketed-vs-superscript distinction (the bracket style lives on
  `<Cite>`'s marker/transform output, not the CSS).
- `src/components/TableOfContents.astro` — change the footnote-heading
  handling from "exclude and relabel to References" to a plain exclude (drop
  the relabel entirely, since Footnotes is no longer mislabeled). No
  References-specific change needed there, since References never produces
  a real heading in the first place.
- `astro.config.mjs` — **no change** (superseded: the original design's
  "register rehypeCite after rehypeKatex" step is removed along with the
  rehype-plugin approach).

## Out of scope

- No change to the Research page's bibtex/publications system — unrelated.
- No automatic citation-style formatting (APA/MLA/etc.) — `<Cite>` children
  are free-form markdown, formatting is on the author.
- No cross-post shared bibliography — each post's References are local to
  that post, consistent with how footnotes already work.
