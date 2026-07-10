# Figure: the derivative of x³ as an exploded cube

**Date:** 2026-07-10
**Post:** `src/content/blog/note-product-rule.mdx` ("A picture proof of the product rule")

## Goal

Add a second figure to the product-rule note that generalizes the 2D
area-of-a-rectangle picture to the 3D volume-of-a-cube picture for $x^3$. A solid
cube $x^3$ grows by $dx$ on its three visible faces; the three leading slabs
(each of volume $x^2\,dx$) are the derivative $3x^2$, and the subleading pieces
(three thin $x\,dx^2$ columns and the $dx^3$ corner) vanish in the limit.

Authored through the existing TikZ → SVG figure pipeline (`./fig.sh`), matching
`figures/product-rule.tex` in style.

## Reference

User-supplied sketch: left = solid cube labeled $x^3$; arrow; right = an
**exploded** view — a faint gray-dashed ghost of the grown cube $(x+dx)^3$ with
three colored leading slabs (each labeled $x^2\,dx$) pulled slightly out from the
ghost, and the subleading pieces left as faint gray-dashed volumes (unlabeled).

## Palette work (prerequisite)

The pipeline's single strong non-red color is `accent` (Oxford Blue `#003366`),
which reads too close to ink on the light background. We introduce two new
**figure-only** theme-safe vars and reuse the existing red, giving three
distinct, legible slab colors in both themes.

| Var | Light | Dark | Notes |
|---|---|---|---|
| `--fig-red` | `#b91c1c` | `#f87171` | **unchanged** (already exists) |
| `--fig-blue` | `#1d4ed8` (Blue-700) | `#60a5fa` (dark accent) | new; light value legible on white, dark value = the accent the user likes on slate |
| `--fig-orange` | `#c2410c` (Orange-700) | `#fb923c` (Orange-400) | new |

`muted` stays as-is. All three light sentinel hexes have no doubled-nibble
channels, so **dvisvgm will not compact them** (verified) — each needs exactly
one long-form rewrite rule in `fig.sh` (unlike `#003366` → `#036`).

### Files touched for the palette

1. `figures/_preamble.tex` — add
   `\definecolor{figblue}{HTML}{1D4ED8}` and
   `\definecolor{figorange}{HTML}{C2410C}` (sentinel = light value, per
   convention so the PDF proof looks like light mode).
2. `fig.sh` — add two `perl` rewrite rules (long form only):
   `s/#1d4ed8\b/var(--fig-blue, #1d4ed8)/gi;`
   `s/#c2410c\b/var(--fig-orange, #c2410c)/gi;`
   Order them before the trailing `currentColor` wrap, alongside the `#b91c1c`
   rule.
3. `src/styles/global.css` — add `--fig-blue` / `--fig-orange` to both the
   `:root` (light) and `[data-theme="dark"]` blocks, next to `--fig-red`.
4. `scripts/check-figures.mjs` — no change expected (new colors become
   `var(--…, #hex)` fallbacks, which the guard already strips). Confirm the new
   sentinels are **not** in `FORBIDDEN`; they are not.
5. `DESIGN.md` — add the two new figure vars to the palette table for
   discoverability (short row addition).

### Consistency: retheme the existing 2D figure

`figures/product-rule.tex` currently uses `accent` for its $dg$ / $f\,dg$ strip.
Since `--fig-blue` becomes *the* figure blue, switch that strip from `accent` to
`figblue` so both figures share one legible blue. Rebuild `product-rule` too and
re-verify it in both themes.

## The figure: `figures/cube-x3.tex`

- Start from `cp figures/_template.tex figures/cube-x3.tex` (keeps the driver
  switch + `\input{_preamble}` verbatim).
- **Projection:** define three isometric unit direction vectors in mm — `right`,
  `up`, `back` (a diagonal for depth) — and build every face as a `\draw`
  polygon from combinations of them. No external 3D package; self-contained like
  `product-rule.tex`. Dimension in mm (`x=1mm, y=1mm`); big cube edge ≈ 40mm,
  `dx` ≈ 10mm.
- **Left cube:** solid, `edge, ink`, three visible faces, centered label
  `$x^3$` (ink).
- **Arrow:** `\draw[->, edge, ink]` between the two cubes.
- **Right, exploded view (build in this order, screenshotting each stage):**
  1. **Ghost** of the grown cube $(x+dx)^3$: all edges `hair, muted, dashed`.
  2. **Three leading slabs**, each an $x \times x \times dx$ box pulled slightly
     off the ghost along its outward normal, filled/stroked:
     - top slab → `figred`, label `$x^2\,dx$`
     - front (left-facing) slab → `figorange`, label `$x^2\,dx$`
     - right slab → `figblue`, label `$x^2\,dx$`
  3. **Subleading pieces:** three thin `$x\,dx^2$` columns + the `$dx^3$` corner,
     drawn `hair, muted, dashed` — **unlabeled** (match reference).
- **Only palette colors** (`ink`, `muted`, `figred`, `figblue`, `figorange`) so
  the theme guard passes and everything flips.

## Wire into the post

Extend `note-product-rule.mdx` after the existing rectangle figure with:
- `import cubeX3 from '../../assets/blog/cube-x3.svg?raw';`
- a short prose bridge ("The same picture works one dimension up…") written in
  Sergio's voice (portfolio-copy skill), and
- a `<Figure svg={cubeX3} width={...} alt="..." caption="..." />` block whose
  caption names the three $x^2\,dx$ slabs as the derivative $3x^2$ and the
  dashed remainder as the higher-order terms that drop out.

## Verification

1. `./fig.sh cube-x3` builds clean; `./fig.sh product-rule` (retheme) clean.
2. `npm run check:figures` passes (no baked theme hexes).
3. `npm run build` clean (runs the figure guard as `prebuild`).
4. `visual-check` skill: screenshot the post in **both** light and dark mode —
   confirm (a) all three slab colors are distinct and legible on white *and*
   slate, (b) the gray-dashed ghost + subleading pieces read as faint/secondary,
   (c) the retheme'd 2D figure still looks right, (d) labels are body-text sized.

## Risks

- 3D isometric geometry is hand-placed and fiddly. Mitigation: incremental
  build (ghost → slabs → subleading → labels), visual-check between stages.
- Slab pull-out distance and label placement may crowd; tune coordinates, not
  type size (geometry mm and text pt are independent dials).
