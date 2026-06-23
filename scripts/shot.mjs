// Screenshot a page (or one element) from the running dev server, for visual
// verification of UI changes. Dev-only (Playwright is a devDependency).
//
// Usage:
//   node scripts/shot.mjs <path> [options]
//
// Options (all optional):
//   --out <file>        output PNG path (default /tmp/shot.png)
//   --width <px>        viewport width (default 1280)
//   --height <px>       viewport height (default 900)
//   --theme <l|d>       light or dark (default dark)
//   --sel <css>         screenshot only this element (else full page)
//   --scroll <px>       scroll Y before shooting (e.g. to test sticky headers)
//   --open <css>        set the `open` attr on a <details> match first
//   --full              full-page screenshot (default: just the viewport)
//
// Examples:
//   node scripts/shot.mjs /blog/physics-entropy-equation/ --sel .toc-mobile-details --open .toc-mobile-details
//   node scripts/shot.mjs / --width 390 --out /tmp/home-mobile.png
//   node scripts/shot.mjs /blog/foo/ --scroll 1600   # check navbar stays stuck

import { chromium } from 'playwright';

const args = process.argv.slice(2);
const path = args[0] && !args[0].startsWith('--') ? args[0] : '/';
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def;
};
const has = (name) => args.includes(`--${name}`);

// Resolve the dev-server base URL. Prefer an explicit PREVIEW_URL; otherwise
// probe the common Astro ports and use whichever is already serving — so we
// reuse a dev server you already started (no need to launch or kill one).
async function detectBase() {
  if (process.env.PREVIEW_URL) return process.env.PREVIEW_URL;
  for (const port of [4321, 4322, 4323, 4324, 4325]) {
    try {
      const res = await fetch(`http://localhost:${port}/`, {
        signal: AbortSignal.timeout(800),
      });
      if (res.ok || (res.status >= 300 && res.status < 400)) {
        return `http://localhost:${port}`;
      }
    } catch {
      /* not listening on this port */
    }
  }
  return 'http://localhost:4321'; // fall back; will error clearly if nothing is up
}

const base = await detectBase();
const url = path.startsWith('http') ? path : base + path;
const out = opt('out', '/tmp/shot.png');
const width = parseInt(opt('width', '1280'), 10);
const height = parseInt(opt('height', '900'), 10);
const theme = opt('theme', 'd').startsWith('l') ? 'light' : 'dark';
const sel = opt('sel', null);
const openSel = opt('open', null);
const scrollY = parseInt(opt('scroll', '0'), 10);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
if (openSel) {
  await page.evaluate((s) => document.querySelector(s)?.setAttribute('open', ''), openSel);
}
if (scrollY) await page.evaluate((y) => window.scrollTo(0, y), scrollY);
await page.waitForTimeout(300);

if (sel) {
  await page.locator(sel).first().screenshot({ path: out });
} else {
  await page.screenshot({ path: out, fullPage: has('full') });
}

// Quick layout sanity checks printed alongside the shot.
const checks = await page.evaluate(() => {
  const doc = document.documentElement;
  const header = document.querySelector('header');
  return {
    overflowX: doc.scrollWidth - doc.clientWidth,
    headerTop: header ? Math.round(header.getBoundingClientRect().top) : null,
  };
});
console.log(`saved ${out}  (${base}, viewport ${width}x${height}, ${theme})`);
console.log(`  overflowX=${checks.overflowX}px (0 = no horizontal scroll)`);
console.log(`  header.top=${checks.headerTop} (0 = navbar stuck at top)`);

await browser.close();
