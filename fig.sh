#!/bin/sh
# ./fig.sh product-rule
#   -> src/assets/diagrams/product-rule.svg   (theme-aware, for the website)
#   -> build/product-rule.pdf             (for Overleaf: \includegraphics)
set -e
n="$1"; [ -n "$n" ] || { echo "usage: ./fig.sh <name>   (figures/<name>.tex)"; exit 1; }
mkdir -p build src/assets/diagrams

# Resolve \input{_preamble} (and any other shared figure includes) from figures/,
# regardless of the CWD we invoke latex from. Trailing empty entry keeps the
# default search path. Shared figure files live in figures/ and start with `_`.
export TEXINPUTS="figures:$TEXINPUTS"

latex    -halt-on-error -interaction=batchmode -output-directory=build "figures/$n.tex" >/dev/null
pdflatex -halt-on-error -interaction=batchmode -output-directory=build "figures/$n.tex" >/dev/null
# Embed fonts as woff2 and reference them via CSS classes. This keeps figure
# labels as real <text> — SELECTABLE, with correct glyph metrics/spacing (drawing
# glyphs as <path> outlines instead, via --no-fonts, loses both). The namespacing
# step below makes it safe to inline several of these on one page.
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
# on narrow columns but never blurrily upscales.
#
# NAMESPACING (why $n is threaded in): dvisvgm gives every SVG the SAME generic
# names — CSS classes f0/f1/…, @font-face families cmmib10/cmmi12/…, and id
# page1. Once an SVG is inlined into the page (Figure.astro uses set:html), those
# names are GLOBAL, so two figures on one page collide: the later figure's
# `text.f0{font-family;font-size}` overrides the earlier figure's, rendering its
# labels in the wrong font/size. Prefixing all three name kinds with the figure's
# own name ($n) makes them unique per figure, so any number can share a page.
# Sed runs first (structural renames), then perl does the color rewrite.
sed -E \
  -e "s/(class=')(f[0-9]+')/\1${n}-\2/g" \
  -e "s/(text\.)(f[0-9]+)/\1${n}-\2/g" \
  -e "s/(font-family:)(cm[a-z0-9]+)/\1${n}-\2/g" \
  -e "s/(id=')(page[0-9]+')/\1${n}-\2/g" \
  -e "s/(url\(#)(page[0-9]+\))/\1${n}-\2/g" \
  "build/$n.svg" \
| perl -pe '
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
' \
| perl -0777 -pe '
  # DETERMINISM: dvisvgm emits the @font-face blocks in a varying order between
  # runs, so regenerating an unchanged figure produced a spurious diff and made
  # real changes hard to see in review. The blocks are order-independent (each
  # binds one font-family to one woff2 payload), so sorting them is safe and
  # makes fig.sh byte-idempotent. The text.f* rules that follow are already
  # emitted in index order and are left alone.
  s{(<!\[CDATA\[)(.*?)(\]\]>)}{
    my ($open, $body, $close) = ($1, $2, $3);
    my @lines = split /\n/, $body;
    my @face  = sort grep {  /^\@font-face/ } @lines;
    my @rest  =      grep { !/^\@font-face/ } @lines;
    $open . join("\n", @face, @rest) . "\n" . $close;
  }gse;
' > "src/assets/diagrams/$n.svg"

# --- Sidecar metadata -------------------------------------------------------
# Alt text describes the DRAWING, not the article that includes it: it is the
# same wherever the figure is used, and it is long enough to wreck the prose if
# inlined. So it lives beside the drawing, in the .tex, and is emitted here as
# JSON for the site's remark plugin to read.
#
#   % alt: first line of the description, wrapped as needed
#   %   continuation lines start with a percent and THREE spaces
#   % width: 420          <- optional display width in CSS px
#
# The continuation marker is explicit rather than "any following comment line"
# because alt prose legitimately contains colons ("% right: a single...") and a
# heuristic would swallow or truncate on them.
#
# A missing `% alt:` is a hard error. Shipping an inaccessible figure should not
# be something you can do by forgetting a line.
alt=$(awk '
  /^% alt:/      { sub(/^% alt:[ \t]*/, ""); buf = $0; grab = 1; next }
  grab && /^%   / { sub(/^%[ \t]*/, ""); buf = buf " " $0; next }
  grab           { grab = 0 }
  END            { print buf }
' "figures/$n.tex")
if [ -z "$alt" ]; then
  echo "error: figures/$n.tex has no '% alt:' line." >&2
  echo "       Every figure needs alt text; it lives with the drawing, not the post." >&2
  exit 1
fi
width=$(sed -n 's/^% width:[[:space:]]*\([0-9][0-9]*\).*/\1/p' "figures/$n.tex" | head -1)

# JSON-escape the alt (backslash and double quote), then emit the sidecar.
esc_alt=$(printf '%s' "$alt" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')
if [ -n "$width" ]; then
  printf '{\n  "alt": "%s",\n  "width": %s\n}\n' "$esc_alt" "$width" > "src/assets/diagrams/$n.json"
else
  printf '{\n  "alt": "%s"\n}\n' "$esc_alt" > "src/assets/diagrams/$n.json"
fi

echo "web    -> src/assets/diagrams/$n.svg"
echo "meta   -> src/assets/diagrams/$n.json"
echo "paper  -> build/$n.pdf"
