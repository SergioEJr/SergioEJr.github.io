# Derivation component — design

**Date:** 2026-07-20
**Status:** Approved (design), pending implementation

## Purpose

A collapsible "derivation" block for Journal posts (`.mdx`). It hides an extended
calculation until the reader wants it, so a note can expand on a computation
without distracting from the main text. Inside the block the author can put
prose, display and inline math, equation cross-references (to equations inside
*or* outside the block), and figures — all with no special handling.

## Authoring API

```mdx
import Derivation from '../../components/Derivation.astro';

<Derivation label="Jacobian">
Start from the chain rule:

$$
\begin{align}
  \htmlId{eq:jac}{ J = \tfrac{\partial x'}{\partial x} }
\end{align}
$$

<Figure svg={foo} .../>

which gives Eq [](#eq:jac).
</Derivation>
```

Props:

- `label?: string` — full header text. Default `"Derivation"`. No auto-prefix is
  added; the author controls the entire string.
- `open?: boolean` — start expanded. Default `false` (collapsed).

## Key design decision: content is always in the DOM

The content is rendered into the HTML on every page load; collapsing only hides
it visually (via the `hidden` attribute, toggled by JS). It is **not** torn out
of the DOM.

This is required for correctness:

- `rehype-eqref` (`src/plugins/rehype-eqref.mjs`) numbers equations at **build
  time** by walking `.katex-display` blocks in document order. An equation inside
  a derivation therefore takes its correct place in the global numbering, and can
  be referenced from anywhere, whether the block is open or closed.
- The KaTeX CSS counter (`katexEqnNo`) that prints the visible number likewise
  runs over all rendered equations regardless of visibility.

Tearing content out when closed would break both. It also matches the repo's
existing pattern (`SideNote`, and the publications `pub-toggle` / `pub-panel`
abstract/BibTeX dropdowns), which all keep content in the DOM and toggle
`hidden`.

## Why not native `<details>`

`<details>` sets `display: none` on closed content. KaTeX and `<Figure>` SVGs
measure their layout width; measuring inside a `display:none` subtree yields zero
or wrong widths, which can mis-render display math and figures on first expand.
An always-rendered `<div>` gated by the `hidden` attribute (which we control and
can override for measurement) sidesteps this and gives full control over styling
and the bottom-collapse affordance, which `<details>` cannot provide.

## Structure

`src/components/Derivation.astro`:

1. **Header button** — a `<button type="button" aria-expanded>` with the `label`
   text and a chevron (▸ collapsed / ▾ expanded, rotated via CSS transform).
   Toggles the block.
2. **Content region** — an always-rendered `<div class="derivation__content">`
   wrapping `<slot />`. Visibility gated by the `hidden` attribute on the outer
   block (or a class); starts hidden unless `open`.
3. **Bottom collapse bar** — a slim full-width `<button>` reading `⌃ Collapse`,
   shown only when the block is open. Clicking it closes the block **and**
   scrolls the header back to just below the sticky navbar.

Both the header and the bottom bar toggle the same state. Because both controls
are `<button>` elements (not `#hash` anchors), ClientRouter never intercepts them
and no browser-history entries are created — no `data-astro-history` needed.

## Requirement: toggling must not touch the back/forward history stack

Opening or closing a derivation must **not** push (or replace) a browser-history
entry — the reader pressing Back after expanding several derivations should not
have to click through each toggle. This is guaranteed by construction and must be
preserved by any implementation:

- The controls are `<button type="button">`, never `<a href="#...">`. ClientRouter
  (Astro transitions) runs a delegated click listener that calls `pushState` via
  `moveToLocation()` only for same-page `#hash` **link** clicks; plain buttons are
  never seen by it. This is the same mechanism that polluted history for eqrefs
  and footnotes (fixed there with `data-astro-history="replace"`); using buttons
  avoids the trap entirely rather than opting out of it.
- The toggle handler mutates the DOM only (`hidden`, `aria-expanded`, and a
  `scrollIntoView` on collapse). It must never call `history.pushState`,
  `history.replaceState`, `location.hash = …`, or navigate. `scrollIntoView` moves
  the viewport but does not create a history entry.
- No `id`/hash is assigned to the block for the *purpose of* toggling. (An author
  may still put `\htmlId` on equations *inside* the block; those are unaffected.)

Verification (added to the checklist below): after expanding and collapsing
derivations several times, the browser Back button returns to the previous page
in one press — it does not step through toggle states.

## Interaction

- A single inline `<script>` (following `SideNote`'s pattern: `is:inline`,
  re-run on `astro:page-load`, idempotent global-bind guard) delegates clicks:
  - Header click → toggle `hidden` + flip `aria-expanded`, show/hide bottom bar.
  - Bottom-bar click → collapse, then `scrollIntoView` the header. The header
    carries `scroll-margin-top: 6rem` (the site's existing sticky-navbar clearance
    convention, already used by `.katex-display[id]`) so it lands cleanly below
    the navbar rather than under it.
- `open` prop: when true, the block renders expanded on load (no `hidden`), bottom
  bar visible.

## Styling

- Card consistent with `SideNote`: accent-tinted background
  (`color-mix(... var(--color-accent) ...)`), a left accent border, `border-radius`,
  themed entirely through `--color-*` vars so it flips in dark mode
  (`data-theme="dark"`).
- Header: accent-colored label, chevron indicator, comfortable click target.
- Content: top/bottom padding so display math and figures breathe; must not
  introduce horizontal overflow (wide equations/figures already scroll within
  their own containers — the block itself uses `overflow-x: clip` if needed, never
  `hidden`/`auto`, per the repo's sticky-navbar rule).
- Bottom bar: slim, full-width, muted until hover, centered `⌃ Collapse`.

## Non-goals (YAGNI)

- No animated max-height height transition in v1 (instant show/hide is fine and
  avoids measuring content height for figures/math). Can be added later if wanted.
- No nesting of derivations inside derivations.
- No per-block persistence of open/closed state across navigations.

## Testing / verification

- `npm run build` clean.
- Wire a sample `<Derivation>` into the existing draft `note-symmetries.mdx`
  (without altering its other prose) containing: prose, a `$$\begin{align}$$`
  equation with `\htmlId`, a reference to an equation *outside* the block, and a
  reference from *outside* the block to the equation *inside* it — confirm both
  refs resolve and the global equation numbers are unchanged by open/closed state.
- `visual-check` skill (Playwright) to confirm: collapsed by default, expands on
  header click, bottom bar collapses and scrolls header into view, dark-mode
  colors correct. Verify on `npm run preview` (dev HMR serves stale inlined CSS).
- **History check:** expand and collapse the sample derivation several times, then
  press the browser Back button — it must return to the previous page in a single
  press, not walk through toggle states.

## Files

- **New:** `src/components/Derivation.astro`
- **Edit (sample only):** `src/content/blog/note-symmetries.mdx`
