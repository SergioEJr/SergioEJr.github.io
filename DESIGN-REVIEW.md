# Design review findings — working checklist

Temporary file; delete before merging. Full review from 2026-07-15 session.
Verdict: site has departed from astro-scholar successfully; remaining gap is
consistency of identity (dark mode / Journal / Projects define the voice;
light mode, hero card, and section headings haven't adopted it yet).

## Working through

- [x] **1. Light mode is a second-class citizen** ✅ DONE (2026-07-15)
  - Shipped the "daylight lab" retune. Spec:
    `docs/superpowers/specs/2026-07-15-light-mode-daylight-lab-design.md`;
    plan: `docs/superpowers/plans/2026-07-15-light-mode-daylight-lab.md`.
  - Palette → cool `#f6f8fa` ground, white `--color-bg-offset` lifts (real surface
    hierarchy), cool borders, ink-navy text, cool-cast shadows.
  - New `--color-hot` token (light `#d1268f`, dark `#f472b6`) → text selection +
    the sim's jr spark; kept scarce/non-interactive.
  - Hero: cool ink-wash gas; name condenses as dense INK (no glow, larger dots)
    in light; dark neon untouched.
  - Journal glow: compact tinted pool (glowK 1.6→1.1, outerR 260→200 light only).
  - Figure card sits on page ground so theme-aware SVG faces stay invisible.
  - Verified light+dark across all pages + production build; dark = zero change.
  - **Follow-up polish round (2026-07-15):** hero particles now drawn as circles
    (baked in sprite, no per-frame cost); hero grid line uses `--sim-grid-line`
    (stronger on the light ground); JR spark glow removed in light (matches name);
    navbar icon-hover uses new `--color-surface-hover` (no white halo); footer on
    `--color-bg` (off-white, not pure white); figure palette reworked for the light
    ground (`--fig-red/blue/orange` retuned + new `--fig-green`/`--fig-muted`),
    SVGs regenerated and `_preamble.tex`/`fig.sh` synced; logo hot glyphs + glow
    use `--color-hot` per theme; favicon regenerated to match.

- [ ] **2. Copy-rendering bugs**
  - Space before commas in author lists (JSX whitespace):
    `src/pages/publications.astro:56-59`, `src/pages/index.astro:826-829`.
  - Journal piece numbers ("ALL · 9 PIECES" but rows numbered to 15) —
    numbering counts filtered-out entries: `src/pages/blog/index.astro:64-69`.
    Verify against production build before changing.

- [ ] **3. Section headings still template-branded**
  - `h2 { border-bottom: 2px accent; display:inline-block }` in
    `src/styles/global.css:223-229` is astro-scholar's signature.
  - Replace with the Journal's eyebrow language (uppercase letter-spaced label
    + big serif) site-wide: Home below-fold, About (Background/Toolkit), etc.

- [ ] **4. De-template the hero card (scroll destination)**
  - Circular headshot + role line + two default buttons = stock academic hero.
  - Ideas: let a low-density particle remnant drift behind the card
    (ParticleField already does this in the footer); squared/b&w portrait to
    match About+Projects photography; carry neon hover language into buttons.

- [ ] **5. Typography conviction**
  - Atkinson (template default) + Georgia headings. Sim stencil font comes from
    CSS (`HeroSim.astro:723`), so a display-serif swap restyles name+headings
    together. Candidates: STIX Two, Source Serif, Fraunces. Ship woff2.
  - Atkinson: .woff not .woff2; no italic face (synthesized obliques).

## Smaller notes (grab-bag)

- Justified text + `hyphens:auto` (`BlogPost.astro:102`): scope to ≥900px,
  ragged-right on mobile.
- Orphaned `/team` page (template residue, crawlable) — delete or noindex.
- Radius drift: 4 / 8 / 10 / 999px — consolidate to two values.
- Body `p` uses `--color-text-muted` as primary reading color (global.css:237).
- Home below-fold two-column lists still template skeleton w/ inline styles —
  restyle with Journal row language (number / dot / eyebrow).
- Footer astro-scholar credit: intentional, keep.
