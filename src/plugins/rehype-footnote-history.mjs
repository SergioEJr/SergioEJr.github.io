// Keep footnote jumps out of the back/forward history stack.
//
// GFM footnotes render as same-page `#hash` links: an in-body ref
// (a[data-footnote-ref] → #user-content-fn-*) and a ↩ back-link
// (a.data-footnote-backref → #user-content-fnref-*).
//
// BlogPost.astro already intercepts these clicks and uses replaceState so they
// add no history entry. That is necessary but NOT sufficient: once ClientRouter
// is live (i.e. the reader arrived via a client-side navigation, the normal
// path), the router's own delegated click listener also sees the link, treats
// the same-page hash as a navigation, and calls pushState via moveToLocation().
// A local preventDefault() does not stop it, so every footnote hop pushed an
// entry and Back walked through them one at a time (a ref + backref round-trip
// cost two presses to undo).
//
// ClientRouter reads `data-astro-history` off the clicked link
// (see astro/components/ClientRouter.astro: `link.dataset.astroHistory`) and
// replaces instead of pushing. Setting it here — at render time, on both link
// kinds — fixes the router half; BlogPost.astro's handler still supplies the
// smooth centered scroll.
//
// Same reasoning and same attribute as the equation references in
// rehype-eqref.mjs; the two are deliberately parallel.

import { visit } from "unist-util-visit";

const isFootnoteLink = (node) => {
  if (node.tagName !== "a") return false;
  const p = node.properties || {};
  // hast normalizes the bare `data-footnote-ref` attribute to a boolean-ish
  // property, and the backref additionally carries a class of the same name.
  if ("dataFootnoteRef" in p || "dataFootnoteBackref" in p) return true;
  const cls = p.className;
  return Array.isArray(cls) && cls.includes("data-footnote-backref");
};

export default function rehypeFootnoteHistory() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (!isFootnoteLink(node)) return;
      const href = node.properties?.href;
      if (typeof href !== "string" || !href.startsWith("#")) return;
      node.properties["data-astro-history"] = "replace";
    });
  };
}
