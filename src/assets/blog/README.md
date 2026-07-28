# Blog images

Put blog-post images here. They are processed by Astro's asset pipeline
(resize, webp/avif, cache-busting hashes), so prefer this over `public/` for
anything inside a post.

**Hero image** (optional, off by default) — reference it from the post
frontmatter relative to the post file:

```yaml
---
title: My Post
heroImage: /src/assets/blog/my-post.jpg
---
```

**In-body images** — use a relative Markdown link or an import:

```md
![Diagram](/src/assets/blog/my-post-diagram.png)
```

Recommended hero size: ~1600px wide. Anything large is fine — Astro downscales.

## Diagrams (`<Figure>`)

For diagrams that must work in light _and_ dark mode, use the `Figure` component
(`src/components/Figure.astro`) in `.mdx` posts. Three modes:

1. **Adaptive SVG** (best for line-art) — export an SVG with black ink, then
   `sed -i '' 's/#000000/currentColor/g; s/#000/currentColor/g' diagram.svg` so it
   inherits the page color and flips with the theme. Put it here; use:
   ```mdx
   import diagram from '/src/assets/blog/diagram.svg?raw';
   <Figure svg={diagram} alt="..." caption="..." />
   ```
2. **Light/dark pair** (for colored graphics) — export two images to `public/blog/`:
   `<Figure light="/blog/fig-light.png" dark="/blog/fig-dark.png" caption="..." />`
3. **Single image on a card** — `<Figure src="/blog/fig.png" caption="..." />`

Optional `width` (px) caps the figure. Export raster images at ~2× display size.

### Canvas colors

Diagrams sit on the page background, which flips with the theme:
`#ffffff` (light) / `#0f172a` deep slate (dark). Design for both — prefer
`currentColor` ink so line-art adapts automatically. See `/DESIGN.md` (repo
root) for the full palette and theme-aware SVG rules.

---

## Math diagrams: TikZ → SVG (`fig.sh`)

Any diagram with math labels is authored as **TikZ**, not hand-written SVG.
One source file per figure in `/figures`, built by one script.

```sh
./fig.sh product-rule          # builds figures/product-rule.tex
# -> src/assets/blog/product-rule.svg   theme-aware, for the site  (commit this)
# -> build/product-rule.pdf             cropped, for Overleaf      (gitignored)
```

Then in an `.mdx` post, mode 1 above:

```mdx
import fig from '/src/assets/blog/product-rule.svg?raw';
<Figure svg={fig} alt="Product rule as rectangle areas" caption="..." />
```

Commit **both** the `.tex` and the generated `.svg`. Requires `latex`,
`pdflatex`, and `dvisvgm` (all ship with TeX Live / MacTeX) — `latex` drives the
`.dvi`→SVG path, `pdflatex` produces the cropped PDF proof.

Shared setup (palette, font size, driver switch) lives in two files so it's
reproducible across figures — don't reinvent it per figure:

- **`figures/_template.tex`** — copy this to start a new figure. It carries the
  per-engine `\documentclass` driver switch (keep it verbatim) and `\input`s the
  preamble; you just fill in the drawing.
- **`figures/_preamble.tex`** — the four palette colors, the body-matching font
  size, and the `edge`/`hair` styles, shared by every figure via `\input`. Edit
  the look here once and every figure picks it up on rebuild. (`fig.sh` sets
  `TEXINPUTS` so `\input{_preamble}` resolves from `figures/`.) Files starting
  with `_` are shared includes, not figures — `fig.sh`/the watcher skip them.

### Making a new figure

`cp figures/_template.tex figures/<name>.tex`, draw, run `./fig.sh <name>`. The
only rule: **use only the four palette colors** (`ink`, `accent`, `muted`,
`figred`, defined in `_preamble.tex`). Anything else won't flip with the theme —
`fig.sh` leaves unrecognized hexes literal, and `npm run check:figures` fails the
build if a theme-locked hex slips through.

| TikZ color | Declared as | Becomes in the SVG                     |
| ---------- | ----------- | -------------------------------------- |
| `ink`      | `#000000`   | `var(--color-text-main, currentColor)` |
| `accent`   | `#003366`   | `var(--color-accent, #003366)`         |
| `muted`    | `#555555`   | `var(--color-text-muted, #555555)`     |
| `figred`   | `#b91c1c`   | `var(--fig-red, #b91c1c)`              |

`ink` reaches the SVG two ways, and `fig.sh` normalizes both to the same var:
`dvisvgm --currentcolor` turns black **text** into `currentColor`, but black
**strokes/fills** (rectangle edges, etc.) come through as a literal compacted
`#000`. `fig.sh` folds `#000`/`#000000` back to `currentColor`, then wraps all of
it once into `var(--color-text-main, currentColor)`. Miss the stroke case and a
black rectangle edge stays `#000` — invisible on the dark background. (This was a
real bug: the main rectangle's bottom/left edges vanished in dark mode.)

The sentinel hexes **are** the light-theme palette, so the PDF proof and the
Overleaf output already look like the light rendering — no color surgery needed
for print.

### Sizing: text vs. geometry

Two **independent** dials — this trips people up:

- **Geometry** is in mm (`x=1mm, y=1mm`); scale a drawing by editing its
  coordinates (the `\F`/`\G`/… defs), not by wrapping it in `\resizebox` or
  passing `width=` in LaTeX (that rescales the *type* too — see "Reusing figures
  in Overleaf" below).
- **Text** is in pt. `_preamble.tex` sets the figure's `\normalsize` to **13.5pt**
  to match the site body text (18px ≈ 13.5pt): `fig.sh` keeps the SVG's intrinsic
  `pt` dimensions, and `<Figure>` renders it ~1:1 (`max-width:100%` only shrinks
  it on narrow columns), so a `\normalsize` label lands at ≈ body-text size.
  Bump one label with `font=\small` / `font=\large`; change the global figure
  size by editing `\figfontsize` in the preamble.

Making text bigger does **not** grow the boxes (different dials), so a large
`font=` can crowd small rectangles — scale the geometry to match if needed.
Figure math is real embedded Computer Modern (see `--font-format=woff2` below),
so at matched size it reads at the same weight as the hinted KaTeX body math.

`--fig-red` is a figure-only accent that must exist in `src/styles/global.css`:

```css
:root {
  --fig-red: #b91c1c;
}
[data-theme="dark"] {
  --fig-red: #f87171;
}
```

### Why it's built this way

Four non-obvious failures, each of which broke a hand-written SVG:

- **CSS beats presentation attributes.** A `text-anchor: middle` rule in an
  SVG's `<style>` block overrides `text-anchor="end"` on an element — the
  attribute sits at the bottom of the cascade. Hand-placed labels silently
  re-center and collide with the artwork. TikZ computes placement from measured
  text extents (`\node[left] at (-2,\G/2)`), so this can't happen.
- **`currentColor` inherits whatever `color` the page sets.** Inlined SVG ink
  went white-on-white. `var(--color-text-main, currentColor)` is deterministic
  when inlined and still falls back sensibly when the file is opened standalone.
- **dvisvgm compacts hex**: `#003366` is emitted as `#036`, `#555555` as `#555`.
  A naive `s/#003366/…/` matches nothing. `fig.sh`'s `perl` pass matches both
  forms.
- **Never bake `#fff`, `#000`, `#1a1a1a`, or `#0f172a` into an SVG.** Such a
  figure looks correct in exactly one theme. This is enforced:
  `scripts/check-figures.mjs` scans `src/assets/blog/*.svg` for baked theme hexes
  and **fails the build** if any slip through (wired as `prebuild`, so it runs
  locally and in CI). Run it directly with `npm run check:figures`.

`fig.sh` runs `dvisvgm --font-format=woff2 --currentcolor`. `--font-format=woff2`
**embeds** the Computer Modern glyphs (as subsetted, base64 `@font-face` data
URIs) and emits real `<text>`, rather than converting glyphs to outline paths
(`--no-fonts`). This matters for weight: browsers *hint* real font text but
render bare outline paths unhinted, so `--no-fonts` labels came out visibly
*thinner/lighter* than the KaTeX body math at the same size. Embedded WOFF fixes
that — and is smaller (only the glyphs used are subsetted) and self-contained.
Because `<Figure>` inlines the SVG via `?raw`, the font is present at parse time,
so there's no async load or FOUT. `--currentcolor` maps TikZ black to
`currentColor` before the substitution table runs.

Labels are set in Computer Modern, which matches the KaTeX body math
(KaTeX_Main is a CM clone), so `$dg_p(v)$` in a figure and `$dg_p(v)$` in a
paragraph render at the same size *and weight*.

### Reusing figures in Overleaf

Never send Overleaf the themed `.svg`: Inkscape — which Overleaf's `svg` package
shells out to — does not resolve CSS custom properties, so
`var(--color-accent, #003366)` is discarded and the figure renders all black.

**Preferred: include the cropped PDF** from `fig.sh` (`build/<name>.pdf`).
Robust, no shell-escape, and it already looks like the light rendering:

```latex
\usepackage{graphicx}
...
\includegraphics{product-rule.pdf}
```

**Source include** (`\includestandalone`) is possible but fiddly with this
setup, because each figure now `\input{_preamble}` and carries a per-engine
`\ifnum\pdfoutput>0 …\documentclass…` switch:

- ship **both** `figures/<name>.tex` **and** `figures/_preamble.tex`;
- the driver conditional can trip standalone's "one `\documentclass`" check under
  `\includestandalone`. If you go this route, inline a plain
  `\documentclass[tikz,border=3pt]{standalone}` (no conditional) in an
  Overleaf-only copy, and use `\usepackage[subpreambles=true]{standalone}` so the
  sub-preamble's `\definecolor` block is honored.

When in doubt, use the PDF — it sidesteps all of this.

In both cases, don't pass `width=0.7\linewidth`. It wraps the picture in a
`\resizebox`, applying a uniform scale factor — label height scales with figure
width, so 11pt labels quietly become 7.7pt and fall out of step with the
caption. Size the figure inside the `.tex` instead (it is dimensioned in mm via
`x=1mm, y=1mm`), and it prints at a defined physical size with type at document
size.
