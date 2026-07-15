# Design review findings — working checklist

Temporary file; delete before merging. Full review from 2026-07-15 session.
Verdict: site has departed from astro-scholar successfully; remaining gap is
consistency of identity (dark mode / Journal / Projects define the voice;
light mode, hero card, and section headings haven't adopted it yet).

## Working through

- [ ] **1. Light mode is a second-class citizen** ← IN PROGRESS
  - Hero gas reads as gray static on pure white; name emerges from noise, not glow.
  - Palette is generic: pure `#fff` bg, `#eaeaea` borders, Oxford Blue accent;
    `--color-bg-offset` == `--color-bg` in both themes → no surface hierarchy.
  - Logo magenta appears nowhere else in light mode.
  - Journal glow-field light treatment reads as a gray smudge rather than a light source.
  - Direction constraints (Sergio): NO dark plate behind the hero sim in light
    mode — retune light mode itself to feel intentional instead.

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
