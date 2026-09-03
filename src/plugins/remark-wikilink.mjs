// Obsidian-style wikilinks for Journal posts.
//
// The Journal is authored in Obsidian, where the vault IS this repo. Obsidian's
// core capture gesture is typing `[[some idea]]` mid-sentence: the link becomes
// a real (initially empty) note the moment you click it, so an idea that arrives
// while writing gets recorded instead of lost. That syntax is not Markdown, so
// without this plugin `[[product-rule]]` would ship to the site as literal text.
//
//   [[product-rule]]              → <a href="/journal/product-rule/">The product rule</a>
//   [[product-rule|that proof]]   → <a href="/journal/product-rule/">that proof</a>
//   [[not-written-yet]]           → plain text "not-written-yet" (no link)
//
// UNRESOLVED LINKS RENDER AS PLAIN TEXT, DELIBERATELY. Placeholder notes are the
// point of the workflow, so a post will routinely reference notes that do not
// exist yet or are still `draft: true`. A "garden" would advertise those as
// broken/unwritten links; the Journal reads as a finished publication, so an
// unresolved link degrades to invisible prose instead. Nothing 404s, and the
// link starts working by itself the day the target is published.
//
// RELATIONSHIP TO postLink() (src/utils/posts.ts): that function is the single
// source of truth for where a post links, and this plugin deliberately does NOT
// reimplement its branching. It resolves exactly one case — a post with its own
// generated detail page at /journal/<id>/ — and lets every other kind of post
// (externalUrl / linkTo / noLink pointers) fall through to the unresolved path.
// Those are timeline entries rather than things prose cites, and treating them
// as unresolved is the same safe no-op as a missing note. If that ever needs to
// change, the has-detail-page rule below must move in step with postHasDetailPage().
//
// WHY IT READS THE FILESYSTEM: remark plugins run outside the Astro module
// graph, so `astro:content` and getCollection() are unavailable here. The index
// is built by scanning the collection directory directly.

import fs from "node:fs";
import path from "node:path";
import { visit } from "unist-util-visit";
import { parse as parseYaml } from "yaml";

const JOURNAL_DIR = path.resolve("src/content/journal");

// `[[target]]` or `[[target|alias]]`. Both parts reject brackets so that an
// unclosed link can't swallow the rest of the paragraph.
const WIKILINK = /\[\[([^[\]|]+?)(?:\|([^[\]]+?))?\]\]/g;

// Mirrors `base` in astro.config.mjs, normalized the way src/utils/paths.ts
// normalizes it (no trailing slash), so generated hrefs match every other link
// on the site when the site is served from a subpath.
const BASE = (process.env.BASE_PATH || "/").replace(/\/+$/, "");

// Drafts are linkable while writing but must never produce a link in a build:
// no detail page is emitted for them, so a link would 404. Default to the
// STRICT reading when NODE_ENV is unset — the safe failure is a plain-text
// link, not a dead one.
const IS_DEV = process.env.NODE_ENV === "development";

let cache = null;
let cachedAt = 0;
const CACHE_MS = IS_DEV ? 1000 : Infinity;

function readPost(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  let data;
  try {
    data = parseYaml(m[1]);
  } catch {
    return null; // malformed frontmatter is the schema's error to report, not ours
  }
  if (!data || typeof data !== "object") return null;
  return data;
}

// slug -> { title, linkable }. The id rule matches content.config.ts's
// generateId: the basename alone, so a post keeps its URL when it moves between
// essays/, notes/ and updates/.
function buildIndex() {
  const index = new Map();
  let files;
  try {
    files = fs.readdirSync(JOURNAL_DIR, { recursive: true, encoding: "utf8" });
  } catch {
    return index; // no collection dir (shouldn't happen) → everything unresolved
  }
  for (const rel of files) {
    if (!/\.mdx?$/.test(rel)) continue;
    const data = readPost(path.join(JOURNAL_DIR, rel));
    if (!data) continue;
    const slug = path.basename(rel).replace(/\.mdx?$/, "");
    const hasDetailPage = !data.externalUrl && !data.linkTo && !data.noLink;
    const published = !data.draft || IS_DEV;
    index.set(slug, {
      title: typeof data.title === "string" ? data.title : slug,
      linkable: hasDetailPage && published,
    });
  }
  return index;
}

function getIndex() {
  const now = Date.now();
  if (!cache || now - cachedAt > CACHE_MS) {
    cache = buildIndex();
    cachedAt = now;
  }
  return cache;
}

// Frontmatter titles may carry the inline markers src/utils/inlineText.ts
// understands (~~strike~~). Link text is already past the Markdown parser, so a
// marker left in would render literally.
function plainTitle(title) {
  return title.replace(/~~/g, "");
}

export default function remarkWikilink() {
  return (tree) => {
    const index = getIndex();

    // Only `text` nodes are visited, which is what keeps wikilinks inert inside
    // code spans, fenced code and math — remark-math and the code tokenizers
    // have already claimed those as their own node types by this point.
    visit(tree, "text", (node, i, parent) => {
      if (!parent || typeof i !== "number") return;
      if (!node.value.includes("[[")) return;

      const out = [];
      let last = 0;
      WIKILINK.lastIndex = 0;
      let m;

      while ((m = WIKILINK.exec(node.value)) !== null) {
        const [full, rawTarget, alias] = m;
        if (m.index > last) {
          out.push({ type: "text", value: node.value.slice(last, m.index) });
        }
        last = m.index + full.length;

        // Obsidian may write a path, an extension, or a heading anchor —
        // `notes/product-rule.mdx#a-heading`. The collection keys on basename.
        const slug = path
          .basename(rawTarget.trim().split("#")[0].trim())
          .replace(/\.mdx?$/, "");
        const entry = index.get(slug);
        const label = (alias ?? "").trim();

        if (entry && entry.linkable) {
          out.push({
            type: "link",
            url: `${BASE}/journal/${slug}/`,
            data: { hProperties: { class: "wikilink" } },
            children: [
              { type: "text", value: label || plainTitle(entry.title) },
            ],
          });
        } else {
          // Unresolved: plain prose, invisible to the reader (see header).
          out.push({ type: "text", value: label || rawTarget.trim() });
        }
      }

      if (!out.length) return;
      if (last < node.value.length) {
        out.push({ type: "text", value: node.value.slice(last) });
      }
      parent.children.splice(i, 1, ...out);
      return i + out.length;
    });
  };
}
