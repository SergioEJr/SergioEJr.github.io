// Bibliography-style references for blog posts, authored via <Cite> (see
// src/components/Cite.astro).
//
// <Cite> cannot number itself or assemble a References list — at Astro
// render time it has no visibility into sibling <Cite> uses. So (the same
// division of labor as rehype-eqref.mjs for KaTeX equation numbers) this
// plugin numbers everything AFTER render, by walking the produced HTML tree
// in document order — the only point where full document order exists.
//
// Authoring contract (Cite.astro's render contract, which this plugin
// depends on):
//   defining use   <Cite id="x">content</Cite>
//     → <sup class="cite-ref" data-cite-id="x">[?]</sup>
//       <span class="cite-def" data-cite-id="x" hidden>content</span>
//   re-reference    <Cite id="x" />
//     → <sup class="cite-ref" data-cite-id="x">[?]</sup>   (no cite-def)
//
// This plugin numbers every cite-ref by FIRST-APPEARANCE order of its id,
// rewrites [?] to [n], deletes each cite-def span from its inline position,
// and relocates its content into a References <section> appended as the
// LAST child of the document root — after everything else, including GFM's
// own footnotes section, so References always renders after Footnotes
// regardless of where in the source the <Cite> calls appear.
//
// Must run AFTER rehype-katex: a <Cite> definition may contain KaTeX math,
// and this plugin relocates that definition's already-rendered HTML — if it
// ran before rehype-katex, it would relocate raw unrendered math nodes
// instead.

import { visit } from "unist-util-visit";

const hasClass = (node, name) => {
  const cls = node.properties?.className;
  return Array.isArray(cls) ? cls.includes(name) : cls === name;
};

// Structural-equality helper for comparing two hast children arrays while
// ignoring `position` (source line/column/offset) — the only field that
// legitimately differs between two occurrences of identical content parsed
// from different points in the source.
const stringifyWithoutPosition = (value) =>
  JSON.stringify(value, (key, val) => (key === "position" ? undefined : val));

export default function rehypeCite() {
  return (tree) => {
    const numberOf = new Map(); // cite id -> reference number
    const definitionOf = new Map(); // cite id -> hast children (the entry body)
    const occurrenceCount = new Map(); // cite id -> how many markers seen so far
    let n = 0;

    // Pass 1: number markers in document order, collect + validate definitions.
    visit(tree, "element", (node, index, parent) => {
      if (hasClass(node, "cite-ref")) {
        const id = node.properties?.dataCiteId;
        if (typeof id !== "string") return;

        if (!numberOf.has(id)) {
          n += 1;
          numberOf.set(id, n);
        }
        const num = numberOf.get(id);

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
        // `position` (line/column/offset in the source) differs between two
        // occurrences of otherwise-identical content, so it must be dropped
        // before comparing — otherwise two <Cite id="x">...</Cite> uses with
        // the exact same children would spuriously look "different" just
        // because they appear at different points in the source file.
        if (existing && stringifyWithoutPosition(existing) !== stringifyWithoutPosition(incoming)) {
          throw new Error(
            `Cite id="${id}" defined twice with different content`,
          );
        }
        if (!existing) definitionOf.set(id, incoming);

        // Remove the now-relocated definition span from its inline position.
        parent.children.splice(index, 1);
        return index; // re-visit this index (it now holds the next sibling)
      }
    });

    if (numberOf.size === 0) return;

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
            children: definitionOf.get(id),
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

    tree.children.push(section);
  };
}
