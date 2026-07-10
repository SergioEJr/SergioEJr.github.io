# Design guidelines doc for agents — design

**Date:** 2026-07-09
**Status:** Approved

## Goal

When an agent generates a diagram or `.svg` for this site, it should know the
site's canvas (background) colors and accent palette in both light and dark
mode, and the theme-aware conventions to follow, without hunting through
`global.css`. Today `src/assets/blog/README.md` documents the `<Figure>` modes
but never states the actual color values.

## Deliverables

### 1. New file — `DESIGN.md` (repo root)

Single source of truth for the palette + theme-aware SVG rules. Sections:

- **For agents (top framing):** one line — read this before generating any
  diagram or `.svg`; the site is theme-aware (light + dark).
- **Color palette table:** every `--color-*` var with its light hex, dark hex,
  and a plain-language "what it's for" note. Values mirrored verbatim from
  `src/styles/global.css`. Include the key ones: `bg`, `bg-offset`,
  `text-main`, `text-muted`, `accent`, `accent-light`, `border`.
  - Background: `#ffffff` (light) / `#0f172a` deep slate (dark)
  - Text main: `#1a1a1a` / `#e2e8f0`
  - Accent: `#003366` Oxford Blue / `#60a5fa` electric blue
- **Staleness note:** a line stating `src/styles/global.css` is authoritative
  and the table should be re-synced if those vars change.
- **Theme-aware SVG rules:**
  - Default for line-art: strokes/text use `currentColor` so the graphic
    inherits the page text color and flips with the theme automatically. This
    is what `Figure.astro` mode 1 and existing diagrams rely on.
  - Use the accent hex only for a deliberate splash of brand color; note it
    differs per theme, so pick the pair or accept it won't flip.
  - Do NOT hardcode the background/text hexes into an SVG that's meant to flip —
    that's what breaks on a theme change.
  - Cross-link to `src/components/Figure.astro` (three modes) rather than
    duplicating the mode docs.

### 2. Edit — `src/assets/blog/README.md`

Under the existing "Diagrams (`<Figure>`)" section, add a short **Canvas
colors** note: the background values (`#ffffff` light / `#0f172a` dark) so a
blog-diagram author knows the canvas, plus a one-line pointer to `DESIGN.md`
for the full palette and rules. Keep the README focused on authoring; don't
duplicate the whole table.

### 3. Edit — `CLAUDE.md`

Add a pointer to `DESIGN.md` so agents discover it (e.g. under a short
"Design / colors" note near the diagram/Figure guidance).

## Non-goals

- No new components or CSS changes; docs only.
- Don't restate the three `<Figure>` modes in `DESIGN.md` — link to them.
- No tooling to auto-sync the color table; a prose staleness note suffices.

## Verification

`npm run build` stays clean (docs-only, but confirm no accidental breakage).
Spot-check that every hex in `DESIGN.md` matches `src/styles/global.css`.
