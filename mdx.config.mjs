// Config read by the MDX language server (the "MDX" VS Code extension /
// mdx-analyzer). It mirrors the remark plugins from astro.config.mjs so the
// editor understands KaTeX `$...$` math and stops flagging things like
// `$2^{10,000}$` as "Could not parse expression with acorn".
//
// This file does NOT affect the build — Astro uses astro.config.mjs — it only
// teaches the editor's diagnostics about our Markdown extensions.
import remarkMath from 'remark-math';

/** @type {import('@mdx-js/mdx').CompileOptions} */
const config = {
	remarkPlugins: [remarkMath],
};

export default config;
