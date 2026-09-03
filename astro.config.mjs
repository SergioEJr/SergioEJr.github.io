// @ts-check

import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import rehypeEqref from "./src/plugins/rehype-eqref.mjs";
import rehypeFootnoteHistory from "./src/plugins/rehype-footnote-history.mjs";
import rehypeMathPunctuation from "./src/plugins/rehype-math-punctuation.mjs";
import remarkWikilink from "./src/plugins/remark-wikilink.mjs";

// Shared by both pipelines below so Markdown and MDX behave identically.
// - rehypeKatex: `trust` enables \htmlId, which is how an equation gets a link
//   target. KaTeX also auto-numbers unstarred environments (align/equation) via
//   a CSS counter.
// - rehypeEqref must run AFTER rehypeKatex — it reads the rendered KaTeX output.
// - rehypeMathPunctuation likewise reads rendered KaTeX; it stops a lone "." or
//   "," being stranded on its own line after inline math. Same technique
//   Wikipedia leans on ({{nowrap}} — 220 uses on the Fourier transform page).
// - rehypeFootnoteHistory is independent of math; it keeps GFM footnote jumps
//   from pushing history entries under ClientRouter (see the plugin's header).
// Typed as any[]: the local .mjs plugins ship no unified type declarations, so
// the inferred element type doesn't satisfy Pluggable[]/RehypePlugin[] even
// though they run correctly. The cast keeps `astro check` green.
// Site-wide KaTeX macros for post bodies. DELIBERATELY EMPTY — post math is
// written in standard LaTeX only.
//
// There used to be a `\bs` -> `\boldsymbol` shorthand here. It was removed on
// 2026-09-03 because post math now has three readers, and a macro defined in
// this file is invisible to two of them: Obsidian (where the Journal is
// authored) renders with MathJax and never sees it, and math pasted into
// Overleaf carries no preamble. A shorthand that only works in the one place
// the text is *displayed* costs more than the keystrokes it saves.
//
// If a macro is ever genuinely worth it, mirror it in src/utils/inlineText.ts
// (captions/frontmatter render through a separate katex.renderToString call)
// AND give Obsidian a matching MathJax preamble.
const katexMacros = {};

// Shared by both pipelines, same as contentPlugins below. remarkWikilink runs
// AFTER remarkMath so that `$...$` is already its own node type and a `[[`
// inside math is never mistaken for a wikilink.
/** @type {any[]} */
const contentRemarkPlugins = [remarkMath, remarkWikilink];

/** @type {any[]} */
const contentPlugins = [
  [rehypeKatex, { trust: true, macros: katexMacros }],
  rehypeEqref,
  rehypeMathPunctuation,
  rehypeFootnoteHistory,
];

// https://astro.build/config
export default defineConfig({
  // The custom domain, NOT sergioejr.github.io — that host 301s here, so
  // declaring it made every canonical, og:url, sitemap entry and RSS link point
  // at a URL that immediately redirects away. `site` only affects absolute URLs;
  // internal links come from `base` below.
  site: "https://sejr.me",
  base: process.env.BASE_PATH || "/",

  // Permanent redirects for the 2026-07-28 rename (see AGENTS.md for the full
  // mapping). GitHub Pages can't issue server-side 301s, so Astro emits a static
  // stub per path: instant meta-refresh + canonical + noindex, which Google
  // treats as a redirect. Without these the old URLs simply 404, which tells a
  // search engine nothing about where the content went and strands anyone
  // arriving from a stale result.
  //
  // Only paths whose content actually moved are listed. Deliberately left to
  // 404: /blog/note-git/ and /blog/sample-math/ (posts deleted outright) and the
  // 20 /tags/<tag>/ pages (the whole section was removed). Pointing deleted
  // writing at an index is a soft 404 — Google drops the URL either way, but it
  // implies to a reader that the piece still exists somewhere. The 404 page
  // already offers the Journal and Research, so nobody lands nowhere.
  //
  // A catch-all is not available: Astro rejects a dynamic source whose
  // destination omits its parameters, so "/blog/[slug]" -> "/journal" is an
  // InvalidRedirectDestination. Hence the explicit list.
  redirects: {
    // Sections
    "/blog": "/journal",
    "/publications": "/research",
    "/publications/[slug]": "/research/[slug]",
    // Journal posts that also changed slug
    "/blog/note-astro": "/journal/what-is-astro",
    "/blog/note-webgl": "/journal/what-is-webgl",
    "/blog/note-product-rule": "/journal/product-rule",
    "/blog/sample-physics": "/journal/random-walks-sqrt-t",
    "/blog/physics-entropy-equation": "/journal/entropy-arrow-of-time",
    "/blog/physics-why-ice-melts": "/journal/why-ice-melts",
    "/blog/essay-i-love-you-bro": "/journal/i-love-you-bro",
    "/blog/news-mit-admission": "/journal/mit-admission",
    "/blog/news-dean-of-science-symposium":
      "/journal/dean-of-science-symposium",
  },
  integrations: [
    // MDX parses `{...}` as JS expressions, which collides with KaTeX math like
    // `$2^{10,000}$`. Registering remark-math on the MDX pipeline makes the math
    // tokenizer claim `$...$` before the expression parser sees the braces.
    mdx({
      remarkPlugins: contentRemarkPlugins,
      rehypePlugins: contentPlugins,
    }),
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    },
    processor: unified({
      remarkPlugins: contentRemarkPlugins,
      rehypePlugins: contentPlugins,
    }),
  },
  build: {
    inlineStylesheets: "always",
  },
});
