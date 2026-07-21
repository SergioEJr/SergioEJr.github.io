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
things in document order *after* rendering, by walking the produced HTML
tree, because that's the only point where full document order is available.

A new rehype plugin, `src/plugins/rehype-cite.mjs`, follows the same
pattern:

1. `<Cite>` renders a stable marker element (e.g.
   `<sup class="cite-ref" data-cite-id="kardar2007" data-cite-def="<rendered HTML of children, if any>">[?]</sup>`)
   with no numbering logic of its own — numbering is entirely the plugin's
   job, same division of labor as `rehype-eqref` + KaTeX's own auto-numbered
   equations.
2. The plugin walks the tree in document order, assigns `[n]` by
   first-appearance per unique `data-cite-id`, and rewrites every marker's
   visible text to its number.
3. It collects each unique id's definition content (from whichever marker
   carried `data-cite-def`) into a References list appended at the end of
   the article, in first-appearance order, each entry linked back to from
   its marker(s) and carrying a backlink to the first in-text occurrence
   (reusing the existing footnote backref visual language/arrow).
4. Build-time error if an id is referenced but never defined with content,
   or if `data-cite-def` differs across two markers with the same id
   (conflicting definitions) — fail loud rather than silently pick one.

This plugin must run in the same `contentPlugins` array as `rehype-eqref`
and `rehypeFootnoteHistory` in `astro.config.mjs`, after `rehype-katex` (so
math inside a `<Cite>` definition, if any, is already-rendered KaTeX by the
time the plugin reads/relocates that HTML).

## Placement + TOC exclusion

Both sections render at the end of the article in fixed order: **Footnotes**
first, **References** second. Each gets a small eyebrow-style label
("Footnotes" / "References") using the *same* quiet, muted styling
`BlogPost.astro` already has for the current single "References" block —
identical visual treatment for both sections, distinguished only by their
label text and marker style (superscript vs. bracketed) established above.

Neither section's label may appear in the TOC. The two sections get there
differently, because of how each is built:

- **References** is entirely our own markup (built by `rehype-cite.mjs`), so
  its "References" label is simply never a heading element — a styled
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

- `src/plugins/rehype-cite.mjs` — new. Numbering + bibliography collection,
  modeled on `rehype-eqref.mjs`.
- `src/components/Cite.astro` — new. Renders the stable marker element
  described above; no numbering logic.
- `astro.config.mjs` — register `rehypeCite` in `contentPlugins`, after
  `rehypeKatex`.
- `src/layouts/BlogPost.astro` — style the new References section
  (mirrors existing `.footnotes` styling); adjust the Footnotes section
  styling only if needed for the bracketed-vs-superscript distinction (the
  bracket style lives on `<Cite>`'s marker/plugin output, not here).
- `src/components/TableOfContents.astro` — change the footnote-heading
  handling from "exclude and relabel to References" to a plain exclude (drop
  the relabel entirely, since Footnotes is no longer mislabeled). No
  References-specific change needed there, since References never produces
  a real heading in the first place.

## Out of scope

- No change to the Research page's bibtex/publications system — unrelated.
- No automatic citation-style formatting (APA/MLA/etc.) — `<Cite>` children
  are free-form markdown, formatting is on the author.
- No cross-post shared bibliography — each post's References are local to
  that post, consistent with how footnotes already work.
