# Light mode: "Daylight lab" — design spec

Date: 2026-07-15
Scope: make light mode feel as intentional as dark mode. Retune the palette,
the hero particle sim, and the Journal glow field; introduce one scarce "hot"
accent. **Dark mode is not touched** except where a token is shared and the
dark value is explicitly preserved.

## Concept

Dark mode is the lab at night — instruments glowing in the dark. Light mode is
the *same lab in daylight*: graph paper, cool gray light, ink. Same geometry,
same accent hues; the neon simply reads as **ink** because the lights are on.
The two themes are two states of one instrument, not two brands.

Guiding constraints (from the user):
- **No dark plate behind the hero sim** in light mode. Retune light mode itself.
- Hero reveal in light = **ink condensing** (no glow); order emerging from noise.
- The hot mark stays **scarce and non-interactive**; exact hue may shift off the
  raw logo magenta if a slightly cooler pink harmonizes better.

## 1. Palette tokens

Edit **only** the light `:root` block in `src/styles/global.css` (plus the two
new shared tokens noted below). Dark `[data-theme="dark"]` values are unchanged.

| Token | Current (light) | New (light) | Rationale |
|---|---|---|---|
| `--color-bg` | `#ffffff` | `#f6f8fa` | Cool near-white daylight ground; kills "static on white". |
| `--color-bg-offset` | `#ffffff` | `#ffffff` (unchanged) | White panels/cards now LIFT off the tinted ground → real surface hierarchy. |
| `--color-border` | `#eaeaea` | `#dce3eb` | Cool blue-gray borders + hero graph-paper grid pick up the cast. |
| `--color-text-main` | `#1a1a1a` | `#18222e` | Ink-navy black, reads as ink not toner. |
| `--color-text-muted` | `#555555` | `#49586a` | Cool-shifted muted. |
| `--color-accent` | `#003366` | `#003366` (unchanged) | Oxford Blue becomes the "ink" color. |
| `--color-accent-light` | `#e6f0fa` | `#e2ecf7` | Retuned to sit on the new bg. |
| `--color-bg-header` | `rgba(255,255,255,.85)` | `rgba(246,248,250,.85)` | Match new bg (frosted nav). |
| `--color-bg-mobile-menu` | `rgba(255,255,255,.95)` | `rgba(246,248,250,.95)` | Match new bg. |
| `--shadow-sm/md/lg` | neutral black rgba | `rgba(23,42,72,…)` same alphas | Cool-cast shadows sell "daylight". Values: sm `0 1px 3px rgba(23,42,72,.05)`, md `0 4px 6px rgba(23,42,72,.08)`, lg `0 10px 15px rgba(23,42,72,.10)`. |

New shared token (define in BOTH light `:root` and dark block):

| Token | Light | Dark |
|---|---|---|
| `--color-hot` | `#d1268f` | `#f472b6` |

`#d1268f` is a hair cooler than the raw logo magenta (`#db2777`/`--cat-essays`)
so it harmonizes against the all-cool page; dark reuses the existing pink
(`#f472b6`, matches `--cat-essays` dark). This token is the single source for the
"hot mark". Do NOT wire it into hovers, links, active nav, or focus rings.

Delete the now-inaccurate comments: `/* Academic Portfolio Theme */`,
`/* Clean white for premium feel */`, `/* Oxford Blue */` may stay.

## 2. Hero sim — ink condenses

File: `src/components/HeroSim.astro`. All changes live inside the existing
theme fork (`readColors()` at ~L425-435 and the draw constants ~L246-248).
Dark-mode branches are untouched.

Current light behavior (the bug): ambient gas is set to `--color-border`
(`#eaeaea`) — near-invisible dust on white → reads as sensor noise.

Changes (light branch only):
- **Ambient gas color** → cool ink-wash blue-gray, approx `#a3b2c2`
  (independent of `--color-border`; hard-code a `LIGHT_GAS` constant mirroring
  the existing empty `DARK_GAS = ""` pattern at L248, e.g.
  `const LIGHT_GAS = "#a3b2c2";` and use it in the light branch instead of the
  border color).
- **Ambient gas alpha** → slightly LOWER than dark so the field reads as a wash,
  not grit. (Tune during implementation via screenshots; start ~0.85× the
  current light alpha.)
- **Inside-letter particles** → keep `--color-accent` navy, but draw HEAVIER in
  light: small bump to name-particle dot radius and/or alpha so the name reads
  dense and printed. (Tune to taste; target: crisp letterforms, not stipple.)
- **No glow in light**: any `shadowBlur`/`shadowColor` activation pass stays
  gated to dark (`if (dark) { … }`). Glows on white wash out — that now reads as
  daylight, not a defect. The dark intro neon flicker is unchanged.
- **jr superscript** stays hot: source it from `--color-hot` (replace the
  hard-coded pink `JR_COLOR`/`#…` with the token read in `readColors()`), so it
  tracks the theme's hot value.
- Graph-paper grid: inherits new `--color-border` automatically (L1541-1542) —
  no change.

## 3. Journal glow field

File: `src/components/JournalGlowField.astro` (light branch of `draw()`,
~L240-324). Current light look = `glowK = 1.6` + large soft pills = a gray
smudge. Retune so the light source reads like **colored ink bleeding into paper**,
tight around the eyebrow:

- `glowK` light: `1.6` → `~1.1`.
- `LOOK.outerR` effective in light: `260` → `~200` (add a light-mode override;
  do not change the dark constant).
- Keep the existing light-mode particle behavior (darken toward the register
  color near the source — that instinct is correct; only the haze is reined in).
- Particle alpha floor in light already `0.12`; keep or nudge up slightly if the
  tighter glow makes the field read too sparse.

## 4. The hot mark deployment

Scarce + non-interactive. Existing uses (logo, jr spark, Essays register) stay.
**One new structural use: text selection.**

Add to `src/styles/global.css` (both themes via the token):
```css
::selection { background: var(--color-hot); color: #fff; }
```
Rationale: selection is the one place a hot spark can appear anywhere on the site
while staying rare by nature (only visible when the reader highlights text). Nav
underline and hovers stay cool navy → accent system stays single-axis.

## 5. Figures (edge case — required)

The theme-aware SVG figures (`src/assets/blog/cube-x3.svg`, etc.) fill face
shapes with `var(--color-bg, #ffffff)` so faces are invisible against the page.
`Figure.astro` `.figure__img--card` (L80-86) currently puts them on a
`--color-bg-offset` (white) card. Today `bg == offset == #fff` so it's invisible
by luck. After §1, `--color-bg` = `#f6f8fa` on a white card → faces show faint
gray.

**Fix (one line):** in `Figure.astro`, change `.figure__img--card` background
from `var(--color-bg-offset)` to `var(--color-bg)`. Figure faces filled with
`--color-bg` then stay perfectly invisible; figures read as "drawn on the page,"
delineated by the card border. Harmless in dark (bg == offset already).

## Non-goals (this spec)

Section-heading eyebrow restyle, hero-card de-templating, typography/serif swap,
copy bugs, justified text, orphaned `/team` — all tracked separately in
`DESIGN-REVIEW.md`; NOT in scope here.

## Verification

`scripts/shot.mjs` sweep, light + dark, widths 1440 / 1000 / 390:
- Home: top (sim), card state (post-scroll), below-fold two-column, footer.
- Journal index (glow field), a blog post (`/blog/physics-entropy-equation/`:
  TOC pill, code block, a figure, side note).
- Research, Projects (cards + blueprint grid), About.

Explicitly confirm in **light** mode:
1. Hero name reads as dense ink; ambient gas is a visible wash, not white static.
2. White surfaces (search modal, TOC pill, code frame, project cards, Figure
   card) lift off the `#f6f8fa` ground.
3. SVG figure faces are invisible (no gray fill on the card).
4. Code blocks stay white (Shiki inline `#fff` — untouched in light).
5. Text selection shows the hot mark.
6. No white-on-white or contrast regressions; borders read cool, not muddy.

Then re-check dark mode across the same pages to confirm **zero** visual change.
