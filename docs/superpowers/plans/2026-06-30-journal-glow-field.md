# Journal Lit Particle Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a drifting dust/gas field behind the Journal header that is lit by the active filter acting as a colored, moving light source.

**Architecture:** A new self-contained Astro component (`JournalGlowField.astro`) renders a `<canvas>` behind `.j-head`. Its client script reads existing page state — the live `--cat-color`, the active filter element's rect, and `.j-head`'s intersection — rather than receiving pushed updates, so it stays decoupled from the filter script. The existing `ParticleField.astro` is untouched.

**Tech Stack:** Astro component + scoped CSS + vanilla TS client script; Canvas 2D; `requestAnimationFrame`; `IntersectionObserver`; `getComputedStyle`.

## Global Constraints

- No test framework exists in this repo; "verification" = `npm run build` clean + visual inspection by the user. Do NOT add a test runner.
- Always finish a change with `npm run build` and confirm it's clean.
- Commit only the files a task touches. NEVER add Co-Authored-By or any AI/Claude attribution to commits.
- Dark mode = `data-theme="dark"` on `<html>`; colors are CSS vars (`--color-*`).
- The active filter color lives in the `--cat-color` custom property on `#journal`, set by the existing inline filter script's `apply()`. Do NOT modify that script.
- Canvas must be `pointer-events: none` and `aria-hidden="true"` so it never blocks header text selection or hits a11y.
- Re-init must be idempotent across `astro:page-load` (ClientRouter view transitions) via a per-canvas bound flag — mirror the `__pfBound` pattern in `src/components/ParticleField.astro`.
- Prettier formats `.astro` with 2-space indent; let it normalize, don't fight it.
- `prefers-reduced-motion: reduce` → one static lit frame, no animation.

---

### Task 1: Component scaffold — canvas mounts behind the header, drifting field, no lighting yet

**Files:**
- Create: `src/components/JournalGlowField.astro`
- Modify: `src/pages/blog/index.astro` (import + mount as first child of `.j-head`; add canvas stacking context)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `JournalGlowField.astro` exporting an Astro component with optional props `count?: number` (default 46) and `class?: string`. Its client script defines `initJournalGlowField()` bound once per canvas via a `__glowBound` flag, and an internal `GlowField` setup that exposes (within the closure) the functions `resize()`, `seed()`, `draw()`. A module-level `DPR`, `parts[]` array of `{x,y,vx,vy,r,ph}`, and `REF_AREA` constant. Later tasks add lighting, light-X tracking, and fade to this same script.

- [ ] **Step 1: Create the component with a drifting (unlit) field**

Create `src/components/JournalGlowField.astro`. This first version draws plain accent-colored drifting particles (no lighting) so we can confirm mounting, sizing, stacking, and the reduced-motion path before adding the lighting math. Mirror the structure of `src/components/ParticleField.astro`.

```astro
---
interface Props {
  count?: number;
  class?: string;
}
const { count = 46, class: className = "" } = Astro.props;
---

<canvas
  class:list={["journal-glow-field", className]}
  data-count={count}
  aria-hidden="true"></canvas>

<style>
  .journal-glow-field {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
    /* Fade driven by the IntersectionObserver in a later task. */
    opacity: 1;
    transition: opacity 0.45s ease;
  }
</style>

<script>
  // Reference header area (≈ content width × header height) used to area-scale
  // the particle count so the field isn't sparse on tall mobile headers.
  const REF_AREA = 760 * 210;
  const MIN_N = 18;
  const MAX_N = 80;

  function initJournalGlowField() {
    const canvases = Array.from(
      document.querySelectorAll<HTMLCanvasElement>(".journal-glow-field"),
    );
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    for (const canvas of canvases) {
      if ((canvas as any).__glowBound) continue;
      (canvas as any).__glowBound = true;

      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      const parent = canvas.parentElement!;
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      const baseCount = parseInt(canvas.dataset.count || "46", 10);

      let W = 0,
        H = 0;
      const parts: {
        x: number;
        y: number;
        vx: number;
        vy: number;
        r: number;
        ph: number;
      }[] = [];

      function resize() {
        const rect = parent.getBoundingClientRect();
        W = rect.width;
        H = rect.height;
        canvas.width = Math.max(1, Math.floor(W * DPR));
        canvas.height = Math.max(1, Math.floor(H * DPR));
        ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
      }

      function particleCount() {
        const n = Math.round((baseCount * (W * H)) / REF_AREA);
        return Math.max(MIN_N, Math.min(MAX_N, n));
      }

      function seed() {
        parts.length = 0;
        const N = particleCount();
        for (let i = 0; i < N; i++) {
          parts.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.15,
            vy: (Math.random() - 0.5) * 0.15,
            r: 0.8 + Math.random() * 1.4,
            ph: Math.random() * Math.PI * 2,
          });
        }
      }

      function draw() {
        ctx!.clearRect(0, 0, W, H);
        const accent =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-accent")
            .trim() || "#60a5fa";
        ctx!.fillStyle = accent;
        for (const p of parts) {
          ctx!.globalAlpha = 0.42;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.globalAlpha = 1;
      }

      function tick() {
        for (const p of parts) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x += W;
          if (p.x > W) p.x -= W;
          if (p.y < 0) p.y += H;
          if (p.y > H) p.y -= H;
        }
        draw();
        raf = requestAnimationFrame(tick);
      }

      let raf = 0;
      resize();
      seed();
      if (reduce) {
        draw();
      } else {
        raf = requestAnimationFrame(tick);
      }
      window.addEventListener("resize", () => {
        resize();
        seed();
        if (reduce) draw();
      });
    }
  }

  initJournalGlowField();
  document.addEventListener("astro:page-load", initJournalGlowField);
</script>
```

- [ ] **Step 2: Mount it behind the header in the Journal page**

In `src/pages/blog/index.astro`, add the import alongside the other component imports (near `import JournalPost from "../../components/JournalPost.astro";`):

```astro
import JournalGlowField from "../../components/JournalGlowField.astro";
```

Then mount it as the **first child** of `.j-head`. Change:

```astro
      <header class="j-head">
        <div class="j-eyebrow">
```

to:

```astro
      <header class="j-head">
        <JournalGlowField />
        <div class="j-eyebrow">
```

- [ ] **Step 3: Ensure header text sits above the canvas**

`.j-head` is already `position: relative; z-index: 1`. The canvas is `z-index: 0` inside it, so it's already behind. To guarantee the text children paint above the canvas (not just the header box), confirm the eyebrow/title/subtitle are positioned in normal flow above `z-index: 0` — they are, since the canvas is the only positioned/`z-index`ed child set to 0. No CSS change needed unless visual check shows text behind the canvas; if so, add `position: relative; z-index: 1;` to `.j-eyebrow, #j-title, .j-subtitle` in `src/pages/blog/index.astro`'s `<style>`. (Leave this conditional — only apply if the visual check requires it.)

- [ ] **Step 4: Build and verify clean**

Run: `npm run build`
Expected: build completes; "41 pages" (or current count) indexed; no errors.

- [ ] **Step 5: Visual check — field is visible and behind text**

Hand off to the user for visual inspection, or run the visual-check skill:

```sh
node scripts/shot.mjs /blog/ --width 1200 --out /tmp/glow-task1.png
node scripts/shot.mjs /blog/ --width 390 --out /tmp/glow-task1-mobile.png
```

Read the PNGs. Confirm: drifting accent particles appear behind the header text; `overflowX` is 0; header text is fully legible. (Lighting comes in Task 2 — at this stage it's a uniform field.)

- [ ] **Step 6: Commit**

```bash
git add src/components/JournalGlowField.astro src/pages/blog/index.astro
git commit -m "feat: scaffold Journal glow field (drifting field behind header)"
```

---

### Task 2: Lighting — radial glow + per-particle distance/directional shading at a fixed light point

**Files:**
- Modify: `src/components/JournalGlowField.astro` (replace `draw()` body; add light state + color resolution)

**Interfaces:**
- Consumes: from Task 1 — the per-canvas closure with `W`, `H`, `parts[]`, `ctx`, `draw()`, `tick()`, and the `--cat-color`/`--color-accent` reading approach.
- Produces: within the closure — a `light` object `{ x: number, y: number }` (this task fixes `x = W/2`, `y = H - 14`; Task 3 animates `x`); a `lightRGB: [number, number, number]` cache; helper `resolveCatColor(): [number,number,number]` that reads `--cat-color` off `#journal`, resolves `var()`/hex to concrete RGB, and is called only when the raw string changes; tuning constants object `LOOK` with the look-B values. Task 3 will mutate `light.x` over time.

- [ ] **Step 1: Add color resolution + look constants + light state**

In the per-canvas closure (after `const baseCount = ...`), add:

```ts
      // Look B (Balanced) tuning, from the approved visual demo.
      const LOOK = {
        glow: 1.0, // glow radius as fraction of min(W,H)
        glowAlpha: 0.16, // peak glow opacity at the core
        lightAlpha: 0.75, // proximity brightening weight
        shade: 0.55, // directional highlight/shadow weight
        baseAlpha: 0.42, // ambient particle alpha away from light
      };

      // Light source state. Task 3 animates light.x toward the active pill.
      const light = { x: 0, y: 0 };

      // Resolve --cat-color (may be a hex like #3b82f6 or var(--color-accent))
      // to concrete RGB. Only re-run when the raw string changes.
      let lastColorStr = "";
      let lightRGB: [number, number, number] = [96, 165, 250];
      const probe = document.createElement("span");
      probe.style.display = "none";
      function resolveCatColor() {
        const journal = document.getElementById("journal");
        const raw = journal
          ? getComputedStyle(journal).getPropertyValue("--cat-color").trim()
          : "";
        if (raw === lastColorStr) return;
        lastColorStr = raw;
        // Let the browser resolve var()/hex/named to rgb() via computed style.
        if (!probe.isConnected) document.body.appendChild(probe);
        probe.style.color = raw || "var(--color-accent)";
        const rgb = getComputedStyle(probe).color; // "rgb(r, g, b)"
        const m = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
        if (m) lightRGB = [+m[1], +m[2], +m[3]];
      }
```

- [ ] **Step 2: Replace `draw()` with the lit renderer**

Replace the entire `draw()` function from Task 1 with:

```ts
      function draw(time = 0) {
        resolveCatColor();
        const [r, g, b] = lightRGB;
        const lx = light.x;
        const ly = light.y;

        ctx!.clearRect(0, 0, W, H);

        // Dust glow: soft radial cloud centered on the light.
        const gr = Math.min(W, H) * LOOK.glow;
        const grad = ctx!.createRadialGradient(lx, ly, 0, lx, ly, gr);
        grad.addColorStop(0, `rgba(${r},${g},${b},${LOOK.glowAlpha})`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${LOOK.glowAlpha * 0.35})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx!.fillStyle = grad;
        ctx!.fillRect(0, 0, W, H);

        // Particles lit by distance + direction to the light.
        const maxd = Math.hypot(W, H);
        for (const p of parts) {
          const dx = p.x - lx;
          const dy = p.y - ly;
          const dist = Math.hypot(dx, dy) || 1;
          const prox = Math.max(0, 1 - dist / (maxd * 0.7)); // brighter near light
          const facing = (-dx / dist) * 0.6 + (-dy / dist) * 0.4; // -1..1
          const dirLit = 0.5 + 0.5 * facing; // 0..1
          const twinkle = 0.85 + 0.15 * Math.sin(time * 1.5 + p.ph);

          const lit =
            LOOK.baseAlpha +
            LOOK.lightAlpha * prox * prox +
            LOOK.shade * prox * (dirLit - 0.5);
          const a = Math.max(0.04, Math.min(1, lit * twinkle));

          // Hot core: tint toward white near the light, accent color farther out.
          const heat = prox * prox;
          const cr = Math.round(r + (255 - r) * heat * 0.7);
          const cg = Math.round(g + (255 - g) * heat * 0.7);
          const cb = Math.round(b + (255 - b) * heat * 0.7);

          ctx!.globalAlpha = a;
          ctx!.fillStyle = `rgb(${cr},${cg},${cb})`;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.globalAlpha = 1;
      }
```

- [ ] **Step 3: Set the light's fixed position on resize, and pass time into the loop**

Update `resize()` to set the light's vertical track and a default X (Task 3 will animate X). Add at the END of the existing `resize()` body:

```ts
        light.y = H - 14;
        if (light.x === 0) light.x = W / 2;
```

Update `tick()` to pass a time value to `draw()`:

```ts
      let t0 = 0;
      function tick(now: number) {
        if (!t0) t0 = now;
        const time = (now - t0) / 1000;
        for (const p of parts) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x += W;
          if (p.x > W) p.x -= W;
          if (p.y < 0) p.y += H;
          if (p.y > H) p.y -= H;
        }
        draw(time);
        raf = requestAnimationFrame(tick);
      }
```

The reduced-motion branch calls `draw()` with no time arg (twinkle term resolves to `sin(0)`, a valid static frame). The initial `raf = requestAnimationFrame(tick)` already passes a timestamp.

- [ ] **Step 4: Build and verify clean**

Run: `npm run build`
Expected: clean build, no TS errors.

- [ ] **Step 5: Visual check — lighting reads in both themes**

```sh
node scripts/shot.mjs /blog/ --width 1200 --theme d --out /tmp/glow-task2-dark.png
node scripts/shot.mjs /blog/ --width 1200 --theme l --out /tmp/glow-task2-light.png
```

Read both PNGs. Confirm: a soft glow sits at header center; particles near it are brighter/whiter with a directional highlight; the effect reads in BOTH light and dark mode (glow not washed out in light mode). If light mode washes out, note it for tuning but proceed — Task 5 is the tuning/inspection gate.

- [ ] **Step 6: Commit**

```bash
git add src/components/JournalGlowField.astro
git commit -m "feat: add radial glow + per-particle lighting to glow field"
```

---

### Task 3: Light tracks the active filter — measure pill center-X, glide on filter change

**Files:**
- Modify: `src/components/JournalGlowField.astro` (add target-X measurement, eased glide, recompute triggers)

**Interfaces:**
- Consumes: from Task 2 — `light.x`, `W`, the canvas element, `resolveCatColor()`, `tick()`.
- Produces: within the closure — `measureLightTargetX(): number` (reads `.j-filter.active`'s rect, returns canvas-relative clamped center-X, falls back to `W/2`); a `targetX` variable the glide eases `light.x` toward each frame; listeners on filter `click`, window `hashchange`, and `resize` that call a `recomputeTarget()` updating `targetX`.

- [ ] **Step 1: Add target-X measurement (layout-agnostic, desktop + mobile)**

In the closure, after the `light` declaration, add:

```ts
      // The light's horizontal anchor is the center-X of the currently-active
      // filter element, measured live. Works for desktop pills, the desktop
      // plain-text Notebook filter, AND the mobile own-row Notebook pill —
      // we use only center-X (ignore Y), so row/layout differences don't matter.
      let targetX = 0;
      function measureLightTargetX(): number {
        const active = document.querySelector(".j-filter.active");
        if (!active) return W / 2;
        const ar = (active as HTMLElement).getBoundingClientRect();
        const cr = canvas.getBoundingClientRect();
        const x = ar.left + ar.width / 2 - cr.left;
        return Math.max(0, Math.min(W, x));
      }
      function recomputeTarget() {
        targetX = measureLightTargetX();
      }
```

- [ ] **Step 2: Initialize targetX and ease light.x toward it each frame**

In `resize()`, replace the `if (light.x === 0) light.x = W / 2;` line added in Task 2 with:

```ts
        targetX = measureLightTargetX();
        if (light.x === 0) light.x = targetX;
```

In `tick()`, add the easing BEFORE `draw(time)` (a critically-damped-ish lerp that settles in ~0.4s at 60fps):

```ts
        light.x += (targetX - light.x) * 0.12;
```

For the reduced-motion branch (which calls `draw()` directly without `tick`), set the light to the target immediately. In the `if (reduce)` block, change `draw();` to:

```ts
        targetX = measureLightTargetX();
        light.x = targetX;
        draw();
```

- [ ] **Step 3: Wire recompute triggers (filter click, hashchange, resize)**

After the `window.addEventListener("resize", ...)` block, add:

```ts
      // Recompute the light target when the active filter changes by any means:
      // a pill click, a URL-hash filter change (or Back), or a layout reflow.
      document.querySelectorAll(".j-filter").forEach((btn) => {
        btn.addEventListener("click", () => {
          // The filter script toggles .active synchronously on click; measure
          // on the next frame so the new active element + its rect are settled.
          requestAnimationFrame(recomputeTarget);
        });
      });
      window.addEventListener("hashchange", () =>
        requestAnimationFrame(recomputeTarget),
      );
```

Also update the existing `resize` listener to recompute the target (it currently re-seeds; add the target recompute). Change the resize handler body to:

```ts
        resize();
        seed();
        recomputeTarget();
        if (reduce) {
          light.x = targetX;
          draw();
        }
```

- [ ] **Step 4: Build and verify clean**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 5: Visual check — light lands on the active pill, glides on switch, mobile Notebook**

Use the visual-check skill to screenshot each filter state (the `--open`/click flow can't easily script a filter click, so measure positions or hand to the user). At minimum:

```sh
# Default (All active) — light near the "All" pill
node scripts/shot.mjs /blog/ --width 1200 --out /tmp/glow-task3-all.png
# Notebook active via hash — light under the plain-text Notebook filter (desktop)
node scripts/shot.mjs "/blog/#notes" --width 1200 --out /tmp/glow-task3-notes-desktop.png
# Notebook active via hash — own-row pill (mobile)
node scripts/shot.mjs "/blog/#notes" --width 390 --out /tmp/glow-task3-notes-mobile.png
```

Read the PNGs. Confirm the glow's horizontal center sits under the active filter in each case, on both desktop and mobile. (The glide itself is motion — confirm via live interaction or hand to the user.)

- [ ] **Step 6: Commit**

```bash
git add src/components/JournalGlowField.astro
git commit -m "feat: light source tracks + glides to the active filter pill"
```

---

### Task 4: Fade + pause on scroll via IntersectionObserver on the header

**Files:**
- Modify: `src/components/JournalGlowField.astro` (IntersectionObserver on `.j-head`, opacity fade, rAF pause/resume)

**Interfaces:**
- Consumes: from Task 3 — `canvas`, `raf`, `tick`, the `parent` (`.j-head`) element, the `reduce` flag.
- Produces: an `IntersectionObserver` that toggles `canvas.style.opacity` between `"1"` and `"0"` and starts/stops the rAF loop as `.j-head` enters/leaves the viewport. No interface consumed by later tasks (Task 5 is verification only).

- [ ] **Step 1: Replace the plain rAF start with an IntersectionObserver-gated loop**

In the non-reduced-motion branch, replace:

```ts
      } else {
        raf = requestAnimationFrame(tick);
      }
```

with:

```ts
      } else {
        const io = new IntersectionObserver((entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              canvas.style.opacity = "1";
              recomputeTarget(); // re-measure in case layout shifted while away
              if (!raf) raf = requestAnimationFrame(tick);
            } else {
              canvas.style.opacity = "0";
              cancelAnimationFrame(raf);
              raf = 0;
            }
          }
        });
        io.observe(parent); // parent is .j-head
      }
```

The `.journal-glow-field` CSS from Task 1 already has `transition: opacity 0.45s ease`, so toggling opacity fades smoothly. The canvas starts at `opacity: 1` (CSS), and the observer fires immediately on observe to set the correct initial state.

- [ ] **Step 2: Build and verify clean**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 3: Visual check — fade on scroll-out, resume on scroll-in**

```sh
# Top of page: field visible
node scripts/shot.mjs /blog/ --width 1200 --out /tmp/glow-task4-top.png
# Scrolled down so the header has left view: field faded to 0
node scripts/shot.mjs /blog/ --width 1200 --scroll 600 --out /tmp/glow-task4-scrolled.png
```

Read both. Confirm: at top the field shows; scrolled past the header it's gone (opacity 0). Live-verify (or hand to user) that scrolling back up fades it back in and motion resumes. Confirm `header.top` is 0 after scroll (sticky navbar unaffected) and `overflowX` is 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/JournalGlowField.astro
git commit -m "feat: fade + pause Journal glow field when header scrolls out of view"
```

---

### Task 5: Final tuning + full verification pass (light/dark, all filters, reduced motion)

**Files:**
- Modify (only if inspection requires): `src/components/JournalGlowField.astro` (`LOOK` constants and/or a theme-aware alpha multiplier)

**Interfaces:**
- Consumes: the complete component from Tasks 1–4.
- Produces: final tuned constants. No new code interfaces.

- [ ] **Step 1: Full visual sweep with the user**

Hand off for visual inspection (the user does this per the spec). Cover, in BOTH light and dark themes:
- Each filter active (News / Math / Physics / All / Notebook) — color + light position correct.
- Notebook on desktop (plain-text anchor) and mobile (own-row pill anchor).
- Light glides (not snaps) when switching filters.
- Scroll-out fade and scroll-in resume.
- Header text fully readable over the field at look-B intensity.

- [ ] **Step 2: Apply any tuning the inspection surfaces**

If light mode washes out or any value needs adjustment, tune `LOOK` constants in `src/components/JournalGlowField.astro`. If light vs dark need different intensity, add a theme multiplier read once per `draw()`:

```ts
        const dark =
          document.documentElement.getAttribute("data-theme") === "dark";
        const k = dark ? 1 : 0.85; // example: damp glow slightly in light mode
```

and multiply `LOOK.glowAlpha`/particle alphas by `k`. Only add this if inspection shows it's needed (YAGNI otherwise).

- [ ] **Step 3: Reduced-motion check**

Verify the static lit frame renders with `prefers-reduced-motion`:

```sh
node scripts/shot.mjs /blog/ --width 1200 --out /tmp/glow-task5-rm.png
```

(The shot script doesn't force reduced-motion; confirm via DevTools emulation or by temporarily forcing `reduce = true`. Hand to user if needed.) Confirm a single lit frame with the light at the active pill, no console errors.

- [ ] **Step 4: Final build**

Run: `npm run build`
Expected: clean, 41+ pages indexed.

- [ ] **Step 5: Commit any tuning (skip if no changes were needed)**

```bash
git add src/components/JournalGlowField.astro
git commit -m "polish: tune Journal glow field intensity for both themes"
```

- [ ] **Step 6: Finish the development branch**

Use superpowers:finishing-a-development-branch to present completion options (merge / PR / keep / discard).
