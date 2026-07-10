# x³ Exploded-Cube Figure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second figure to the product-rule Journal note that shows the derivative of x³ as an exploded cube — three colored x²dx slabs plus faint gray-dashed subleading pieces — built through the existing TikZ→SVG figure pipeline.

**Architecture:** Introduce two theme-safe figure palette vars (`--fig-blue`, `--fig-orange`) across the four pipeline files, retheme the existing 2D figure onto the shared blue, author `figures/cube-x3.tex` as a self-contained isometric TikZ drawing, then wire it into `note-product-rule.mdx`. Verification is the build-time figure guard plus visual-check screenshots in both themes — this is figure authoring, not TDD, so tasks end in build/visual checks rather than unit tests.

**Tech Stack:** Astro, TikZ/LaTeX (`latex` + `pdflatex` + `dvisvgm`), the `./fig.sh` pipeline, `<Figure>` component, CSS custom properties.

## Global Constraints

- **Only the palette colors** may appear in a figure: `ink` (#000000), `muted` (#555555), `figred` (#B91C1C), `figblue` (#1D4ED8), `figorange` (#C2410C). Any other hex won't flip with the theme and fails `npm run check:figures`.
- **Sentinel hex = light-theme value** (pipeline convention, so the PDF proof looks like light mode).
- **New light sentinels must not be dvisvgm-compactible** — verified: `#1d4ed8` and `#c2410c` have no doubled-nibble channels, so only the long form appears; each gets exactly one long-form `fig.sh` rewrite rule.
- **Never bake** `#fff`, `#000`, `#1a1a1a`, `#0f172a`, `#e2e8f0` into an SVG.
- Dimension figures in mm (`x=1mm, y=1mm`); scale geometry via coordinates, text via pt — independent dials.
- Commit only the changes for each task; don't push.
- Finish the whole change with a clean `npm run build`.

---

### Task 1: Add `--fig-blue` and `--fig-orange` to the palette plumbing

Wire the two new figure colors through all four pipeline files so any figure can use `figblue`/`figorange` and have them flip with the theme. No figure consumes them yet — this task's deliverable is verified by rebuilding an existing figure and confirming the guard still passes.

**Files:**
- Modify: `figures/_preamble.tex` (the `\definecolor` block, ~line 19-22)
- Modify: `fig.sh` (the `perl` rewrite block, ~line 29-35)
- Modify: `src/styles/global.css` (`:root` ~line 23 and `[data-theme="dark"]` ~line 50, next to `--fig-red`)
- Modify: `scripts/check-figures.mjs` (confirm-only; no edit expected)
- Modify: `DESIGN.md` (palette table, add two rows)

**Interfaces:**
- Produces: TikZ colors `figblue` / `figorange`; CSS vars `--fig-blue` / `--fig-orange`; `fig.sh` rewrites `#1d4ed8`→`var(--fig-blue, #1d4ed8)` and `#c2410c`→`var(--fig-orange, #c2410c)`.

- [ ] **Step 1: Add the TikZ color definitions**

In `figures/_preamble.tex`, after the `\definecolor{figred}...` line, add:

```latex
\definecolor{figblue}{HTML}{1D4ED8}
\definecolor{figorange}{HTML}{C2410C}
```

Also extend the palette comment above the block to list the two new mappings:

```latex
%   figblue   #1d4ed8 -> var(--fig-blue, #1d4ed8)
%   figorange #c2410c -> var(--fig-orange, #c2410c)
```

- [ ] **Step 2: Add the fig.sh rewrite rules**

In `fig.sh`, inside the `perl -pe '...'` block, add these two lines immediately after the `s/#b91c1c\b.../` line and before the final `s/currentColor/.../` line:

```perl
  s/#1d4ed8\b/var(--fig-blue, #1d4ed8)/gi;
  s/#c2410c\b/var(--fig-orange, #c2410c)/gi;
```

(Long form only — these hexes do not compact. Placing them before the trailing `currentColor` wrap keeps ink handling last, matching the existing order.)

- [ ] **Step 3: Add the CSS variables (both themes)**

In `src/styles/global.css`, in the `:root` block next to `--fig-red: #b91c1c;` add:

```css
	--fig-blue: #1d4ed8;
	--fig-orange: #c2410c;
```

In the `[data-theme="dark"]` block next to `--fig-red: #f87171;` add:

```css
	--fig-blue: #60a5fa;
	--fig-orange: #fb923c;
```

- [ ] **Step 4: Confirm the figure guard needs no change**

Run: `grep -nE "1d4ed8|c2410c|fig-blue|fig-orange" scripts/check-figures.mjs`
Expected: no matches. The new sentinels are not in `FORBIDDEN`, and they become `var(--…, #hex)` fallbacks which `stripVarFallbacks` already removes. No edit to this file.

- [ ] **Step 5: Add the two rows to DESIGN.md palette table**

In `DESIGN.md`, in the color palette table, after the `--fig-red` context (or in the figure-color area), add rows documenting:

```markdown
| `--fig-blue` | `#1d4ed8` | `#60a5fa` | Figure-only blue (legible on white; dark = the accent). |
| `--fig-orange` | `#c2410c` | `#fb923c` | Figure-only orange for a third distinct slab color. |
```

(Match the existing table's exact column structure — read the surrounding rows first and mirror them.)

- [ ] **Step 6: Verify the plumbing by rebuilding an existing figure**

Run: `./fig.sh product-rule && npm run check:figures`
Expected: `web -> src/assets/blog/product-rule.svg` and `✓ figure theme check: N SVG(s) clean`. (This rebuild does not yet use the new colors; it just proves the pipeline still runs and the guard passes.) Then `git checkout src/assets/blog/product-rule.svg` to discard the no-op rebuild — Task 2 regenerates it intentionally.

- [ ] **Step 7: Commit**

```bash
git add figures/_preamble.tex fig.sh src/styles/global.css DESIGN.md
git commit -m "Add --fig-blue and --fig-orange figure palette colors"
```

---

### Task 2: Retheme the 2D product-rule figure onto `figblue`

Switch the existing figure's blue strip from `accent` (near-black on light) to the new legible `figblue`, so both figures share one blue.

**Files:**
- Modify: `figures/product-rule.tex` (the `accent`-colored draw + labels, lines 16, 20, 25)
- Regenerate: `src/assets/blog/product-rule.svg` (via `./fig.sh`)

**Interfaces:**
- Consumes: `figblue` from Task 1.

- [ ] **Step 1: Swap accent → figblue in the figure**

In `figures/product-rule.tex`, change every `accent` to `figblue`:
- line 16: `\draw[edge, accent] (0,\G) rectangle (\F,\G+\dg);` → `\draw[edge, figblue] ...`
- line 20: `\node[left, text=accent] at (-2,\G+\dg/2) {$dg$};` → `text=figblue`
- line 25: `\node[text=accent] at (\F/2,\G+\dg/2) {$f\,dg$};` → `text=figblue`

Leave `ink`, `muted`, `figred` untouched.

- [ ] **Step 2: Rebuild the SVG**

Run: `./fig.sh product-rule`
Expected: `web -> src/assets/blog/product-rule.svg`.

- [ ] **Step 3: Confirm the blue mapped to the var**

Run: `grep -c "var(--fig-blue" src/assets/blog/product-rule.svg`
Expected: a count ≥ 1 (the strip stroke + the two labels). Also `grep -c "var(--color-accent" src/assets/blog/product-rule.svg` should now be `0`.

- [ ] **Step 4: Run the figure guard**

Run: `npm run check:figures`
Expected: `✓ figure theme check: N SVG(s) clean`.

- [ ] **Step 5: Visual-check the retheme in both modes**

Use the `visual-check` skill to screenshot the product-rule post at `/blog/note-product-rule` (dev server) in light and dark mode. Confirm the $f\,dg$ strip and $dg$ label are now a clearly legible blue (not near-black) on white, and still read well on slate.

- [ ] **Step 6: Commit**

```bash
git add figures/product-rule.tex src/assets/blog/product-rule.svg
git commit -m "Retheme product-rule figure onto legible fig-blue"
```

---

### Task 3: Scaffold `cube-x3.tex` — isometric helper + left solid cube

Create the new figure file from the template and establish the isometric projection helper plus the left-hand solid `x³` cube. Stop here for a first visual check before adding the exploded view.

**Files:**
- Create: `figures/cube-x3.tex`
- Generates: `src/assets/blog/cube-x3.svg`, `build/cube-x3.pdf`

**Interfaces:**
- Produces: a `\coordinate`/point convention `\I{a}{b}{c}` (or three `\def`'d direction vectors) mapping cube-space (right `a`, up `b`, depth `c`) to 2D mm, reused by all later tasks. Big cube edge `\X`, small step `\dx`.

- [ ] **Step 1: Copy the template**

Run: `cp figures/_template.tex figures/cube-x3.tex`
This carries the driver switch and `\input{_preamble}` verbatim.

- [ ] **Step 2: Replace the drawing body with the projection helper + left cube**

Replace the `\begin{document}...\end{document}` body of `figures/cube-x3.tex` with:

```latex
\begin{document}
\begin{tikzpicture}[x=1mm, y=1mm]
  % Isometric-ish projection: cube-space (a=right, b=up, c=depth) -> page mm.
  % Depth axis goes up-and-right for a standard "3/4 view" cube.
  \def\ax{1}\def\ay{0}      % right  direction (page dx,dy per unit a)
  \def\bx{0}\def\by{1}      % up     direction
  \def\cx{0.5}\def\cy{0.35} % depth  direction (foreshortened)
  % Point macro: \P{a}{b}{c} expands to a page coordinate in mm.
  \newcommand{\P}[3]{({(#1)*\ax + (#2)*\bx + (#3)*\cx}, {(#1)*\ay + (#2)*\by + (#3)*\cy})}

  \def\X{40}   % big cube edge
  \def\dx{10}  % growth step

  % --- Left: solid cube x^3 (three visible faces). Origin at its near-bottom-left.
  \begin{scope}[shift={(0,0)}]
    % front face
    \draw[edge, ink] \P{0}{0}{0} -- \P{\X}{0}{0} -- \P{\X}{\X}{0} -- \P{0}{\X}{0} -- cycle;
    % top face
    \draw[edge, ink] \P{0}{\X}{0} -- \P{\X}{\X}{0} -- \P{\X}{\X}{\X} -- \P{0}{\X}{\X} -- cycle;
    % right face
    \draw[edge, ink] \P{\X}{0}{0} -- \P{\X}{\X}{0} -- \P{\X}{\X}{\X} -- \P{\X}{0}{\X} -- cycle;
    \node[text=ink] at \P{\X/2}{\X/2}{0} {$x^3$};
  \end{scope}
\end{tikzpicture}
\end{document}
```

- [ ] **Step 3: Build it**

Run: `./fig.sh cube-x3`
Expected: `web    -> src/assets/blog/cube-x3.svg` and `paper  -> build/cube-x3.pdf` with no LaTeX error. If `latex` errors, read `build/cube-x3.log`.

- [ ] **Step 4: Visual-check the left cube**

Use `visual-check` (or open `build/cube-x3.pdf`) to confirm a clean 3/4-view cube with a centered `$x^3$` label reads correctly. Adjust `\cx`/`\cy` foreshortening if the cube looks skewed. Do not proceed until the base cube looks right.

- [ ] **Step 5: Run the guard and commit**

```bash
npm run check:figures
git add figures/cube-x3.tex src/assets/blog/cube-x3.svg
git commit -m "Scaffold cube-x3 figure: projection helper + solid x^3 cube"
```

---

### Task 4: Add the arrow + gray-dashed ghost of the grown cube

Add the transition arrow and, to the right, the faint dashed ghost of the grown cube (x+dx)³ that the slabs will sit against.

**Files:**
- Modify: `figures/cube-x3.tex`
- Regenerate: `src/assets/blog/cube-x3.svg`

**Interfaces:**
- Consumes: `\P`, `\X`, `\dx` from Task 3.
- Produces: a right-hand scope shifted by `\def\Rx{...}` (page mm) so later tasks place slabs in the same local cube-space; the grown edge `\Xg = \X + \dx`.

- [ ] **Step 1: Add arrow + ghost cube**

In `figures/cube-x3.tex`, before `\end{tikzpicture}`, add:

```latex
  % --- Arrow between the two cubes.
  \def\Rx{95}  % page-mm x-shift to the right-hand exploded view
  \draw[edge, ink, ->] (55, {\X/2}) -- (\Rx-8, {\X/2});

  % --- Right: exploded grown cube. Ghost of (x+dx)^3 as faint dashed edges.
  \begin{scope}[shift={(\Rx,0)}]
    \def\Xg{50} % \X + \dx
    % ghost: 9 visible edges of the grown cube
    \draw[hair, muted, dashed] \P{0}{0}{0} -- \P{\Xg}{0}{0} -- \P{\Xg}{\Xg}{0} -- \P{0}{\Xg}{0} -- cycle;
    \draw[hair, muted, dashed] \P{0}{\Xg}{0} -- \P{\Xg}{\Xg}{0} -- \P{\Xg}{\Xg}{\Xg} -- \P{0}{\Xg}{\Xg} -- cycle;
    \draw[hair, muted, dashed] \P{\Xg}{0}{0} -- \P{\Xg}{\Xg}{0} -- \P{\Xg}{\Xg}{\Xg} -- \P{\Xg}{0}{\Xg} -- cycle;
  \end{scope}
```

(`\Rx` and `\Xg` values are starting guesses — tune in Step 3.)

- [ ] **Step 2: Build**

Run: `./fig.sh cube-x3`
Expected: clean build.

- [ ] **Step 3: Visual-check spacing**

Use `visual-check`/PDF: confirm the arrow points from the solid cube to the ghost, the two cubes don't overlap, and the ghost reads as faint/secondary (muted dashed). Tune `\Rx` (horizontal gap) and the arrow endpoints if crowded.

- [ ] **Step 4: Guard + commit**

```bash
npm run check:figures
git add figures/cube-x3.tex src/assets/blog/cube-x3.svg
git commit -m "cube-x3: add arrow and dashed ghost of grown cube"
```

---

### Task 5: Add the three colored x²dx leading slabs

Add the three leading slabs — top (figred), front (figorange), right (figblue) — each an x×x×dx box pulled slightly out from the ghost along its outward normal, each labeled $x^2\,dx$.

**Files:**
- Modify: `figures/cube-x3.tex`
- Regenerate: `src/assets/blog/cube-x3.svg`

**Interfaces:**
- Consumes: `\P`, `\X`, `\dx`, the right-hand scope from Task 4.

- [ ] **Step 1: Add the three slabs inside the right-hand scope**

Inside the `\begin{scope}[shift={(\Rx,0)}]` block (after the ghost, before its `\end{scope}`), add. Each slab is drawn as its three visible faces so it reads as a 3D box; `\pull` offsets it outward from the ghost so the explosion is visible:

```latex
    \def\pull{7}
    % TOP slab (figred): sits above the x-cube, thickness dx in +b (up).
    \begin{scope}[shift=\P{0}{\pull}{0}]
      \draw[edge, figred] \P{0}{\X}{0} -- \P{\X}{\X}{0} -- \P{\X}{\X+\dx}{0} -- \P{0}{\X+\dx}{0} -- cycle; % front
      \draw[edge, figred] \P{0}{\X+\dx}{0} -- \P{\X}{\X+\dx}{0} -- \P{\X}{\X+\dx}{\X} -- \P{0}{\X+\dx}{\X} -- cycle; % top
      \draw[edge, figred] \P{\X}{\X}{0} -- \P{\X}{\X+\dx}{0} -- \P{\X}{\X+\dx}{\X} -- \P{\X}{\X}{\X} -- cycle; % right
      \node[text=figred] at \P{\X/2}{\X+\dx/2}{\X/2} {$x^2\,dx$};
    \end{scope}
    % RIGHT slab (figblue): thickness dx in +a (right).
    \begin{scope}[shift=\P{\pull}{0}{0}]
      \draw[edge, figblue] \P{\X}{0}{0} -- \P{\X+\dx}{0}{0} -- \P{\X+\dx}{\X}{0} -- \P{\X}{\X}{0} -- cycle; % front
      \draw[edge, figblue] \P{\X}{\X}{0} -- \P{\X+\dx}{\X}{0} -- \P{\X+\dx}{\X}{\X} -- \P{\X}{\X}{\X} -- cycle; % top
      \draw[edge, figblue] \P{\X+\dx}{0}{0} -- \P{\X+\dx}{\X}{0} -- \P{\X+\dx}{\X}{\X} -- \P{\X+\dx}{0}{\X} -- cycle; % right
      \node[text=figblue] at \P{\X+\dx/2}{\X/2}{\X/2} {$x^2\,dx$};
    \end{scope}
    % FRONT slab (figorange): thickness dx toward viewer, in -c (depth) ... drawn at front face pulled in -c.
    \begin{scope}[shift=\P{0}{0}{-\pull}]
      \draw[edge, figorange] \P{0}{0}{0} -- \P{\X}{0}{0} -- \P{\X}{\X}{0} -- \P{0}{\X}{0} -- cycle; % front face of slab
      \draw[edge, figorange] \P{0}{\X}{0} -- \P{\X}{\X}{0} -- \P{\X}{\X}{-\dx} -- \P{0}{\X}{-\dx} -- cycle; % top
      \draw[edge, figorange] \P{\X}{0}{0} -- \P{\X}{\X}{0} -- \P{\X}{\X}{-\dx} -- \P{\X}{0}{-\dx} -- cycle; % right
      \node[text=figorange] at \P{\X/2}{\X/2}{-\dx/2} {$x^2\,dx$};
    \end{scope}
```

Note: the exact face list / normal direction for the front slab may need adjustment once rendered — the deliverable is "three distinct pulled-out slabs, each labeled $x^2\,dx$, one per axis," not these coordinates verbatim. Tune in Step 3.

- [ ] **Step 2: Build**

Run: `./fig.sh cube-x3`
Expected: clean build. On LaTeX error, check `build/cube-x3.log`.

- [ ] **Step 3: Visual-check — this is the crux stage**

Use `visual-check` in **both** light and dark mode. Confirm: (a) three slabs, one red / one orange / one blue, each clearly a 3D slab pulled off the ghost along a different axis; (b) each labeled `$x^2\,dx$` in its own color, label legible and not colliding; (c) all three colors legible on white AND slate. Iterate on `\pull`, face lists, and label positions until it matches the reference sketch's "three colored slabs off a ghost cube" reading. Rebuild after each tweak.

- [ ] **Step 4: Guard + commit**

```bash
npm run check:figures
git add figures/cube-x3.tex src/assets/blog/cube-x3.svg
git commit -m "cube-x3: add three colored x^2 dx slabs"
```

---

### Task 6: Add the gray-dashed subleading pieces

Add the three thin `x·dx²` columns and the `dx³` corner as faint gray dashed volumes (unlabeled) so the full (x+dx)³ decomposition is visible as "leading colored + subleading faint."

**Files:**
- Modify: `figures/cube-x3.tex`
- Regenerate: `src/assets/blog/cube-x3.svg`

**Interfaces:**
- Consumes: `\P`, `\X`, `\dx`, the right-hand scope from Tasks 4–5.

- [ ] **Step 1: Add subleading pieces inside the right-hand scope**

After the three slabs, before the scope's `\end{scope}`, add the three `x·dx²` edge-columns (each `x` long, `dx×dx` cross-section, along one axis at the far corner) and the `dx³` corner, all `hair, muted, dashed`:

```latex
    % Subleading: three x·dx^2 columns (dashed) along each axis at the far edges,
    % and the dx^3 corner. Faint — these vanish in the limit.
    % column along a (right) at top-back edge:
    \draw[hair, muted, dashed] \P{0}{\X}{\X} -- \P{\X}{\X}{\X} -- \P{\X}{\X+\dx}{\X+\dx} -- \P{0}{\X+\dx}{\X+\dx} -- cycle;
    % column along b (up) at right-back edge:
    \draw[hair, muted, dashed] \P{\X}{0}{\X} -- \P{\X}{\X}{\X} -- \P{\X+\dx}{\X}{\X+\dx} -- \P{\X+\dx}{0}{\X+\dx} -- cycle;
    % column along c (depth) at top-right edge:
    \draw[hair, muted, dashed] \P{\X}{\X}{0} -- \P{\X}{\X}{\X} -- \P{\X+\dx}{\X+\dx}{\X} -- \P{\X+\dx}{\X+\dx}{0} -- cycle;
    % dx^3 corner cube at the far top-right-back:
    \draw[hair, muted, dashed] \P{\X}{\X}{\X} -- \P{\X+\dx}{\X}{\X} -- \P{\X+\dx}{\X+\dx}{\X} -- \P{\X}{\X+\dx}{\X} -- cycle;
```

The exact placement of the subleading pieces is secondary — they must read as *faint, unlabeled, clearly behind/between the colored slabs*. Tune in Step 3; if they clutter the figure, simplify to just indicating the `dx³` corner + minimal hint of the columns.

- [ ] **Step 2: Build**

Run: `./fig.sh cube-x3`
Expected: clean build.

- [ ] **Step 3: Visual-check the full figure, both themes**

Use `visual-check` in light and dark. The colored slabs must dominate; the muted dashed subleading pieces must recede. If they fight the slabs for attention, reduce them (fewer edges) rather than adding more. Confirm the whole right-hand view still reads as "grown cube = 3 colored slabs + faint remainder."

- [ ] **Step 4: Guard + commit**

```bash
npm run check:figures
git add figures/cube-x3.tex src/assets/blog/cube-x3.svg
git commit -m "cube-x3: add faint dashed subleading pieces"
```

---

### Task 7: Wire the figure into note-product-rule.mdx

Add the import, a short prose bridge in Sergio's voice, and the `<Figure>` block after the existing rectangle figure.

**Files:**
- Modify: `src/content/blog/note-product-rule.mdx`

**Interfaces:**
- Consumes: `src/assets/blog/cube-x3.svg` from Tasks 3–6; the `Figure` component already imported at the top of the post.

- [ ] **Step 1: Add the import**

In `note-product-rule.mdx`, after the existing `import productRule ...` line (line 16), add:

```jsx
import cubeX3 from '../../assets/blog/cube-x3.svg?raw';
```

- [ ] **Step 2: Add prose + Figure after the product rule conclusion**

After the existing closing line ("the product rule.", line 38), invoke the `portfolio-copy` skill to write 2–3 sentences bridging from the 2D rectangle to the 3D cube for x³ (same idea, one dimension up: three faces each contribute an x²dx slab → derivative 3x², dashed remainder is higher-order and drops out). Then add:

```jsx
<Figure
  svg={cubeX3}
  width={520}
  alt="A cube of volume x³ growing by dx on three faces: three x²dx slabs plus faint higher-order pieces"
  caption="Growing the cube adds three x²dx slabs — the derivative 3x² — plus dashed higher-order pieces that vanish."
/>
```

(Width is a starting value; adjust in Step 4 so the figure isn't oversized in-column.)

- [ ] **Step 3: Build the site**

Run: `npm run build`
Expected: clean build, including the `prebuild` figure guard (`✓ figure theme check`) and Pagefind index. Fix any MDX/import errors before proceeding.

- [ ] **Step 4: Visual-check the post end-to-end, both themes**

Use `visual-check` on `/blog/note-product-rule`: confirm both figures render, the new cube figure sits well in-column at the chosen `width`, labels are body-text sized, and everything is legible in light and dark mode. Adjust `width` / caption if needed and rebuild.

- [ ] **Step 5: Commit**

```bash
git add src/content/blog/note-product-rule.mdx
git commit -m "Add exploded-cube x^3 figure to product-rule note"
```

---

## Self-Review Notes

- **Spec coverage:** palette work (Task 1), retheme 2D figure (Task 2), cube-x3.tex with ghost/slabs/subleading (Tasks 3–6), wire into post (Task 7), verification via check:figures + visual-check in both themes (every task) — all spec sections covered.
- **Placeholders:** coordinate values in Tasks 3–6 are explicit starting code, with each task's Step 3 flagged as the tuning/visual gate — this is inherent to figure authoring, not a placeholder; the deliverable criterion ("what it must read as") is stated for each.
- **Type/name consistency:** `\P`, `\X`, `\dx`, `\Rx`, `\Xg`, `\pull`, `figblue`, `figorange`, `--fig-blue`, `--fig-orange` used consistently across tasks and match the spec.
