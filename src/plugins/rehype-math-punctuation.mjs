// Keep tight punctuation attached to the inline math it follows.
//
// KaTeX renders inline math as <span class="katex">…<span class="base">…, and
// .base is `display: inline-block`. An inline-block is an ATOMIC INLINE, and CSS
// places a soft-wrap opportunity on either side of one — so "at $t = 0$." may
// break between the math and the period and strand a lone "." on its own line.
// Observed at 390px in notes/symmetry-transformations.mdx; 43 occurrences of
// math-then-punctuation exist across the journal, so this recurs.
//
// `text-align: justify` (BlogPost.astro) is NOT the cause, and left-aligning is
// NOT the cure: measured across 360/390/414/430/500/700px, justify+hyphens and
// left+hyphens strand the period at exactly the same width. Justification only
// distributes leftover space along a line; it does not choose the break point.
// Turning hyphens off happened to avoid it at those widths, but that just
// changes what fits per line — the break opportunity survives, so it is luck.
//
// Fix: wrap [inline math][tight punctuation] in a span that forbids wrapping
// inside itself, removing the opportunity structurally at every width.
//
// Deliberately a wrapper rather than a U+2060 WORD JOINER. Both work (both
// measured at 0 orphans), but the word joiner injects an invisible character
// into the text stream, where Pagefind would index it and readers would
// copy-paste it. This site invests heavily in index hygiene (see AGENTS.md), so
// the markup carries the cost instead of the text.
//
// Must run AFTER rehype-katex — it reads the rendered output.

import { visit } from "unist-util-visit";

const hasClass = (node, name) => {
  const cls = node.properties?.className;
  return Array.isArray(cls) ? cls.includes(name) : cls === name;
};

// Punctuation that must never begin a line by itself. Deliberately excludes
// opening brackets and quotes, which belong with what FOLLOWS them.
const TIGHT = /^[.,;:!?)\]}%‰]+/;

export default function rehypeMathPunctuation() {
  return (tree) => {
    visit(tree, "element", (node) => {
      // Never re-enter a wrapper we just made: its children are exactly the
      // [math, punctuation] pair this plugin looks for, so without this guard
      // the visitor would wrap its own output forever.
      if (hasClass(node, "math-punct")) return;
      // Display math is its own block; punctuation never trails it inline.
      if (hasClass(node, "katex-display")) return;

      const kids = node.children;
      if (!kids || kids.length < 2) return;

      // Walk backwards so the in-place splice below can't disturb indices we
      // have yet to visit.
      for (let i = kids.length - 1; i >= 1; i--) {
        const math = kids[i - 1];
        const text = kids[i];
        if (text.type !== "text") continue;
        if (math.type !== "element" || !hasClass(math, "katex")) continue;

        const hit = TIGHT.exec(text.value);
        if (!hit) continue;

        // Replace the math with [math + punctuation] wrapped, and strip that
        // punctuation off the front of the following text. Length is unchanged.
        kids.splice(i - 1, 1, {
          type: "element",
          tagName: "span",
          properties: { className: ["math-punct"] },
          children: [math, { type: "text", value: hit[0] }],
        });
        text.value = text.value.slice(hit[0].length);
      }
    });
  };
}
