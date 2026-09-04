// Obsidian callouts -> the site's article components.
//
// The Journal is authored as plain .md in Obsidian, and that file is the ground
// truth: the components below are the SITE'S rendering of it, not part of what
// the content means. So the authoring syntax is chosen to be the thing Obsidian
// already renders natively, and this plugin translates it on the way out.
//
//   > [!figure] Entropy essentially counts the arrows into each bin.
//   > ![[coin-macrostates.svg|400]]
//
//   > [!note] recall             -> a note in the reading column
//   > Entropy counts microstates.
//
//   > [!note-margin] recall      -> the same note, floated into the right gutter
//   > Entropy counts microstates.
//
// Generic types are note / tip / warning / danger / example, and ANY of them
// takes a `-margin` suffix. Placement is a modifier rather than part of the
// type name, so a warning can live in the margin without inventing a type for
// it. The `-margin` variants are unknown to Obsidian and fall back to its
// default callout styling there; a vault snippet restores their colour. The
// float is site-only — Obsidian has no gutter.
//
//   > [!example]- Why the Jacobian shows up     -> collapsible, starts collapsed
//   > Let $\Phi$ be a coordinate transformation...
//   >
//   > > [!figure] A nested figure works
//   > > ![[velocity-field-transform.svg]]
//
// COLLAPSIBILITY IS A MODIFIER, exactly as in Obsidian: a bare `[!type]` is
// static, `[!type]+` is collapsible and starts open, `[!type]-` is collapsible
// and starts collapsed. There is no separate collapsible TYPE — same reason
// placement is `-margin` rather than a type name of its own.
//
// Obsidian shows a callout containing the real diagram; the site emits the same
// <figure> markup Figure.astro produces. See
// docs/superpowers/specs/2026-09-04-markdown-as-ground-truth-design.md.
//
// WHY CALLOUTS AND NOT remark-directive: a callout is a blockquote, so it
// degrades gracefully in every renderer, forever. `:::figure{...}` renders as
// literal text anywhere that has not opted into the directive extension --
// Obsidian included, which defeats the entire point. The content is ground
// truth precisely because it must outlive this repo's build.
//
// TWO FREE ALIGNMENTS, not designed:
//   - `|400` is Obsidian's native image-width syntax, in CSS px, numerically
//     identical to the `width` prop this replaces.
//   - `[!type]-` is Obsidian's fold-collapsed marker (used by Derivation later).
//
// An unrecognised callout type is NOT an error -- it passes through as the
// ordinary blockquote it already is.
//
// ORDER: must run AFTER remarkMath (so `$...$` in a caption is already an
// inlineMath node and reaches KaTeX through the normal pipeline, rather than
// the renderInline bypass Figure.astro needed) and BEFORE remarkWikilink
// (which would otherwise eat the `[[...]]` inside the embed).

import fs from "node:fs";
import path from "node:path";
import { visit } from "unist-util-visit";

const DIAGRAMS = path.resolve("src/assets/diagrams");

// `[!type]`, optional Obsidian fold marker, optional title on the same line.
const CALLOUT = /^\[!([a-zA-Z][\w-]*)\]([+-]?)[ \t]*/;
// `![[name.svg]]` or `![[name.svg|420]]`.
const EMBED = /!\[\[([^[\]|]+?)(?:\|([^[\]]*))?\]\]/;

const cache = new Map();

function loadFigure(name, file, node) {
  if (cache.has(name)) return cache.get(name);
  const svgPath = path.join(DIAGRAMS, `${name}.svg`);
  const metaPath = path.join(DIAGRAMS, `${name}.json`);
  if (!fs.existsSync(svgPath)) {
    file.fail(
      `figure "${name}": no such diagram at src/assets/diagrams/${name}.svg. ` +
        `Generate it with ./fig.sh ${name}`,
      node,
    );
  }
  if (!fs.existsSync(metaPath)) {
    file.fail(
      `figure "${name}": missing sidecar src/assets/diagrams/${name}.json. ` +
        `Add a "% alt:" line to figures/${name}.tex and re-run ./fig.sh ${name}`,
      node,
    );
  }
  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch (err) {
    file.fail(
      `figure "${name}": sidecar is not valid JSON (${err.message})`,
      node,
    );
  }
  if (!meta.alt) {
    file.fail(
      `figure "${name}": sidecar has no alt text. Add "% alt:" to figures/${name}.tex`,
      node,
    );
  }
  // Strip an XML prolog if one survived into the raw SVG (Figure.astro did the
  // same); it is invalid inside an inlined document fragment.
  const svg = fs.readFileSync(svgPath, "utf8").replace(/<\?xml[^>]*>\s*/, "");
  const entry = { svg, alt: meta.alt, width: meta.width };
  cache.set(name, entry);
  return entry;
}

// The callout's title line and its body arrive as ONE paragraph whose children
// are split by a literal "\n" inside a text node -- remark-parse does not emit a
// break node here. Cut the inline children at that first newline, keeping the
// caption's math and emphasis nodes intact.
function splitAtFirstNewline(children) {
  const head = [];
  const tail = [];
  let cut = false;
  for (const child of children) {
    if (cut) {
      tail.push(child);
      continue;
    }
    if (child.type === "text" && child.value.includes("\n")) {
      const i = child.value.indexOf("\n");
      const before = child.value.slice(0, i);
      const after = child.value.slice(i + 1);
      if (before) head.push({ ...child, value: before });
      if (after) tail.push({ ...child, value: after });
      cut = true;
    } else {
      head.push(child);
    }
  }
  return [head, tail];
}

function findEmbed(nodes) {
  for (const n of nodes) {
    if (n.type !== "text") continue;
    const m = EMBED.exec(n.value);
    if (m) return m;
  }
  return null;
}

// Chevron and collapse icons for collapsible callouts (from the old Derivation component).
const CHEVRON_ICON =
  '<svg class="callout__chevron" xmlns="http://www.w3.org/2000/svg"' +
  ' width="14" height="14" viewBox="0 0 24 24" fill="none"' +
  ' stroke="currentColor" stroke-width="2.5" stroke-linecap="round"' +
  ' stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6">' +
  "</path></svg>";
const COLLAPSE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13"' +
  ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"' +
  ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="m18 15-6-6-6 6"></path></svg>';

// The content is ALWAYS in the DOM; collapsing only toggles `hidden`. That is
// required so rehype-eqref and KaTeX's counter see equations inside a closed
// block — an inner equation keeps its place in the global numbering and stays
// referenceable from anywhere. Do not "optimise" this into <details>.
//
// The trailing Collapse button is deliberate: a long open block can run past a
// screen, and scrolling back to the header to close it is the annoyance it
// exists to remove.
function collapsible(type, label, bodyNodes, open, id, margin) {
  const className = ["callout", `callout--${type}`, "callout--collapsible"];
  if (margin) className.push("callout--margin");
  return {
    type: "paragraph",
    data: {
      hName: "div",
      hProperties: { className, "data-callout-collapsible": "" },
    },
    children: [
      {
        type: "paragraph",
        data: {
          hName: "button",
          hProperties: {
            type: "button",
            className: ["callout__head", "callout__head--button"],
            "aria-expanded": open ? "true" : "false",
            "aria-controls": id,
          },
          hChildren: [
            { type: "raw", value: CHEVRON_ICON },
            { type: "raw", value: icon(type) },
            {
              type: "element",
              tagName: "span",
              properties: { className: ["callout__label"] },
              children: [{ type: "text", value: label }],
            },
          ],
        },
        children: [],
      },
      {
        type: "paragraph",
        data: {
          hName: "div",
          hProperties: {
            className: ["callout__content"],
            id,
            ...(open ? {} : { hidden: true }),
          },
        },
        children: [
          ...bodyNodes,
          {
            type: "paragraph",
            data: {
              hName: "button",
              hProperties: {
                type: "button",
                className: ["callout__collapse"],
              },
              hChildren: [
                { type: "raw", value: COLLAPSE_ICON },
                {
                  type: "element",
                  tagName: "span",
                  properties: {},
                  children: [{ type: "text", value: "Collapse" }],
                },
              ],
            },
            children: [],
          },
        ],
      },
    ],
  };
}

// One icon per callout type, matching Obsidian's own choices so the two
// renderers agree at a glance (note=pencil, tip=flame, warning=triangle,
// danger=zap, example=list). Lucide paths, 14px, stroked with currentColor so
// each inherits its type's --callout-color.
const ICON_PATHS = {
  note: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>',
  tip: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>',
  warning:
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>',
  danger:
    '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>',
  example:
    '<path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M3 6h.01"></path><path d="M3 12h.01"></path><path d="M3 18h.01"></path>',
};

const CALLOUT_TYPES = Object.keys(ICON_PATHS);

function icon(type) {
  return (
    '<svg class="callout__icon" xmlns="http://www.w3.org/2000/svg" width="14"' +
    ' height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' +
    ' aria-hidden="true">' +
    ICON_PATHS[type] +
    "</svg>"
  );
}

// <div>s, not the <span>s inherited from SideNote. SideNote used spans because
// it had to be valid inside a paragraph; a callout always comes from a
// blockquote, so it is block-level by construction and a span wrapping
// paragraphs was invalid HTML.
function buildCallout(type, label, bodyNodes, margin) {
  const className = ["callout", `callout--${type}`];
  if (margin) className.push("callout--margin");
  return {
    type: "paragraph",
    data: { hName: "div", hProperties: { className } },
    children: [
      {
        type: "paragraph",
        data: {
          hName: "div",
          hProperties: { className: ["callout__head"] },
          hChildren: [
            { type: "raw", value: icon(type) },
            {
              type: "element",
              tagName: "span",
              properties: { className: ["callout__label"] },
              children: [{ type: "text", value: label }],
            },
          ],
        },
        children: [],
      },
      {
        type: "paragraph",
        data: {
          hName: "div",
          hProperties: { className: ["callout__content"] },
        },
        children: bodyNodes,
      },
    ],
  };
}

export default function remarkCalloutComponents() {
  return (tree, file) => {
    // Deterministic ids for aria-controls, unique within the page. The old
    // component used Math.random(); a counter keeps the built output
    // reproducible.
    let collapsibleSeq = 0;

    visit(tree, "blockquote", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      const first = node.children?.[0];
      if (first?.type !== "paragraph") return;
      const lead = first.children?.[0];
      if (lead?.type !== "text") return;
      const m = CALLOUT.exec(lead.value);
      if (!m) return;
      const type = m[1].toLowerCase();
      // `-margin` is a PLACEMENT modifier, not part of the type.
      const margin = type.endsWith("-margin");
      const base = margin ? type.slice(0, -"-margin".length) : type;
      // Anything else passes through as the ordinary blockquote it already is.
      if (base !== "figure" && !CALLOUT_TYPES.includes(base)) return;

      // Drop the "[!type]" marker, then separate the title line from the body.
      const children = [...first.children];
      children[0] = { ...lead, value: lead.value.slice(m[0].length) };
      const [captionNodes, bodyNodes] = splitAtFirstNewline(children);

      if (CALLOUT_TYPES.includes(base)) {
        const label =
          captionNodes
            .map((n) => (n.type === "text" ? n.value : ""))
            .join("")
            .trim() || base[0].toUpperCase() + base.slice(1);
        const body = [];
        if (bodyNodes.length) {
          body.push({ type: "paragraph", children: bodyNodes });
        }
        body.push(...node.children.slice(1));
        if (!body.length) {
          file.fail(`[!${type}] callout has no body text.`, node);
        }
        // A one-paragraph callout renders its text directly inside
        // .callout__content, with no <p> wrapper — which is what
        // <SideNote>inline text</SideNote> produced. Wrapping it would add
        // paragraph margins the component never had. Multi-paragraph bodies
        // keep their paragraphs.
        const content =
          body.length === 1 && body[0].type === "paragraph"
            ? body[0].children
            : body;
        // Obsidian's fold marker, and its exact meaning there: bare is static,
        // `+` is collapsible and open, `-` is collapsible and collapsed.
        const fold = m[2];
        if (fold) {
          collapsibleSeq += 1;
          parent.children.splice(
            index,
            1,
            collapsible(
              base,
              label,
              // A collapsible block holds block content, so keep its paragraphs
              // rather than unwrapping a lone one.
              body,
              fold === "+",
              `callout-${collapsibleSeq}`,
              margin,
            ),
          );
        } else {
          parent.children.splice(
            index,
            1,
            buildCallout(base, label, content, margin),
          );
        }
        // Return `index`, not index + 1: the replacement is re-entered so that
        // callouts NESTED inside it (a figure, typically) are still visited.
        // The replacement is not a blockquote, so this cannot loop.
        return index;
      }

      // The embed may sit on the title line's own paragraph (body) or, if the
      // author left a blank line, in a later child of the blockquote.
      const rest = node.children.slice(1).flatMap((c) => c.children ?? []);
      const embed = findEmbed(bodyNodes) ?? findEmbed(rest);
      if (!embed) {
        file.fail(
          "[!figure] callout has no ![[diagram.svg]] embed. Expected:\n" +
            "  > [!figure] caption\n" +
            "  > ![[name.svg|420]]",
          node,
        );
      }

      const name = path.basename(embed[1].trim()).replace(/\.svg$/i, "");
      const rawWidth = (embed[2] ?? "").trim();
      if (rawWidth && !/^\d+$/.test(rawWidth)) {
        file.fail(
          `figure "${name}": width "${rawWidth}" is not a number. ` +
            `Use ![[${name}.svg|420]], in CSS pixels.`,
          node,
        );
      }

      const fig = loadFigure(name, file, node);
      const width = rawWidth ? Number(rawWidth) : fig.width;

      const out = {
        type: "paragraph",
        data: {
          hName: "figure",
          hProperties: {
            className: ["figure"],
            ...(width ? { style: `max-width:${width}px` } : {}),
          },
        },
        children: [
          {
            type: "paragraph",
            data: {
              hName: "div",
              hProperties: {
                className: ["figure__svg"],
                role: "img",
                "aria-label": fig.alt,
              },
              hChildren: [{ type: "raw", value: fig.svg }],
            },
            children: [],
          },
        ],
      };
      if (captionNodes.length) {
        out.children.push({
          type: "paragraph",
          data: {
            hName: "figcaption",
            hProperties: { className: ["figure__caption"] },
          },
          children: captionNodes,
        });
      }

      parent.children.splice(index, 1, out);
      return index;
    });
  };
}
