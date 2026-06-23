# Blog images

Put blog-post images here. They are processed by Astro's asset pipeline
(resize, webp/avif, cache-busting hashes), so prefer this over `public/` for
anything inside a post.

**Hero image** (optional, off by default) — reference it from the post
frontmatter relative to the post file:

```yaml
---
title: My Post
heroImage: ../../assets/blog/my-post.jpg
---
```

**In-body images** — use a relative Markdown link or an import:

```md
![Diagram](../../assets/blog/my-post-diagram.png)
```

Recommended hero size: ~1600px wide. Anything large is fine — Astro downscales.

## Diagrams (`<Figure>`)

For diagrams that must work in light *and* dark mode, use the `Figure` component
(`src/components/Figure.astro`) in `.mdx` posts. Three modes:

1. **Adaptive SVG** (best for line-art) — export an SVG with black ink, then
   `sed -i '' 's/#000000/currentColor/g; s/#000/currentColor/g' diagram.svg` so it
   inherits the page color and flips with the theme. Put it here; use:
   ```mdx
   import diagram from '../../assets/blog/diagram.svg?raw';
   <Figure svg={diagram} alt="..." caption="..." />
   ```
2. **Light/dark pair** (for colored graphics) — export two images to `public/blog/`:
   `<Figure light="/blog/fig-light.png" dark="/blog/fig-dark.png" caption="..." />`
3. **Single image on a card** — `<Figure src="/blog/fig.png" caption="..." />`

Optional `width` (px) caps the figure. Export raster images at ~2× display size.
