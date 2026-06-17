---
title: 'A tiny note on the Gaussian integral'
description: 'The classic polar-coordinates trick for evaluating the Gaussian integral.'
pubDate: '2026-05-20'
category: math
authors:
  - sergio-eraso
tags:
  - calculus
---

A quick favorite. To evaluate $I = \int_{-\infty}^{\infty} e^{-x^2}\,dx$, square it and switch to polar coordinates:

$$
I^2 = \int_{-\infty}^{\infty}\!\!\int_{-\infty}^{\infty} e^{-(x^2+y^2)}\,dx\,dy = \int_0^{2\pi}\!\!\int_0^{\infty} e^{-r^2} r\,dr\,d\theta = \pi.
$$

So $I = \sqrt{\pi}$. (Placeholder post — replace with your own.)
