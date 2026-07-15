# Light Mode "Daylight Lab" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make light mode feel as intentional as dark mode by retuning the palette, hero particle sim, and Journal glow field, and adding one scarce "hot" accent — without changing dark mode.

**Architecture:** Pure presentation change. Edit CSS custom properties (light `:root` only) in `global.css`; retune theme-branch constants in two canvas components (`HeroSim.astro`, `JournalGlowField.astro`); one-line fix in `Figure.astro`. No new files, no dependencies, no logic changes to render loops.

**Tech Stack:** Astro, CSS custom properties, Canvas2D/WebGL (existing). Verification is screenshot-based via `scripts/shot.mjs` (Playwright headless) + reading the PNGs — there is **no unit-test surface** for visual retuning.

## Global Constraints

- **Dark mode must not change.** Every task edits only the light branch/value; after each task, screenshot the same page in dark and confirm zero visual difference.
- **New shared token `--color-hot`:** light `#d1268f`, dark `#f472b6`. Define in BOTH theme blocks.
- **Palette values (light `:root` only), verbatim:** `--color-bg: #f6f8fa`; `--color-bg-offset: #ffffff` (unchanged); `--color-border: #dce3eb`; `--color-text-main: #18222e`; `--color-text-muted: #49586a`; `--color-accent: #003366` (unchanged); `--color-accent-light: #e2ecf7`; `--color-bg-header: rgba(246,248,250,0.85)`; `--color-bg-mobile-menu: rgba(246,248,250,0.95)`; shadows `sm 0 1px 3px rgba(23,42,72,.05)`, `md 0 4px 6px rgba(23,42,72,.08)`, `lg 0 10px 15px rgba(23,42,72,.10)`.
- **Verification loop per task:** the user usually runs `npm run dev` (port 4321). `scripts/shot.mjs` auto-probes 4321–4325. NEVER `pkill` astro. If no server is live, start one tracking its PID (`npm run dev > /tmp/dev.log 2>&1 & echo $! > /tmp/shot-dev.pid`) and kill only that PID at the end.
- **Commit after each task.** No Claude/AI attribution in commit messages (repo rule).
- Work happens on branch `design-review` (already created).

---

### Task 1: Palette token retune (`global.css`)

**Files:**
- Modify: `src/styles/global.css:9-42` (light `:root` block) and `:47-79` (dark block — add `--color-hot` only).

**Interfaces:**
- Produces: the token values every later task and component reads. `--color-hot` becomes available site-wide.

- [ ] **Step 1: Edit the light `:root` block.** Apply the verbatim palette values from Global Constraints. Specifically:
  - `--color-bg: #ffffff;` → `--color-bg: #f6f8fa;`
  - Leave `--color-bg-offset: #ffffff;` as-is (delete the stale `/* Clean white for premium feel */` comment).
  - `--color-bg-header: rgba(255, 255, 255, 0.85);` → `rgba(246, 248, 250, 0.85);`
  - `--color-text-main: #1a1a1a;` → `#18222e;`
  - `--color-text-muted: #555555;` → `#49586a;`
  - `--color-accent-light: #e6f0fa;` → `#e2ecf7;`
  - `--color-border: #eaeaea;` → `#dce3eb;`
  - `--color-bg-mobile-menu: rgba(255, 255, 255, 0.95);` → `rgba(246, 248, 250, 0.95);`
  - Add `--color-hot: #d1268f;` (place near `--color-accent`).
  - Shadows: `--shadow-sm: 0 1px 3px rgba(23,42,72,0.05);` `--shadow-md: 0 4px 6px rgba(23,42,72,0.08);` `--shadow-lg: 0 10px 15px rgba(23,42,72,0.10);`
  - Change the file's first comment `/* Academic Portfolio Theme */` → `/* Sergio Eraso — site theme */`.

- [ ] **Step 2: Add `--color-hot` to the dark block.** In `[data-theme="dark"]`, add `--color-hot: #f472b6;` near `--color-accent`.

- [ ] **Step 3: Screenshot light + dark home top and below-fold.**
  Run:
  ```sh
  node scripts/shot.mjs / --theme l --scroll 1400 --out /tmp/t1-light-below.png
  node scripts/shot.mjs / --theme d --scroll 1400 --out /tmp/t1-dark-below.png
  node scripts/shot.mjs /publications/ --theme l --out /tmp/t1-pubs-light.png
  ```
  Then Read each PNG. Expected: light below-fold shows a subtle cool-gray ground with white lift on any card/border; text is ink-navy; **dark is visually identical to before**. `overflowX=0` on all.

- [ ] **Step 4: Commit.**
  ```sh
  git add src/styles/global.css
  git commit -m "Light mode: cool daylight palette + --color-hot token"
  ```

---

### Task 2: Hot-mark on text selection (`global.css`)

**Files:**
- Modify: `src/styles/global.css` (add a `::selection` rule near the top-level base rules, after the `*` reset block ~L140).

**Interfaces:**
- Consumes: `--color-hot` from Task 1.

- [ ] **Step 1: Add the selection rule.**
  ```css
  ::selection {
    background: var(--color-hot);
    color: #fff;
  }
  ```

- [ ] **Step 2: Verify.** In a browser (or via a quick inline Playwright select-all), confirm highlighted text shows the hot pink in light and dark. Quick check:
  ```sh
  node scripts/shot.mjs /about/ --theme l --out /tmp/t2-about.png
  ```
  Read the PNG only to confirm nothing else changed (selection itself needs interaction; a manual highlight in the running dev server is the real check). Expected: page unchanged at rest; no layout shift.

- [ ] **Step 3: Commit.**
  ```sh
  git add src/styles/global.css
  git commit -m "Light mode: hot-mark text selection"
  ```

---

### Task 3: Figure card sits on page ground (`Figure.astro`)

**Files:**
- Modify: `src/components/Figure.astro:80-86` (`.figure__img--card`).

**Rationale:** Theme-aware SVG figures fill face shapes with `var(--color-bg)` so faces are invisible against the page. The card currently uses `--color-bg-offset` (white); after Task 1 that makes `--color-bg`-filled faces (`#f6f8fa`) show faint gray on white. Matching the card to `--color-bg` restores invisibility.

- [ ] **Step 1: Change the card background.**
  `background: var(--color-bg-offset);` → `background: var(--color-bg);`

- [ ] **Step 2: Screenshot a post with a theme-aware figure, both themes.** The entropy post embeds figures; the product-rule note has `product-rule.svg`.
  Run:
  ```sh
  node scripts/shot.mjs /blog/note-product-rule/ --theme l --out /tmp/t3-fig-light.png
  node scripts/shot.mjs /blog/note-product-rule/ --theme d --out /tmp/t3-fig-dark.png
  ```
  Read both. Expected: in light, the figure's SVG shape faces are invisible (only wireframe/ink strokes show) on a card delineated by its border; caption/border still present; dark unchanged. If the post has no visible figure in the first viewport, add `--scroll 1200` or use `--full`.

- [ ] **Step 3: Commit.**
  ```sh
  git add src/components/Figure.astro
  git commit -m "Light mode: figure card matches page ground so SVG faces stay invisible"
  ```

---

### Task 4: Hero sim ambient gas — cool ink wash (`HeroSim.astro`)

**Files:**
- Modify: `src/components/HeroSim.astro:249` (`LIGHT_GAS`) and `:231` (`GL_ALPHA_OUT`) / `:226` (`ALPHA_OUT`) if alpha needs tuning.

**Interfaces:**
- Consumes: nothing new. `LIGHT_GAS` is used by `readColors()` (L434) for the light-mode `dotColor`.
- Produces: the ambient gas color/alpha the name reveal contrasts against (Task 5).

**Note:** gas already uses a dedicated `LIGHT_GAS = "#999999"` constant (the spec's "uses `--color-border`" assumption was outdated — cite this constant instead). Alpha is `GL_ALPHA_OUT = 0.25` (WebGL, the live path) and `ALPHA_OUT = 0.4` (Canvas2D fallback), each multiplied by `ambientAlpha`. These are shared across themes — do NOT lower them globally (that would dim dark-mode gas). If the light wash needs a different alpha, gate it by theme (see Step 2).

- [ ] **Step 1: Recolor the light gas.** `const LIGHT_GAS = "#999999";` → `const LIGHT_GAS = "#a3b2c2";` (cool blue-gray ink wash).

- [ ] **Step 2: Screenshot the light hero (wait out the intro).** The home intro scroll-locks; use the intro-aware capture:
  ```sh
  cat > scripts/_t4.mjs <<'EOF'
  import { chromium } from 'playwright';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.documentElement.setAttribute('data-theme','light'));
  await p.waitForFunction(() => !document.documentElement.hasAttribute('data-home-intro'), null, {timeout:12000}).catch(()=>{});
  await p.waitForTimeout(1600);
  await p.screenshot({ path: '/tmp/t4-hero-light.png' });
  await p.evaluate(() => document.documentElement.setAttribute('data-theme','dark'));
  await p.waitForTimeout(800);
  await p.screenshot({ path: '/tmp/t4-hero-dark.png' });
  await b.close();
  EOF
  node scripts/_t4.mjs && rm scripts/_t4.mjs
  ```
  Read both. Expected (light): ambient gas reads as a visible cool wash (not white static, not muddy gray); the navy name is legible against it. Dark unchanged. If the wash is too heavy/light, adjust: for a light-only alpha, in `render()` (L1125) and `render2D()` (L1154) branch the ambient multiplier on `isDark` — but only do this if recoloring alone isn't enough; prefer leaving alpha shared.

- [ ] **Step 3: Commit.**
  ```sh
  git add src/components/HeroSim.astro
  git commit -m "Light hero: cool ink-wash ambient gas"
  ```

---

### Task 5: Hero sim name — ink, not neon (`HeroSim.astro`)

**Files:**
- Modify: `src/components/HeroSim.astro:508` (name sprite bake) and `:359`/`:509` (JR color); optionally `:207` (`DOT_R`).

**Interfaces:**
- Consumes: `LIGHT_GAS` wash (Task 4), `--color-hot` (Task 1).
- Produces: final hero appearance.

**Note:** the name/JR glow is a **baked sprite** — `bakeSprite(insideColor, GLOW, …)` at L508 with `GLOW = 4` (L213). It is applied in both themes (not currently theme-gated). "No glow in light" = bake the NAME sprite with `glow = 0` when light. The name sprite color is `insideColor` (navy), so its glow is already faint on white; gating to 0 makes it crisp and is cheaper.

- [ ] **Step 1: Read the theme in the sprite-build path.** In `buildSprites()` (starts L495), compute `const isDark = document.documentElement.getAttribute("data-theme") === "dark";` (or reuse the value already resolved in `readColors()` — check whether it's in scope; if not, re-read it here).

- [ ] **Step 2: Gate the name glow by theme.** Change L508 from
  `sprites[1] = bakeSprite(insideColor, GLOW, spriteCssSize);`
  to
  `sprites[1] = bakeSprite(insideColor, isDark ? GLOW : 0, spriteCssSize);`
  Leave the JR sprite (L509) glowing in both themes (the hot spark keeps a small halo — it's a single glyph and the hot pink reads on white; confirm in Step 4 and drop to `isDark ? GLOW : 0` too if it smears).

- [ ] **Step 3: Source the JR/hot color from the token.** Change `const JR_COLOR = "#ff49ff";` (L359) to read the token so it tracks the theme:
  - In `readColors()` add: `jrColor = cs.getPropertyValue("--color-hot").trim() || "#ff49ff";` (declare `let jrColor = "#ff49ff";` near the `insideColor` decl at L357).
  - Replace the `JR_COLOR` usage at L509 with `jrColor`. Remove the now-unused `const JR_COLOR` if nothing else references it (grep first).

- [ ] **Step 4: Screenshot light + dark hero (reuse the Task 4 capture script pattern).**
  ```sh
  cat > scripts/_t5.mjs <<'EOF'
  import { chromium } from 'playwright';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.documentElement.setAttribute('data-theme','light'));
  await p.waitForFunction(() => !document.documentElement.hasAttribute('data-home-intro'), null, {timeout:12000}).catch(()=>{});
  await p.waitForTimeout(1800);
  await p.screenshot({ path: '/tmp/t5-hero-light.png' });
  await p.evaluate(() => document.documentElement.setAttribute('data-theme','dark'));
  await p.waitForTimeout(1000);
  await p.screenshot({ path: '/tmp/t5-hero-dark.png' });
  // mobile light
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await m.evaluate(() => document.documentElement.setAttribute('data-theme','light'));
  await m.waitForFunction(() => !document.documentElement.hasAttribute('data-home-intro'), null, {timeout:12000}).catch(()=>{});
  await m.waitForTimeout(1800);
  await m.screenshot({ path: '/tmp/t5-hero-mobile.png' });
  await b.close();
  EOF
  node scripts/_t5.mjs && rm scripts/_t5.mjs
  ```
  Read all three. Expected (light): the name reads as **dense, crisp ink** (no halo); the "jr" spark is hot pink; ambient wash behind it is cool, legible. Dark: name still ignites with its neon glow (unchanged). If letters read thin/stippled in light, bump `DOT_R` (L207) — but that is shared with dark, so prefer a light-only radius: `const DOT_R = 1.0;` stays; if needed, in `dotRadius()` (L209) add a light-mode nudge. Only if screenshots demand it.

- [ ] **Step 5: Commit.**
  ```sh
  git add src/components/HeroSim.astro
  git commit -m "Light hero: name condenses as ink (no glow); JR spark from --color-hot"
  ```

---

### Task 6: Journal glow field — tight ink pool (`JournalGlowField.astro`)

**Files:**
- Modify: `src/components/JournalGlowField.astro:242` (`glowK`), `:284-285` (drawPill radii) — via a light-mode override; and `LOOK.outerR` at `:65` if overriding at the constant is cleaner.

**Interfaces:**
- Consumes: register colors + `dark` flag already resolved in `draw()` (L240-241).

**Note:** current light look = `glowK = 1.6` (L242) + `LOOK.outerR = 260` (L65) = large soft blob = the gray smudge. Retune light only; dark keeps `glowK = 1`, `outerR = 260`.

- [ ] **Step 1: Reduce the light glow multiplier.** At L242, `const glowK = dark ? 1 : 1.6;` → `const glowK = dark ? 1 : 1.1;`.

- [ ] **Step 2: Tighten the outer radius in light.** The pills are drawn at L284 `drawPill(LOOK.outerR, LOOK.outerAlpha)`. Introduce a light-mode outer radius: just above the two `drawPill` calls (L284), add `const outerR = dark ? LOOK.outerR : 200;` and change L284 to `drawPill(outerR, LOOK.outerAlpha);`. Leave the inner pill (L285) as-is.

- [ ] **Step 3: Screenshot the Journal index, light + dark.**
  ```sh
  node scripts/shot.mjs /blog/ --theme l --out /tmp/t6-journal-light.png
  node scripts/shot.mjs /blog/ --theme d --out /tmp/t6-journal-dark.png
  ```
  Read both. Expected (light): the eyebrow glow is a compact tinted pool of the register color bleeding into the page around the "ALL · N PIECES" text — not a wide gray smudge. Dark unchanged. Optionally re-shoot after clicking a filter to confirm the color tracks (manual, in dev server).

- [ ] **Step 4: Commit.**
  ```sh
  git add src/components/JournalGlowField.astro
  git commit -m "Light Journal: tighter tinted glow pool instead of gray haze"
  ```

---

### Task 7: Full-site verification sweep

**Files:** none (verification only).

- [ ] **Step 1: Sweep light + dark at 1440 / 1000 / 390.**
  ```sh
  for pg in / /publications/ /projects/ /blog/ /about/ /blog/physics-entropy-equation/; do
    slug=$(echo "$pg" | tr -c 'a-z0-9' '-')
    node scripts/shot.mjs "$pg" --theme l --out "/tmp/sweep-l-$slug.png"
    node scripts/shot.mjs "$pg" --theme d --out "/tmp/sweep-d-$slug.png"
  done
  node scripts/shot.mjs /projects/ --theme l --width 390 --out /tmp/sweep-l-projects-390.png
  node scripts/shot.mjs /blog/physics-entropy-equation/ --theme l --width 1000 --out /tmp/sweep-l-post-1000.png
  ```
  Read the PNGs and confirm the spec's checklist:
  1. Hero name = dense ink; gas = visible wash (light). ✔ from Task 5.
  2. White surfaces (search modal, TOC pill, code frame, project cards, Figure card) lift off `#f6f8fa`.
  3. SVG figure faces invisible.
  4. Code blocks stay white (open the entropy post; Shiki inline `#fff` untouched in light).
  5. Text selection shows hot mark (manual highlight in dev server).
  6. No white-on-white / contrast regressions; borders read cool.
  7. **Dark mode: zero change** vs. pre-branch across all pages.

- [ ] **Step 2: Check the search modal + TOC explicitly** (they use `--color-bg-offset`, should now lift):
  ```sh
  node scripts/shot.mjs /blog/physics-entropy-equation/ --theme l --sel .toc-mobile-details --open .toc-mobile-details --width 1000 --out /tmp/sweep-toc.png
  ```
  Read it. Expected: white TOC panel on the tinted ground with a cool border.

- [ ] **Step 3: Production-build confirmation** (HMR can serve stale inlined CSS on client nav; confirm on a real build):
  ```sh
  npm run build > /tmp/build.log 2>&1 && tail -3 /tmp/build.log
  npm run preview -- --port 4399 > /tmp/preview.log 2>&1 & echo $! > /tmp/shot-preview.pid
  sleep 3
  PREVIEW_URL=http://localhost:4399 node scripts/shot.mjs / --theme l --scroll 1400 --out /tmp/prod-light.png
  PREVIEW_URL=http://localhost:4399 node scripts/shot.mjs /blog/ --theme l --out /tmp/prod-journal-light.png
  kill "$(cat /tmp/shot-preview.pid)" 2>/dev/null
  ```
  Read both. Expected: identical to dev. Build succeeds with no errors.

- [ ] **Step 4: Update the findings checklist.** In `DESIGN-REVIEW.md`, mark item 1 (light mode) done with a one-line note pointing at this plan/spec.

- [ ] **Step 5: Commit.**
  ```sh
  git add DESIGN-REVIEW.md
  git commit -m "Mark light-mode daylight-lab retune complete"
  ```

---

## Self-review notes

- **Spec coverage:** §1 palette → Task 1. §2 hero (gas + name + no-glow + jr token) → Tasks 4-5. §3 Journal glow → Task 6. §4 hot mark (selection) → Task 2. §5 figures → Task 3. Verification → Task 7. All sections covered.
- **Correction vs. spec:** gas uses `LIGHT_GAS` constant (not `--color-border`); the name glow is a baked sprite gated via `bakeSprite(..., isDark ? GLOW : 0, ...)` rather than a per-frame `shadowBlur` branch. Plan cites the real mechanism.
- **Shared-constant guardrails:** `ALPHA_OUT`/`GL_ALPHA_OUT`/`DOT_R` are theme-shared; the plan says prefer color-only changes and gate by `isDark` only if screenshots demand, so dark can't regress.
- **Perceptual tunings** (gas alpha, dot radius) are intentionally screenshot-gated with concrete start values — not placeholders.
