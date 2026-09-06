# Design guidelines

**For agents:** read this before generating any diagram, chart, or `.svg` for
this site. The site is **theme-aware** — every page renders in both light and
dark mode (`data-theme="dark"` on `<html>`), so a graphic must look right on
both a white and a deep-slate background.

## Two themes, two characters

**Light is "e-ink"; dark is "glass and glow."** They share structure (the same
tokens, the same layout) and deliberately differ in character:

- **Light** is a reflective display: warm paper, near-black ink, and *no surface
  hierarchy*. Nothing glows, blurs, or casts a shadow. Hierarchy comes from
  rules (a soft hairline to divide, an ink line to frame), weight, and
  geometry. Card-like boxes are square; small controls (pills, buttons) keep
  their radius. Color is scarce and printed: the register/subject hues are
  darkened, desaturated versions of dark mode's pastels, so they sit *in* the
  paper rather than lighting up on it.
- **Dark** keeps frosted headers, soft shadows, neon hover glows and rounded
  cards.

Three tokens carry the difference; everything else is shared:

| Token | Light | Dark | Role |
|---|---|---|---|
| `--shadow-sm/md/lg` | `none` | soft shadows | Paper casts no shadow. Sites that hard-code a shadow get a light-scoped `box-shadow: none`. |
| `--r-card` | `0` | `1` | Multiplier on every card-like radius: `border-radius: calc(16px * var(--r-card))`. Not a shared radius token, so dark keeps each site's own value. |
| `--color-rule` | ink (`#141414`) | `--color-border` | The FRAME line (photos, cards, code blocks, modals). `--color-border` stays the soft divider. |

Light-only rules are scoped `html:not([data-theme="dark"])` (in a component:
`:global(html:not([data-theme="dark"])) .x`). They remove things — blur,
gradient hairlines, glow filters, cursor-following light — rather than add
them.

## Color palette

Values mirror `src/styles/global.css`, which is **authoritative** — if the
`--color-*` vars there change, re-sync this table.

| Variable | Light | Dark | What it's for |
|---|---|---|---|
| `--color-bg` | `#f4f3ee` | `#0f172a` | Page background (the canvas your diagram sits on). Warm paper vs. deep slate (Slate-900). |
| `--color-bg-offset` | `#f4f3ee` | `#0f172a` | Panels/cards. Same as `bg` in BOTH themes — no panel lifts off the ground. |
| `--color-text-main` | `#141414` | `#e2e8f0` | Primary text / diagram ink. Near-black vs. light slate. |
| `--color-text-muted` | `#524f49` | `#94a3b8` | Secondary text, captions, axis labels. |
| `--color-accent` | `#003366` | `#60a5fa` | Brand accent. Oxford Blue (reads as a second ink on paper) vs. electric blue. |
| `--color-accent-light` | `#e6e4dc` | `#1e3a8a` | Accent fill / hover backgrounds. Pressed-paper grey in light, not a blue wash. |
| `--color-border` | `#cdcac1` | `#334155` | Soft hairlines, dividers. |
| `--color-rule` | `#141414` | `#334155` | Frames (see above). |
| `--color-hot` | `#d1268f` | `#f472b6` | The scarce signature magenta (logo spark, jr particles, selection). |
| `--fig-red` | `#c02748` | `#f87171` | Figure-only red slab/accent (see `src/assets/diagrams/README.md`). |
| `--fig-blue` | `#1d4ed8` | `#60a5fa` | Figure-only blue (legible on paper; dark = the accent blue). |
| `--fig-orange` | `#b45309` | `#fb923c` | Figure-only orange for a third distinct slab color. |
| `--fig-green` | `#047857` | `#34d399` | Figure-only green. |
| `--fig-muted` | `#64748b` | `#94a3b8` | Figure-only neutral. |

The `--fig-*` palette was deliberately left alone by the e-ink theme: figures
are drawn once and these hues are their whole vocabulary. Face fills in the
generated SVGs are `var(--color-bg)`, so they follow the paper automatically.

## Theme-aware SVG rules

**Default (line-art): use `currentColor` for ink.** Strokes and text set to
`currentColor` inherit the page text color and flip with the theme
automatically — no second asset needed. Export the SVG with black ink, then:

```sh
sed -i '' 's/#000000/currentColor/g; s/#000/currentColor/g' diagram.svg
```

**Accent color is a deliberate splash, not the default.** Reach for the accent
hex only where brand color genuinely helps. Note it differs per theme
(`#003366` light / `#60a5fa` dark), so either accept that a single hardcoded
accent won't flip, or ship a light/dark pair.

**Never hardcode the background or text hexes into an SVG meant to flip.** A
diagram with `#ffffff` fills or `#141414` ink baked in will look broken on the
opposite theme (and there is no `#ffffff` anywhere on the paper theme — a white
fill shows as a bright patch). Use `currentColor` (ink) and let the transparent SVG background
show the page canvas through.

## Rendering diagrams

Use the `<Figure>` component (`src/components/Figure.astro`) in `.mdx` posts —
it has three modes (adaptive `currentColor` SVG, light/dark image pair, single
image on a card). See `src/assets/diagrams/README.md` for authoring details.
