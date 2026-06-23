// @ts-check

import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

// https://astro.build/config
export default defineConfig({
	site: 'https://sergioejr.github.io',
	base: process.env.BASE_PATH || '/',
	integrations: [
		// MDX parses `{...}` as JS expressions, which collides with KaTeX math like
		// `$2^{10,000}$`. Registering remark-math on the MDX pipeline makes the math
		// tokenizer claim `$...$` before the expression parser sees the braces.
		mdx({
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeKatex],
		}),
		sitemap()
	],
	markdown: {
		shikiConfig: {
			themes: {
				light: 'github-light',
				dark: 'github-dark',
			},
		},
		processor: unified({
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeKatex],
		}),
	},
	build: {
		inlineStylesheets: 'always',
	},
});
