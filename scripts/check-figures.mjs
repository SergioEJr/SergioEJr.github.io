#!/usr/bin/env node
// Fail the build if any committed figure SVG bakes in a theme-specific color
// instead of a CSS variable. Such a figure looks correct in exactly ONE theme —
// e.g. a black rectangle edge (#000) that vanishes on the dark background, or a
// white fill (#fff) that blinds the light one. `fig.sh` rewrites the sanctioned
// palette to `var(--...)`; anything left as a raw theme hex slipped through.
//
// Runs automatically via the `prebuild` npm script (local + CI).

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/assets/blog";

// Hexes that are theme backgrounds/ink and must never be baked into a themed
// figure. Both long and dvisvgm-compacted short forms. The sanctioned figure
// palette (#003366 accent, #555 muted, #b91c1c figred) is intentionally allowed
// as a fallback INSIDE `var(--x, #hex)`, so we only flag these theme-locked ones.
const FORBIDDEN = [
  { label: "black (ink)", re: /#000000\b|#000\b/gi },
  { label: "white (bg)", re: /#ffffff\b|#fff\b/gi },
  { label: "text-main dark", re: /#e2e8f0\b/gi },
  { label: "light ink", re: /#1a1a1a\b/gi },
  { label: "bg dark (slate)", re: /#0f172a\b/gi },
];

// A bare theme hex is only a problem outside a `var(--x, …)` fallback. Strip the
// fallbacks first so an allowed `var(--color-accent, #003366)` never trips us,
// while a raw `stroke='#000'` still does.
const stripVarFallbacks = (s) =>
  s.replace(/var\(\s*--[\w-]+\s*,\s*#[0-9a-fA-F]{3,6}\s*\)/g, "");

const svgs = readdirSync(DIR).filter((f) => f.endsWith(".svg"));
let failed = false;

for (const file of svgs) {
  const raw = readFileSync(join(DIR, file), "utf8");
  const body = stripVarFallbacks(raw);
  for (const { label, re } of FORBIDDEN) {
    const hits = body.match(re);
    if (hits) {
      failed = true;
      console.error(
        `✗ ${join(DIR, file)}: ${hits.length} baked ${label} hex (${[...new Set(hits)].join(", ")}) — ` +
          `won't flip with the theme. Regenerate via ./fig.sh, or map the color to a CSS var.`,
      );
    }
  }
}

if (failed) {
  console.error(
    '\nFigure theme check failed. See src/assets/blog/README.md > "Why it\'s built this way".',
  );
  process.exit(1);
}
console.log(`✓ figure theme check: ${svgs.length} SVG(s) clean`);
