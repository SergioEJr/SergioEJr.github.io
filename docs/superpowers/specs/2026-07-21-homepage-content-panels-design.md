# Homepage content panels + footer redesign — design spec

**Date:** 2026-07-21
**Status:** Approved direction from brainstorm (this session); pending user review of this doc.

## Goal

Extend the homepage past the hero with content panels that (a) surface the
site's actual content — projects had zero homepage presence, (b) give the page
a deliberate ending with an ask, and (c) plant one small easter egg. Also
replace the last wholesale astro-scholar artifact, the footer, with the site's
own editorial language. Sergio and his content lead; whimsy is demoted to a
coda.

## Final page composition

1. Hero sim (unchanged)
2. Profile card + live hold (unchanged)
3. Selected Research + Latest Posts rows (unchanged, shipped earlier)
4. **NEW — Projects strip**
5. **NEW — Equation coda** (compact easter egg)
6. **NEW — Contact band** (the page's final beat)
7. **REDESIGNED — Footer** (site-wide)

Narrative: gas → the person → the work → the builds → the rule → the ask.

## Global constraints

- No scroll-scrubbing below the hero. Below-fold panels use the established
  reveal-once cascade (`[data-reveal]` + `--i` stagger, 80ms steps) only.
- Both themes; light and dark verified. Reduced-motion: everything static and
  visible. Mobile: single column.
- All new links use the established editorial link treatment (accent color,
  hairline underline at 35% opacity → 100% on hover, arrow translate 4px,
  `:focus-visible` 2px accent outline at 3px offset).
- Copy follows the portfolio voice: grounded, concrete, no hype. The contact
  band's sentence is drafted at implementation time and shown to Sergio for
  approval before merge.
- Verification on the production preview build, not dev (HMR staleness).

## Panel: Projects strip

- **Placement:** after the research/posts grid, before the equation coda.
- **Data:** `getPublishedProjects()`, existing default sort (manual `order`
  override, else reverse-chronological). Take the first 3. If fewer exist,
  render what's there; if zero, omit the whole section.
- **Layout:** `<h2>Projects</h2>` (global heading style applies), then a
  3-column card grid (single column on mobile). Card = image thumbnail
  (`image` frontmatter, `public/projects/`), serif title, category label —
  reusing the Projects page's card visual language (including its category
  pill colors from `src/utils/categories.ts`) so the strip reads as a preview
  of that page, not a new invention. Card links to `/projects/[slug]`.
- **More-link:** "View all projects →" (`.home-more` treatment).
- **Reveal:** same cascade as the research/posts rows (h2, then cards with
  `--i` stagger, then more-link).

## Panel: Equation coda (easter egg)

- **Placement:** between the projects strip and the contact band. Compact:
  a short centered block, ~8rem of vertical space, muted ink. A scanning
  reader passes it without friction.
- **Content:** the damped Langevin equation the hero particles actually
  integrate (transcribe from `HeroSim.astro` `step()` at implementation time;
  it is velocity damping + Gaussian noise + cursor repulsion):

  dv/dt = −γv + √(2D) ξ(t) + F_cursor(r)

  Typeset with KaTeX at ~1.15–1.3rem (KaTeX CSS is global; render via
  `katex.renderToString` in frontmatter — the homepage is `.astro`, not MDX).
  Below it one caption line, notebook register:
  "Every particle in the hero integrates this equation. The last term is you."
- **Hover annotations (the easter egg):** the equation renders alone — no
  visible labels, nothing says "hover me." Each of the three terms (−γv,
  √(2D)ξ(t), F_cursor) is an interactive target:
  - Hover/focus tints the term and reveals a small annotation chip beneath it
    in the same color.
  - Colors are semantic: drag → muted steel (`--color-text-muted`), noise →
    accent (`--color-accent`), you → `--color-hot` (the site's scarce "human
    spark" token — the cursor-force term IS the visitor).
  - Chip copy: "drag", "noise", "you (the cursor)". Short; lowercase; small
    caps styling.
  - Accessibility: terms are keyboard-focusable, `aria-describedby` points at
    the chip text; chips are real DOM (visually hidden until reveal), not
    `::after` content.
  - Touch / `(hover: none)` fallback: the three chips render statically
    beneath the equation (the compact annotated layout) — no hidden content
    on devices that can't hover.
- **Implementation note:** the three terms are three separate KaTeX spans laid
  out inline in a flex row (equation reads continuously), so each can carry
  its own hover state without fragile positioning inside one KaTeX tree.

## Panel: Contact band

- **Placement:** last content block before the footer — the page ends on the
  ask, not on whimsy.
- **Layout:** slim full-width band on `--color-bg-offset` ground (hairline
  top/bottom borders), content column centered. One sentence in Sergio's
  voice about finishing the PhD / being open to what's next (draft at
  implementation, Sergio approves wording), then three editorial links:
  Email → (mailto, from existing footer config), CV → (existing
  `CV_AVAILABLE`/`CV_URL` util; omit if unavailable), LinkedIn → (existing
  social config).
- **Reveal:** single fade, no stagger theatrics.

## Footer redesign (site-wide — ships on every page)

- **Remove (template furniture):** the four-column skeleton and its
  QUICK LINKS / CONTACT / CONNECT small-caps column headers.
- **Keep:** ParticleField ambience; the Feynman quote (personal); the
  astro-scholar credit (marked intentional in DESIGN-REVIEW.md); the existing
  link-sanitization logic for configured social URLs.
- **New shape (editorial):** hairline top rule. Left block: serif
  "Sergio Eraso" + the Feynman quote beneath in small muted italic. Right
  block: nav links in one quiet wrapped row with dot separators (Home · About
  · Research · Projects · Journal · CV) — no column headers; beneath it the
  contact essentials as editorial links/icons: email, GitHub, LinkedIn.
  Bottom: one muted line — copyright + astro-scholar credit. Target ≈ half
  the current footer height. Mobile: blocks stack, links wrap.

## Non-goals

- No changes to the hero sim, card, hold, or research/posts rows.
- No "Now" strip or notebook topic chips (deferred; noted as future ideas).
- No new scroll-linked animation below the hero.
- No new dependencies (KaTeX already ships).

## Verification

- Screenshots (preview build): each new panel, dark + light, 1440 and 390;
  equation hover states (hover each term), touch fallback via
  `(hover: none)` emulation; footer on homepage + one content page (e.g. a
  blog post) since it ships site-wide.
- Keyboard pass over the equation terms and all new links.
- `npm run build` clean; `npm run format:check` clean.
