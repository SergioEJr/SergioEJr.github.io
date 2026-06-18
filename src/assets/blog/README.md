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
