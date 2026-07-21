// @ts-check

import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import rehypeEqref from "./src/plugins/rehype-eqref.mjs";
import rehypeFootnoteHistory from "./src/plugins/rehype-footnote-history.mjs";
import rehypeCite from "./src/plugins/rehype-cite.mjs";

// Shared by both pipelines below so Markdown and MDX behave identically.
// - rehypeKatex: `trust` enables \htmlId, which is how an equation gets a link
//   target. KaTeX also auto-numbers unstarred environments (align/equation) via
//   a CSS counter.
// - rehypeEqref must run AFTER rehypeKatex — it reads the rendered KaTeX output.
// - rehypeFootnoteHistory is independent of math; it keeps GFM footnote jumps
//   from pushing history entries under ClientRouter (see the plugin's header).
// Typed as any[]: the local .mjs plugins ship no unified type declarations, so
// the inferred element type doesn't satisfy Pluggable[]/RehypePlugin[] even
// though they run correctly. The cast keeps `astro check` green.
/** @type {any[]} */
const contentPlugins = [
  [rehypeKatex, { trust: true }],
  rehypeEqref,
  rehypeFootnoteHistory,
  rehypeCite,
];

// https://astro.build/config
export default defineConfig({
  site: "https://sergioejr.github.io",
  base: process.env.BASE_PATH || "/",
  integrations: [
    // MDX parses `{...}` as JS expressions, which collides with KaTeX math like
    // `$2^{10,000}$`. Registering remark-math on the MDX pipeline makes the math
    // tokenizer claim `$...$` before the expression parser sees the braces.
    mdx({
      remarkPlugins: [remarkMath],
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
      remarkPlugins: [remarkMath],
      rehypePlugins: contentPlugins,
    }),
  },
  build: {
    inlineStylesheets: "always",
  },
});
