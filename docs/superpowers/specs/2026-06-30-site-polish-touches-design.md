# Site polish — thoughtful touches — design

**Date:** 2026-06-30
**Scope:** A curated set of five tasteful, on-brand polish touches across the
portfolio site. Restrained, physics-flavored, all `prefers-reduced-motion`-safe,
none competing with the homepage hero sim.

## Background

The homepage's interactive physics simulation gives the site a big "wow" moment.
The rest of the site is deliberately quiet and premium (subtle 0.2s transitions,
careful reduced-motion guards, view-transition animation intentionally killed to
avoid flashes). The goal here is **a few intentional touches that reward
attention** and reinforce the scientific identity — not animation everywhere.

This spec was brainstormed with visual mockups. Several candidate touches were
**rejected** and are out of scope (see below).

## Goals / the five touches

1. **Draw-on underline on blog post titles.**
2. **Count-up animation on the Journal "N pieces" eyebrow count.**
3. **A reusable drifting-particle field component**, placed in the footer.
4. **A bespoke "potential well" 404 page** (replacing the inherited template
   look), reusing the particle-field component.
5. **Branded text-selection color** site-wide.

## Out of scope (explicitly rejected during brainstorming)

- Nav / magic-bar link underlines (the navbar magic bar stays untouched).
- Project / research **card lift** — cards already have lift + 3D tilt + glare.
- Section-reveal scroll choreography.
- Phase-transition theme toggle.
- Count-up stats on About / Publications / Projects — **Journal only**.
- Focus rings: the site already has custom keyboard-focus rings. Review them;
  only change if a clear improvement, otherwise leave as-is. Default: no change.

## Global constraints

- Every animation must respect `prefers-reduced-motion: reduce` — degrade to the
  final static state, no motion.
- No regression to the existing sticky-navbar / horizontal-overflow rules
  (`overflow-x: clip`, never `hidden`/`auto`).
- Verify CSS changes on `npm run preview` (production build), not just dev — Vite
  HMR can serve stale inlined CSS on ClientRouter navigation.
- Finish with a clean `npm run build`.
- Colors come from existing CSS vars (`--color-*`) and category colors; light +
  dark both handled.

---

## 1. Draw-on underline — blog post titles

**File:** `src/components/JournalPost.astro` (the `.j-post-title` styles).

**Current behavior:** `.j-post-title` has `border-bottom: 2px solid transparent`
at rest; on `.j-post:hover` the border-color fades to `var(--cat-color)`. The
fade is a color transition on a full-width border.

**New behavior:** the underline **draws on from left to right** on hover instead
of fading in uniformly.

- Implement with a pseudo-element (`.j-post-title a::after` or a `::after` on the
  title) that is a 2px bar in `var(--cat-color)`, `transform: scaleX(0)`,
  `transform-origin: left`, transitioning `transform` ~0.3s with an ease like
  `cubic-bezier(.2,.7,.2,1)`. On `.j-post:hover` → `scaleX(1)`.
- Keep no layout shift: reserve the 2px (the title already reserves
  `padding-bottom` for the underline; preserve that).
- **Link-less / static titles** (`.j-post-title--static`, the `noLink` update
  posts) must NOT get the draw-on affordance — they have no destination. Keep
  them with no underline at rest and on hover, as today.
- `prefers-reduced-motion`: skip the `scaleX` transition — the underline appears
  instantly (full width) on hover. No draw-on motion.

**Why a pseudo-element, not the border:** a border can't animate `scaleX`; a
pseudo-element bar can, giving the left-to-right reveal without reflow.

---

## 2. Journal count-up — the "N pieces" eyebrow

**File:** `src/pages/blog/index.astro` (the eyebrow markup `#j-eyebrow-count`
and the inline filter `<script>`), plus a small odometer module.

**Where:** the Journal page eyebrow reads `<label> · <count> pieces`. The
`#j-eyebrow-count` value is the number to animate.

**Behavior:**

- On initial load, the count animates **0 → current count** as an odometer:
  - The visible sequence is an **honest count** (0, 1, 2, …, target) — no random
    or filler digits.
  - The digit strip **scrolls downward** into place (values descend; final value
    rests at the top row, so it can never end blank).
  - Strong **ease-out** so the number visibly *settles* rather than snapping
    (e.g. `cubic-bezier(.12,.9,.18,1)`, ~1.5–1.7s).
- On **filter change** (the existing `apply()` updates the count, e.g. 9 → 3),
  the count-up animates **from the previous value to the new value**, not from 0.
- **Width stability:** reserve the box width for the largest displayed number so
  any trailing text doesn't shift. Use an invisible "ghost" of the target value
  (or a `ch`-based min-width) and `font-variant-numeric: tabular-nums`.
- **Font-load jitter fix (critical):** the odometer must measure/animate only
  **after `document.fonts.ready`** resolves. The hard-refresh jitter observed in
  brainstorming was the web font swapping in after first paint and reflowing the
  digits. Gate the first animation on `await document.fonts.ready`.
- `prefers-reduced-motion`: set `#j-eyebrow-count` to the final number
  immediately, no roll. Also applies on filter changes (instant update).

**Structure / isolation:** implement the odometer as a small, focused helper
(e.g. `src/utils/odometer.ts` exporting a function that, given the count element
and a target value, animates from its current value to the target, honoring
reduced-motion and fonts-ready). The Journal inline script calls it on load and
inside `apply()` after computing `visible`. Keeping it a separate module keeps
`index.astro`'s script focused and makes the animation testable in isolation.

**Interaction with ClientRouter:** the Journal script re-inits on
`astro:page-load`; the count-up should run on (re)init too, so navigating into
the Journal animates the count. Guard against double-binding consistent with the
existing `dataset.filtersInitialized` pattern.

---

## 3. Drifting-particle field — reusable component

**File (new):** `src/components/ParticleField.astro`.

**What:** a faint field of small dots that slowly drift/twinkle — a quiet echo of
the hero sim. Very low opacity, accent-tinted, behind content.

**Requirements:**

- **Self-contained and reusable.** Consumed by the footer and the 404. It renders
  its own absolutely-positioned layer and accepts light configuration via props
  (at minimum: particle `count`/density and `opacity`/intensity; optionally a
  color or `class` hook). Sensible defaults so `<ParticleField />` just works.
- **Subtlety first.** Default opacity low enough to read as texture, not
  decoration. It must never reduce text contrast/readability of the content above
  it.
- **Performance.** Lightweight. Prefer a small canvas with a capped particle
  count and a `requestAnimationFrame` loop, OR CSS-animated dots if that hits the
  same look more cheaply. Pause/stop the loop when off-screen if canvas-based.
- **`prefers-reduced-motion`:** render the particles **static** (no drift) — a
  still field is fine; just no motion. Guard the rAF loop behind the media query
  exactly as `HeroSim.astro` / `index.astro` already do.
- **Positioning:** the component fills its positioned parent
  (`position:absolute; inset:0; pointer-events:none; z-index` below content). The
  consumer marks the container `position: relative; overflow: hidden`.

**Note on existing patterns:** mirror the reduced-motion / rAF guard style
already used in `HeroSim.astro` and `index.astro` for consistency.

---

## 4. Potential-well 404 — bespoke page

**File:** `src/pages/404.astro` (replace the current inherited-template design).

**Concept:** a particle that has **escaped a potential well** — the metaphor for a
page no longer bound to the site. Physics-themed, restrained, a little clever.

**Composition:**

- A **potential-well curve** (an SVG `U`/double-well shaped path in
  `--color-border` / muted accent) sitting in the lower portion of a hero panel.
- An **animated "escapee" particle** (a small glowing accent dot) that animates
  along a path suggesting it has tunneled/escaped up and out of the well. Subtle,
  looping, slow.
- The **drifting-particle field** (component from §3) behind it.
- Copy in the site's voice (physicist, restrained, lightly clever). First-pass
  wording — refine during implementation:
  - Eyebrow/chip: `Error · 404`.
  - Headline (serif): e.g. *"A particle escaped the well."*
  - Sub: e.g. *"This page isn't bound to the site anymore — it may have moved or
    never existed."*
- Keep the **useful navigation** from the current 404: primary actions (Return
  Home, Read the Journal/Blog) and the quick-destinations list (Publications,
  Projects, About, Blog/Journal). Don't lose utility for cleverness.
- Reuse existing tokens, button styles (`.btn` / `.btn-outline`), `Header`,
  `Footer`, `BaseHead`, and `pageFade` as the current page does.

**`prefers-reduced-motion`:** the escapee particle and field are static; the
composition still reads (the particle simply sits outside the well).

**Responsive:** collapse to a single column on narrow widths (the current page
already does this; preserve it).

**Voice:** use the `portfolio-copy` skill when finalizing the 404 copy so it
matches Sergio's grounded, no-hype voice.

---

## 5. Branded text-selection

**File:** `src/styles/global.css`.

- Add a site-wide `::selection` (and `::-moz-selection` if needed) using the
  accent palette: a tinted background with readable text, defined for **both**
  light and dark themes (use the `--color-*` vars / `--color-accent-light` so it
  flips with `[data-theme="dark"]`).
- Keep it tasteful — enough tint to feel branded, not enough to hurt legibility
  of selected text.
- This is global and static; no motion considerations.

---

## Affected files (summary)

- `src/components/JournalPost.astro` — draw-on title underline (§1).
- `src/pages/blog/index.astro` — count-up wiring in eyebrow + filter script (§2).
- `src/utils/odometer.ts` *(new)* — count-up odometer helper (§2).
- `src/components/ParticleField.astro` *(new)* — reusable drifting-particle field
  (§3).
- `src/components/Footer.astro` — host the particle field (§3).
- `src/pages/404.astro` — bespoke potential-well 404 (§4), reuses §3.
- `src/styles/global.css` — `::selection` (§5).

## Testing / verification

For each task: clean `npm run build`, then visual confirmation via the
`visual-check` skill on `npm run preview` (production build), in **both light and
dark mode**, and at desktop + mobile widths where relevant.

Specific checks:

- **§1:** hover a blog post title → underline draws left→right in the category
  color; static (`noLink`) titles show no underline; reduced-motion shows no
  draw motion.
- **§2:** load Journal → count rolls 0→N and settles (eased); switch filters →
  count animates prev→new; **hard-refresh** (not just replay) → no horizontal
  jitter of the count or trailing text (fonts-ready gate working);
  reduced-motion → instant numbers.
- **§3:** footer shows a subtle drifting field; text remains readable;
  reduced-motion → static field, no rAF churn; no layout/overflow regressions.
- **§4:** 404 renders the potential-well concept with the field; nav links work;
  reduced-motion → static; responsive single-column on mobile.
- **§5:** selecting text shows the branded color in light and dark.

## Risks / notes

- The count-up's font-load jitter is the subtlest part — the `document.fonts.ready`
  gate is mandatory, and the width must be reserved up front.
- The particle field must stay subtle and cheap; if canvas perf is a concern at
  the footer (always in DOM), prefer a capped particle count and stop the loop
  when scrolled out of view.
- Don't regress the Journal filter URL-hash persistence or the count's
  per-filter updates when wiring the count-up into `apply()`.
