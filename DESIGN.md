# Design guidelines

**For agents:** read this before generating any diagram, chart, or `.svg` for
this site. The site is **theme-aware** — every page renders in both light and
dark mode (`data-theme="dark"` on `<html>`), so a graphic must look right on
both a white and a deep-slate background.

## Color palette

Values mirror `src/styles/global.css`, which is **authoritative** — if the
`--color-*` vars there change, re-sync this table.

| Variable | Light | Dark | What it's for |
|---|---|---|---|
| `--color-bg` | `#ffffff` | `#0f172a` | Page background (the canvas your diagram sits on). White vs. deep slate (Slate-900). |
| `--color-bg-offset` | `#ffffff` | `#0f172a` | Panels/cards. Same as `bg` here — the site uses a seamless, unified canvas. |
| `--color-text-main` | `#1a1a1a` | `#e2e8f0` | Primary text / diagram ink. Near-black vs. light slate. |
| `--color-text-muted` | `#555555` | `#94a3b8` | Secondary text, captions, axis labels. |
| `--color-accent` | `#003366` | `#60a5fa` | Brand accent. Oxford Blue vs. electric blue. |
| `--color-accent-light` | `#e6f0fa` | `#1e3a8a` | Accent fill / highlight backgrounds. |
| `--color-border` | `#eaeaea` | `#334155` | Hairlines, dividers, card borders. |
| `--fig-red` | `#b91c1c` | `#f87171` | Figure-only red slab/accent (see `src/assets/diagrams/README.md`). |
| `--fig-blue` | `#173f7a` | `#60a5fa` | Figure-only blue (legible on white; dark = the accent blue). |
| `--fig-orange` | `#c2410c` | `#fb923c` | Figure-only orange for a third distinct slab color. |

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
diagram with `#ffffff` fills or `#1a1a1a` ink baked in will look broken on the
opposite theme. Use `currentColor` (ink) and let the transparent SVG background
show the page canvas through.

## Rendering diagrams

Use the `<Figure>` component (`src/components/Figure.astro`) in `.mdx` posts —
it has three modes (adaptive `currentColor` SVG, light/dark image pair, single
image on a card). See `src/assets/diagrams/README.md` for authoring details.
