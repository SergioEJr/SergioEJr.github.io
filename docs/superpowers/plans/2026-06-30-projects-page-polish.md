# Projects Page Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the Projects page to the Journal's craft level via two scoped additions — a static blueprint grid behind the header and a "dim, don't hide" filter — without touching the project cards' hover interaction.

**Architecture:** A new self-contained `BlueprintGrid.astro` renders a static ruled grid on a `<canvas>` behind `.projects-hero`, symmetric about the header's center-X, full-bleed with a downward (in-canvas) + side-edge (CSS mask) fade. The existing filter script in `projects.astro` toggles a `.dimmed` class instead of `display:none`, and the tilt script skips dimmed cards.

**Tech Stack:** Astro component + scoped CSS + vanilla TS client script; Canvas 2D; `getComputedStyle`; `MutationObserver` (theme redraw).

## Global Constraints

- No test framework exists in this repo; "verification" = `npm run build` clean + visual inspection by the user. Do NOT add a test runner.
- Always finish a change with `npm run build` and confirm it's clean.
- Commit only the files a task touches. NEVER add Co-Authored-By or any AI/Claude attribution to commits.
- Dark mode = `data-theme="dark"` on `<html>`; colors are CSS vars (`--color-*`). The grid line color comes from `--color-accent`.
- Do NOT modify the project-card hover interaction (tilt/glare/outline/edge-glow) beyond the one documented skip-condition change.
- Canvas must be `pointer-events: none` and `aria-hidden="true"`.
- Re-init must be idempotent across `astro:page-load` via a per-canvas bound flag (mirror `src/components/JournalGlowField.astro` / `ParticleField.astro`).
- Grid is STATIC: draw once; redraw only on `resize` and `data-theme` change. No rAF loop, no IntersectionObserver, no reduced-motion branch.
- Grid is symmetric about the header center-X so it reads as anchored to the centered "Projects" title.
- Prettier formats `.astro` with 2-space indent; let it normalize.

---

### Task 1: BlueprintGrid component — static ruled grid, symmetric about center, faded

**Files:**
- Create: `src/components/BlueprintGrid.astro`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `BlueprintGrid.astro`, an Astro component with optional prop
  `class?: string`, rendering `<canvas class="blueprint-grid" aria-hidden="true">`.
  Its client script defines `initBlueprintGrid()` bound once per canvas via a
  `__bpBound` flag; internally a `draw()` that renders the static grid and a
  `resize()` that sizes the canvas full-bleed and recomputes `centerX`. Task 2
  mounts it into `.projects-hero`.

- [ ] **Step 1: Create the component**

Create `src/components/BlueprintGrid.astro`. Mirror the canvas/DPR/theme-read
patterns from `src/components/JournalGlowField.astro`, but STATIC (no animation).

```astro
---
interface Props {
  class?: string;
}
const { class: className = "" } = Astro.props;
---

<canvas
  class:list={["blueprint-grid", className]}
  aria-hidden="true"></canvas>

<style>
  .blueprint-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    /* Side-edge fade so the full-bleed grid dissolves at the viewport edges.
       (The downward fade is baked into the canvas pixels — see draw().) */
    -webkit-mask-image: linear-gradient(
      to right,
      transparent 0,
      #000 8%,
      #000 92%,
      transparent 100%
    );
    mask-image: linear-gradient(
      to right,
      transparent 0,
      #000 8%,
      #000 92%,
      transparent 100%
    );
  }
</style>

<script>
  const GRID = 26; // cell size (px)

  function initBlueprintGrid() {
    const canvases = Array.from(
      document.querySelectorAll<HTMLCanvasElement>(".blueprint-grid"),
    );
    for (const canvas of canvases) {
      if ((canvas as any).__bpBound) continue;
      (canvas as any).__bpBound = true;

      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      const parent = canvas.parentElement!;
      const DPR = Math.min(window.devicePixelRatio || 1, 2);

      let W = 0,
        H = 0,
        centerX = 0;

      function accent(): string {
        return (
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-accent")
            .trim() || "#3b82f6"
        );
      }

      function resize() {
        const rect = parent.getBoundingClientRect();
        // Full-bleed: canvas spans the whole viewport width, shifted so its left
        // edge sits at viewport x=0 → canvas-local coords == viewport coords.
        const vw = document.documentElement.clientWidth;
        W = vw;
        H = rect.height;
        // Header center-X in canvas-local (== viewport) coords: the grid is
        // generated symmetrically outward from here so it's anchored to the
        // centered "Projects" title.
        centerX = rect.left + rect.width / 2;

        canvas.style.left = `${-rect.left}px`;
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
        canvas.width = Math.max(1, Math.floor(W * DPR));
        canvas.height = Math.max(1, Math.floor(H * DPR));
        ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
      }

      // Downward fade: 1 at the top → 0 near the bottom (so the grid never
      // touches the cards below the header).
      function vfade(y: number): number {
        return Math.max(0, 1 - y / (H * 0.9));
      }

      function draw() {
        ctx!.clearRect(0, 0, W, H);
        const color = accent();
        ctx!.lineWidth = 1;

        // Vertical lines: generated OUTWARD from centerX in both directions so
        // the pattern is mirror-symmetric and a line lands on the header center.
        // major = every 5th line counted from center. Each line uses a
        // top→bottom gradient stroke that fades toward the bottom.
        const maxK = Math.ceil(W / GRID) + 2;
        for (let k = -maxK; k <= maxK; k++) {
          const x = centerX + k * GRID;
          if (x < -1 || x > W + 1) continue;
          const major = k % 5 === 0;
          const a = major ? 0.22 : 0.1;
          const grad = ctx!.createLinearGradient(0, 0, 0, H);
          grad.addColorStop(0, hexA(color, a));
          grad.addColorStop(0.9, hexA(color, 0));
          grad.addColorStop(1, hexA(color, 0));
          ctx!.strokeStyle = grad;
          ctx!.beginPath();
          ctx!.moveTo(x, 0);
          ctx!.lineTo(x, H);
          ctx!.stroke();
        }

        // Horizontal lines: span full width; alpha scaled per-row by vfade(y).
        // major = every 5th row from the top.
        ctx!.strokeStyle = color;
        let row = 0;
        for (let y = 0; y <= H; y += GRID, row++) {
          const major = row % 5 === 0;
          const a = (major ? 0.22 : 0.1) * vfade(y);
          if (a <= 0.001) continue;
          ctx!.globalAlpha = a;
          ctx!.beginPath();
          ctx!.moveTo(0, y);
          ctx!.lineTo(W, y);
          ctx!.stroke();
        }
        ctx!.globalAlpha = 1;
      }

      // Turn a hex/rgb accent + alpha into an rgba() string. Resolves any CSS
      // color form via a probe element so var()/hex/named all work.
      const probe = document.createElement("span");
      probe.style.display = "none";
      function hexA(color: string, a: number): string {
        if (!probe.isConnected) document.body.appendChild(probe);
        probe.style.color = color;
        const rgb = getComputedStyle(probe).color; // "rgb(r, g, b)"
        const m = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
        const [r, g, b] = m ? [m[1], m[2], m[3]] : ["59", "130", "246"];
        return `rgba(${r},${g},${b},${a})`;
      }

      function render() {
        resize();
        draw();
      }

      render();
      window.addEventListener("resize", render);
      // Redraw on theme change so the line color follows light/dark.
      const themeObs = new MutationObserver(() => draw());
      themeObs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    }
  }

  initBlueprintGrid();
  document.addEventListener("astro:page-load", initBlueprintGrid);
</script>
```

- [ ] **Step 2: Build to verify the component compiles**

Run: `npm run build`
Expected: build completes, current page count indexed, no errors. (The component
isn't mounted yet, so nothing renders — this only checks it compiles.)

- [ ] **Step 3: Commit**

```bash
git add src/components/BlueprintGrid.astro
git commit -m "feat: add BlueprintGrid component (static ruled grid, center-symmetric)"
```

---

### Task 2: Mount the grid behind the Projects header

**Files:**
- Modify: `src/pages/projects.astro` (import + mount; hero z-index CSS)

**Interfaces:**
- Consumes: `BlueprintGrid.astro` from Task 1 (default import, optional `class`).
- Produces: the grid rendered behind `.projects-hero`, with header text/filters
  layered above it.

- [ ] **Step 1: Import the component**

In `src/pages/projects.astro`, add to the frontmatter imports (after the existing
`import { renderInline }`-style imports near the top, e.g. after
`import { pageFade } from "../utils/pageTransition";`):

```astro
import BlueprintGrid from "../components/BlueprintGrid.astro";
```

- [ ] **Step 2: Mount it as the first child of `.projects-hero`**

Change:

```astro
      <div class="projects-hero">
        <h1>Projects</h1>
```

to:

```astro
      <div class="projects-hero">
        <BlueprintGrid />
        <h1>Projects</h1>
```

- [ ] **Step 3: Layer the header above the canvas**

In the `<style>` block, update `.projects-hero` to be a positioning context and
lift its children above the `z-index: 0` canvas. Change:

```css
      .projects-hero {
        text-align: center;
        margin-bottom: 0.5rem;
        padding: 2rem 0;
      }
```

to:

```css
      .projects-hero {
        text-align: center;
        margin-bottom: 0.5rem;
        padding: 2rem 0;
        position: relative;
      }
      .projects-hero h1,
      .projects-hero p {
        position: relative;
        z-index: 1;
      }
```

Also lift the filter bar (it follows the hero and could otherwise sit under a
tall canvas). Find `.projects-filters` and add `position: relative; z-index: 1;`
to its existing rule:

```css
      .projects-filters {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.6rem;
        margin-bottom: 3rem;
        position: relative;
        z-index: 1;
      }
```

- [ ] **Step 4: Build and verify clean**

Run: `npm run build`
Expected: clean build, current page count indexed.

- [ ] **Step 5: Visual check — grid behind header, centered, faded, both themes**

Ensure a dev server is running (reuse the user's; the `visual-check` skill
auto-probes 4321–4325). Then:

```sh
node scripts/shot.mjs /projects/ --width 1200 --theme d --out /tmp/bp-dark.png
node scripts/shot.mjs /projects/ --width 1200 --theme l --out /tmp/bp-light.png
node scripts/shot.mjs /projects/ --width 390 --theme d --out /tmp/bp-mobile.png
```

Read the PNGs. Confirm: a faint ruled grid sits behind "Projects", **symmetric
about the title's center** (a vertical line on/near center, mirror-symmetric
sides), every 5th line brighter, fading out downward toward the cards and at the
left/right edges; header text + filters fully readable above it; adapts to
light/dark; `overflowX` is 0. Hand to the user for final look/tuning.

- [ ] **Step 6: Commit**

```bash
git add src/pages/projects.astro
git commit -m "feat: mount blueprint grid behind the Projects header"
```

---

### Task 3: Dim, don't hide — filter dims non-matching cards in place

**Files:**
- Modify: `src/pages/projects.astro` (`.dimmed` CSS + base-transition tweak; filter `apply()`; tilt `onMove` skip condition)

**Interfaces:**
- Consumes: the existing filter script (`initProjectFilters` / `apply`) and tilt
  script (`initCardTilt` / `onMove`) in `projects.astro`.
- Produces: `.project-card.dimmed` styling + behavior; filter toggles `.dimmed`
  instead of `display:none`; dimmed cards are inert in the tilt handler.

- [ ] **Step 1: Add `.dimmed` CSS and include opacity/filter in the base transition**

In the `<style>` block, the base `.project-card` transition currently reads:

```css
        transition:
          transform 0.4s cubic-bezier(0.23, 1, 0.32, 1),
          box-shadow 0.3s ease,
          border-color 0.3s ease;
```

Change it to also transition opacity + filter so dim/un-dim is smooth:

```css
        transition:
          transform 0.4s cubic-bezier(0.23, 1, 0.32, 1),
          box-shadow 0.3s ease,
          border-color 0.3s ease,
          opacity 0.3s ease,
          filter 0.3s ease;
```

Then add a new rule after the `.project-card` block (near the other
`.project-card` rules, e.g. right after the `.project-card:hover { --lift: -6px; }`
rule):

```css
      /* Filter "lens": non-matching cards recede in place (no reflow) — grayscale
         + dimmed, no size change so the layout stays perfectly stable. */
      .project-card.dimmed {
        filter: grayscale(1);
        opacity: 0.4;
      }
```

- [ ] **Step 2: Toggle `.dimmed` instead of `display:none` in `apply()`**

In the `initProjectFilters()` script, `apply()` currently does:

```js
          cards.forEach((card) => {
            const cats = (card.getAttribute("data-categories") || "")
              .split(",")
              .filter(Boolean);
            // No filter selected → show all; otherwise show if it matches any active filter.
            const show = active.size === 0 || cats.some((c) => active.has(c));
            card.style.display = show ? "" : "none";
            if (show) visible++;
          });
```

Change the body to toggle the class instead of display:

```js
          cards.forEach((card) => {
            const cats = (card.getAttribute("data-categories") || "")
              .split(",")
              .filter(Boolean);
            // No filter selected → all vivid; otherwise a card is "matched" if it
            // matches any active filter. Non-matches DIM in place (no reflow).
            const show = active.size === 0 || cats.some((c) => active.has(c));
            card.classList.toggle("dimmed", !show);
            if (show) visible++;
          });
```

(The `visible` counter and `empty.hidden = visible !== 0` logic below stay as-is;
`visible` now counts matched/non-dimmed cards. With two non-exclusive toggles the
empty state is effectively unreachable, which is fine.)

- [ ] **Step 3: Make the tilt handler skip dimmed cards**

In `initCardTilt()`'s `onMove`, the card-hunt loop currently skips
`display:none` cards:

```js
          for (const c of grid.querySelectorAll(".project-card")) {
            if (c.style.display === "none") continue;
```

Cards are never `display:none` anymore, so change the skip to dimmed cards (so a
dimmed card gets no tilt/glare on hover — reinforcing the lens metaphor):

```js
          for (const c of grid.querySelectorAll(".project-card")) {
            if (c.classList.contains("dimmed")) continue;
```

- [ ] **Step 4: Build and verify clean**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 5: Visual check — dim in place, no reflow, dimmed cards inert**

```sh
# Default (no filter): all cards vivid
node scripts/shot.mjs /projects/ --width 1200 --theme d --out /tmp/dim-none.png
```

The dim/inert behavior is interactive (needs a filter click), so hand to the user
to verify live: toggling Technical / Teaching should **desaturate + dim
non-matching cards in place** (grid does NOT reflow), matches stay vivid;
toggling off restores all; dimmed cards should NOT tilt/glare on hover but should
still be clickable. Also confirm `overflowX` is 0 in the screenshot.

- [ ] **Step 6: Commit**

```bash
git add src/pages/projects.astro
git commit -m "feat: dim (not hide) non-matching project cards; skip tilt on dimmed"
```

---

### Task 4: Final verification pass (both themes, both features)

**Files:**
- Modify (only if inspection requires): `src/components/BlueprintGrid.astro` (density/alpha tuning) and/or `src/pages/projects.astro` (`.dimmed` alpha).

**Interfaces:**
- Consumes: the complete features from Tasks 1–3.
- Produces: final tuned values. No new interfaces.

- [ ] **Step 1: Full visual sweep with the user**

Hand off for visual inspection (user performs). Cover, in BOTH light and dark:
- Blueprint grid: static, center-symmetric, every-5th brighter, fades down + at
  side edges, adapts to theme, no motion, text readable, no overflow.
- Dim-don't-hide: toggle each filter (Technical / Teaching) — non-matching cards
  desaturate + dim in place with no reflow; matches vivid; toggle-off restores;
  dimmed cards inert on hover but clickable.
- Resize + theme toggle redraw the grid correctly; client-side nav into Projects
  re-inits both without double-binding.

- [ ] **Step 2: Apply any tuning the inspection surfaces**

If the grid density/brightness or the dim strength needs adjustment: tune `GRID`
/ the `0.22`/`0.1` alphas in `BlueprintGrid.astro`, and/or the `opacity: 0.4` in
the `.dimmed` rule. Only change what inspection shows is needed (YAGNI).

- [ ] **Step 3: Final build**

Run: `npm run build`
Expected: clean, current page count indexed.

- [ ] **Step 4: Commit any tuning (skip if none needed)**

```bash
git add src/components/BlueprintGrid.astro src/pages/projects.astro
git commit -m "polish: tune blueprint grid + dim strength"
```

- [ ] **Step 5: Finish the development branch**

Use superpowers:finishing-a-development-branch to present completion options
(merge / PR / keep / discard).
```
