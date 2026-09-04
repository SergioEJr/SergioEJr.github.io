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
//   > [!aside] recall            -> SideNote, floats into the right margin
//   > Entropy counts microstates.
//
//   > [!note] Note               -> SideNote inline, stays in the reading column
//   > A framing note too important for the margin.
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

// Lifted verbatim from SideNote.astro so the two renderings are identical.
const SIDENOTE_ICON =
  '<svg class="sidenote__icon" xmlns="http://www.w3.org/2000/svg" width="14"' +
  ' height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' +
  ' aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121' +
  ' 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg>';

// SideNote renders as <span>s, not <div>s, because the component had to be
// valid INSIDE a paragraph. The compiled form keeps that markup so one set of
// CSS serves both, even though a callout is always block-level.
function buildSideNote(label, bodyNodes, inline) {
  return {
    type: "paragraph",
    data: {
      hName: "span",
      hProperties: {
        className: inline
          ? ["sidenote__body", "sidenote__body--inline"]
          : ["sidenote__body"],
        "data-sidenote": inline ? "inline" : "",
      },
    },
    children: [
      {
        type: "paragraph",
        data: {
          hName: "span",
          hProperties: { className: ["sidenote__head"] },
          hChildren: [
            { type: "raw", value: SIDENOTE_ICON },
            {
              type: "element",
              tagName: "span",
              properties: { className: ["sidenote__label"] },
              children: [{ type: "text", value: label }],
            },
          ],
        },
        children: [],
      },
      {
        type: "paragraph",
        data: {
          hName: "span",
          hProperties: { className: ["sidenote__content"] },
        },
        children: bodyNodes,
      },
    ],
  };
}

export default function remarkCalloutComponents() {
  return (tree, file) => {
    visit(tree, "blockquote", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      const first = node.children?.[0];
      if (first?.type !== "paragraph") return;
      const lead = first.children?.[0];
      if (lead?.type !== "text") return;
      const m = CALLOUT.exec(lead.value);
      if (!m) return;
      const type = m[1].toLowerCase();
      // Anything else passes through as the ordinary blockquote it already is.
      if (type !== "figure" && type !== "aside" && type !== "note") return;

      // Drop the "[!type]" marker, then separate the title line from the body.
      const children = [...first.children];
      children[0] = { ...lead, value: lead.value.slice(m[0].length) };
      const [captionNodes, bodyNodes] = splitAtFirstNewline(children);

      if (type === "aside" || type === "note") {
        // The title is the label; SideNote.astro defaults it to "Note".
        const label =
          captionNodes
            .map((n) => (n.type === "text" ? n.value : ""))
            .join("")
            .trim() || "Note";
        // Body = the rest of the title paragraph, plus any further blockquote
        // children (a callout may hold several paragraphs).
        const body = [];
        if (bodyNodes.length) {
          body.push({ type: "paragraph", children: bodyNodes });
        }
        body.push(...node.children.slice(1));
        if (!body.length) {
          file.fail(`[!${type}] callout has no body text.`, node);
        }
        // A one-paragraph note renders its text directly inside
        // .sidenote__content, with no <p> wrapper -- which is what
        // <SideNote>inline text</SideNote> produced. Wrapping it would add
        // paragraph margins the component never had. Multi-paragraph bodies
        // keep their paragraphs.
        const content =
          body.length === 1 && body[0].type === "paragraph"
            ? body[0].children
            : body;
        parent.children.splice(
          index,
          1,
          buildSideNote(label, content, type === "note"),
        );
        return index + 1;
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
      return index + 1;
    });
  };
}
