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
  visit(
    tree,
    "element",
    (node: any, index: number | undefined, parent: any) => {
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
        if (typeof id !== "string" || !parent || index === undefined) return;

        const existing = definitionOf.get(id);
        const incoming = node.children;
        if (
          existing &&
          stringifyWithoutPosition(existing) !==
            stringifyWithoutPosition(incoming)
        ) {
          throw new Error(
            `Cite id="${id}" defined twice with different content`,
          );
        }
        if (!existing) definitionOf.set(id, incoming);

        // Remove the now-relocated definition span from its inline position.
        parent.children.splice(index, 1);
        return index; // re-visit this index (it now holds the next sibling)
      }
    },
  );

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
    properties: {
      className: ["cite-references"],
      "data-cite-references": true,
    },
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
