---
name: visual-check
description: Visually verify UI/CSS changes on this Astro site by screenshotting the running dev server with Playwright (headless Chromium). Use whenever a change is visual — layout, spacing, sticky positioning, light/dark mode, responsive breakpoints, the TOC, side notes, figures — instead of guessing from the code. Also use to reproduce a visual bug the user reports.
---

# Visual check

This site's UI bugs (sticky navbar, gutter overflow, TOC alignment, side-note
fade) are hard to get right by reading CSS alone. Don't guess — screenshot it.

Playwright + Chromium are installed (dev-only). The helper is `scripts/shot.mjs`.

## Steps

1. **Reuse the user's dev server.** The user usually runs `npm run dev`
   themselves (often on 4321). `scripts/shot.mjs` auto-probes ports 4321–4325 and
   uses whichever is already serving, so normally you do nothing here.

   **Never run `pkill -f "astro dev"`** or similar — it would kill the user's own
   server. Only start one yourself if no port is live:
   ```sh
   # check first
   for p in 4321 4322 4323; do curl -s -o /dev/null --max-time 1 localhost:$p && echo "$p live"; done
   ```
   If you must start one, track its PID and kill ONLY that PID when done:
   ```sh
   npm run dev > /tmp/dev.log 2>&1 & echo $! > /tmp/shot-dev.pid
   # ...later...
   kill "$(cat /tmp/shot-dev.pid)" 2>/dev/null
   ```
   Override the detected port if needed: `PREVIEW_URL=http://localhost:4323 node scripts/shot.mjs ...`

2. **Screenshot** the page or element, then **Read the PNG** to inspect it:
   ```sh
   node scripts/shot.mjs <path> [--sel <css>] [--width <px>] [--theme l|d] \
        [--scroll <px>] [--open <css>] [--out <file>] [--full]
   ```
   The script also prints two sanity numbers every run:
   - `overflowX` — should be `0` (nonzero = horizontal scroll bug)
   - `header.top` — should be `0` after scrolling (nonzero = navbar un-stuck)

   Then `Read /tmp/shot.png` (or your `--out` path) to actually see it.

3. **Iterate**: edit CSS → the dev server hot-reloads → re-run the script. No
   rebuild needed for `.astro`/CSS changes.

4. **Clean up**: if YOU started a dev server in step 1, kill only its PID
   (`kill "$(cat /tmp/shot-dev.pid)"`). If you reused the user's, leave it alone.
   Keep `scripts/shot.mjs` (it's reusable).

## Measuring exact positions

When alignment matters (e.g. the TOC guide line under a heading), measure pixels
rather than eyeballing. Write a tiny inline Playwright script that reports
`getBoundingClientRect().left + paddingLeft` for the elements in question — the
**text start**, not the element's border-box edge. (Earlier confusion came from
measuring the element edge instead of where the text actually begins.)

## Examples

```sh
# TOC dropdown, expanded, on a sub-1200px width (in-column mode)
node scripts/shot.mjs /blog/physics-entropy-equation/ \
  --sel .toc-mobile-details --open .toc-mobile-details --width 1000

# Navbar still stuck + no overflow after scrolling, at the width that broke before
node scripts/shot.mjs /blog/physics-entropy-equation/ --width 1150 --scroll 1600

# Mobile home page, light mode
node scripts/shot.mjs / --width 390 --theme l --out /tmp/home.png

# Side note floating in the gutter (needs >=1200px)
node scripts/shot.mjs /blog/physics-entropy-equation/ --width 1400 --sel '[data-sidenote]'

# Override the dev-server port if it isn't 4322
PREVIEW_URL=http://localhost:4323 node scripts/shot.mjs /
```

## Key breakpoints / facts for this site

- Dark mode = `data-theme="dark"` on `<html>` (the script sets it via `--theme`).
- TOC sidebar (margin) appears at **≥1200px**; below that it's the in-column
  `<details>` dropdown (`.toc-mobile-details`).
- Side notes float into the right gutter at **≥1200px**; inline below that.
- A sticky-navbar failure almost always means **horizontal overflow** somewhere
  (check `overflowX`). Fix with `overflow-x: clip` (NOT `hidden`/`auto`, which
  break sticky), or remove the overflowing element's negative margin.
