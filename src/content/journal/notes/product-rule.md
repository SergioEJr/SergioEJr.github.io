---
title: "A picture proof of the product rule"
description: "The product rule falls out of a rectangle with no calculus required."
pubDate: "2023-07-09"
category: notebook
topic: Math
authors:
  - sergio-eraso
keywords:
  - calculus
  - derivatives
  - visual proofs
draft: false # set to true to unpublish
---
We want the derivative of a product $f \cdot g$, which we can picture as the area
of a rectangle with sides $f$ and $g$. Nudging the input by a small amount grows each
side by its own differential, $df$ and $dg$:

> [!figure] The change in area is the two strips plus a vanishing corner.
> ![[product-rule.svg]]

The new area exceeds the old by two thin strips plus a small corner. The strips
have areas $g \,df $ and $f\,dg$, whereas the corner $df\,dg$ is a
second order contribution and drops out in the limit. What
survives is exactly the product rule:

$$
d(fg) = f \, dg + g \,df.
$$

As an example, we will now visually prove the power rule
$$
dx^n = n x^{n-1} \, dx
$$
for the case $n = 3$, but the same argument holds for arbitrary $n$. Take $x^3$ as the volume of a cube with
sides $x$, and grow each side by $dx$. Three faces of the cube each grow
outward into a slab of volume $x^2\,dx$, so the volume gains $3x^2\,dx$, the
derivative of $x^3$. There are some remaining pieces: three long edges of order
$x\,dx^2$ and a single corner cube $dx^3$. Those are higher order and vanish in
the limit.

> [!figure] Growing the cube adds three x²dx slabs, giving the derivative 3x². The faint subleading contributions are of order $dx^2$ or higher and vanish in the limit.
> ![[cube-x3.svg]]
