# Footnotes + References Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split blog posts' single "References"-labeled footnote pool into
two real, independently-authored systems — GFM `[^1]` Footnotes (unchanged,
already supports KaTeX math) and a new `<Cite>`-based References system
(bracketed `[n]` markers, numbered by a render-time HTML-string transform) —
both rendering at the end of the article (Footnotes, then References),
neither appearing in the Table of Contents.

> **ARCHITECTURE REVISION (2026-07-20).** Tasks 1 and 6 are unchanged from
> the original plan. Tasks 2–5 were rewritten after the original
> rehype-plugin approach was implemented (Task 2/3), tested, and found not
> to work: a rehype plugin registered in `astro.config.mjs` runs during MDX
> *compilation*, where `<Cite>` is still an unexpanded `mdxJsxTextElement`
> node, not the `<sup class="cite-ref">` HTML it renders to — Astro
> components only execute later, at page render. See the revised
> "Numbering mechanism" section of
> `docs/superpowers/specs/2026-07-20-footnotes-references-design.md` for the
> full root-cause writeup. The corrected approach captures the rendered
> article body as an HTML string via Astro's own `Astro.slots.render`, runs
> the (unchanged) numbering algorithm over that string using
> `hast-util-from-html` → `unist-util-visit` → `hast-util-to-html`, and
> re-injects it — all within normal Astro rendering, no rehype plugin, no
> `astro.config.mjs` change. The original Task 2 commit (097211f, the rehype
> plugin) and Task 3 commit (registering it) have been reverted/superseded;
> Task 2's numbering *algorithm* is reused verbatim, only its wrapper shape
> and file location change.

**Architecture:** `<Cite id="x">definition</Cite>` renders an in-text marker
(`<sup class="cite-ref">`) plus, only when it has children, an inline hidden
definition wrapper (`<span class="cite-def" hidden>`) right after it — always
in the DOM (never conditionally omitted). `BlogPost.astro` captures the
fully-rendered post body as an HTML string via `Astro.slots.render('default')`
— the point at which `<Cite>` has actually executed to real HTML — passes it
through a pure `numberCitations(html) → html` transform (parse with
`hast-util-from-html`, walk with `unist-util-visit` to number markers by
first-appearance per id and relocate each definition's children into a
References list at the end, serialize back with `hast-util-to-html`), and
renders the result with `<Fragment set:html={...} />` in place of `<slot />`.

**Tech Stack:** Astro components (`.astro`), `Astro.slots.render` (Astro's
documented slot-to-string API), a `unist-util-visit`-based pure TS function
(`hast-util-from-html`/`hast-util-to-html` — both already transitive
dependencies, confirmed resolvable during planning). No new npm dependency,
no `astro.config.mjs` change.

## Global Constraints

- Footnotes keep their existing GFM `[^1]` / `[^1]: ...` authoring — no
  syntax change, no plugin change for footnotes themselves. Math inside a
  footnote definition already renders (verified empirically during
  brainstorming: `remark-math`/`rehype-katex` run in the same pass as GFM
  footnote parsing).
- References are authored via a new `<Cite id="...">...</Cite>` /
  `<Cite id="..." />` component: free-form markdown/JSX children on the
  first (defining) use, self-closing re-reference on later uses. No props
  beyond `id`.
- Reference numbers are assigned by first-appearance order in the rendered
  document (not by where the defining `<Cite>` happens to sit relative to
  other definitions).
- In-text markers: footnotes stay superscript (GFM default, unchanged).
  References render bracketed, e.g. `[1]`.
- End-of-article order is fixed: Footnotes section first, References section
  second. Both use the same quiet/muted eyebrow-label + numbered-list visual
  style already in `BlogPost.astro`.
- Neither section may appear in the Table of Contents.
- The numbering transform runs at Astro render time inside `BlogPost.astro`
  (NOT as a rehype plugin — see the Architecture Revision above). Because the
  site builds statically (`astro build` renders every page), a thrown error
  in the transform still fails the build.
- Build must fail loudly (not silently drop or dedupe) if a `<Cite id="x" />`
  self-closing reference is used but `id="x"` was never defined anywhere in
  the document, or if two *different* `<Cite id="x">...</Cite>` definitions
  give conflicting content for the same id.

---

## File Structure

- **Create** `src/components/Cite.astro` — renders the in-text marker +
  (conditionally) the hidden definition wrapper. No numbering logic; it has
  no visibility into sibling `<Cite>` uses. **(Task 1 — already implemented,
  reviewed, and committed as 7d3938c; unchanged by this revision.)**
- **Create** `src/utils/numberCitations.ts` — the render-time numbering +
  relocation transform: a pure `(html: string) => string` function. Reuses
  the exact `unist-util-visit` walk from the original (reverted)
  `src/plugins/rehype-cite.mjs`, wrapped in `fromHtml`/`toHtml` so it
  operates on an HTML string instead of being a rehype plugin.
- **Modify** `src/layouts/BlogPost.astro` — capture the rendered slot via
  `Astro.slots.render('default')`, pass through `numberCitations`, render
  with `<Fragment set:html={...} />`; retitle the existing `.footnotes` CSS
  block's `::after` content from "References" back to "Footnotes" (retiring
  the relabel-hack it currently does); add a parallel styled block for the
  new References section the transform emits.
- **Modify** `src/components/TableOfContents.astro` — replace the
  filter-and-relabel of `footnote-label` with a plain filter (exclude,
  don't relabel).
- **Delete** `src/plugins/rehype-cite.mjs` — the reverted rehype-plugin file
  (its algorithm moves into `src/utils/numberCitations.ts`). NOTE: the file
  may still be on disk as leftover reference material from the original
  Task 2 commit; Task 2 (rewritten) is responsible for removing it once its
  logic has been ported.
- **`astro.config.mjs`** — NO change (the original plan's Task 3, registering
  the rehype plugin, is dropped entirely).
- **Test posts**: use `src/content/blog/_scratch-cite-footnote-test.mdx` (a
  dedicated throwaway `draft: true` post the controller created — NOT
  `note-symmetries.mdx`, which has the repo owner's uncommitted in-progress
  prose and must not be touched by any implementer).

---

### Task 1: `<Cite>` component

> **STATUS: DONE** (committed 7d3938c, reviewed clean). Left in the plan as a
> record. The component's render contract below is still 100% correct under
> the revised architecture — only *who consumes its output* changed (the
> render-time `numberCitations` transform, not a rehype plugin). The
> committed file's header comments still say "rehype-cite.mjs / build time";
> Task 2 (rewritten) updates those stale comments as a small side-fix while
> it's editing the surrounding integration. Do NOT re-run this task.

**Files:**
- Create: `src/components/Cite.astro`

**Interfaces:**
- Consumes: nothing (leaf component).
- Produces: rendered HTML consumed by the `numberCitations` transform
  (Task 2) — contract below. (Original brief said "rehype-cite.mjs";
  superseded by the architecture revision, but the HTML contract is
  unchanged.)

**Render contract** (what Task 2 depends on):
- Always renders a `<sup class="cite-ref" data-cite-id={id}>[?]</sup>`
  marker. The `[?]` placeholder text only ever appears if the rehype plugin
  fails to run (i.e. this is a visible "something's wrong" fallback, not
  something a reader should ever see in practice) — the plugin is
  responsible for overwriting it with the real number.
- When the component receives slotted children (`Astro.slots.has("default")`
  is true — i.e. this is a **defining** use), it additionally renders,
  immediately after the marker:
  `<span class="cite-def" data-cite-id={id} hidden><slot /></span>`.
- When there are no slotted children (self-closing `<Cite id="x" />` —
  a **re-reference**), only the marker is rendered; no `cite-def` span.

- [ ] **Step 1: Write the component**

```astro
---
// A bibliography-style citation for blog posts (.mdx). Distinct from GFM
// footnotes ([^1]) — this is for citing sources (papers, books, links),
// numbered [n] by first appearance, collected into a References list at
// the end of the article.
//
//   import Cite from '../../components/Cite.astro';
//
//   Defining use (first time citing this source) — free-form markdown/JSX
//   children become the bibliography entry:
//     Kardar's textbook.<Cite id="kardar2007">Kardar, M. *Statistical
//     Physics of Particles*. Cambridge, 2007.</Cite>
//
//   Re-reference (citing the same source again later) — self-closing, no
//   children, reuses the number and entry from the defining use:
//     ...cited again later.<Cite id="kardar2007" />
//
// This component has no visibility into sibling <Cite> uses, so it cannot
// number itself or assemble the References list — it only renders a stable
// marker (and, on the defining use, a hidden definition span) for
// src/plugins/rehype-cite.mjs to number and relocate at build time. Content
// is ALWAYS rendered into the DOM (never conditionally omitted), the same
// pattern Derivation.astro uses for build-time equation numbering: a
// rehype plugin can only see nodes that exist in the tree.
//
// The visible "[?]" marker text is a fallback that should never survive a
// real build — rehype-cite.mjs overwrites it with the citation's actual
// number. If you see a literal "[?]" on the live site, the plugin didn't
// run or didn't find this id.

interface Props {
  id: string;
}

const { id } = Astro.props;
const hasDefinition = Astro.slots.has("default");
---

<sup class="cite-ref" data-cite-id={id}>[?]</sup>{
  hasDefinition && (
    <span class="cite-def" data-cite-id={id} hidden>
      <slot />
    </span>
  )
}
```

- [ ] **Step 2: Verify it builds with no plugin registered yet**

Add a throwaway line to `src/content/blog/note-symmetries.mdx` (this file is
already `draft: true`, so it never ships) right after its frontmatter
imports:

```mdx
import Cite from '../../components/Cite.astro';
```

and anywhere in the body:

```mdx
A test citation.<Cite id="test1">Some Author, *Some Title*, 2024.</Cite>
```

Run: `npm run build`
Expected: build succeeds (no plugin exists yet, so the raw `[?]` marker and
a hidden `cite-def` span will be in the output HTML — that's expected and
temporary; Task 2 makes the marker show a real number).

Leave these two lines in `note-symmetries.mdx` for now — Task 3 adds more to
this same file for full end-to-end verification.

- [ ] **Step 3: Commit**

```bash
git add src/components/Cite.astro src/content/blog/note-symmetries.mdx
git commit -m "Add Cite component for bibliography-style references"
```

---

### Task 2: `src/utils/numberCitations.ts` (render-time HTML-string transform)

**Files:**
- Create: `src/utils/numberCitations.ts`
- Delete: `src/plugins/rehype-cite.mjs` (leftover from the reverted original
  Task 2 — its algorithm is ported into the new file below; the file itself
  should no longer exist after this task)

**Interfaces:**
- Consumes: an HTML string containing `<sup class="cite-ref" data-cite-id>`
  markers and `<span class="cite-def" data-cite-id hidden>` definition spans
  produced by `Cite.astro` (Task 1). This string comes from
  `Astro.slots.render('default')`, called in `BlogPost.astro` (Task 4) — the
  transform itself does not know or care about Astro; it is a pure
  `numberCitations(html: string): string`.
- Produces: the same HTML string with every `cite-ref` marker's `[?]`
  rewritten to `[n]` (linked to `#cite-n`), every `cite-def` span removed
  from its inline position, and a
  `<section class="cite-references" data-cite-references>` appended at the
  very end. Each entry: `<li id="cite-n"><span class="cite-entry-body">
  {relocated definition children}</span><a class="cite-backref"
  href="#cite-ref-n-1" data-astro-history="replace">↩</a></li>` — `n-1`
  because the backlink always returns to the FIRST in-text occurrence of
  that id.
- Consumed by: `BlogPost.astro` (Task 4), which calls it on the captured
  slot HTML and injects the result with `<Fragment set:html={...} />`.

**Why a string transform, not a rehype plugin** (context an implementer
needs): the original design registered this as a rehype plugin in
`astro.config.mjs`, which failed — rehype runs during MDX *compilation*,
where `<Cite>` is still an unexpanded `mdxJsxTextElement`, so the plugin
never saw any `cite-ref` markers to number. Astro components only render to
real HTML later, at page render. Capturing that rendered HTML as a string
(via `Astro.slots.render`, in Task 4) and transforming *it* is the fix. The
numbering *algorithm* is identical to the reverted plugin — only the wrapper
changes: instead of receiving a hast `tree` from unified, this function
parses an HTML string into a hast tree itself (`hast-util-from-html`), runs
the same `unist-util-visit` walk, and serializes back (`hast-util-to-html`).
Both `hast-util-from-html` and `hast-util-to-html` are already transitive
dependencies (confirmed resolvable during planning: `node -e
"require.resolve('hast-util-from-html')"` and `hast-util-to-html` both
succeed) — do NOT add them to `package.json`; import them directly.

**Numbering + relocation algorithm** (document-order, unchanged from the
reverted rehype plugin — the walk is the part that already passed review):

1. **Pass 1 — find every `cite-ref` marker in document order.** For each
   unique `data-cite-id`, the first time it's seen, assign the next integer
   `n` (starting at 1) and remember `n` for that id. Every marker (first AND
   later re-references) gets an `id="cite-ref-n-k"` where `k` is its own
   occurrence index for that citation id (`1` for the first, `2` for the
   second use of the same id, etc.) — this lets each individual marker be a
   distinct backlink-jump target, even though they all show the same number
   `[n]`. Overwrite each marker's text from `[?]` to `[n]` and wrap it in a
   link to `#cite-n` (the bibliography entry).
2. **Pass 1 (continued) — collect definitions.** When a `cite-def` span is
   found, read its `children` and store them keyed by `data-cite-id`, then
   **delete the `cite-def` span node from its parent's children** (it must
   not remain inline). If an id already has stored definition children and
   the newly found content differs from the stored content, throw an
   `Error` at render time (which fails the static build):
   `` `Cite id="${id}" defined twice with different content` ``. The content
   comparison strips hast `position` metadata before comparing (see the
   `stringifyWithoutPosition` helper in the code below) — WITHOUT this,
   two textually-identical `<Cite id="x">Same text</Cite>` definitions at
   different source positions would carry different `position` line/col/offset
   fields and spuriously compare unequal, throwing on a legitimate identical
   re-definition. (This bug and fix were found and verified during the
   original Task 2 implementation; the fix is retained verbatim.)
3. **Validation pass.** After Pass 1, for every id seen in `numberOf`,
   confirm it has stored definition children. If not — every use of that id
   was a self-closing re-reference and the id was never defined — throw an
   `Error`: `` `Cite id="${id}" is referenced but never defined (no <Cite id="${id}">...</Cite> with content anywhere in this post)` ``.
4. **Pass 2 — build and append the References section.** In first-appearance
   order, build one `<li>` per id, wrap them in `<ol>`, wrap that in the
   `section.cite-references`, and push that section as the last item of
   `tree.children` (the parsed fragment's root children — pushing here means
   appending after everything else in the article body, which for the string
   coming from `Astro.slots.render` includes GFM's `section[data-footnotes]`
   if present, so References always lands after Footnotes).

- [ ] **Step 1: Write the transform**

Note the differences from the reverted rehype plugin, all mechanical: it is
a named export `numberCitations` taking/returning a string (not a default
`rehypeCite` plugin factory); it parses the string with `fromHtml(..., {
fragment: true })` at the top and serializes with `toHtml(...)` at the
bottom; and it carries the `stringifyWithoutPosition` position-stripping
helper for the duplicate-content check. The `visit` walk between those is
identical to what already passed review.

```typescript
// src/utils/numberCitations.ts
//
// Numbers <Cite> bibliography markers and assembles a References list, as a
// render-time transform over the article's already-rendered HTML string.
//
// WHY a string transform and not a rehype plugin: rehype plugins run during
// MDX *compilation*, where <Cite> is still an unexpanded mdxJsxTextElement —
// the markers this needs (<sup class="cite-ref">, <span class="cite-def">)
// don't exist yet, because Astro components only render to real HTML later,
// at page render. So BlogPost.astro captures the rendered body via
// Astro.slots.render('default') and passes that string here, where the
// markers are real. (The original design tried the rehype-plugin route and
// it silently did nothing; see the spec's Numbering-mechanism revision.)
//
// Authoring contract (Cite.astro's render output, which this depends on):
//   defining use   <Cite id="x">content</Cite>
//     → <sup class="cite-ref" data-cite-id="x">[?]</sup>
//       <span class="cite-def" data-cite-id="x" hidden>content</span>
//   re-reference    <Cite id="x" />
//     → <sup class="cite-ref" data-cite-id="x">[?]</sup>   (no cite-def)
//
// Numbers every cite-ref by FIRST-APPEARANCE order of its id, rewrites [?] to
// [n], deletes each cite-def span from its inline position, and appends a
// References <section> as the last child — after GFM's footnotes section
// (also in the captured string), so References always renders after Footnotes.

import { fromHtml } from "hast-util-from-html";
import { toHtml } from "hast-util-to-html";
import { visit } from "unist-util-visit";

const hasClass = (node: any, name: string): boolean => {
  const cls = node.properties?.className;
  return Array.isArray(cls) ? cls.includes(name) : cls === name;
};

// Structural comparison of two hast children arrays that ignores `position`
// (source line/column/offset). Two textually-identical <Cite> definitions at
// different points in the source carry different `position` fields, so a bare
// JSON.stringify would wrongly report identical re-definitions as conflicting.
const stringifyWithoutPosition = (value: unknown): string =>
  JSON.stringify(value, (key, val) => (key === "position" ? undefined : val));

export function numberCitations(html: string): string {
  const tree = fromHtml(html, { fragment: true });

  const numberOf = new Map<string, number>(); // cite id -> reference number
  const definitionOf = new Map<string, any[]>(); // cite id -> hast children
  const occurrenceCount = new Map<string, number>(); // cite id -> markers seen
  let n = 0;

  // Pass 1: number markers in document order, collect + validate definitions.
  visit(tree, "element", (node: any, index: number | null, parent: any) => {
    if (hasClass(node, "cite-ref")) {
      const id = node.properties?.dataCiteId;
      if (typeof id !== "string") return;

      if (!numberOf.has(id)) {
        n += 1;
        numberOf.set(id, n);
      }
      const num = numberOf.get(id)!;

      const occurrence = (occurrenceCount.get(id) || 0) + 1;
      occurrenceCount.set(id, occurrence);

      node.properties.id = `cite-ref-${num}-${occurrence}`;
      node.children = [
        {
          type: "element",
          tagName: "a",
          properties: {
            href: `#cite-${num}`,
            className: ["cite-ref-link"],
            "data-astro-history": "replace",
          },
          children: [{ type: "text", value: `[${num}]` }],
        },
      ];
      return;
    }

    if (hasClass(node, "cite-def")) {
      const id = node.properties?.dataCiteId;
      if (typeof id !== "string" || !parent || index === null) return;

      const existing = definitionOf.get(id);
      const incoming = node.children;
      if (
        existing &&
        stringifyWithoutPosition(existing) !== stringifyWithoutPosition(incoming)
      ) {
        throw new Error(`Cite id="${id}" defined twice with different content`);
      }
      if (!existing) definitionOf.set(id, incoming);

      // Remove the now-relocated definition span from its inline position.
      parent.children.splice(index, 1);
      return index; // re-visit this index (it now holds the next sibling)
    }
  });

  if (numberOf.size === 0) return toHtml(tree);

  // Validation: every referenced id must have a definition somewhere.
  for (const id of numberOf.keys()) {
    if (!definitionOf.has(id)) {
      throw new Error(
        `Cite id="${id}" is referenced but never defined (no <Cite id="${id}">...</Cite> with content anywhere in this post)`,
      );
    }
  }

  // Pass 2: build the References section in first-appearance order.
  const items = [...numberOf.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([id, num]) => ({
      type: "element",
      tagName: "li",
      properties: { id: `cite-${num}` },
      children: [
        {
          type: "element",
          tagName: "span",
          properties: { className: ["cite-entry-body"] },
          children: definitionOf.get(id)!,
        },
        {
          type: "element",
          tagName: "a",
          properties: {
            className: ["cite-backref"],
            href: `#cite-ref-${num}-1`,
            "data-astro-history": "replace",
            "aria-label": `Back to reference ${num}`,
          },
          children: [{ type: "text", value: "↩" }],
        },
      ],
    }));

  const section = {
    type: "element",
    tagName: "section",
    properties: { className: ["cite-references"], "data-cite-references": true },
    children: [
      {
        type: "element",
        tagName: "p",
        properties: { className: ["cite-references-label"] },
        children: [{ type: "text", value: "References" }],
      },
      {
        type: "element",
        tagName: "ol",
        properties: {},
        children: items,
      },
    ],
  };

  (tree as any).children.push(section);
  return toHtml(tree);
}
```

- [ ] **Step 2: Delete the reverted rehype-plugin file**

```bash
rm -f src/plugins/rehype-cite.mjs
```

(It was committed by the original Task 2 and reverted at the config level,
but the file itself may still be on disk. Its algorithm now lives in
`numberCitations.ts`.)

- [ ] **Step 2b: Fix the stale comments in `Cite.astro`**

`src/components/Cite.astro` (built under the old design) has header comments
that reference "rehype-cite.mjs" and "build time". Update those to match the
new mechanism — they're comments only, no behavior change. In
`src/components/Cite.astro`, replace the two comment fragments:

- `for\n// src/plugins/rehype-cite.mjs to number and relocate at build time. Content`
  → `for the\n// numberCitations transform (src/utils/numberCitations.ts) to number and\n// relocate at page-render time. Content`
- `// The visible "[?]" marker text is a fallback that should never survive a\n// real build — rehype-cite.mjs overwrites it with the citation's actual\n// number. If you see a literal "[?]" on the live site, the plugin didn't\n// run or didn't find this id.`
  → `// The visible "[?]" marker text is a fallback that should never survive a\n// real render — numberCitations overwrites it with the citation's actual\n// number. If you see a literal "[?]" on the live site, the transform didn't\n// run or didn't find this id.`

(Also fix the one line reading `// rehype plugin can only see nodes that exist in the tree.` →
`// transform can only see nodes that exist in the rendered HTML.` if
present.) Keep every other line of the file byte-for-byte identical.

- [ ] **Step 3: Test the transform in isolation**

Create a throwaway script that feeds `numberCitations` the HTML string
`Cite.astro` produces (hand-written here, since this unit is pure and does
not run Astro):

```javascript
// scripts/_test-cite.mjs
import { numberCitations } from '../src/utils/numberCitations.ts';

const html = `<p>First citation.<sup class="cite-ref" data-cite-id="a">[?]</sup><span class="cite-def" data-cite-id="a" hidden>Author A, <em>Title A</em>, 2020.</span></p>
<p>Second citation.<sup class="cite-ref" data-cite-id="b">[?]</sup><span class="cite-def" data-cite-id="b" hidden>Author B, 2021.</span></p>
<p>Re-cite the first.<sup class="cite-ref" data-cite-id="a">[?]</sup></p>`;

console.log(numberCitations(html));
```

Run it with a TypeScript-aware runner. This repo builds with Astro/Vite, so
the simplest reliable way to execute a `.ts` file directly is:
`npx tsx scripts/_test-cite.mjs` (tsx is available transitively; if it is
not, fall back to `node --experimental-strip-types scripts/_test-cite.mjs`
on Node ≥ 22, or temporarily rename the import target to a `.mjs` copy for
the test). If none of those run, do NOT skip verification — instead do Step 4
(the real dev-server check) first and treat that as the verification, noting
in your report that the isolated unit test could not be run and why.

Expected output characteristics (verify by reading the printed HTML):
- First marker shows `[1]`, links to `#cite-1`, has `id="cite-ref-1-1"`.
- Second marker shows `[2]`, links to `#cite-2`, has `id="cite-ref-2-1"`.
- Third marker (the re-cite) shows `[1]` (reuses `a`'s number), has
  `id="cite-ref-1-2"`.
- A `<section class="cite-references">` at the very end, `<ol>` with
  `<li id="cite-1">` before `<li id="cite-2">` (first-appearance order).
- No `cite-def` spans remain anywhere outside the References section.

Delete the script when done: `rm scripts/_test-cite.mjs`.

- [ ] **Step 4: Wire it into BlogPost.astro just enough to verify end-to-end**

This is the real integration proof (Task 4 does the full styling; here we
only confirm the transform actually numbers a real rendered `<Cite>`). In
`src/layouts/BlogPost.astro`, find the single `<slot />` that renders the
post body (it is inside the `.prose` container, after the TOC block). Replace
it with a captured-and-transformed render.

Add to the component's frontmatter script (top `---` block), after the
existing imports:

```astro
import { numberCitations } from "../utils/numberCitations";
```

and, at the END of the frontmatter script (after all existing logic, so
`Astro.slots` is available):

```astro
// Capture the rendered post body and number any <Cite> markers in it. <Cite>
// renders real HTML only at this point (page render), which is why numbering
// is a string transform here rather than a rehype plugin — see
// src/utils/numberCitations.ts's header for the full rationale.
const renderedBody = await Astro.slots.render("default");
const numberedBody = numberCitations(renderedBody);
```

Then replace the body `<slot />` with:

```astro
<Fragment set:html={numberedBody} />
```

- [ ] **Step 5: Verify against the real dev server**

There may already be an `astro dev` process running on port 4321 from
earlier work. Config/component changes to `.astro` files ARE picked up by
HMR, but to be safe, find the live port rather than assuming:

```bash
for p in 4321 4322 4323 4324 4325; do
  echo "$p: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:$p/ 2>/dev/null)"
done
```

If none respond, start one: `npm run dev > /tmp/dev.log 2>&1 &` and wait a
few seconds. Then check the scratch post (NOT note-symmetries.mdx):

```bash
curl -s http://localhost:<port>/blog/_scratch-cite-footnote-test/ | grep -o 'cite-ref[^<]*<a[^>]*>\[[0-9?]*\]</a>'
```

Expected: a match showing `[1]` (NOT `[?]`). Also confirm the References
section rendered:

```bash
curl -s http://localhost:<port>/blog/_scratch-cite-footnote-test/ | grep -o 'cite-references'
```

Expected: at least one match. If you still see `[?]`, the transform is not
running — do NOT commit; report BLOCKED with what you observed. (This is the
exact failure the original rehype approach hit, so this check is the whole
point of the task.)

- [ ] **Step 6: Confirm a clean production build**

Run: `npm run build`
Expected: succeeds. (The scratch post is `draft: true`, excluded from
`dist/`, but drafts are still compiled in a production build, so a broken
transform or type error would still fail here.)

- [ ] **Step 7: Commit**

```bash
git add src/utils/numberCitations.ts src/layouts/BlogPost.astro src/components/Cite.astro
git rm src/plugins/rehype-cite.mjs 2>/dev/null || true
git commit -m "Number Cite markers via a render-time HTML-string transform (Astro.slots.render), not a rehype plugin"
```

(`Cite.astro` is included because Step 2b updated its stale comments. Its
render behavior is unchanged from Task 1.)

(Note: this task both creates the transform AND does the minimal
BlogPost.astro wiring, because they cannot be verified independently — the
transform only proves out when actually fed real rendered `<Cite>` HTML.
Task 4 adds the CSS/section styling on top of this working wiring.)

---

### Task 4: Style the References section + retitle Footnotes

**Files:**
- Modify: `src/layouts/BlogPost.astro` (CSS only — the slot-capture wiring
  was already added in Task 2 Step 4; this task does NOT touch the
  frontmatter script or the `<Fragment set:html>` line, only the `<style>`
  block)

**Interfaces:**
- Consumes: `section.cite-references` / `.cite-references-label` /
  `.cite-ref` / `.cite-ref-link` / `.cite-backref` / `.cite-entry-body`
  class names, produced by `numberCitations` (Task 2, via the wiring already
  in `BlogPost.astro`) and `Cite.astro` (Task 1).
- Produces: visual styling matching the spec's "identical style, different
  labels" decision — same quiet/muted eyebrow-label + numbered-list
  treatment as the existing Footnotes styling, applied to both sections.

The current `.footnotes`/`#footnote-label` block in
`src/layouts/BlogPost.astro`'s `<style>` (search for `#footnote-label` —
around line 205 of the file) mislabels GFM's auto "Footnotes" heading as
"References" via a `::after` content override. That relabel is now wrong —
GFM footnotes are genuinely just footnotes — so it flips back to "Footnotes",
and a new parallel block styles the transform-built References section the
same way.

- [ ] **Step 1: Retitle the existing footnotes block**

In `src/layouts/BlogPost.astro`, find:

```astro
      /* Relabel the auto "Footnotes" heading as a "References" eyebrow (hide the
				   literal text via font-size:0, show the ::after label). */
      .prose :global(#footnote-label) {
        font-size: 0;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--color-text-muted);
        margin: 0 0 1rem;
      }
      .prose :global(#footnote-label)::after {
        content: "References";
        font-size: 0.72rem;
      }
```

Replace with:

```astro
      /* Hide the auto "Footnotes" heading's literal text (font-size:0) and show
				   a styled eyebrow label via ::after instead — same technique as before,
				   just no longer mislabeled: this section is genuinely footnotes now
				   that References is its own system (see .cite-references below). */
      .prose :global(#footnote-label) {
        font-size: 0;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--color-text-muted);
        margin: 0 0 1rem;
      }
      .prose :global(#footnote-label)::after {
        content: "Footnotes";
        font-size: 0.72rem;
      }
```

- [ ] **Step 2: Add References section styling**

Immediately after the footnotes block from Step 1 (still inside the same
`<style>` block in `src/layouts/BlogPost.astro`), add:

```astro
      /* References (src/utils/numberCitations.ts / src/components/Cite.astro).
				   Deliberately mirrors the .footnotes styling immediately above —
				   the design calls for identical visual treatment for both
				   end-of-article sections, distinguished only by label text and
				   in-text marker shape (footnote: superscript number; reference:
				   bracketed [n]). Always emitted by numberCitations AFTER the
				   footnotes section (it appends to the end of the captured body
				   string), so it needs no ordering rule here — source order already
				   places it last. */
      .prose :global(.cite-references) {
        margin-top: 2.5rem;
        padding-top: 1.25rem;
        border-top: 1px solid var(--color-border);
        font-size: 0.9rem;
        color: var(--color-text-muted);
      }
      /* Only add the DOUBLE top margin/border-top when a footnotes section
				   also rendered before it — otherwise References alone would carry an
				   oversized gap. Footnotes' own block already supplies one border/gap;
				   this rule fires only when both exist back to back. */
      .prose :global(section[data-footnotes] + .cite-references) {
        margin-top: 3rem;
      }
      .prose :global(.cite-references-label) {
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-size: 0.72rem;
        color: var(--color-text-muted);
        margin: 0 0 1rem;
      }
      .prose :global(.cite-references ol) {
        margin: 0;
        padding-left: 1.4rem;
      }
      .prose :global(.cite-references li) {
        margin: 0.5rem 0;
        line-height: 1.55;
      }
      .prose :global(.cite-entry-body) {
        display: inline;
      }
      .prose :global(.cite-entry-body a) {
        color: var(--color-accent);
        text-decoration: none;
        word-break: break-word;
      }
      .prose :global(.cite-entry-body a:hover) {
        text-decoration: underline;
      }
      .prose :global(.cite-backref) {
        margin-left: 0.35rem;
        text-decoration: none;
        color: var(--color-text-muted);
        opacity: 0.7;
      }
      .prose :global(.cite-backref:hover) {
        opacity: 1;
        color: var(--color-accent);
      }
      /* In-text marker: bracketed [n], distinct from a footnote's bare
				   superscript number at a glance. */
      .prose :global(sup.cite-ref) {
        font-size: 0.7em;
        line-height: 0;
      }
      .prose :global(.cite-ref-link) {
        text-decoration: none;
        font-weight: 600;
        padding: 0 0.1em;
        color: var(--color-accent);
      }
      .prose :global(.cite-ref-link:hover) {
        text-decoration: underline;
      }
```

- [ ] **Step 3: Verify visually**

Find the live dev server port (see Task 2 Step 5 for the probe loop; start
one if none is up). Use the visual-check skill (per AGENTS.md) to screenshot
`http://localhost:<port>/blog/_scratch-cite-footnote-test/` (the scratch
post — NOT note-symmetries.mdx) in both light and dark theme, scrolled to
the bottom of the article. Confirm:
- A "References" eyebrow section renders at the end, containing the scratch
  post's test citation, showing entry `[1]` with the rendered text "Some
  Author, *Some Title*, 2024." and a `↩` backlink.
- The in-text marker reads `[1]` (bracketed), styled via `.cite-ref-link`.
- Clicking the in-text `[1]` marker in the body scrolls down to the
  reference entry; clicking `↩` scrolls back up.
- Both themes render with correct muted/border colors (no unstyled black
  text, no invisible-on-dark issues).
- (No "Footnotes" section appears here — the scratch post has no `[^1]`;
  GFM omits `section[data-footnotes]` entirely when there are zero
  footnotes. Both sections together are verified in Task 6.)

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BlogPost.astro
git commit -m "Style References section; retitle Footnotes label back from the old relabel-hack"
```

---

### Task 5: Fix the Table of Contents filter

**Files:**
- Modify: `src/components/TableOfContents.astro`

**Interfaces:**
- Consumes: `headings` prop (unchanged shape:
  `{ depth: number; slug: string; text: string }[]`).
- Produces: `toc` array used by both the desktop and mobile TOC render
  blocks (unchanged consumers — this task only changes how `toc` is
  computed).

- [ ] **Step 1: Replace the relabel with a plain exclude**

In `src/components/TableOfContents.astro`, find:

```astro
// Filter headings to only include h2 and h3, and relabel the auto-generated GFM
// footnotes heading ("Footnotes", slug "footnote-label") to "References" so the
// TOC matches the styled References section in the post body (see BlogPost.astro).
const toc = headings
  .filter((heading) => heading.depth > 1 && heading.depth < 4)
  .map((heading) =>
    heading.slug === 'footnote-label'
      ? { ...heading, text: 'References' }
      : heading,
  );
```

Replace with:

```astro
// Filter headings to only include h2 and h3, and exclude the auto-generated
// GFM footnotes heading (slug "footnote-label") — Footnotes and References
// are both end-of-article reference material, not navigable article
// sections, so neither belongs in the Table of Contents. References has no
// heading element to begin with (see src/utils/numberCitations.ts), so only
// Footnotes needs an explicit exclude here.
const toc = headings.filter(
  (heading) =>
    heading.depth > 1 && heading.depth < 4 && heading.slug !== 'footnote-label',
);
```

- [ ] **Step 2: Verify**

The scratch post has no `##`/`###` headings that also carry a footnotes
section, so it can't fully exercise this filter alone. Instead, verify with
a `.md`/`.mdx` post in the repo that DOES use GFM `[^1]` footnotes AND has a
TOC — search for one: `grep -rl '\[\^' src/content/blog/` and pick a
published, non-draft result with `toc: true` in its frontmatter (or add a
temporary `[^1]` footnote + `toc` to the scratch post for this check, then
remove it). With the dev server running, visit that post and check the
desktop TOC (right sidebar, ≥1200px viewport) and the mobile TOC (the
collapsible `<details>` at narrower widths). Confirm the TOC shows the
post's real `##`/`###` headings but NOT a "Footnotes" or "References" entry.
If no existing post has both footnotes and a TOC, note that in your report
and rely on Task 6's end-to-end check (which sets up exactly this condition)
for the definitive verification.

- [ ] **Step 3: Commit**

```bash
git add src/components/TableOfContents.astro
git commit -m "TOC: exclude the Footnotes heading instead of relabeling it to References"
```

---

### Task 6: End-to-end verification with both systems together

> **Controller-executed, NOT delegated.** This task is run by the SDD
> controller directly, not a subagent, because it edits the scratch post and
> must be careful never to touch `note-symmetries.mdx` (the repo owner's
> uncommitted in-progress prose). It also verifies error paths that
> deliberately break the build. The scratch post
> (`src/content/blog/_scratch-cite-footnote-test.mdx`) is disposable and
> untracked — nothing here commits it.

**Files:**
- Modify: `src/content/blog/_scratch-cite-footnote-test.mdx` (the dedicated
  throwaway `draft: true` scratch post, untracked; safe to edit freely)

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces: a manually-verified confirmation that Footnotes and References
  coexist correctly in the required order, with the required TOC exclusion,
  in one real post.

- [ ] **Step 1: Build up the scratch post to exercise both systems**

Set the scratch post's body (keep the frontmatter, but give it `toc: true`
so the TOC is exercised, and headings so the TOC has real entries) to:

```mdx
import Cite from '../../components/Cite.astro';

## Section One

A test citation.<Cite id="test1">Some Author, *Some Title*, 2024.</Cite> Here's a footnote too.[^1]

[^1]: A footnote with math: $\nabla \cdot \bs{E} = \rho/\epsilon_0$.

## Section Two

Citing the same source again.<Cite id="test1" />, and a new one.<Cite id="test2">Another Author, *Another Title*, 2023.</Cite>
```

(Add `toc: true` to the frontmatter if not present.)

- [ ] **Step 2: Build and inspect**

Find the live dev server port (probe loop from Task 2 Step 5). Visit
`http://localhost:<port>/blog/_scratch-cite-footnote-test/`. Scroll to the
end of the article and confirm, in this exact top-to-bottom order:

1. A "Footnotes" section, containing one entry with rendered math
   ($\nabla \cdot \bs{E} = \rho/\epsilon_0$ as real KaTeX, not raw LaTeX
   text). (`\bs` is a site-wide KaTeX macro — confirm it renders, since the
   footnote uses it.)
2. Below it, a "References" section, containing exactly TWO entries (not
   three — `test1` cited twice collapses to one entry): `[1]` "Some Author,
   *Some Title*, 2024." and `[2]` "Another Author, *Another Title*, 2023."

In the body text, confirm:
- The first `<Cite id="test1">` marker shows `[1]`.
- The later self-closing `<Cite id="test1" />` also shows `[1]` (same
  number, reused).
- `<Cite id="test2">` shows `[2]`.
- The footnote marker renders as a superscript number (GFM default),
  visually distinct from the bracketed `[n]` citation markers.

Confirm the TOC (desktop sidebar ≥1200px, or mobile dropdown) shows "Section
One" / "Section Two" but NEITHER "Footnotes" nor "References".

- [ ] **Step 3: Verify the build-time error paths work**

Temporarily edit the scratch post to add a self-closing reference to an id
that's never defined:

```mdx
<Cite id="nonexistent" />
```

Run: `npm run build`
Expected: build FAILS with the error message
`Cite id="nonexistent" is referenced but never defined (no <Cite id="nonexistent">...</Cite> with content anywhere in this post)`.
(The scratch post is `draft: true` but drafts are still compiled in a
production build, so the render-time throw still fails the build.)

Remove that line. Then temporarily add a second, differently-worded
definition for an id that's already defined:

```mdx
<Cite id="test1">A completely different citation text.</Cite>
```

Run: `npm run build`
Expected: build FAILS with
`Cite id="test1" defined twice with different content`.

Then confirm the identical-redefinition case does NOT throw (the
position-stripping fix): add a SECOND `<Cite id="test1">Some Author, *Some
Title*, 2024.</Cite>` with content byte-identical to the Step 1 definition.
Run `npm run build` — expected: SUCCEEDS (identical re-definition is allowed;
only differing content throws). Remove that line.

Remove all three temporary lines — restore the scratch post to the Step 1
state.

- [ ] **Step 4: Confirm a clean production build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 5: Clean up the scratch post**

The scratch post was only ever a verification surface — it is untracked and
`draft: true`, so it never shipped. Delete it now that the feature is
verified:

```bash
rm -f src/content/blog/_scratch-cite-footnote-test.mdx
```

(Nothing to commit here — it was never tracked. `note-symmetries.mdx` was
never touched by any task and keeps its pre-existing uncommitted prose. If
the user wants a permanent worked example of `<Cite>`/footnotes in a real
post, that's a separate follow-up, not part of this plan.)

---

## Self-Review Notes (updated for the architecture revision)

**Spec coverage check:**
- Footnotes unchanged, math verified → Task 6 Steps 1–2 confirm math renders
  in a footnote. ✓
- `<Cite>` free-form children, first-appearance numbering → Tasks 1, 2. ✓
- In-text marker distinction (superscript vs bracketed) → Task 4 Step 2
  (`sup.cite-ref` sizing) + `Cite.astro`'s `<sup>` wrapper + the transform's
  `[n]` text. ✓
- Footnotes-then-References order → `numberCitations` pushes the References
  section to the parsed fragment's `children` unconditionally last (Task 2),
  verified in Task 6 Step 2. ✓
- Neither in TOC → Task 5 (Footnotes exclude) + References never produces a
  heading element. ✓
- Build-time errors for undefined/conflicting citations, and the
  identical-redefinition non-error case → `numberCitations` logic (Task 2),
  verified in Task 6 Step 3. ✓
- Same visual style for both sections → Task 4 Step 2 mirrors Step 1's
  existing footnote CSS almost line-for-line. ✓
- Numbering runs at render time, not as a rehype plugin (the whole point of
  the revision) → Task 2's `Astro.slots.render` wiring (Step 4) + the
  string-transform shape of `numberCitations`; verified end-to-end in Task 2
  Step 5 (the marker actually becomes `[1]` on a real page, which the
  original rehype approach failed to do). ✓

**Placeholder scan:** No TBD/TODO markers; every step has literal code or
literal shell commands, not descriptions of code.

**Type consistency:** `Cite.astro`'s `data-cite-id` prop → hast property
`dataCiteId` (hast's standard camelCase normalization of `data-*` attributes,
consistent with how `rehype-footnote-history.mjs` reads `dataFootnoteRef`
off GFM's `data-footnote-ref` attribute — same normalization rule, and the
same `fromHtml` parser produces the same normalization, so the walk that
already passed review reads the property identically after the from-html
parse). Class names (`cite-ref`, `cite-def`, `cite-references`,
`cite-entry-body`, `cite-backref`, `cite-ref-link`, `cite-references-label`)
are used identically across `Cite.astro` (Task 1), `numberCitations.ts`
(Task 2), and the CSS in `BlogPost.astro` (Task 4) — cross-checked
name-by-name. `numberCitations(html: string): string` — the single exported
signature, consumed in Task 4/Task 2-Step-4's `BlogPost.astro` wiring as
`numberCitations(await Astro.slots.render("default"))`.

**Revision consistency:** every remaining reference to "rehype plugin",
"rehype-cite.mjs", "Task 3", or "register in astro.config.mjs" as a
still-to-do action was rewritten. `astro.config.mjs` is explicitly a
no-change file. The old Task 3 is folded away (its number is not reused —
tasks are now 1, 2, 4, 5, 6, with 2 absorbing the old 2+3's intent minus the
plugin registration). Task numbering intentionally skips 3 to keep Task
4/5/6 briefs and any existing ledger references stable.
