#!/bin/sh
# ./fig.sh product-rule
#   -> src/assets/blog/product-rule.svg   (theme-aware, for the website)
#   -> build/product-rule.pdf             (for Overleaf: \includegraphics)
set -e
n="$1"; [ -n "$n" ] || { echo "usage: ./fig.sh <name>   (figures/<name>.tex)"; exit 1; }
mkdir -p build src/assets/blog

# Resolve \input{_preamble} (and any other shared figure includes) from figures/,
# regardless of the CWD we invoke latex from. Trailing empty entry keeps the
# default search path. Shared figure files live in figures/ and start with `_`.
export TEXINPUTS="figures:$TEXINPUTS"

latex    -halt-on-error -interaction=batchmode -output-directory=build "figures/$n.tex" >/dev/null
pdflatex -halt-on-error -interaction=batchmode -output-directory=build "figures/$n.tex" >/dev/null
# --no-fonts draws every glyph as a <path> instead of embedding fonts and
# referencing them via CSS classes. This is REQUIRED for correctness when a page
# inlines more than one of these SVGs: dvisvgm names its text classes generically
# (text.f0, text.f1, ...) and its @font-face families generically (cmmib10, ...),
# and those names are GLOBAL once the SVG is inlined into the page. Two figures on
# one page then collide — the later figure's `text.f0 {font-family; font-size}`
# overrides the earlier figure's, silently rendering its labels in the wrong font
# and size (this actually happened: field-vector-transform shrank field-
# translation's bold vectors to a small non-bold font). Path glyphs carry no
# shared class/font names, so they cannot collide; they fill with #000, which the
# color rewrite below folds into currentColor just like the strokes.
dvisvgm --no-fonts --currentcolor --exact-bbox -o "build/$n.svg" "build/$n.dvi" >/dev/null 2>&1

# dvisvgm compacts hex (#003366 -> #036), so match both forms. Match the long
# form before the short one (#000000 contains #000) so neither is half-eaten.
# --currentcolor only maps black TEXT to currentColor; explicit black strokes/
# fills stay #000, so fold them into currentColor here (the line below then wraps
# all of it once into the ink var — invisible-in-dark-mode edges were this bug).
# Keep the SVG's intrinsic width/height (dvisvgm emits them in pt). At 96dpi a pt
# maps ~1:1 to a CSS px, so this is the figure's natural 1x size. With --no-fonts
# the label sizes are baked into the glyph PATH geometry (not a font-size on a
# <text>), so they scale with the whole SVG under Figure.astro's max-width:100%;
# height:auto — responsive on narrow columns, never blurrily upscaled.
perl -pe '
  s/#000000\b|#000\b/currentColor/g;
  s/#003366\b|#036\b/var(--color-accent, #003366)/g;
  s/#555555\b|#555\b/var(--color-text-muted, #555555)/g;
  s/#f6f8fa\b|#ffffff\b|#fff\b/var(--color-bg, #f6f8fa)/gi;
  s/#c02748\b/var(--fig-red, #c02748)/gi;
  s/#1d4ed8\b/var(--fig-blue, #1d4ed8)/gi;
  s/#b45309\b/var(--fig-orange, #b45309)/gi;
  s/#047857\b/var(--fig-green, #047857)/gi;
  s/#64748b\b/var(--fig-muted, #64748b)/gi;
  s/currentColor/var(--color-text-main, currentColor)/g;
' "build/$n.svg" > "src/assets/blog/$n.svg"

echo "web    -> src/assets/blog/$n.svg"
echo "paper  -> build/$n.pdf"
