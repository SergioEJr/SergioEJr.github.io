# Site Polish Touches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five tasteful, on-brand polish touches — draw-on blog title underlines, a Journal count-up, a reusable drifting-particle field, a bespoke potential-well 404, and branded text selection.

**Architecture:** Mostly scoped CSS + small inline scripts in existing Astro components, plus two new files: a focused `odometer.ts` helper and a reusable `ParticleField.astro` component (consumed by the footer and the 404). All motion is guarded behind `prefers-reduced-motion`.

**Tech Stack:** Astro (static), vanilla TS/JS, scoped CSS, canvas for the particle field. Build via `npm run build` (also runs Pagefind).

## Global Constraints

- **No unit-test framework exists** (only Playwright, dev-only). The per-task verification cycle is: `npm run build` must be clean, then **the user does the visual inspection**. Do not run Playwright screenshots unless asked.
- Every animation MUST respect `prefers-reduced-motion: reduce` — degrade to the final static state, no motion. Mirror the guard style in `HeroSim.astro`/`index.astro`: `window.matchMedia("(prefers-reduced-motion: reduce)").matches`.
- Do not regress sticky-navbar / horizontal-overflow rules (`overflow-x: clip`, never `hidden`/`auto`).
- Colors come from existing `--color-*` vars and category colors; handle light + dark.
- **No Claude/AI attribution** in commit messages — plain messages only, no `Co-Authored-By` trailer.
- Commit after each task. Do not push.
- The repo uses Prettier (2-space indent in `.astro`); match surrounding formatting.

## File Structure

- `src/components/JournalPost.astro` — Task 1: draw-on title underline (CSS only).
- `src/utils/odometer.ts` *(new)* — Task 2: count-up animation helper (one focused responsibility).
- `src/pages/blog/index.astro` — Task 2: wire the odometer into the eyebrow count + filter script.
- `src/components/ParticleField.astro` *(new)* — Task 3: reusable canvas drifting-particle field.
- `src/components/Footer.astro` — Task 3: host the field.
- `src/pages/404.astro` — Task 4: bespoke potential-well 404, reuses Task 3's component.
- `src/styles/global.css` — Task 5: `::selection`.

Tasks are ordered so Task 3 (ParticleField) lands before Task 4 (which consumes it).

---

### Task 1: Draw-on underline on blog post titles

Replace the fade-in hover border on `.j-post-title` with a left→right draw-on underline via a pseudo-element. Static (`noLink`) titles stay underline-free.

**Files:**
- Modify: `src/components/JournalPost.astro` (the `.j-post-title` styles in its `<style>` block)

**Interfaces:**
- Consumes: existing `--cat-color` (set inline on `.j-post`), `.j-post:hover`, `.j-post-title--static`.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Replace the title underline CSS**

In `src/components/JournalPost.astro`, the current rules are:

```css
.j-post-title {
  ...
  border-bottom: 2px solid transparent;
  padding-bottom: 0.15rem;
  ...
}
.j-post:hover .j-post-title { border-bottom-color: var(--cat-color); }
```

Replace the `border-bottom` approach with a pseudo-element bar that scales in from the left. Set `.j-post-title` to `position: relative`, drop its `border-bottom`, and add the `::after`:

```css
.j-post-title {
  /* keep existing font/size/margin/padding-bottom; change underline mechanism */
  position: relative;
  border-bottom: none;
}
.j-post-title::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: var(--cat-color);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.j-post:hover .j-post-title::after { transform: scaleX(1); }
```

Keep the existing `padding-bottom` so the bar sits just below the text with no layout shift.

- [ ] **Step 2: Suppress the underline on static (noLink) titles**

`.j-post-title--static` titles must have no draw-on affordance. Update its rule (currently removes border/padding) to also hide the pseudo-element:

```css
.j-post-title--static { padding-bottom: 0; cursor: default; }
.j-post-title--static::after { display: none; }
```

Remove the now-obsolete `.j-post:hover .j-post-title--static { border-bottom-color: transparent; }` rule if present.

- [ ] **Step 3: Add the reduced-motion fallback**

After the rules above, add:

```css
@media (prefers-reduced-motion: reduce) {
  .j-post-title::after { transition: none; }
}
```

(Underline still appears instantly on hover; just no draw motion.)

- [ ] **Step 4: Build to verify clean**

Run: `npm run build`
Expected: completes with no errors.

- [ ] **Step 5: User visual check + commit**

Ask the user to confirm: hovering a blog post title draws the underline left→right in the category color; static update posts show no underline. Then:

```bash
git add src/components/JournalPost.astro
git commit -m "feat: draw-on underline for blog post titles"
```

---

### Task 2: Journal count-up odometer

A focused odometer helper animates the Journal `#j-eyebrow-count` number: honest 0→N sequence, scrolls downward, eased settle, `document.fonts.ready`-gated, animates prev→new on filter change, reduced-motion safe.

**Files:**
- Create: `src/utils/odometer.ts`
- Modify: `src/pages/blog/index.astro` (eyebrow markup + inline filter `<script>` + a small style block)

**Interfaces:**
- Produces: `src/utils/odometer.ts` exports `createOdometer(el: HTMLElement): { to(target: number): void }`. It rebuilds the element as rolling digit columns and `to(target)` rolls them to `target`. Honors `prefers-reduced-motion` (renders final digits, no roll) and waits for `document.fonts.ready` before the first roll.
- Consumes (in index.astro): the `#j-eyebrow-count` element; the inline `apply()` writes the intended count to its `data-count` attribute, which a MutationObserver in the module script reads to drive `to()`. The two scripts are decoupled — `apply()` does not call the odometer directly.

- [ ] **Step 1: Create the odometer helper**

Create `src/utils/odometer.ts`:

This is a **true rolling odometer** (per-digit strips that scroll downward), matching the mockups the user iterated on — not a plain numeric tween. Each digit column is a vertical strip of `0..9` (with leading "spin" copies so multi-digit places roll), the strip is translated so the target digit lands at rest, and the transform eases out. Width is reserved up front with an invisible ghost of the target so trailing text (e.g. a `+`) never shifts; `font-variant-numeric: tabular-nums` keeps glyph widths equal. The first animated run waits for `document.fonts.ready` (the font swapping in after first paint caused the hard-refresh jitter we found).

```ts
// A rolling-digit odometer for a small count element. Builds per-digit columns
// whose strips scroll DOWNWARD to land on the target digits, easing to a settle.
// - Honest digits: each column shows 0..9; no random filler.
// - Width reserved via an invisible ghost of the target (trailing text holds).
// - First animated run gated on document.fonts.ready (kills hard-refresh jitter).
// - prefers-reduced-motion: sets the final number instantly, no roll.

const DURATION_MS = 1600;
const EASE = "cubic-bezier(.12,.9,.18,1)"; // strong ease-out settle

export function createOdometer(el: HTMLElement) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = parseInt(el.textContent || "0", 10) || 0;
  let fontsReady = !(document.fonts && document.fonts.ready);
  if (!fontsReady) document.fonts.ready.then(() => (fontsReady = true));

  // The element becomes a flex row of digit columns. tabular-nums for equal width.
  el.style.display = "inline-flex";
  el.style.alignItems = "flex-end";
  el.style.fontVariantNumeric = "tabular-nums";
  el.style.lineHeight = "1";

  function render(target: number) {
    target = Math.max(0, Math.round(target));
    const digits = String(target).split("");
    el.textContent = "";

    digits.forEach((d) => {
      const col = document.createElement("span"); // 1em-tall window
      col.style.height = "1em";
      col.style.overflow = "hidden";
      col.style.display = "inline-block";
      col.style.position = "relative";

      // ghost reserves this column's width
      const ghost = document.createElement("span");
      ghost.textContent = d;
      ghost.style.visibility = "hidden";
      ghost.style.display = "block";

      const strip = document.createElement("span");
      strip.style.position = "absolute";
      strip.style.left = "0";
      strip.style.bottom = "0";
      strip.style.display = "flex";
      strip.style.flexDirection = "column";
      strip.style.alignItems = "center";

      // Strip rows: target at TOP, then 9..0, ending on target at BOTTOM. Start
      // showing the bottom row; animate translateY(0) so it rolls DOWN to the top
      // target row. (Mirrors the brainstormed v6 behavior.)
      const target_d = parseInt(d, 10);
      const rows: number[] = [target_d];
      for (let n = 9; n >= 0; n--) rows.push(n);
      rows.push(target_d);
      strip.innerHTML = rows
        .map((n) => `<span style="height:1em;line-height:1">${n}</span>`)
        .join("");

      col.appendChild(ghost);
      col.appendChild(strip);
      el.appendChild(col);

      if (reduce) {
        strip.style.transform = "translateY(0)"; // rest on top target row
        return;
      }
      const last = rows.length - 1;
      strip.style.transition = "none";
      strip.style.transform = `translateY(-${last}em)`; // start at bottom row
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          strip.style.transition = `transform ${DURATION_MS}ms ${EASE}`;
          strip.style.transform = "translateY(0)"; // roll down to target
        }),
      );
    });
  }

  function to(target: number) {
    current = Math.max(0, Math.round(target));
    if (reduce || fontsReady) {
      render(current);
    } else {
      document.fonts.ready.then(() => render(current));
    }
  }

  return { to };
}
```

Note on `to()` semantics: each call re-renders the digit columns and rolls them to `target`. Because every column always rolls through a full 9→0 sequence into place, switching filters (e.g. 9 → 3) produces a clean roll to the new number; the implementer does not need a per-digit diff. This satisfies the spec's "animates from the previous value to the new value" intent (the displayed number transitions to the new one with a roll), without filler digits.

- [ ] **Step 2: Wire the odometer via a MutationObserver (no cross-script coupling)**

The existing inline `is:inline` filter script keeps doing exactly what it does today — setting `eyeCount.textContent = String(visible)`. We do NOT modify `apply()`. Instead, a separate **module** `<script>` owns the odometer and watches the count element for text changes, so the two scripts stay fully decoupled (no `window` globals, no load-order race, no double-render).

Add this module script block near the existing inline script in `src/pages/blog/index.astro`:

```astro
<script>
  import { createOdometer } from "../../utils/odometer";

  function initCountUp() {
    const countEl = document.getElementById("j-eyebrow-count");
    if (!countEl || (countEl as any).__odoBound) return;
    (countEl as any).__odoBound = true;

    // The number the page rendered/just set, before we take over rendering.
    const initial = parseInt(countEl.textContent || "0", 10) || 0;
    const odo = createOdometer(countEl);

    // Roll 0 -> initial on first paint.
    odo.to(initial);

    // When the inline filter script writes a new number, roll to it. The
    // observer reads the *intended* value from a data attribute the odometer
    // is NOT managing: since the odometer replaces textContent with digit
    // columns, we can't observe textContent directly. So have apply() write the
    // value to `data-count` instead (Step 3), and observe that attribute.
    const obs = new MutationObserver(() => {
      const v = parseInt(countEl.getAttribute("data-count") || "0", 10) || 0;
      odo.to(v);
    });
    obs.observe(countEl, { attributes: true, attributeFilter: ["data-count"] });
  }

  initCountUp();
  document.addEventListener("astro:page-load", initCountUp);
</script>
```

- [ ] **Step 3: Have `apply()` publish the count via `data-count`**

Because the odometer replaces `#j-eyebrow-count`'s `textContent` with digit-column markup, the inline script must stop writing visible text into it and instead publish the intended number on a `data-count` attribute (which the observer above reads). In the inline `<script>`, change the final line of `apply()`:

```js
eyeCount.textContent = String(visible);
```

to:

```js
eyeCount.setAttribute("data-count", String(visible));
```

Also set the initial attribute so first paint has a value. In the eyebrow markup, add `data-count` to the span:

```astro
<span id="j-eyebrow-count" data-count={counts.all}>{counts.all}</span>
```

Now: on load, the server renders the number as text AND `data-count`; the module script reads it, rolls 0→N, and takes over the element's contents; every subsequent filter change updates `data-count`, the observer fires, and the odometer rolls to the new value. The inline script never fights the odometer for `textContent`.

- [ ] **Step 4: Confirm the no-JS / reduced-motion fallbacks**

- No-JS: the server-rendered `{counts.all}` text shows the correct initial count (the module script simply never runs). Good.
- Reduced-motion: `createOdometer` renders the final digits with no roll on every `to()`, including the observer-driven filter changes. Confirm the number is always correct and static.

- [ ] **Step 5: Build to verify clean**

Run: `npm run build`
Expected: no errors. (TypeScript in the module script is compiled by Astro/Vite.)

- [ ] **Step 6: User visual check + commit**

Ask the user to confirm on `npm run preview`: Journal load animates the count 0→N with an eased settle; switching filters animates prev→new; **hard refresh** shows no horizontal jitter of the count/trailing text; reduced-motion shows instant numbers. Then:

```bash
git add src/utils/odometer.ts src/pages/blog/index.astro
git commit -m "feat: count-up odometer on the Journal pieces count"
```

---

### Task 3: Reusable drifting-particle field + footer

A small canvas component renders faint, slowly drifting particles. Reused later by the 404. Placed in the footer at low opacity.

**Files:**
- Create: `src/components/ParticleField.astro`
- Modify: `src/components/Footer.astro` (render the field; `.site-footer` is already `position: relative`)

**Interfaces:**
- Produces: `ParticleField.astro` accepting props `count?: number` (default 36), `opacity?: number` (default 0.5, the canvas layer opacity), `class?: string`. Renders a single `<canvas>` filling its positioned parent (`position:absolute; inset:0; pointer-events:none`). The consumer must be `position: relative; overflow: hidden`.
- Consumes (404, Task 4): `<ParticleField />`.

- [ ] **Step 1: Create the ParticleField component**

Create `src/components/ParticleField.astro`:

```astro
---
interface Props {
  count?: number;
  opacity?: number;
  class?: string;
}
const { count = 36, opacity = 0.5, class: className = "" } = Astro.props;
---

<canvas
  class:list={["particle-field", className]}
  data-count={count}
  style={`opacity:${opacity}`}
  aria-hidden="true"></canvas>

<style>
  .particle-field {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  }
</style>

<script>
  function initParticleFields() {
    const canvases = Array.from(
      document.querySelectorAll<HTMLCanvasElement>(".particle-field"),
    );
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    for (const canvas of canvases) {
      if ((canvas as any).__pfBound) continue;
      (canvas as any).__pfBound = true;

      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      const parent = canvas.parentElement!;
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      const N = parseInt(canvas.dataset.count || "36", 10);
      // Accent-ish dot color; read from CSS var on <html>.
      const dotColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-accent")
        .trim() || "#60a5fa";

      let W = 0,
        H = 0;
      const parts: { x: number; y: number; vx: number; vy: number; r: number }[] =
        [];

      function resize() {
        const rect = parent.getBoundingClientRect();
        W = rect.width;
        H = rect.height;
        canvas.width = Math.max(1, Math.floor(W * DPR));
        canvas.height = Math.max(1, Math.floor(H * DPR));
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      }
      function seed() {
        parts.length = 0;
        for (let i = 0; i < N; i++) {
          parts.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.15,
            vy: (Math.random() - 0.5) * 0.15,
            r: 0.8 + Math.random() * 1.4,
          });
        }
      }
      function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = dotColor;
        for (const p of parts) {
          ctx.globalAlpha = 0.35 + Math.random() * 0.15;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
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
        draw(); // static field, no motion
      } else {
        // Pause when scrolled out of view (footer is always in DOM).
        const io = new IntersectionObserver((entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              if (!raf) raf = requestAnimationFrame(tick);
            } else {
              cancelAnimationFrame(raf);
              raf = 0;
            }
          }
        });
        io.observe(canvas);
      }
      window.addEventListener("resize", () => {
        resize();
        seed();
        if (reduce) draw();
      });
    }
  }
  initParticleFields();
  document.addEventListener("astro:page-load", initParticleFields);
</script>
```

- [ ] **Step 2: Render the field in the footer**

In `src/components/Footer.astro`, import the component in the frontmatter:

```ts
import ParticleField from "./ParticleField.astro";
```

Then add it as the first child inside `<footer class="site-footer">`, before `.footer-content`:

```astro
<footer class="site-footer">
  <ParticleField count={30} opacity={0.18} />
  <div class="footer-content">
```

- [ ] **Step 3: Ensure footer clips and layers correctly**

`.site-footer` is already `position: relative`. Add `overflow: hidden` to it (so drifting dots don't spill) and make sure content sits above the canvas. In the `.site-footer` rule add `overflow: hidden;`. The `.footer-content` is already `max-width` centered; give it `position: relative; z-index: 1;` so it layers above the `z-index:0` canvas:

```css
.footer-content {
  position: relative;
  z-index: 1;
  /* keep existing max-width / margin */
}
```

(The existing `.site-footer::before` top-border has no z-index; it will still paint. If it disappears behind the canvas, give it `z-index: 1` too.)

- [ ] **Step 4: Build to verify clean**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 5: User visual check + commit**

Ask the user to confirm on `npm run preview`, light + dark: the footer shows a subtle drifting field, footer text stays fully readable, no horizontal overflow, and reduced-motion shows a static field. Then:

```bash
git add src/components/ParticleField.astro src/components/Footer.astro
git commit -m "feat: reusable drifting-particle field in the footer"
```

---

### Task 4: Potential-well 404

Replace the inherited-template 404 with a bespoke physics concept: a particle that has escaped a potential well, over the drifting-particle field, keeping the useful navigation.

**Files:**
- Modify: `src/pages/404.astro` (replace the design; keep imports + nav utility)

**Interfaces:**
- Consumes: `ParticleField.astro` (Task 3), existing `Header`, `Footer`, `BaseHead`, `pageFade`, `url`, `.btn`/`.btn-outline`.

- [ ] **Step 1: Rewrite the 404 markup**

In `src/pages/404.astro`, keep the frontmatter imports and add the ParticleField import:

```ts
import ParticleField from "../components/ParticleField.astro";
```

Replace the `<section class="not-found-wrap">…</section>` body with the potential-well composition. The panel hosts the field, an SVG well with an escapee particle, the headline/copy, primary actions, and the quick-destinations list:

```astro
<section class="nf">
  <ParticleField count={28} opacity={0.16} />
  <div class="nf-inner">
    <div class="nf-main">
      <span class="nf-chip">Error · 404</span>
      <div class="nf-well" aria-hidden="true">
        <svg viewBox="0 0 600 160" preserveAspectRatio="none">
          <path
            d="M0,20 C150,20 180,150 300,150 C420,150 450,20 600,20"
            fill="none"
            stroke="var(--color-border)"
            stroke-width="2"></path>
        </svg>
        <span class="nf-particle"></span>
      </div>
      <h1 class="nf-title">A particle escaped the well.</h1>
      <p class="nf-desc">
        This page isn’t bound to the site anymore — it may have moved, or it
        never existed. Here’s the way back.
      </p>
      <div class="actions">
        <a class="btn" href={url("/")}>Return Home</a>
        <a class="btn btn-outline" href={url("/blog")}>Read the Journal</a>
      </div>
    </div>
    <aside class="nf-suggest">
      <h3>Quick Destinations</h3>
      <ul>
        <li><a href={url("/publications")}>Publications</a></li>
        <li><a href={url("/projects")}>Projects</a></li>
        <li><a href={url("/about")}>About</a></li>
        <li><a href={url("/blog")}>Journal</a></li>
      </ul>
    </aside>
  </div>
</section>
```

- [ ] **Step 2: Replace the 404 styles**

Replace the page's `<style>` block contents with styles for the new composition. The panel is `position: relative; overflow: hidden` (to host the field), content sits above it, and the escapee particle animates up-and-out of the well:

```css
.nf {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 3.5rem 2rem;
  background:
    radial-gradient(900px 400px at 12% -20%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 60%),
    linear-gradient(160deg, var(--color-bg) 0%, var(--color-bg-offset) 100%);
  box-shadow: var(--shadow-md);
}
.nf-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 2rem;
  align-items: end;
}
.nf-chip {
  display: inline-block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: var(--color-accent);
  border: 1px solid color-mix(in srgb, var(--color-accent) 25%, var(--color-border));
  border-radius: 999px;
  padding: 0.3rem 0.6rem;
  margin-bottom: 1rem;
}
.nf-well {
  position: relative;
  height: 90px;
  margin: 0.5rem 0 1.25rem;
}
.nf-well svg {
  width: 100%;
  height: 100%;
}
.nf-particle {
  position: absolute;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 12px var(--color-accent);
  left: 46%;
  top: 78%;
  animation: nf-escape 4s ease-in-out infinite;
}
@keyframes nf-escape {
  0% { left: 46%; top: 78%; opacity: 0.7; }
  50% { left: 80%; top: 8%; opacity: 1; }
  100% { left: 46%; top: 78%; opacity: 0.7; }
}
.nf-title {
  font-family: var(--font-serif);
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  margin: 0 0 0.6rem;
  border: 0;
}
.nf-desc {
  margin: 0;
  max-width: 52ch;
  color: var(--color-text-muted);
  font-size: 1.02rem;
}
.actions {
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}
.nf-suggest {
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--color-bg-offset) 84%, transparent);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  padding: 1rem;
}
.nf-suggest h3 {
  margin: 0 0 0.8rem;
  font-family: var(--font-sans);
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.nf-suggest ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.6rem; }
.nf-suggest a {
  display: block;
  text-decoration: none;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  color: var(--color-text-main);
  background: var(--color-bg);
  transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
.nf-suggest a:hover {
  transform: translateY(-1px);
  border-color: var(--color-accent);
  color: var(--color-accent);
}
@media (max-width: 900px) {
  .nf-inner { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .nf { border-radius: 16px; padding: 2.5rem 1.2rem; }
}
@media (prefers-reduced-motion: reduce) {
  .nf-particle { animation: none; left: 80%; top: 8%; }
}
```

- [ ] **Step 3: Finalize the copy with the portfolio-copy skill**

Invoke the `portfolio-copy` skill to confirm/refine the headline ("A particle escaped the well.") and the description so they match Sergio's grounded, no-hype voice. Apply any revisions to the markup from Step 1.

- [ ] **Step 4: Build to verify clean**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 5: User visual check + commit**

Ask the user to confirm on `npm run preview`, light + dark, desktop + mobile: the well + escapee particle render over the subtle field; nav links work; reduced-motion shows the particle static outside the well; layout collapses to one column on mobile. Then:

```bash
git add src/pages/404.astro
git commit -m "feat: bespoke potential-well 404"
```

---

### Task 5: Branded text-selection

Site-wide `::selection` using the accent palette, defined for light and dark.

**Files:**
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `--color-accent-light`, `--color-accent`, `--color-text-main` (which flip with `[data-theme="dark"]`).

- [ ] **Step 1: Add the selection rules**

In `src/styles/global.css`, add near the top-level base rules (after the `html`/`body` base styles):

```css
::selection {
  background: var(--color-accent-light);
  color: var(--color-text-main);
}
::-moz-selection {
  background: var(--color-accent-light);
  color: var(--color-text-main);
}
```

`--color-accent-light` is `#e6f0fa` (light) / `#1e3a8a` (dark) and `--color-text-main` flips per theme, so selected text stays readable in both. If contrast looks weak in dark mode during review, switch the dark value via a `[data-theme="dark"] ::selection { background: color-mix(in srgb, var(--color-accent) 35%, transparent); }` override — but try the var-based version first.

- [ ] **Step 2: Build to verify clean**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: User visual check + commit**

Ask the user to confirm: selecting text shows the branded color, readable in both light and dark. Then:

```bash
git add src/styles/global.css
git commit -m "feat: branded text-selection color"
```

---

### Task 6: Focus-ring review (likely no-op)

The spec says: review existing focus rings; only change if a clear improvement, default no change.

**Files:**
- Inspect: `src/styles/global.css`, `src/components/Header.astro` (and anywhere `:focus-visible`/`outline` appears)

- [ ] **Step 1: Inspect existing focus styles**

Run: `grep -rn ":focus-visible\|:focus\b\|outline" src/styles/global.css src/components/*.astro`
Review what exists. If the site already has coherent, visible focus rings (it does have custom ones per the spec), **make no change** and report that to the user.

- [ ] **Step 2: Only if clearly deficient, propose then apply**

If — and only if — focus rings are missing on interactive elements or invisible in one theme, propose a minimal `:focus-visible` outline using `var(--color-accent)` to the user and apply after approval. Otherwise skip. No commit if no change.

---

## Final verification

- [ ] `npm run build` clean.
- [ ] User walks the site on `npm run preview`, light + dark, desktop + mobile:
  - Blog title underlines draw on hover; static titles unaffected.
  - Journal count animates 0→N on load and prev→new on filter switch; no hard-refresh jitter; reduced-motion instant.
  - Footer drifting field subtle and readable; reduced-motion static.
  - 404 potential-well renders with field + nav; reduced-motion static; mobile single-column.
  - Text selection branded in both themes.
