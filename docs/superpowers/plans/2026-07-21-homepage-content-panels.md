# Homepage Content Panels + Footer Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three homepage panels (projects strip, equation coda easter egg, contact band) and replace the astro-scholar template footer with the site's editorial language, per `docs/superpowers/specs/2026-07-21-homepage-content-panels-design.md`.

**Architecture:** All homepage panels live in `src/pages/index.astro` (matching how the existing below-fold rows are built) except the equation coda, which is a self-contained component `src/components/EquationCoda.astro` (it owns KaTeX rendering + hover interaction). The footer redesign restructures `src/components/Footer.astro` in place, preserving its Search modal, ParticleField, link-sanitization script, and umami attributes.

**Tech Stack:** Astro 6, scoped component CSS with global `--color-*` tokens, KaTeX (already a direct dependency, CSS loaded globally in BaseHead), Playwright screenshots via `scripts/shot.mjs` for verification. No test framework exists in this repo — each task verifies via production build + screenshots.

## Global Constraints

- No scroll-scrubbing below the hero: new panels use the existing reveal-once cascade (`[data-reveal]` container + per-item `--i`, 80ms steps) only.
- Both themes; reduced-motion static-visible; mobile single column.
- All new links use the established editorial treatment (see `.home-more` in `index.astro`): accent color, 1px `::after` underline at opacity 0.35 → 1 on hover, arrow `translateX(4px)` on hover, `:focus-visible` `2px solid var(--color-accent)` outline at `outline-offset: 3px`.
- Equation term colors: drag → `var(--color-text-muted)`, noise → `var(--color-accent)`, you → `var(--color-hot)`.
- Contact-band sentence requires Sergio's approval before merge (draft provided in Task 3).
- Verify on the production preview build (`npm run preview -- --port 4399`), never trust dev HMR.
- Commits: plain messages, **no AI/Claude attribution or Co-Authored-By trailers** (standing repo rule).
- Never `pkill` the user's dev server; preview servers you start are killed by their saved PID.

## Before Task 1 (one-time setup)

The working tree holds approved-but-uncommitted hero/scroll work. Branch and commit it first so each task's diff is clean:

```bash
git checkout -b feat/home-panels
git add -A
git commit -m "Home: editorial hero card, scroll choreography, live hold, below-fold Journal rows"
```

---

### Task 1: Projects strip

**Files:**
- Modify: `src/pages/index.astro` (frontmatter, markup after the `.home-below` grid, CSS, reveal/reduced-motion blocks)

**Interfaces:**
- Consumes: `getPublishedProjects()` from `src/utils/posts.ts` (returns collection entries sorted by the projects convention: manual `order` override, else reverse-chronological); `PROJECT_CATEGORY_BADGE_VARS` from `src/utils/categories.ts` (record: category name → CSS `var(--proj-*)` reference for badge backgrounds); `url()` from `src/utils/paths.ts`.
- Produces: a `.home-projects` section — Task 2 inserts the equation coda right after it.

- [ ] **Step 1: Add data to the frontmatter**

In `src/pages/index.astro` frontmatter, extend the existing `getPublishedPosts/getPublishedResearch` imports and add:

```ts
import { getPublishedProjects } from "../utils/posts";
import { PROJECT_CATEGORY_BADGE_VARS } from "../utils/categories";

const projects = (await getPublishedProjects()).slice(0, 3);
```

(If `getPublishedProjects` already returns sorted entries — it does, matching the Projects page — no extra sort. Check `src/utils/posts.ts` if unsure.)

- [ ] **Step 2: Add the markup**

Directly AFTER the closing `</div>` of `.home-below` and BEFORE `</main>`, insert:

```astro
{
  projects.length > 0 && (
    <section class="home-projects" data-reveal>
      <h2 style="margin-top: 0;">Projects</h2>
      <div class="home-proj-grid">
        {projects.map((project, i) => (
          <a
            class="home-proj-card"
            style={`--i: ${i}`}
            href={url(`/projects/${project.id}/`)}
          >
            {project.data.image && (
              <div class="home-proj-image">
                <img
                  src={url(project.data.image)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                {project.data.categories?.[0] && (
                  <span
                    class="home-proj-pill"
                    style={`background: ${
                      PROJECT_CATEGORY_BADGE_VARS[
                        project.data.categories[0]
                      ] ?? "var(--color-accent)"
                    }`}
                  >
                    {project.data.categories[0]}
                  </span>
                )}
              </div>
            )}
            <div class="home-proj-title">{project.data.title}</div>
            <div class="home-proj-year">
              {project.data.date.getUTCFullYear()}
            </div>
          </a>
        ))}
      </div>
      <a href={url("/projects")} class="home-more" style="--i: 3">
        View all projects<span class="home-more-arrow" aria-hidden="true"
          >&rarr;</span
        >
      </a>
    </section>
  )
}
```

Note: check the exact category-pill class/color usage in `src/pages/projects.astro` (`.project-image-badge`) and mirror its visual result; if `PROJECT_CATEGORY_BADGE_VARS` values are `var(--proj-*)` references they resolve per-theme automatically.

- [ ] **Step 3: Add the CSS**

In the same file's `<style>`, after the `.home-more` rules:

```css
/* ---- Projects strip: preview of the Projects page in its card language. ---- */
.home-projects {
  max-width: var(--max-width);
  margin: 0 auto 2rem;
  padding: 0 1rem;
}
.home-proj-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1.5rem;
}
.home-proj-card {
  display: block;
  text-decoration: none;
  color: inherit;
}
.home-proj-image {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  margin-bottom: 0.7rem;
}
.home-proj-image img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  transition: transform 0.25s ease;
}
.home-proj-card:hover .home-proj-image img {
  transform: scale(1.03);
}
.home-proj-pill {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #fff;
}
.home-proj-title {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-text-main);
  transition: color 0.15s ease;
}
.home-proj-card:hover .home-proj-title {
  color: var(--color-accent);
}
.home-proj-card:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: 4px;
}
.home-proj-year {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 0.15rem;
}
```

- [ ] **Step 4: Wire into the reveal cascade**

Extend BOTH existing selector lists (base + `.is-revealed`) that currently read `[data-reveal] h2, [data-reveal] .home-row, [data-reveal] .home-more` to also include `[data-reveal] .home-proj-card`. Extend the reduced-motion static block the same way.

- [ ] **Step 5: Verify**

```bash
npm run build && npm run preview -- --port 4399 & echo $! > /tmp/shot-dev.pid
sleep 3
PREVIEW_URL=http://localhost:4399 node scripts/shot.mjs / --scroll 2600 --out /tmp/t1-projects.png
PREVIEW_URL=http://localhost:4399 node scripts/shot.mjs / --scroll 2600 --theme l --width 390 --out /tmp/t1-projects-m.png
kill "$(cat /tmp/shot-dev.pid)"
```

Note: the homepage intro scroll-locks early scrolling in headless runs; if `--scroll` lands wrong, use a small Playwright script (run from repo root) that waits for `data-home-intro` removal, then `document.querySelector(".home-projects").scrollIntoView()`, waits 1.2s for the cascade, screenshots. Read the PNGs: expect ≤3 cards with image, pill, serif title, year; hover language matches the site; single column at 390.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro
git commit -m "Home: projects strip in Projects-page card language"
```

---

### Task 2: Equation coda component

**Files:**
- Create: `src/components/EquationCoda.astro`
- Modify: `src/pages/index.astro` (import + insert after `.home-projects`)

**Interfaces:**
- Consumes: `katex` (direct dependency; `katex.renderToString`). KaTeX CSS is already global via BaseHead — do NOT import katex CSS.
- Produces: `<EquationCoda />` with no props, placed between the projects strip and the contact band (Task 3 inserts itself after it).

- [ ] **Step 1: Create the component**

`src/components/EquationCoda.astro`:

```astro
---
// Compact easter-egg coda: the damped Langevin equation the hero particles
// actually integrate (HeroSim step(): velocity damping + Gaussian noise +
// cursor repulsion). Renders as one quiet line; hovering/focusing a term
// tints it and reveals a small same-colored annotation chip. Nothing invites
// the interaction — discovery is the point. On (hover: none) devices the
// chips render statically so touch users get the annotated layout.
import katex from "katex";

const T = (tex: string) =>
  katex.renderToString(tex, { throwOnError: false });

const terms = [
  { key: "drag", tex: "-\\gamma\\,\\mathbf{v}", label: "drag" },
  { key: "noise", tex: "+\\sqrt{2D}\\,\\boldsymbol{\\xi}(t)", label: "noise" },
  {
    key: "you",
    tex: "+\\mathbf{F}_{\\mathrm{cursor}}(\\mathbf{r})",
    label: "you (the cursor)",
  },
];
---

<section class="eq-coda" data-reveal>
  <p class="eq-line">
    <span class="eq-frag" set:html={T("\\dot{\\mathbf{v}} \\;=\\;")} />
    {
      terms.map((t) => (
        <span
          class={`eq-term eq-term--${t.key}`}
          tabindex="0"
          aria-describedby={`eq-chip-${t.key}`}
        >
          <span class="eq-frag" set:html={T(t.tex)} />
          <span class="eq-chip" id={`eq-chip-${t.key}`}>{t.label}</span>
        </span>
      ))
    }
  </p>
  <p class="eq-caption">
    Every particle in the hero integrates this equation. The last term is you.
  </p>
</section>

<style>
  .eq-coda {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 2.5rem 1rem 3rem;
    text-align: center;
  }
  .eq-line {
    margin: 0 0 0.9rem;
    font-size: 1.25rem;
    color: var(--color-text-main);
  }
  .eq-frag :global(.katex) {
    font-size: 1em;
  }
  .eq-term {
    --eq-c: var(--color-text-main);
    position: relative;
    display: inline-block;
    cursor: default;
    transition: color 0.2s ease;
    border-radius: 3px;
  }
  .eq-term--drag {
    --eq-c: var(--color-text-muted);
  }
  .eq-term--noise {
    --eq-c: var(--color-accent);
  }
  .eq-term--you {
    --eq-c: var(--color-hot);
  }
  .eq-term:hover,
  .eq-term:focus-visible {
    color: var(--eq-c);
  }
  .eq-term:focus-visible {
    outline: 2px solid var(--eq-c);
    outline-offset: 3px;
  }
  /* Chip: real DOM (screen readers can always reach it via aria-describedby);
     visually revealed on hover/focus. Kept opacity-based, not display:none. */
  .eq-chip {
    position: absolute;
    left: 50%;
    top: 100%;
    transform: translate(-50%, 0.15rem);
    white-space: nowrap;
    font-family: var(--font-sans);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--eq-c);
    opacity: 0;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
    pointer-events: none;
  }
  .eq-term:hover .eq-chip,
  .eq-term:focus-visible .eq-chip {
    opacity: 1;
    transform: translate(-50%, 0.35rem);
  }
  .eq-caption {
    margin: 1.4rem 0 0;
    font-size: 0.9rem;
    color: var(--color-text-muted);
  }
  /* Touch / no-hover: annotated statically (the compact fallback layout). */
  @media (hover: none) {
    .eq-line {
      display: inline-flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: baseline;
      gap: 0 0.1em;
    }
    .eq-chip {
      position: static;
      display: block;
      transform: none;
      opacity: 1;
      margin-top: 0.3rem;
    }
    .eq-term {
      color: var(--eq-c);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .eq-term,
    .eq-chip {
      transition: none;
    }
  }
</style>
```

- [ ] **Step 2: Insert into the homepage**

In `src/pages/index.astro` frontmatter: `import EquationCoda from "../components/EquationCoda.astro";`
In the body, after the `.home-projects` section: `<EquationCoda />`

- [ ] **Step 3: Verify**

Build + preview (same pattern as Task 1). With a Playwright script from the repo root: screenshot the coda at rest (no chips visible), `:hover` each term via `page.hover(".eq-term--you")` etc. (term tints, chip appears in matching color — "you" must be magenta/pink), keyboard `Tab` reaches each term (focus ring + chip), and emulate touch (`hasTouch: true` + CSS `(hover: none)` — chips statically visible). Check dark + light. Expected: the coda occupies roughly 8rem of quiet vertical space; equation reads continuously despite being four spans.

- [ ] **Step 4: Commit**

```bash
git add src/components/EquationCoda.astro src/pages/index.astro
git commit -m "Home: equation coda — the Langevin rule behind the hero, hover-annotated"
```

---

### Task 3: Contact band

**Files:**
- Modify: `src/pages/index.astro` (frontmatter imports, markup after `<EquationCoda />`, CSS, reveal blocks)

**Interfaces:**
- Consumes: `CONTACT` (has `emails: string[]`) and `SOCIAL_LINKS` (array of `{label, href, icon}`) from `src/consts.ts`; `CV_URL` from `src/consts.ts`; `CV_AVAILABLE` from `src/utils/cv.ts`.
- Produces: `.home-contact` — the final content block before `<Footer />`.

- [ ] **Step 1: Frontmatter**

```ts
import { CONTACT, CV_URL, SOCIAL_LINKS } from "../consts";
import { CV_AVAILABLE } from "../utils/cv";

const contactEmail = CONTACT.emails[0];
const linkedin = SOCIAL_LINKS.find((l) => l.icon === "linkedin");
const cvHref = CV_AVAILABLE && CV_URL ? url(CV_URL) : null;
```

- [ ] **Step 2: Markup** (after `<EquationCoda />`, before `</main>`)

DRAFT copy — **Sergio approves or rewrites the sentence before merge**:

```astro
<section class="home-contact" data-reveal>
  <div class="home-contact-inner">
    <p class="home-contact-line">
      I'm finishing my PhD and open to what comes next — if your team works
      on problems where modeling, simulation, or messy data matter, I'd like
      to hear from you.
    </p>
    <div class="home-contact-links">
      <a href={`mailto:${contactEmail}`} class="home-more" style="--i: 0">
        Email<span class="home-more-arrow" aria-hidden="true">&rarr;</span>
      </a>
      {
        cvHref && (
          <a
            href={cvHref}
            target="_blank"
            class="home-more"
            style="--i: 1"
            data-umami-event="cv-download"
            data-umami-event-location="home-contact"
          >
            CV<span class="home-more-arrow" aria-hidden="true">&rarr;</span>
          </a>
        )
      }
      {
        linkedin && (
          <a
            href={linkedin.href}
            target="_blank"
            rel="noopener noreferrer"
            class="home-more"
            style="--i: 2"
          >
            LinkedIn<span class="home-more-arrow" aria-hidden="true">&rarr;</span>
          </a>
        )
      }
    </div>
  </div>
</section>
```

- [ ] **Step 3: CSS**

```css
/* ---- Contact band: the page's final beat — ends on the ask. ---- */
.home-contact {
  background: var(--color-bg-offset);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  /* Full-bleed out of main's column (same trick as .hero-card). */
  width: 100vw;
  margin-left: calc(50% - 50vw);
}
.home-contact-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 2.75rem 1rem;
  text-align: center;
}
.home-contact-line {
  margin: 0 auto 1.4rem;
  max-width: 36rem;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--color-text-main);
}
.home-contact-links {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}
.home-contact-links .home-more {
  margin-top: 0;
}
```

Reveal: add `[data-reveal] .home-contact-line, [data-reveal] .home-contact-links` to the cascade lists (base, `.is-revealed`, reduced-motion) — the `.home-more` links inside already match existing selectors; verify no double-animation (if `.home-more` is already in the list, the links stagger via their `--i`, which is the desired effect).

- [ ] **Step 4: Verify**

Build + preview; screenshot the band (both themes, 1440 + 390). Expect: offset ground with hairlines, centered sentence ≤36rem, three (or two if no CV) editorial links. `main`'s bottom padding should not leave a stripe between the band and the footer — if it does, add `margin-bottom: -3rem` compensation on `.home-contact` (main has `padding: 3rem 1rem`) and note it in a comment.

- [ ] **Step 5: Present the draft sentence to Sergio** for approval/rewrite (do not merge the branch before this).

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro
git commit -m "Home: closing contact band (email / CV / LinkedIn)"
```

---

### Task 4: Footer redesign (site-wide)

**Files:**
- Modify: `src/components/Footer.astro`

**Interfaces:**
- Consumes (all already imported there): `CONTACT`, `CV_URL`, `SITE_TAGLINE`, `SITE_TITLE`, `SOCIAL_LINKS`, `CV_AVAILABLE`, `Search`, `ParticleField`, `url`.
- MUST PRESERVE VERBATIM: the `<ParticleField ... />` invocation; the trailing `<Search />`; the entire existing `<script>` block (link sanitization/team logic); the CV link's `data-umami-event="cv-download"` attributes; the existing social-icon SVG markup (move, don't retype); any existing credit/copyright text content.

- [ ] **Step 1: Restructure the template**

Replace the `.footer-content` four-column block with (keeping the preserved pieces listed above):

```astro
<footer class="site-footer">
  <ParticleField count={30} opacity={0.18} />
  <div class="footer-inner">
    <div class="footer-id">
      <div class="footer-name">{SITE_TITLE}</div>
      <p class="footer-quote">{SITE_TAGLINE}</p>
    </div>
    <div class="footer-side">
      <nav class="footer-nav" aria-label="Footer">
        <a href={url("/")}>Home</a>
        <a href={url("/about")}>About</a>
        <a href={url("/publications")}>Research</a>
        <a href={url("/projects")}>Projects</a>
        <a href={url("/blog")}>Journal</a>
        {
          cvHref && (
            <a
              href={cvHref}
              target="_blank"
              data-umami-event="cv-download"
              data-umami-event-location="footer"
            >
              CV
            </a>
          )
        }
      </nav>
      <div class="footer-contact">
        <a class="footer-email" href={`mailto:${CONTACT.emails[0]}`}>
          {CONTACT.emails[0]}
        </a>
        <!-- MOVE the existing social-links icon list here unchanged
             (the <ul>/loop with the GitHub/LinkedIn/etc SVGs). -->
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    &copy; {today.getFullYear()} {SITE_TITLE}. All rights reserved.
    <!-- keep any existing credit text here verbatim -->
  </div>
  <Search />
</footer>
```

- [ ] **Step 2: Replace the footer CSS**

New scoped styles (delete the old column styles; keep any styles the preserved script/icons depend on — check selectors the script writes into):

```css
.site-footer {
  position: relative;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  overflow: hidden;
}
.footer-inner {
  position: relative;
  z-index: 1;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 2.5rem 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  flex-wrap: wrap;
}
.footer-name {
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-text-main);
}
.footer-quote {
  margin: 0.4rem 0 0;
  max-width: 22rem;
  font-size: 0.85rem;
  font-style: italic;
  color: var(--color-text-muted);
}
.footer-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.9rem;
}
.footer-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0;
}
.footer-nav a {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
}
.footer-nav a:hover {
  color: var(--color-accent);
}
/* Dot separators between nav links (not after the last). */
.footer-nav a + a::before {
  content: "·";
  margin: 0 0.6rem;
  color: var(--color-border);
}
.footer-contact {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.footer-email {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}
.footer-email:hover {
  color: var(--color-accent);
}
.footer-bottom {
  position: relative;
  z-index: 1;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 1rem 1.75rem;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}
@media (max-width: 640px) {
  .footer-side {
    align-items: flex-start;
  }
}
```

Restyle the preserved social-icons list minimally (icons at `--color-text-muted`, hover accent) — reuse its existing class names so the sanitization script still finds its targets.

- [ ] **Step 3: Verify site-wide**

Build + preview. Screenshot the footer on `/` AND on a blog post (e.g. `/blog/physics-entropy-equation/`), dark + light, 1440 + 390. Expect: ~half previous height, no column headers, nav row with dot separators, quote under the serif name, icons functional (hover states), ParticleField still drifting, Search still opens (click the navbar search icon on the preview — the modal lives in the footer). Keyboard-tab through all footer links.

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.astro
git commit -m "Footer: replace template columns with editorial single-band layout"
```

---

### Task 5: Integration pass

**Files:**
- Modify (only if issues found): `src/pages/index.astro`
- Modify: `DESIGN-REVIEW.md`

- [ ] **Step 1:** Full-page scroll-through on the preview build (desktop + 390): intro → hero → hold → rows → projects → coda → contact → footer. Confirm panel rhythm/spacing (no double borders where the contact band meets the footer; coda doesn't feel like a headline), reveal cascades fire once each, `overflowX` stays 0 at every stop (the shot script prints it).
- [ ] **Step 2:** `npm run build` clean and `npx prettier --check` on touched files (fix with `--write` if needed).
- [ ] **Step 3:** Append to `DESIGN-REVIEW.md` grab-bag: a DONE note that the footer was de-templated (editorial band, template columns removed) with date 2026-07-21.
- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Home: integration polish for panels; note footer de-templating in design review"
```
