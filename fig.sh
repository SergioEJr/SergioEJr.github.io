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
dvisvgm --font-format=woff2 --currentcolor --exact-bbox -o "build/$n.svg" "build/$n.dvi" >/dev/null 2>&1

# dvisvgm compacts hex (#003366 -> #036), so match both forms. Match the long
# form before the short one (#000000 contains #000) so neither is half-eaten.
# --currentcolor only maps black TEXT to currentColor; explicit black strokes/
# fills stay #000, so fold them into currentColor here (the line below then wraps
# all of it once into the ink var — invisible-in-dark-mode edges were this bug).
# Keep the SVG's intrinsic width/height (dvisvgm emits them in pt). At 96dpi a pt
# maps ~1:1 to a CSS px, so this is the figure's natural 1x size — figure text set
# to the site body size (13.5pt, see _preamble.tex) then renders at ~body px.
# Figure.astro adds max-width:100%; height:auto, so it still shrinks responsively
# on narrow columns but never blurrily upscales. (Earlier this stripped the dims,
# which let the browser pick an arbitrary default size and broke the pt↔px scale.)
perl -pe '
  s/#000000\b|#000\b/currentColor/g;
  s/#003366\b|#036\b/var(--color-accent, #003366)/g;
  s/#555555\b|#555\b/var(--color-text-muted, #555555)/g;
  s/#b91c1c\b/var(--fig-red, #b91c1c)/gi;
  s/currentColor/var(--color-text-main, currentColor)/g;
' "build/$n.svg" > "src/assets/blog/$n.svg"

echo "web    -> src/assets/blog/$n.svg"
echo "paper  -> build/$n.pdf"
