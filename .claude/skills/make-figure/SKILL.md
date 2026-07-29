---
name: make-figure
description: Generate a theme-aware figure for this site from a description and/or a sketch/screenshot of the concept, using the repo's TikZ→SVG pipeline (figures/*.tex + fig.sh). Use whenever Sergio asks to make, create, or redo a figure, diagram, or illustration for a post; shares a sketch, whiteboard photo, or screenshot to turn into a site figure; or mentions TikZ, the figure pipeline, or theme-aware diagrams — even if he doesn't say "figure" (e.g. "can we visualize this idea for the post?"). Not for data charts (plots of datasets) or for verifying page CSS (that's visual-check).
---

# Make a figure (TikZ → SVG, theme-aware)

Turn a concept — described in words, sketched on paper, or screenshotted — into a
figure that adapts to the site's light and dark themes. The pipeline and its
reasons live in `src/assets/diagrams/README.md` (read it for anything not covered
here); the palette rules live in `DESIGN.md`. This skill is the distilled
workflow plus the mistakes already made so you don't repeat them.

**Scope: produce and verify the figure, then stop.** Deliverables are
`figures/<name>.tex` and `src/assets/diagrams/<name>.svg`. Do NOT wire the figure
into a post (import + `<Figure>` block) unless explicitly asked. Do NOT commit
unless asked (repo rule).

## Step 0 — Understand the concept, map it to the palette

If a sketch/screenshot is provided, `Read` the image. Identify: the shapes, their
spatial relationships, which elements are emphasized (color) vs. secondary
(gray/dashed), and every label.

Figures may ONLY use the palette (anything else won't flip with the theme and
fails the build guard):

| TikZ name   | Light     | Dark      | Use for |
| ----------- | --------- | --------- | ------- |
| `ink`       | near-black| light slate | primary strokes, main labels |
| `muted`     | #555555   | slate-400 | secondary/ghost elements, dashed hints |
| `figred`    | #b91c1c   | #f87171   | emphasis element #1 |
| `figblue`   | #173f7a   | #60a5fa   | emphasis element #2 |
| `figorange` | #c2410c   | #fb923c   | emphasis element #3 |
| `figbg`     | page bg   | page bg   | OPAQUE fills that occlude (solid objects) |

Sketch colors rarely match this palette. **Propose the mapping in one line and
proceed** — e.g. "mapping: your green arrows → figblue, gray boxes → muted" —
then build. Don't block waiting for approval; Sergio corrects on the render.
If the concept genuinely needs more distinct colors than the palette has, say so
and ask before adding any (a new color means plumbing in 4 files:
`figures/_preamble.tex`, `fig.sh`, `src/styles/global.css`, `DESIGN.md`).

## Step 1 — Start from the template

```sh
cp figures/_template.tex figures/<name>.tex
```

Keep the `\ifnum\pdfoutput` driver switch and `\input{_preamble}` verbatim — they
are what make both the PDF proof and the web SVG build.

## Step 2 — Draw, incrementally

Dimension geometry in mm (`x=1mm, y=1mm`); a main shape of ~40mm reads well at
the site's default figure size. Text is a separate dial (pt): `\normalsize`
already matches the site's body text — scale the *coordinates*, never wrap in
`\resizebox`.

Build in stages (base shape → secondary elements → labels), rendering and
looking between stages (Step 3). Writing 80 lines of coordinates blind and then
debugging the render is slower than 3 look-adjust cycles.

For labels: put each label on its element's *largest visible face*, and check
the render for collisions with other strokes (especially dashed/ghost lines).

**Labels on a slanted or curved segment (a hypotenuse, an angled arrow, a
self-loop) are the case that most often comes out wrong.** A horizontal or
vertical edge is forgiving — `at (mid, offset)` reads fine because the label
naturally clears the stroke. A diagonal one is not: an eyeballed absolute
coordinate (`at (21,16)`, `at (0.65*\a, 0.35*\b)`) routinely lands unbalanced
relative to the figure's other labels, or clips the stroke outright, because it
doesn't actually know where the segment is. Compute it instead: take the
segment's true midpoint and push the label out **along the segment's own
perpendicular normal** (swap-and-negate the direction vector, scale to a few mm,
add to the midpoint) — the same technique as `figures/pythagoras.tex`'s a²/b²
labels, which sit correctly because they're placed via a symmetric offset from
each square's actual center, not a guess. When several labels sit near each
other on non-parallel elements (e.g. the three side labels of a triangle), this
also keeps them visually balanced relative to one another, which an eyeballed
one-off coordinate won't.

## Step 3 — Build, render, and actually look

```sh
./fig.sh <name>          # builds figures/<name>.tex → src/assets/diagrams/<name>.svg
```

If the build fails silently (no output), the error is in `build/<name>.log`:
`grep -A2 '^!' build/<name>.log | head`.

Then render the SVG in both themes and **Read both images**:

```sh
node .claude/skills/make-figure/scripts/render-fig.mjs <name>
# → prints paths to <name>-light.png and <name>-dark.png
```

A clean build proves nothing about the figure. Judge the render against the
concept/sketch: layout right? colors mapped as proposed? labels legible and not
colliding? nothing invisible in dark mode? Iterate coordinates until it matches.
This look-and-compare step is the actual work; everything else is mechanics.

## Step 4 — Guard, then hand off

```sh
npm run check:figures    # fails if any theme-locked hex leaked into the SVG
```

Report to Sergio with: the mapping you chose, both rendered PNGs (Read them into
the conversation via screenshots already taken), and any judgment calls. Offer —
don't perform — the commit (`figures/<name>.tex` + `src/assets/diagrams/<name>.svg`
together) and the post wiring.

## Gotchas (each of these cost a real debugging cycle)

- **`\P` is a reserved LaTeX macro** (pilcrow). So are other single letters.
  Name point/projection macros `\Q` or longer. Error: `Command \P already defined`.
- **`shift={\macro{...}}` won't parse** ("Cannot parse this coordinate").
  Compute the offset explicitly: `shift={({-\pull*\cx},{-\pull*\cy})}`.
- **Solid objects need `fill=figbg`** (opaque page-color fill) — NOT a
  translucent tint of the element's color, and never a literal `#fff`/`#0f172a`
  (the guard rejects baked theme hexes; `figbg` maps to `var(--color-bg)` and
  flips with the theme). Draw filled shapes back-to-front (painter's order) so
  near objects occlude far ones.
- **3D/isometric**: define direction-vector macros (right/up/depth) and build
  faces from them; a depth vector of `(0.5, 0.35)` gives a good 3/4 view. For a
  box, draw its three visible faces (front, top, right).
- **Emphasis vs. ghost**: colored `edge` strokes for the elements that carry the
  idea; `hair, muted, dashed` for context/ghost geometry. If a secondary element
  competes with the primary ones on the render, simplify it rather than
  recoloring it.
- **Dark mode is where figures break**: black strokes on dark bg, or fills that
  don't flip. Never skip the dark render.
- **Eyeballed labels on diagonal segments land unbalanced or clip the stroke**
  (a hypotenuse, an angled arrow, a self-loop). Compute the position from the
  segment's own midpoint + perpendicular normal instead of guessing a
  coordinate — see Step 2.

## Definition of done

1. `./fig.sh <name>` builds clean.
2. `npm run check:figures` passes.
3. You have Read both theme renders and honestly compared them against the
   concept — layout, mapping, labels, occlusion all match.
4. Sergio has seen the renders (or knows where they are) and the mapping.
