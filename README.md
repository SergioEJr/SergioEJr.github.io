# sergioejr.github.io

Personal website of **Sergio Eraso** — research, projects, and writing.
Live at **https://sergioejr.github.io**.

Built with [Astro](https://astro.build/) on the
[Astro Scholar](https://github.com/shravanngoswamii/astro-scholar) theme by
Shravan Goswami (MIT License). Supports LaTeX math (KaTeX), syntax-highlighted
code, full-text search (Pagefind), and auto-generated OG images. Deployed to
GitHub Pages via GitHub Actions.

## Where to edit things

| What | File |
|------|------|
| Site title, contact, social links, CV link | `src/consts.ts` |
| Home page hero | `src/pages/index.astro` |
| About page | `src/pages/about.astro` |
| Author profile(s) | `src/data/authors.json` |
| Projects | `src/data/projects.json` |
| Publications | `src/data/publications.bib` |
| Blog posts (one file per post) | `src/content/blog/*.md` |
| Navigation | `src/components/Header.astro` |
| Profile image | `public/profile.svg` (replace with a headshot) |

## Develop locally

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # production build to ./dist (also runs Pagefind search index)
npm run preview  # preview the production build
```

## Deploying

Pushing to `main` runs the **Deploy site** workflow
(`.github/workflows/deploy.yml`), which builds with Astro and publishes to
GitHub Pages. In the repo's **Settings → Pages**, set **Source** to
**GitHub Actions** (one-time).

## Editor notes

**MDX language server is disabled** (`mdx.server.enable: false` in
`.vscode/settings.json`). The MDX VS Code extension parses `{...}` as JS and
falsely flags KaTeX math such as `$2^{10,000}$` with *"Could not parse
expression with acorn"* — even though the build is fine, because
`astro.config.mjs` registers `remark-math` (mirrored in `mdx.config.mjs` for
tooling). That version of the extension has no setting to disable only that
diagnostic, so the whole server is off.

- **Trade-off:** MDX syntax highlighting still works; MDX IntelliSense
  (component autocomplete/hover in `.mdx`) is lost. Astro validates everything at
  build time regardless.
- **To re-enable** IntelliSense, set `mdx.server.enable: true` and live with the
  false positives, or shorten the offending inline math.
