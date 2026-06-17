# sergioejr.github.io

Personal website of **Sergio Eraso** — research, projects, teaching, and writing.
Live at **https://sergioejr.github.io**.

Built with [Astro](https://astro.build/) on the
[astro-theme-scholars](https://github.com/jxpeng98/astro-theme-scholars) theme
by Jiaxin Peng (MIT License). Deployed to GitHub Pages via GitHub Actions.

## Where to edit things

| What | File |
|------|------|
| Name, tagline, socials, nav, hero, page titles | `src/side.config.ts` |
| About page (bio, education, experience, skills) | `src/data/about.yml` |
| Research / publications | `src/data/publications.bib` |
| Projects | `src/data/projects.yml` |
| Teaching | `src/data/teaching.yml` |
| Blog posts (one file per post) | `src/content/posts/*.md` |
| Profile photo | `public/profile.svg` (replace with your headshot) |
| Favicon | `public/favicon.svg` |

In `publications.bib`, set `public = {yes}` for published work, `{wp}` for
working papers, and `{wip}` for work in progress.

## Develop locally

```sh
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # production build to ./dist
pnpm preview   # preview the production build
```

## Deploying

Pushing to `main` runs the **Deploy site** workflow
(`.github/workflows/deploy.yml`), which builds with Astro and publishes to
GitHub Pages. In the repo's **Settings → Pages**, set **Source** to
**GitHub Actions** (one-time).
