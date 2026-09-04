// `\label{eq:foo}` in display math -> the `\htmlId{eq:foo}{}` KaTeX needs.
//
// Equations are labelled with LaTeX's own `\label`, because the same math now
// has three readers and only one of them is KaTeX:
//
//   site      KaTeX  — no \label at all (it THROWS: undefined control sequence),
//                     but it does have the non-standard \htmlId extension
//   Obsidian  MathJax — \label is standard and accepted; \htmlId is not, and
//                     rendered as an error box inside the equation
//   Overleaf  LaTeX  — \label is the whole point; \htmlId means nothing
//
// So the source says `\label` and this plugin translates for KaTeX alone. That
// keeps the authored file correct everywhere and confines the KaTeX-specific
// spelling to the one pipeline that needs it.
//
// `\htmlId{id}{}` with EMPTY content is deliberate and sufficient: it still
// emits `id="..."`, and the equation still gets its `eqn-num`, which is all
// rehype-eqref needs to hoist the id onto the .katex-display and number it.
// (Verified against katex directly; the old form wrapped the equation body for
// no benefit, and its unbalanced-brace variants were a hazard.)
//
// ORDER: after remarkMath, so `$$...$$` is already a math node and a stray
// `\label` in prose is left alone; before rehype-katex, which is a rehype
// plugin and therefore always later.

import { visit } from "unist-util-visit";

const LABEL = /\\label\s*\{([^{}]+)\}/g;

export default function remarkEqLabel() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== "math" && node.type !== "inlineMath") return;
      if (typeof node.value !== "string" || !node.value.includes("\\label")) {
        return;
      }
      const rewritten = node.value.replace(
        LABEL,
        (_m, id) => `\\htmlId{${id.trim()}}{}`,
      );
      node.value = rewritten;
      // remark-math copies the source into data.hChildren, and THAT is what
      // reaches rehype-katex after mdast-to-hast. Updating node.value alone
      // changes nothing.
      //
      // The two math kinds nest it differently, so this must recurse: inline
      // math is hName "code" with the text as a DIRECT child, while display
      // math is hName "pre" with the text one level deeper inside a <code>.
      // Handling only the direct children silently fixed inline math and left
      // every display equation untouched.
      const setText = (nodes) => {
        for (const k of nodes) {
          if (k.type === "text") k.value = rewritten;
          else if (Array.isArray(k.children)) setText(k.children);
        }
      };
      if (Array.isArray(node.data?.hChildren)) setText(node.data.hChildren);
    });
  };
}
