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
  - **Hero particle round-out + intro glow (2026-07-15):** particles supersampled
    8× in the sprite bake so 1px dots rasterize as real circles (the "squares" were
    a sub-pixel-rasterization + glow-clip issue, NOT arc-vs-rect); shadowBlur scaled
    by the supersample factor so the neon survives; `NAME_DOT_SCALE` restores chunky
    name dots vs gas. Added a temporary intro neon flare: LIGHT flat-ink dots flare
    then ease to flat (`introGlowFade`, cubic ease-out, `GLOW_PEAK`/`GLOW_FADE_MS`);
    DARK blooms a wider halo down to the resting glow (`GLOW_BIG`). Flare runs off a
    persistent `introStart` clock so it finishes smoothly instead of snapping to 0
    when `data-home-intro` is removed mid-fade. All intro-only → zero resting cost.
  - Light mode revamp CLOSED. Branch: design-review.

- [x] **2. Copy-rendering bugs** ✅ DONE (2026-07-15)
  - Space-before-comma in author lists: JSX inserted a whitespace text node
    between `<AuthorLink>`/venue span and the `, ` separator. Fixed by keeping the
    separator flush (publications.astro authors; index.astro pub-meta venue+year).
    Now renders "Sergio Eraso, Mehran Kardar" / "In preparation, 2026".
  - Journal numbering: `postNumber` indexed ALL published posts, but numbered rows
    (Updates+Essays) + the "N pieces" count are the non-notebook subset — so rows
    were numbered past the count (5 pieces, rows to 6/11). Fixed: number over the
    non-notebook set only (blog/index.astro). Verified on prod build: "5 PIECES",
    rows 05/04/03… no skip/overflow.
  - **Journal "All" now includes Notebook (2026-07-15):** "All" was excluding
    notebook posts while the copy said "all in one place". Reworked so "All" = the
    Updates/Essays timeline followed by notebook posts as a FLAT continuation (row
    separators + a muted pencil icon in the gutter where timeline rows show a
    number; no section title, no topic groups). All 11 posts counted. Subtitle →
    "Updates, essays, and a living notebook." Scoped to `#journal[data-view="all"]`
    so the dedicated Notebook filter view is unchanged (header/sidebar/topic groups,
    borderless, no icons). Fixed a note-row alignment stagger: removed a
    `grid-column:2` hack on `.j-main`; notes now auto-flow like timeline rows, so
    alignment holds across all widths (verified 1440→390 + the 600px breakpoint).

- [x] **3. Section headings still template-branded** ✅ DONE (2026-07-15)
  - Replaced astro-scholar's `border-bottom: 2px accent; display:inline-block`
    underline with bold serif (700 weight) + a short navy rule set BELOW the
    text via `h2::after` (detached from the descenders, not hugging the
    baseline like the old underline). Compared two rounds of options via
    artifact: round 1 (eyebrow label / left accent tick / hairline / plain)
    was rejected as repetitive (eyebrow) and not heading-like enough (tick);
    round 2 added this "short rule below" option plus a hot-color spark dot,
    a Journal-style short underline, weight-only, and a full-width divider —
    landed on the short-rule-below option.
  - Global rule lives on `h2::after` in `src/styles/global.css`, so no markup
    changes were needed anywhere `<h2>` is used. Verified it cascades cleanly
    to About (Background/Toolkit/Beyond research/Get in touch), and in-essay
    blog prose h2s (e.g. "Phase Transitions"), in both themes.
  - Added `content: none` resets to the 2 pre-existing h2 overrides that would
    otherwise inherit the new rule mark at the wrong scale: Journal post
    titles (`.j-post-title::after` in JournalPost.astro — it has its own
    hover-underline device instead) and the TOC title (`.toc-title::after` in
    TableOfContents.astro — a small eyebrow label, not a section heading).
    Verified via computed-style checks on the prod preview build. The header
    logo is a `div.brand-heading`, not an `h2`, so needed no change.

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
