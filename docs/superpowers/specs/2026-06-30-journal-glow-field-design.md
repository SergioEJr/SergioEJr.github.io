# Journal Lit Particle Field — Design Spec

**Date:** 2026-06-30
**Status:** Approved (pending spec review)

## Goal

Add a wow-factor background to the Journal header: a slowly drifting dust/gas
field that is **lit by the active filter**. The active filter acts as a moving,
colored light source — particles brighten near it, pick up a directional
highlight on the side facing it, and the surrounding dust glows in the filter's
color. Switching filters glides the light to the newly-active pill, sweeping the
dust as it travels.

## Visual target

**Look B (Balanced)** chosen from a live three-way comparison:

- Medium particle density (~46 on a desktop-width header; scaled by area).
- A focused radial **glow** centered on the light (not a huge diffuse haze).
- Clear **directional shading**: per-particle lighting from distance + angle to
  the light, with a hot (toward white) core tint fading to the accent color.
- The effect reads on arrival but does not fight the header text for attention.

Tuning constants captured from the approved demo (`balanced` look):

```
count      ~46 (area-scaled; see Density below)
glow       0.95–1.05  (glow radius as a fraction of min(W,H))
glowAlpha  ~0.16      (peak glow opacity at the light core)
lightAlpha ~0.75      (proximity brightening weight)
shade      ~0.55      (directional highlight/shadow weight)
baseAlpha  ~0.42      (particle ambient alpha away from light)
rMin/rMax  0.8 / 2.2  (particle radius range, px)
heat       core tint lerps particle color toward white by up to ~0.7
```

These are starting values; final values get dialed in via visual inspection in
both themes. The user performs the visual inspection.

## Architecture

A new dedicated client component renders a `<canvas>` behind the Journal header.
It reads existing page state (the live `--cat-color`, the active filter pill's
rect, and the header's intersection) rather than requiring the filter script to
push to it — so the two stay decoupled.

### Components

- **`src/components/JournalGlowField.astro`** (new)
  - Renders a single `<canvas class="journal-glow-field" aria-hidden="true">`
    plus scoped CSS and a client `<script>`.
  - **Does:** draws the lit dust field; tracks the active filter as a light
    source; glides the light on filter change; fades/pauses on header scroll-out;
    renders a static lit frame under `prefers-reduced-motion`.
  - **Props (all optional, with defaults):** `count?: number` (base particle
    count at reference width, default ~46), `class?: string`. Intensity constants
    live inside the component (not props) to keep the call site clean.
  - **Depends on:** `--cat-color` custom property on `#journal`; the presence of
    a `.j-filter.active` element in the document; the `.j-head` element for the
    fade trigger.

- **`src/components/ParticleField.astro`** (existing) — **untouched.** The
  footer/404 uniform field stays simple. The new component duplicates the small
  amount of drift/seed/resize logic rather than coupling the two.

### Integration point

- **`src/pages/blog/index.astro`** — mount `<JournalGlowField />` as the **first
  child of `.j-head`** (before the eyebrow). `.j-head` is already
  `position: relative; z-index: 1`; the canvas is `position: absolute; inset: 0;
  z-index: 0` so the eyebrow/title/subtitle render above it. The header text
  remains fully readable and selectable (canvas is `pointer-events: none`).
- **No change to the inline filter script.** The field reads state; it does not
  receive pushed updates. (It may add its own `click`/`hashchange` listeners.)

## Behavior / data flow

### Light color

Each frame, read `getComputedStyle(document.getElementById('journal'))
.getPropertyValue('--cat-color')`. The filter script already sets `--cat-color`
on `#journal` on every filter change (`apply()`), so the glow + particle tint
follow the active filter automatically with no extra wiring. Resolve the value to
RGB once per change (cache; only re-parse when the string differs) to avoid
per-frame string parsing. `--cat-color` may be a hex (e.g. `#3b82f6`) or
`var(--color-accent)` for the "All" filter — resolve via a temporary computed
style read so both forms yield concrete RGB.

### Light X position (filter switch) — desktop AND mobile

The light's horizontal anchor is the **center-X of the currently-active filter
element**, measured live from the DOM. This is layout-agnostic by construction:

- **Desktop:** category filters are pills in one wrapping row; the **Notebook**
  filter is plain text (`.j-filter--text`, no pill). Both are
  `.j-filter`-classed and both have a bounding box, so measuring
  `.j-filter.active` works whether the active element is a pill or the plain-text
  Notebook control.
- **Mobile (≤600px):** Notebook becomes a real pill on its **own row below** the
  category pills (a zero-height flex-break divider forces the wrap). Its rect is
  on a different line, but we use only its **center-X** (Y is ignored), so the
  light still lands at the correct horizontal position.

**Rule (single code path, no desktop/mobile branching):**

1. `const active = document.querySelector('.j-filter.active')` — whichever
   element it is (pill or text, any row).
2. Compute `centerX = active.getBoundingClientRect().left + width/2`, expressed
   **relative to the canvas** (subtract the canvas rect's left).
3. Clamp `centerX` to `[0, W]`.
4. Ignore the active element's Y entirely; the light rides a fixed vertical track
   near the bottom of the header band.
5. The light **eases** from its current X to the new target X over ~0.4s
   (cubic ease-out), sweeping the dust during the glide.

**Recompute triggers:** filter click (any `.j-filter`), `hashchange` (filter set
via URL hash / Back), and `resize` (covers desktop↔mobile breakpoint crossover
and orientation change — a resize event fires at the 600px boundary). On each, the
field re-reads `.j-filter.active` and re-measures. **Fallback:** if no active
element is found or measurement fails, target X = header center (`W/2`).

### Scroll behavior — fade, don't track

Per the user's preference, the field does **not** chase the pill pixel-for-pixel
down the page. Instead:

- An **`IntersectionObserver` on `.j-head`** drives a CSS-opacity fade. As the
  header scrolls out of view, the canvas fades to `opacity: 0` and the rAF loop
  pauses. As it scrolls back into view, the canvas fades back in and the loop
  resumes. (Reuses the pause-when-offscreen pattern from `ParticleField`, plus an
  opacity transition for the fade.)
- No per-frame scroll listener; the light's X is measured only on the recompute
  triggers above, which is sufficient because the field is faded out before any
  scroll-induced drift becomes visible.

### Density (area-scaled, layout-aware)

Particle count scales with header area so the field isn't sparse on a tall,
wrapped mobile header or dense on a short wide one. Base `count` is the target at
a reference area (desktop header ≈ full content width × ~210px). Compute:
`N = clamp(round(count * (W*H) / REF_AREA), minN, maxN)` with sane bounds
(e.g. `minN ≈ 18`, `maxN ≈ 80`). Glow radius uses `min(W,H) * glow` so it stays
proportional on tall mobile headers (not a fixed pixel radius).

### Motion

Particles drift slowly with wraparound (same model as `ParticleField`:
`vx/vy ≈ ±0.15`, wrap at edges). A subtle per-particle twinkle
(`0.85 + 0.15*sin`) adds life. The only non-drift motion is the light's eased
glide on filter change.

## Edge cases

- **`prefers-reduced-motion: reduce`** — render exactly one static lit frame
  (dust + glow + lighting from the current filter and current active pill X). No
  drift, no twinkle, no light glide, no fade loop. Mirrors `ParticleField`'s
  reduced-motion handling.
- **Light vs dark theme** — the effect is built on `--cat-color` and additive
  alpha. The dark demo looked right; **light mode must be verified** so the glow
  doesn't wash out or the particles don't disappear. If needed, the glow/particle
  alphas may be nudged per theme via a `[data-theme="dark"]`-aware multiplier read
  from a CSS var or `getComputedStyle`. Final values set by visual inspection.
- **Canvas height differs by layout** — `.j-head` is taller on mobile (text
  wraps). The field sizes to its parent's rect on every `resize()`, and glow
  radius / density scale off measured `W,H`, so tall headers stay proportional.
- **Notebook (plain-text) active on desktop** — `.j-filter--text.active` has a
  bounding box; measured the same as any pill. No special case.
- **No active pill / measurement failure** — fall back to header center X.
- **Re-init across view transitions** — bind once per canvas via a
  `__glowBound` flag (same pattern as `ParticleField` / the filter script);
  initialize on first load and on `astro:page-load`. The `IntersectionObserver`,
  listeners, and rAF are owned per canvas instance and cleaned up / guarded so a
  client-side navigation back to the Journal doesn't double-bind or leak loops.

## Verification

No automated tests (static site; canvas is visual). Verification is:

1. `npm run build` completes clean (41+ pages, Pagefind index intact).
2. Visual inspection (performed by the user) in **both light and dark themes**:
   - Lighting reads at look-B intensity; text stays readable.
   - Switching each filter (News / Math / Physics / All / Notebook) glides the
     light to the correct pill and retints the field.
   - Notebook works on **desktop** (plain-text anchor) and **mobile** (own-row
     pill anchor).
   - Scrolling the header out fades the field; scrolling back fades it in.
   - `prefers-reduced-motion` shows a static lit frame.
   - Resize / breakpoint crossover (600px) and orientation change re-measure the
     light X.

## Out of scope (YAGNI)

- Mouse/cursor-follow lighting (the filter is the only light source).
- Per-frame scroll tracking of the pill (explicitly rejected for a calmer feel).
- Touching `ParticleField.astro` or the footer/404 fields.
- Configurable lighting model via props (constants live in the component).
