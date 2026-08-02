// Equation cross-references for KaTeX math.
//
// KaTeX has no \label/\ref: it renders each formula in isolation and never
// tracks numbers across a document, so LaTeX's cross-reference machinery does
// not exist here. What it DOES have is automatic numbering — an unstarred
// environment (`align`, `equation`) emits <span class="eqn-num">, and
// katex.min.css prints the number from a CSS counter:
//
//   .eqn-num:before { content: "(" counter(katexEqnNo) ")"; counter-increment: katexEqnNo }
//
// The number therefore exists ONLY at render time, in CSS — it is nowhere in the
// HTML for a plugin to read. So this plugin recomputes it: it walks the numbered
// display equations in document order (the same order, and the same skip rules,
// the CSS counter uses) and fills each reference link's text with the count it
// arrived at. The invariant to preserve is that this walk must increment on
// exactly the equations katexEqnNo increments on — i.e. those with an .eqn-num
// span — or numbers and references will silently disagree.
//
// Authoring contract:
//   define    $$\begin{align} \htmlId{eq:foo}{ ... } \end{align}$$
//   reference [](#eq:foo)      → renders as "(2)", linked
//
// \htmlId is used rather than a stray <div id> because it lives INSIDE the math,
// where MDX never sees its braces. A bare \ref{...} in MDX prose is parsed as a
// JSX expression and hard-fails the build with "Unexpected content after
// expression" — that trap is the reason this indirection exists.
//
// Requires rehype-katex to run FIRST (this reads its output) and to be
// configured with `trust: true`, which is what enables \htmlId.

import { visit } from "unist-util-visit";

const hasClass = (node, name) => {
  const cls = node.properties?.className;
  return Array.isArray(cls) ? cls.includes(name) : cls === name;
};

/** Depth-first search for the first descendant matching `test`. */
function find(node, test) {
  let hit = null;
  visit(node, (n) => {
    if (hit) return false;
    if (test(n)) {
      hit = n;
      return false;
    }
  });
  return hit;
}

/** Drop the first descendant matching `test` from its parent. */
function remove(root, test) {
  visit(root, (n) => {
    const i = n.children?.findIndex(test) ?? -1;
    if (i !== -1) {
      n.children.splice(i, 1);
      return false;
    }
  });
}

export default function rehypeEqref() {
  return (tree) => {
    // Pass 1 — walk display-math blocks IN DOCUMENT ORDER, which is the order
    // the CSS counter increments in. Only unstarred environments carry an
    // .eqn-num span, and only those advance katexEqnNo, so numbering here must
    // count exactly those and skip align*/aligned.
    const numberOf = new Map(); // id -> equation number
    const toHoist = []; // { parent, node, n } — consumed by Pass 1b
    let n = 0;

    visit(tree, "element", (node, _index, parent) => {
      if (!hasClass(node, "katex-display")) return;

      const numbered = find(
        node,
        (d) => d.type === "element" && hasClass(d, "eqn-num"),
      );
      if (!numbered) return; // starred env: no number, no counter bump
      n += 1;

      // Bake the visible "(n)" into the .eqn-num span as real text. KaTeX
      // normally prints the number from a CSS counter (katexEqnNo) in an
      // ::before, but a CSS counter does NOT increment inside a display:none
      // subtree — so an equation hidden in a collapsed <Derivation> would fail
      // to advance it and every later equation's visible number would be one
      // too low until the block is expanded. Writing the number here (the same
      // count Pass 2 uses for references) makes it static HTML, correct whether
      // the equation is shown or hidden, and immune to collapse state.
      // global.css suppresses the ::before counter so the two don't double up.
      numbered.children = [{ type: "text", value: `(${n})` }];

      // Queue this equation to have its number lifted OUT of the math (Pass 1b).
      // Recorded rather than done here: rewriting parent.children mid-visit
      // would make `visit` descend into the new wrapper and rediscover this same
      // .katex-display, forever. Pushed BEFORE the `\htmlId` early-return below,
      // so equations that carry no reference id still get hoisted.
      if (parent) toHoist.push({ parent, node, n });

      // The id comes from \htmlId inside the math. KaTeX renders that id on an
      // inner span; hoist it to the display wrapper so the anchor lands on the
      // whole equation (and scroll-margin can clear the sticky navbar).
      const labelled = find(
        node,
        (d) => d.type === "element" && d.properties?.id,
      );
      if (!labelled) return;

      const id = String(labelled.properties.id);
      delete labelled.properties.id;
      node.properties = node.properties || {};
      node.properties.id = id;
      numberOf.set(id, n);
    });

    // Pass 1b — give the number its own column instead of letting it lie on top
    // of the math.
    //
    // KaTeX positions the number ABSOLUTELY (.tag, pinned to the right edge of
    // .katex). .katex is only ever as wide as the COLUMN, so as soon as an
    // equation is wider than its column the number anchors short of where the
    // math ends and prints straight over the symbols — measured 187px inside the
    // equation at 390px viewport. Because it only misbehaves when the equation
    // overflows, it looks fine on desktop and broken on phones.
    //
    // The fix is Wikipedia's: its {{NumBlk}} renders a numbered equation as a
    // row of cells — [equation][spacer][number] — with the label a static <td>
    // that RESERVES width, so it structurally cannot collide. Mirror that here:
    //
    //   <div class="eq-row">
    //     <span class="katex-display">…math…</span>   <- scrolls on its own
    //     <span class="eq-number">(n)</span>          <- own column, never overlaps
    //   </div>
    //
    // Dropping KaTeX's .tag is safe for layout precisely because it was absolute
    // — out of flow, so the math's own centring and metrics are untouched. It
    // also removes a phantom: .tag's sub-pixel right edge used to leave
    // scrollWidth 2px over clientWidth on every numbered equation.
    //
    // The id stays on .katex-display, so #eq:foo anchors, scroll-margin-top and
    // the .eq-flash highlight all still target the equation itself.
    for (const { parent, node, n: num } of toHoist) {
      const i = parent.children.indexOf(node);
      if (i === -1) continue; // someone else moved it; leave well alone
      remove(node, (c) => c.type === "element" && hasClass(c, "tag"));
      parent.children[i] = {
        type: "element",
        tagName: "div",
        properties: { className: ["eq-row"] },
        children: [
          node,
          {
            type: "element",
            tagName: "span",
            properties: { className: ["eq-number"], "aria-hidden": "true" },
            children: [{ type: "text", value: `(${num})` }],
          },
        ],
      };
    }

    if (numberOf.size === 0) return;

    // Pass 2 — turn <a href="#eq:foo"> into a counter-driven reference. The link
    // text is generated by CSS (see global.css .eqref:before), not written here,
    // so it cannot drift from the equation's own number.
    visit(tree, "element", (node) => {
      if (node.tagName !== "a") return;
      const href = node.properties?.href;
      if (typeof href !== "string" || !href.startsWith("#")) return;

      const num = numberOf.get(href.slice(1));
      if (num === undefined) return;

      const cls = node.properties.className;
      node.properties.className = Array.isArray(cls)
        ? [...cls, "eqref"]
        : ["eqref"];
      // Keep equation jumps out of the back/forward stack.
      // A local preventDefault() is NOT enough: ClientRouter runs its own
      // delegated click listener, sees a same-page `#hash` link, and calls
      // pushState via moveToLocation() — so every reference click added a
      // history entry and Back walked through them one by one. ClientRouter
      // reads this attribute (ClientRouter.astro: dataset.astroHistory) and
      // then replaces instead of pushing.
      node.properties["data-astro-history"] = "replace";
      // Empty link text ([](#eq:foo)) → fill in "(2)". An author who wrote their
      // own text ("the frame equation") keeps it. The number is emitted as real
      // text rather than CSS content so it survives copy/paste and CSS-off.
      if (node.children.length === 0) {
        node.children = [{ type: "text", value: `(${num})` }];
      }
    });
  };
}
