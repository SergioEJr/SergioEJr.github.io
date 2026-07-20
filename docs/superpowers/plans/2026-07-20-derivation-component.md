# Derivation Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a collapsible `<Derivation>` Astro component for `.mdx` Journal posts that hides an extended calculation until the reader wants it, with a header toggle and a bottom "collapse" bar.

**Architecture:** A single `.astro` component renders a card with a header `<button>`, an always-in-the-DOM content `<div>` wrapping `<slot />`, and a bottom collapse `<button>`. One idempotent inline script (mirroring `SideNote.astro`'s pattern) toggles the `hidden` attribute + `aria-expanded` on click. Content stays in the DOM so build-time equation numbering (`rehype-eqref`) and KaTeX's CSS counter see equations inside the block regardless of open/closed state.

**Tech Stack:** Astro 6 components, MDX, KaTeX (via rehype-katex), CSS custom properties (`--color-*`), vanilla inline JS. No test runner in this repo — verification is `npm run build`, `npm run format:check`, and the `visual-check` Playwright helper (`scripts/shot.mjs`).

## Global Constraints

- **Commit only; never push.** (AGENTS.md)
- **No AI attribution** in commit messages, PRs, or files. (memory: no-claude-attribution)
- **Dark mode** = `data-theme="dark"` on `<html>`; all colors via `--color-*` CSS vars in `src/styles/global.css`. Component must render correctly in both themes.
- **`position: sticky` + horizontal overflow don't mix.** Never use `overflow-x: hidden`/`auto` (creates a scroll container, breaks the sticky navbar). Use `overflow-x: clip` only if clipping is needed. (AGENTS.md)
- **Dev HMR serves stale inlined CSS** on ClientRouter navigation — always verify CSS on `npm run preview`, not `npm run dev`. (AGENTS.md)
- **Toggling must not create a browser-history entry.** Controls are `<button type="button">` (not `#hash` anchors); the handler mutates the DOM only — never `history.pushState`/`replaceState`, `location.hash`, or navigation. (spec: back/forward requirement)
- **`npm run prebuild` runs `check:figures`** — a build implicitly runs the figure theme guard; it must stay green (`✓ figure theme check: N SVG(s) clean`).
- Do not modify any prose in `note-symmetries.mdx` other than adding the sample derivation. (user instruction)

---

## File Structure

- **Create:** `src/components/Derivation.astro` — the whole component: template, scoped `<style>`, and one `is:inline` toggle script. Self-contained, following the `SideNote.astro` precedent (which also colocates template + style + inline script in one file).
- **Modify (sample only):** `src/content/blog/note-symmetries.mdx` — import the component and add one sample `<Derivation>` block. No other edits.

There is no separate test file: the repo has no unit-test runner. Each task's verification is a build and/or a Playwright screenshot.

---

## Task 1: Component skeleton — props, template, always-in-DOM content

**Files:**
- Create: `src/components/Derivation.astro`

**Interfaces:**
- Consumes: nothing (leaf component).
- Produces: a component importable as `import Derivation from '../../components/Derivation.astro';`, used as `<Derivation label="…" open>…</Derivation>`.
  - Prop `label?: string` — full header text, default `"Derivation"`.
  - Prop `open?: boolean` — start expanded, default `false`.
  - Emits an outer `<section class="derivation" data-derivation>` containing a header `<button class="derivation__head" aria-expanded>`, a content `<div class="derivation__content" hidden?>` wrapping `<slot />`, and a bottom `<button class="derivation__collapse">`.

- [ ] **Step 1: Write the component with props, template, and a placeholder style block**

Create `src/components/Derivation.astro`:

```astro
---
// A collapsible "derivation" block for Journal posts (.mdx). Hides an extended
// calculation until the reader wants it, so a note can expand on a computation
// without distracting from the main text.
//
//   import Derivation from '../../components/Derivation.astro';
//   <Derivation label="Jacobian">
//     ...prose, $$math$$, <Figure/>, equation refs...
//   </Derivation>
//
// Props:
//   label?: string   full header text (default "Derivation"; no auto-prefix)
//   open?:  boolean  start expanded (default false, i.e. collapsed)
//
// The content is ALWAYS rendered into the DOM; collapsing only toggles the
// `hidden` attribute. This is required so build-time equation numbering
// (rehype-eqref) and KaTeX's CSS counter see equations INSIDE the block whether
// it is open or closed — an inner equation keeps its place in the global
// numbering and stays referenceable from anywhere. (Native <details> is avoided
// because its display:none closed content makes KaTeX/Figure mis-measure widths
// on first expand.)
//
// Toggling never touches browser history: the controls are <button> elements
// (not #hash links), so ClientRouter's click listener never turns a toggle into
// a navigation, and the handler mutates the DOM only.

interface Props {
  label?: string;
  open?: boolean;
}

const { label = "Derivation", open = false } = Astro.props;
---

<section class="derivation" data-derivation>
  <button
    type="button"
    class="derivation__head"
    aria-expanded={open ? "true" : "false"}
  >
    <svg
      class="derivation__chevron"
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6"></path>
    </svg>
    <span class="derivation__label">{label}</span>
  </button>

  <div class="derivation__content" hidden={!open}>
    <slot />
    <button type="button" class="derivation__collapse">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m18 15-6-6-6 6"></path>
      </svg>
      <span>Collapse</span>
    </button>
  </div>
</section>

<style>
  /* filled in Task 2 */
  .derivation {
    display: block;
  }
</style>
```

- [ ] **Step 2: Verify the build is clean**

Run: `npm run build`
Expected: build completes with no errors; `✓ figure theme check: N SVG(s) clean` prints during prebuild. (The component isn't used by any page yet, so this only proves it compiles.)

- [ ] **Step 3: Commit**

```bash
git add src/components/Derivation.astro
git commit -m "feat: Derivation component skeleton (props + template)"
```

---

## Task 2: Styling — themed card, header, content, bottom bar

**Files:**
- Modify: `src/components/Derivation.astro` (replace the placeholder `<style>` block)

**Interfaces:**
- Consumes: the class names and DOM structure from Task 1 (`.derivation`, `.derivation__head`, `.derivation__chevron`, `.derivation__label`, `.derivation__content`, `.derivation__collapse`).
- Produces: no new API; styles the existing markup. Establishes that `aria-expanded="true"` on `.derivation__head` rotates the chevron (the Task 3 script only flips `aria-expanded` + `hidden`; all visual open/closed state is CSS driven off `aria-expanded`).

- [ ] **Step 1: Replace the placeholder `<style>` block with the full themed styles**

In `src/components/Derivation.astro`, replace the entire `<style>…</style>` block with:

```astro
<style>
  /* Card consistent with SideNote: accent-tinted ground + left accent border,
     themed via --color-* so it flips in dark mode. */
  .derivation {
    display: block;
    margin: 1.4rem 0;
    border: 1px solid color-mix(in srgb, var(--color-accent) 18%, transparent);
    border-left: 3px solid var(--color-accent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--color-accent) 6%, transparent);
    /* Wide equations/figures inside scroll within their own containers; clip (not
       hidden/auto) keeps the block from becoming a scroll container that would
       break the sticky navbar. */
    overflow-x: clip;
    /* Clear the sticky navbar when the bottom bar scrolls the header into view. */
    scroll-margin-top: 6rem;
  }

  /* Header is a full-width button so the whole bar is clickable. */
  .derivation__head {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    width: 100%;
    margin: 0;
    padding: 0.55rem 0.85rem;
    border: 0;
    background: transparent;
    color: var(--color-accent);
    font: inherit;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    text-align: left;
    cursor: pointer;
  }
  .derivation__head:hover {
    background: color-mix(in srgb, var(--color-accent) 10%, transparent);
    border-radius: 6px;
  }
  .derivation__head:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .derivation__chevron {
    flex-shrink: 0;
    transition: transform 0.15s ease;
  }
  /* Point down when expanded. */
  .derivation__head[aria-expanded="true"] .derivation__chevron {
    transform: rotate(90deg);
  }

  .derivation__label {
    display: inline-block;
  }

  /* Content: padded so math/figures breathe. Hidden via the `hidden` attribute
     (Task 3 toggles it); [hidden] gets display:none from the UA sheet. */
  .derivation__content {
    padding: 0.2rem 0.95rem 0.5rem;
  }
  /* First child sits right under the header without a double gap. */
  .derivation__content > :first-child {
    margin-top: 0;
  }

  /* Bottom collapse bar: slim, full-width, muted until hover. */
  .derivation__collapse {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    width: 100%;
    margin: 0.6rem 0 0;
    padding: 0.4rem;
    border: 0;
    border-top: 1px solid color-mix(in srgb, var(--color-accent) 16%, transparent);
    background: transparent;
    color: var(--color-text-muted);
    font: inherit;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
  }
  .derivation__collapse:hover {
    color: var(--color-accent);
  }
  .derivation__collapse:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
  }
</style>
```

- [ ] **Step 2: Verify the build is clean**

Run: `npm run build`
Expected: no errors; figure guard green.

- [ ] **Step 3: Commit**

```bash
git add src/components/Derivation.astro
git commit -m "feat: Derivation component styling (themed card + bottom bar)"
```

---

## Task 3: Toggle behavior — inline script (open/close, no history)

**Files:**
- Modify: `src/components/Derivation.astro` (add an `is:inline` `<script>` after the `</section>`… actually after the template, before/after `<style>` is fine — place it at the end of the file)

**Interfaces:**
- Consumes: the DOM from Task 1 — `[data-derivation]` blocks, each with a `.derivation__head` button (`aria-expanded`), a `.derivation__content` (`hidden`), and a `.derivation__collapse` button.
- Produces: runtime behavior only. Header click and bottom-bar click both toggle `hidden` on `.derivation__content` and flip `aria-expanded` on `.derivation__head`. Bottom-bar click additionally collapses and scrolls the header into view. No exported API.

- [ ] **Step 1: Add the inline toggle script at the end of `Derivation.astro`**

Append to `src/components/Derivation.astro` (after the `<style>` block):

```astro
<script is:inline data-astro-rerun>
  // Toggle derivation blocks open/closed. Delegated + idempotent so it survives
  // ClientRouter navigation (astro:page-load) and multiple <Derivation> uses on a
  // page. (Inline so it's reliably emitted even when the component is used in MDX,
  // matching SideNote.astro.)
  //
  // History: the controls are <button>s and this handler only mutates the DOM
  // (hidden, aria-expanded) plus scrollIntoView — it never calls
  // history.pushState/replaceState or changes location.hash, so opening/closing a
  // derivation never adds a back/forward entry.
  (function () {
    function setOpen(block, isOpen) {
      var head = block.querySelector(".derivation__head");
      var content = block.querySelector(".derivation__content");
      if (!head || !content) return;
      head.setAttribute("aria-expanded", isOpen ? "true" : "false");
      content.hidden = !isOpen;
    }

    function onClick(e) {
      var head = e.target.closest(".derivation__head");
      if (head) {
        var block = head.closest("[data-derivation]");
        if (!block) return;
        var open = head.getAttribute("aria-expanded") === "true";
        setOpen(block, !open);
        return;
      }
      var collapse = e.target.closest(".derivation__collapse");
      if (collapse) {
        var b = collapse.closest("[data-derivation]");
        if (!b) return;
        setOpen(b, false);
        // Bring the header back below the sticky navbar so the reader isn't left
        // stranded mid-page after closing a long derivation. scroll-margin-top on
        // .derivation clears the navbar. scrollIntoView does not touch history.
        b.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    }

    if (!window.__derivationBound) {
      document.addEventListener("click", onClick);
      window.__derivationBound = true;
    }
  })();
</script>
```

Note: the click listener is bound once to `document` (guarded by `window.__derivationBound`), so it keeps working across ClientRouter swaps without rebinding — no per-load `setup()` needed since it's fully delegated. `data-astro-rerun` is harmless and kept for parity with SideNote in case the guard is ever removed.

- [ ] **Step 2: Verify the build is clean**

Run: `npm run build`
Expected: no errors; figure guard green.

- [ ] **Step 3: Commit**

```bash
git add src/components/Derivation.astro
git commit -m "feat: Derivation toggle behavior (header + bottom bar, no history)"
```

---

## Task 4: Wire a sample into note-symmetries.mdx and verify end to end

**Files:**
- Modify: `src/content/blog/note-symmetries.mdx` (add import + one sample `<Derivation>`; change no other prose)

**Interfaces:**
- Consumes: the `<Derivation>` component from Tasks 1–3; the existing `<Figure>` import already present in the post; the `\htmlId`/`[](#eq:…)` eqref convention from `rehype-eqref`.
- Produces: a rendered sample proving prose, display math with `\htmlId`, an eqref to an equation *outside* the block, and (from outside) an eqref to the equation *inside* the block all resolve, with global equation numbers unchanged by open/closed state.

- [ ] **Step 1: Add the Derivation import**

In `src/content/blog/note-symmetries.mdx`, add after the existing `Figure` import (line ~17):

```mdx
import Derivation from '../../components/Derivation.astro';
```

- [ ] **Step 2: Insert one sample derivation**

The post already has an empty stub `### Derivation: Jacobian` heading (around line 99) followed by "We require the value of". Replace ONLY that stub area — leave every other line untouched. Change:

```mdx
We require the value of 

### Derivation: Jacobian 

```

to:

```mdx
We require the value of the transformed field to match, which we verify below.

<Derivation label="Derivation: Jacobian">
Start from the transformation rule and apply the chain rule. Referencing an
equation *outside* this block works — see Eq [](#eq:vector-rotation). Defining a
new relation inside the block,

$$
\begin{align}
  \htmlId{eq:jacobian}{ J_{ij} = \frac{\partial x'_i}{\partial x_j} = R_{ij} }
\end{align}
$$

we can refer back to Eq [](#eq:jacobian) from inside the derivation. This block
starts collapsed; the bottom bar closes it again.
</Derivation>

```

Then, to prove an *outside-in* reference resolves, add one sentence immediately
after the closing `</Derivation>` (this is new prose the user authorized as part
of the sample — it is inside the sample region, not a change to existing prose):

```mdx
The Jacobian defined in the derivation above (Eq [](#eq:jacobian)) is just the
rotation matrix itself.
```

- [ ] **Step 3: Verify the build is clean and equations number correctly**

Run: `npm run build`
Expected: no errors. Then inspect the built HTML to confirm the inner equation took a global number and both refs resolved:

Run: `grep -o 'eqref[^<]*' dist/blog/note-symmetries/index.html | head` — *note:* draft posts are excluded from prod builds. Since `note-symmetries.mdx` has `draft: true`, it will NOT be in `dist/`. So instead verify via dev/preview in Step 4, and rely on the build simply not erroring here.

Expected for this step: `npm run build` exits 0 (proves the component + MDX compile together with no syntax/JSX errors).

- [ ] **Step 4: Visual + interaction verification on preview**

Start a preview server in the background if one isn't already running (do NOT `pkill` an existing astro dev server per AGENTS.md — reuse it). Because the post is a draft, use `npm run dev` (drafts render in dev, not prod):

```bash
# reuse the running dev server if present; otherwise:
npm run dev
```

Then use the `visual-check` skill / `scripts/shot.mjs` against the dev server (default port 4321):

```bash
node scripts/shot.mjs /blog/note-symmetries/ --sel "[data-derivation]" --out /tmp/deriv-closed.png
```

Manually (or via Playwright in the visual-check skill) confirm:
1. Block renders **collapsed** by default (content hidden, chevron pointing right).
2. Clicking the header expands it (chevron rotates down, math + refs visible).
3. Eqref inside the block shows a number and links to `#eq:vector-rotation`; the outside-in ref shows the inner equation's number.
4. Bottom "Collapse" bar closes the block and scrolls the header below the navbar.
5. Dark mode (`--theme d`) colors are correct:
   ```bash
   node scripts/shot.mjs /blog/note-symmetries/ --theme d --sel "[data-derivation]" --out /tmp/deriv-dark.png
   ```
6. **History check:** in the browser, expand then collapse the block a few times, then press Back — it returns to the previous page in one press, not through toggle states.

- [ ] **Step 5: Run the formatter check**

Run: `npm run format:check`
Expected: passes. If it reports the new files, run `npm run format` and re-check. (CI gates on `format:check` — commit e4b3002.)

- [ ] **Step 6: Commit**

```bash
git add src/content/blog/note-symmetries.mdx
git commit -m "docs: sample Derivation block in note-symmetries draft"
```

---

## Self-Review

**Spec coverage:**
- Collapsible, expandable on click → Tasks 1–3 (header button + inline toggle). ✓
- Content: text, math, refs inside/outside, figures → Task 1 always-in-DOM `<slot />`; verified in Task 4. ✓
- Bottom-of-block collapse control → Task 1 (`.derivation__collapse`) + Task 3 (scroll header into view). ✓
- Always-in-DOM / equation numbering correctness → Task 1 rationale + Task 4 verification. ✓
- No `<details>` (measurement rationale) → Task 1 comment. ✓
- Back/forward stack untouched → Global Constraints + Task 3 script + Task 4 Step 4.6 history check. ✓
- Themed / dark mode → Task 2 + Task 4 Step 4.5. ✓
- Custom `label` prop, `open` default false → Task 1 props. ✓
- Sticky-navbar / overflow rule → Task 2 (`overflow-x: clip`, `scroll-margin-top`). ✓
- Preview-not-dev CSS gotcha, no-pkill, format:check gate → Global Constraints + Task 4. ✓

**Placeholder scan:** No TBD/TODO in delivered code; the only "filled in Task 2" placeholder is in Task 1's throwaway style block, explicitly replaced whole in Task 2. ✓

**Type/name consistency:** Class names (`.derivation`, `.derivation__head`, `.derivation__content`, `.derivation__collapse`, `.derivation__chevron`, `.derivation__label`), the `[data-derivation]` hook, `aria-expanded`, and the `hidden` attribute are used identically across Tasks 1–3. Props `label`/`open` consistent. `window.__derivationBound` guard named once. ✓

**Note on TDD:** This repo has no unit-test runner (see `package.json` scripts); the established verification is `npm run build` + `visual-check` Playwright + `format:check`. Inventing a test framework would violate YAGNI and repo conventions, so each task's "test cycle" is a build and, for the user-facing task, a Playwright visual/interaction check. This is a deliberate, documented deviation from the generic TDD step template.
