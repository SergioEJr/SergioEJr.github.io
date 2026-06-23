---
title: "Hello, world!"
description: "My first post — what this blog is for, with a quick demo of math and code."
pubDate: "2020-01-30"
category: news
authors:
  - sergio-eraso
toc: false # table of contents flag
tags:
  - intro
---

Welcome, and thanks for stopping by!

I'm starting this personal website and blog as a place to think out loud — about cool science explained plainly, projects I'm working on, and general updates about what I'm up to.

One of the neat things about creating my own blog is that I can set up support for the things I care about for technical writing. For example, inline math works splendidly $E = mc^2$ as well as display equations:

$$
i\hbar \partial_t \psi =  \frac{\hbar^2}{2m} \nabla^2\psi + V \psi.
$$

We also have support for `inline-code` and even syntax-highlighted code:

```python
import numpy as np

def random_walk(n, steps):
    return np.cumsum(np.random.choice([-1, 1], size=(n, steps)), axis=1)
```

Of course, there is also support for images:

![Sample image](/src/assets/blog/intro-pic.jpeg)

For more advanced projects, I am also excited to test out JSX integration with .mdx files. I am super excited to see where this goes!

~ Sergio
