# Projects Page Polish — Design Spec

**Date:** 2026-06-30
**Status:** Approved (pending spec review)
**Branch:** `feat/projects-polish`

## Goal

Bring the Projects page up to the craft level of the Journal, **without touching
the project cards** (their 3D tilt + cursor glare + outline activation are the
page's signature and must not be competed with or piled onto). Two scoped
additions:

1. A **signature ambient touch**: a faint, static blueprint/engineering grid
   behind the "Projects" hero header — Projects' own quiet character, thematically
   "things built," visually distinct from the Journal's organic dust field.
2. **Dim, don't hide** on filter: non-matching cards desaturate + dim in place
   instead of being removed, so the grid never reflows and matches "light up."

## Non-goals (explicitly out of scope)

- No changes to the card hover interaction (tilt/glare/outline/edge-glow).
- No live project count in the header (the pill counts already cover this).
- No spacing/rhythm changes (spacing is fine as-is).
- No "All" filter (the filters are non-exclusive toggles; an "All" doesn't fit).
- No animation on the grid (static, by decision — reads as more intentional).

## Feature 1: Blueprint grid behind the header

### Visual target (chosen from a live 3-way demo)

- **Style A — ruled grid:** even engineering-paper grid; thin lines with every
  **5th line brighter** (major/minor). Classic graph-paper / blueprint.
- **Static** — drawn once, no drift/animation.
- **Full-width**, fading to nothing **downward** (toward the cards) and softly at
  the **left/right edges**, so it dissolves into the page and never visually
  touches the card grid.
- Accent-colored lines, adapting to light/dark theme.
- Current demo density/brightness approved: cell ≈ 26px; minor-line alpha ≈ 0.10,
  major-line (every 5th) alpha ≈ 0.22, scaled by the downward fade. Final values
  confirmed by visual inspection (user performs it).

### Architecture

- **`src/components/BlueprintGrid.astro`** (new): a `<canvas>` + scoped CSS + a
  small client `<script>`. Self-contained; reads only the accent color and its
  parent's size. No props required (optional `class?` for flexibility).
  - **Does:** draws the static ruled grid once, sizing to its parent, with the
    downward + side-edge fade. Redraws on `resize` and on **theme change**
    (so the line color follows light/dark). No rAF loop, no IntersectionObserver,
    no reduced-motion branch (nothing animates).
  - **Depends on:** `--color-accent` (read via `getComputedStyle`); its parent
    element's box for sizing; a `data-theme` change signal on `<html>`.

### Rendering details

- Canvas is `position: absolute; inset: 0; pointer-events: none; z-index: 0`
  inside `.projects-hero`, which becomes `position: relative`. The title,
  subtitle, and (existing) filter bar render above via `z-index: 1`.
- **Sizing:** measure the parent (`.projects-hero`) rect; set canvas CSS width to
  the **full viewport width** and offset left to bleed edge-to-edge (mirror the
  glow field's full-bleed technique: `canvas.style.left = -parentRect.left`,
  width = `document.documentElement.clientWidth`). Height = the hero's height.
  Use DPR scaling (`Math.min(devicePixelRatio, 2)`).
- **Grid:** vertical lines drawn with a top→bottom linear-gradient stroke that
  fades to transparent toward the bottom; horizontal lines drawn per-row with an
  alpha scaled by a `vfade(y)` factor (1 at top → 0 near bottom). Every 5th line
  (both axes) uses the brighter "major" alpha.
- **Fades (decided, not either/or):** The **downward fade is done in-canvas**
  (vertical lines use a top→bottom gradient stroke; horizontal lines use the
  `vfade(y)` alpha) — this is already how the approved demo rendered it. The
  **side-edge fade is done with a CSS mask** on the canvas: a horizontal
  linear-gradient `transparent 0 → #000 8% → #000 92% → transparent 100%`.
  (No `mask-composite` needed since only the horizontal mask is used — the
  vertical fade lives in the canvas pixels, not the mask.)
- **Theme redraw:** observe `data-theme` on `<html>` with a `MutationObserver`
  (attributeFilter `["data-theme"]`) and redraw with the re-read accent. Also
  redraw on `window.resize`. Re-init idempotently on `astro:page-load` via a
  `__bpBound` flag (mirror the site's existing canvas components).

### Integration

- **`src/pages/projects.astro`:** import `BlueprintGrid`; mount it as the first
  child of `.projects-hero`. Add `position: relative;` to `.projects-hero` and
  `position: relative; z-index: 1;` to `.projects-hero h1`, `.projects-hero p`,
  and `.projects-filters` so they sit above the canvas. No other markup changes.

## Feature 2: Dim, don't hide (filter as a lens)

### Behavior

- Currently the filter script sets `card.style.display = "none"` on non-matching
  cards, which **reflows** the grid. Change to: toggle a `.dimmed` class instead,
  leaving every card in the layout.
- **Dimmed style:** `filter: grayscale(1); opacity: 0.4;` with a smooth
  transition. **No scale / size change** — layout stays perfectly stable.
- **When no filter is active:** no card is dimmed (all vivid), exactly as today.
- **Dimmed cards are interactively inert:** the tilt/glare hover effect does NOT
  run on a `.dimmed` card (reinforces the lens metaphor). They remain **clickable**
  (real projects) via the existing stretched link overlay.

### Implementation

- **`projects.astro` filter script (`apply()`):** replace
  `card.style.display = show ? "" : "none"` with
  `card.classList.toggle("dimmed", !show)`. Keep the `visible` counter logic for
  the empty state (a dimmed card still "counts" as present, so `visible` reflects
  matches; see empty state below).
- **CSS:** add
  ```css
  .project-card.dimmed {
    filter: grayscale(1);
    opacity: 0.4;
    transition: opacity 0.3s ease, filter 0.3s ease;
  }
  ```
  Ensure the base `.project-card` transition includes `opacity`/`filter` so the
  un-dim is equally smooth (its transition currently covers transform/box-shadow/
  border-color; add opacity + filter).
- **Tilt script:** in `onMove`, the loop currently does
  `if (c.style.display === "none") continue;`. Change the skip condition to
  `if (c.classList.contains("dimmed")) continue;` so dimmed cards get no
  tilt/glare. (They also won't be `display:none` anymore, so the old check is
  obsolete.) On `release`, a card that becomes dimmed while hovered should reset
  to rest — calling the existing `release(card)` path is sufficient.

### Empty state

- The existing `#projects-empty` ("No projects match the selected filters") stays
  in the markup and logic **unchanged**. With only two non-exclusive toggles,
  some card always matches whenever any filter is on, so it's effectively
  unreachable — but harmless to keep. `apply()` continues to compute `visible` as
  the count of matching (non-dimmed) cards and shows the empty state only if
  `visible === 0` (which won't happen in practice).

## Verification

No automated tests (static site; visual). Verification is:

1. `npm run build` clean.
2. Visual inspection (user performs) in **both light and dark themes**:
   - Blueprint grid: static ruled grid behind the "Projects" title, every 5th
     line brighter, fading down + at side edges, adapts to theme, no motion.
     Text/filters fully readable above it. No `overflowX`.
   - Dim-don't-hide: toggling Technical / Teaching desaturates + dims
     non-matching cards **in place** (no reflow), matches stay vivid; toggling
     off restores all; dimmed cards don't tilt/glare on hover but are clickable.
   - Theme toggle redraws the grid color; resize reflows the grid correctly.
   - `astro:page-load` (client-side nav into Projects) re-inits both without
     double-binding.

## Files touched

- **Create:** `src/components/BlueprintGrid.astro`
- **Modify:** `src/pages/projects.astro` (import + mount grid; hero z-index CSS;
  `.dimmed` CSS + base-transition tweak; filter script `apply()`; tilt script
  skip condition).
