---
title: 'Hello, world'
description: 'A first post — what this blog is for, with a quick demo of math and code.'
pubDate: '2026-06-10'
category: news
authors:
  - sergio-eraso
toc: false
tags:
  - intro
---

Welcome, and thanks for stopping by.

I'm starting this blog as a place to think out loud — about modeling and
simulation, the occasional physics idea explained plainly, projects I'm
building, and what I'm learning as I move from academia toward industry.

This theme supports the things I care about for technical writing. Inline math
like $E = mc^2$ works, as do display equations:

$$
\partial_t \rho = D\,\partial_x^2 \rho - v\,\partial_x \rho
$$

And syntax-highlighted code:

```python
import numpy as np

def random_walk(n, steps):
    return np.cumsum(np.random.choice([-1, 1], size=(n, steps)), axis=1)
```

This is a placeholder post — replace it with your own first entry. To add a
post, drop a Markdown file into `src/content/blog/` with `title`, `description`,
and `pubDate` in the frontmatter.
