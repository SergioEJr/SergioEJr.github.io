#!/usr/bin/env node
// Render a built figure SVG (src/assets/journal/<name>.svg) into light + dark PNGs
// so it can be visually judged without a dev server.
//
//   node .claude/skills/make-figure/scripts/render-fig.mjs <name> [outdir]
//
// Theme variables are parsed live from src/styles/global.css (the `:root` and
// `[data-theme="dark"]` blocks), so this never drifts from the real palette —
// when a --fig-* or --color-* value changes on the site, renders pick it up
// automatically. Playwright resolves from the repo's node_modules, so run from
// a checkout where `npm install` has happened (in a bare worktree, symlink
// node_modules from the main checkout first).

import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../../..'); // scripts/ -> make-figure/ -> skills/ -> .claude/ -> root

const name = process.argv[2];
if (!name) {
  console.error('usage: node render-fig.mjs <figure-name> [outdir]');
  process.exit(1);
}
const outDir = process.argv[3] || '/tmp';
mkdirSync(outDir, { recursive: true });

const svgPath = join(repoRoot, 'src/assets/journal', `${name}.svg`);
const svg = readFileSync(svgPath, 'utf8');

// Pull every `--x: value;` declaration out of a CSS block body.
const cssVars = (block) => {
  const vars = {};
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
};
const css = readFileSync(join(repoRoot, 'src/styles/global.css'), 'utf8');
const rootBlock = css.match(/:root\s*\{([\s\S]*?)\n\}/);
const darkBlock = css.match(/\[data-theme=['"]dark['"]\]\s*\{([\s\S]*?)\n\}/);
if (!rootBlock || !darkBlock) {
  console.error('could not find :root / [data-theme="dark"] blocks in global.css');
  process.exit(1);
}
const light = cssVars(rootBlock[1]);
const dark = { ...light, ...cssVars(darkBlock[1]) }; // dark overrides, inherits the rest

// Playwright from the repo's node_modules regardless of cwd.
const require = createRequire(join(repoRoot, 'package.json'));
const { chromium } = require('playwright');

// Vars go in a <style> block, NOT an inline style attribute: some values
// (--font-sans: … "Segoe UI" …) contain double quotes that would terminate a
// style="…" attribute early and silently drop every var after them — which made
// all var(--color-bg, #fff) fills fall back to light values in the dark render.
const styleOf = (vars) =>
  Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');

const browser = await chromium.launch();
const page = await browser.newPage();
const outputs = [];
for (const [theme, vars] of [
  ['light', light],
  ['dark', dark],
]) {
  const bg = vars['--color-bg'] || (theme === 'dark' ? '#0f172a' : '#ffffff');
  const fg = vars['--color-text-main'] || (theme === 'dark' ? '#e2e8f0' : '#1a1a1a');
  const html = `<!doctype html>
  <style>#fig{display:inline-block;padding:24px;background:${bg};color:${fg};${styleOf(vars)}}</style>
  <body style="margin:0;background:${bg}"><div id="fig">${svg}</div></body>`;
  await page.setContent(html);
  const el = await page.$('#fig');
  const out = join(outDir, `${name}-${theme}.png`);
  await el.screenshot({ path: out });
  outputs.push(out);
}
await browser.close();
console.log(outputs.join('\n'));
