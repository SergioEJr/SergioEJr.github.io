# Static media (`public/`)

Files here are served **as-is** from the site root with no optimization
(`public/foo.jpg` → `/foo.jpg`). Use this for images referenced by a plain
string path in frontmatter or JSON. Compress images before adding them.

| Folder | For | Referenced as |
|---|---|---|
| `authors/` | Author/collaborator avatars | `avatar` in `src/data/authors.json`, e.g. `/authors/sergio.jpeg` |
| `projects/` | Project card thumbnails + in-article images | `image` / `articleImage` in project frontmatter, e.g. `/projects/foo.jpeg` |
| `posters/` | Research poster PDFs | `poster` in research frontmatter, e.g. `/posters/foo.pdf` |
| (root) | Site assets: `logo.svg`, `favicon.svg`, `resume_public.pdf` | `/logo.svg`, etc. |

**Images rendered with Astro's `<Image>` component do NOT go here** — put them in
`src/assets/` so they get optimized and pass the accessibility/perf audit:

- **Blog-post images** → `src/assets/blog/` (see that folder's README).
- **About + homepage photos** → `src/assets/site/` (imported in `about.astro` /
  `index.astro`).

Suggested sizes: avatars ~600px, project cards ~800px (16:9).
