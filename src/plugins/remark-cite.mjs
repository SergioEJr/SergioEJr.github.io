// Pandoc-style citations: `[@key]` to cite, `[@key]: entry` to define.
//
//   Men were affectionate [@ibson] in that era.
//   ...
//   [@ibson]: Ibson, J. (2002). _Picturing Men._ University of Chicago Press.
//
// This emits exactly what Cite.astro emitted -- a `<sup class="cite-ref">`
// marker and a hidden `<span class="cite-def">` -- so src/utils/numberCitations.ts
// numbers them and assembles the References list at page-render time,
// unchanged. See Cite.astro for why the definition is always in the DOM.
//
// WHY `[@key]` AND NOT A COMPONENT: the .md file is the ground truth, and
// `[@key]` is the Pandoc/BibTeX spelling a reader already understands. It
// renders as literal `[@ibson]` in Obsidian rather than vanishing -- which is
// the best available outcome there, since Obsidian has no citation concept of
// its own to borrow.
//
// ENTRIES LIVE AT THE END, not at first use. A definition is block-level, so it
// could not stay mid-sentence where <Cite>'s children used to sit; collecting
// them means the source order matches the rendered order and numberCitations'
// relocation stops being invisible magic.
//
// `[@key]: entry` survives CommonMark intact rather than being eaten as a link
// reference definition, because a definition's destination cannot contain
// spaces -- verified against remark before this was chosen. Separate entries
// with a BLANK LINE so each is its own paragraph; consecutive lines would fold
// into one paragraph and only the first would be seen.

import { visit } from "unist-util-visit";

// `[@some-key]` — the key allows the punctuation BibTeX keys actually use.
const CITE = /\[@([A-Za-z0-9][\w.:+-]*)\]/g;
// A paragraph that OPENS with `[@key]:` is a definition, not a citation.
const DEFINITION = /^\[@([A-Za-z0-9][\w.:+-]*)\]:[ \t]*/;

function marker(id) {
  // `emphasis` is a carrier: data.hName overrides the tag, and mdast-to-hast
  // already knows how to walk its children. The "[?]" text is Cite.astro's
  // fallback — numberCitations overwrites it with the real number, so seeing a
  // literal [?] on the site means the transform did not run.
  return {
    type: "emphasis",
    data: {
      hName: "sup",
      hProperties: { className: ["cite-ref"], dataCiteId: id },
    },
    children: [{ type: "text", value: "[?]" }],
  };
}

export default function remarkCite() {
  return (tree) => {
    // Pass 1: definitions. Done first so the `[@key]:` prefix is consumed here
    // and cannot be mistaken for a citation by pass 2.
    visit(tree, "paragraph", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      const first = node.children?.[0];
      if (first?.type !== "text") return;
      const m = DEFINITION.exec(first.value);
      if (!m) return;
      const children = [...node.children];
      children[0] = { ...first, value: first.value.slice(m[0].length) };
      parent.children.splice(index, 1, {
        type: "paragraph",
        data: {
          hName: "span",
          hProperties: {
            className: ["cite-def"],
            dataCiteId: m[1],
            hidden: true,
          },
        },
        children,
      });
      return index + 1;
    });

    // Pass 2: citations in prose. Only `text` nodes are visited, so `[@key]`
    // inside code spans, fenced code and math is left alone.
    visit(tree, "text", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      if (!node.value.includes("[@")) return;
      const out = [];
      let last = 0;
      let m;
      CITE.lastIndex = 0;
      while ((m = CITE.exec(node.value)) !== null) {
        if (m.index > last) {
          out.push({ type: "text", value: node.value.slice(last, m.index) });
        }
        last = m.index + m[0].length;
        out.push(marker(m[1]));
      }
      if (!out.length) return;
      if (last < node.value.length) {
        out.push({ type: "text", value: node.value.slice(last) });
      }
      parent.children.splice(index, 1, ...out);
      return index + out.length;
    });
  };
}
