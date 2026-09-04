---
title: "Symmetry transformations of fields"
description: "How scalar, vector, covector, and general tensor fields transform under the symmetries of a group."
pubDate: "2026-07-16"
category: notebook
topic: Physics
featured: 3
authors:
 - sergio-eraso
keywords:
 - field theory
 - group theory
 - symmetry
draft: false # set to false to publish
---

## Scalar Fields

Suppose I have a hot cup of coffee described by a temperature field $\phi(\boldsymbol{x})$, and I slide the cup by a displacement $\boldsymbol{a}$ on my desk. If physics is going to be of any use to us, then the total heat content of the coffee better not have changed. Why must this be?

Because space is *homogeneous* -- there is no preferred or privileged position. Mathematically, the energy $F[\phi]$ of the coffee cup is invariant under actions from the translation group $\mathbb{R}^3$. How do we describe the transformed temperature field of this displaced coffee?
> [!figure] Displacing the cup by $\boldsymbol{a}$ carries the field $\phi$ to a new field $\phi'$.
> ![[field-translation.svg]]

Evidently, the transformed temperature field $\phi'$ now has support in a different region of space. This is a whole new function, it is an entirely different configuration of the coffee cup. The function $\phi$ is *not* invariant under translations, unlike the energy. This new function is defined by

$$
\begin{align*}
 \phi'(\boldsymbol{x} + \boldsymbol{a}) = \phi(\boldsymbol{x}).
\end{align*}
$$
This is the most straightforward way to describe the transformation, however, it is customary (and also useful) to describe the transformed field from *its* perspective. Letting $\boldsymbol{x}' = \boldsymbol{x} + \boldsymbol{a}$, we get

$$
\begin{align}
 % \label{eq:scalar-translation}
 \phi'(\boldsymbol{x}') = \phi(\boldsymbol{x})
 = \phi(\boldsymbol{x}' - \boldsymbol{a}).
\end{align}
$$
In general, if $g$ is an element of a group $G$, then the transformed scalar field $g \cdot \phi$ is
$$
\begin{align}
 % \label{eq:scalar-transform}
 (g \cdot \phi)(\boldsymbol{x}) = \phi(g^{-1} \boldsymbol{x}).
\end{align}
$$
If the inverse group element is ever confusing, just remember that it comes from expressing the field and points in terms of the new reference frame as in Eq. [eq:scalar-translation](#eq:scalar-translation). This is called a *pullback* -- we define the transformed field $\phi'$ by pulling the evaluation point $\boldsymbol{x}$ back to its original position $g^{-1}\boldsymbol{x}$ and evaluate the *old* function there.

## Vector Fields

Now, let's consider a bar magnet whose local magnetization is described by a vector field $\boldsymbol{m}(\boldsymbol{x})$. In the absence of any external field, I can rotate this magnet by rotation matrix $R$, and the energy of the magnetic field should not change. Why must this be?

Because in addition to being homogeneous, space is also *isotropic* -- there is no preferred or privileged direction. That means the energy of the bar magnet $F[\boldsymbol{m}]$ is not only invariant under translations $\mathbb{R}^3$, but also under the group of rotations $O(3)$. Together, these transformations make up the *Euclidean* group $E(3)$, the fundamental group of symmetries for flat three-dimensional space. Let's see how our magnetic field transforms under a rotation:

> [!note|margin] Aside
> For relativistic systems, the fundamental group of symmetries is the Poincaré group $P(1,3)$, which is the combination of spacetime translations $\mathbb{R}^{(1,3)}$ and spacetime rotations $O(1,3)$.

> [!figure] To transform a vector field, both the positions $\boldsymbol{x}$ and the vectors $\boldsymbol{m}$ must rotate together (bottom right). Rotating only one leaves the magnetization misaligned with the bar.
> ![[field-vector-transform.svg]]

From the diagram above, we can see that the transformed field $\boldsymbol{m}'$ is described by,

$$
\begin{align*}
 \boldsymbol{m}'(R\boldsymbol{x})
 = R\boldsymbol{m}(\boldsymbol{x}).
\end{align*}
$$
Letting $\boldsymbol{x}' = R \boldsymbol{x}$, we can again express this as a pullback function,
$$
\begin{align}
 % \label{eq:vector-rotation}
 \boldsymbol{m}'(\boldsymbol{x}')
 = R\boldsymbol{m}(R^{-1}\boldsymbol{x}')
\end{align}
$$
so that the rotated field is defined entirely in terms of the untransformed field. This reveals an important distinction between symmetry transformations on scalar fields (Eq. [eq:scalar-transform](#eq:scalar-transform)) and on vector fields: for vector fields, one must transform both the inputs *and* the outputs. From Eq. [eq:vector-rotation](#eq:vector-rotation), it may appear that we should just transform the vector field opposite how we transform the base space, however, we can come up with an immediate counterexample.

Consider now a general rigid-body transformation $\boldsymbol{x}' = R\boldsymbol{x} + \boldsymbol{a}$. Translating the magnet should certainly not change the direction of the field, so only the rotation operator should act on $\boldsymbol{m}$, giving $\boldsymbol{m}'(\boldsymbol{x}') = R \boldsymbol{m}(R^{-1}(\boldsymbol{x}' - \boldsymbol{a})).$ So, we see that the transformation acting on the vector field $\boldsymbol{m}$ is not simply the rigid body motion $g$. The proper transformation is given by the *Jacobian* of the rigid body motion $J(\boldsymbol{x}) = R$,

$$
\boldsymbol{m}'(\boldsymbol{x}) = J(g^{-1}\boldsymbol{x}) \boldsymbol{m}(g^{-1}\boldsymbol{x}).
$$

The Jacobian may vary over space for more general coordinate maps, but it is constant in this simple example.

> [!example]- Derivation: Why the Jacobian shows up
> Let $\Phi$ be an arbitrary coordinate transformation (an invertible, differentiable function) and let $\boldsymbol{v}$ represent a velocity field. Choose an arbitrary point $\boldsymbol{x}$ and define the curve $\gamma(t)$ such that $\gamma(0) = \boldsymbol{x}$ and $\dot{\gamma}(0) = \boldsymbol{v}(\boldsymbol{x})$ -- the curve passes through the chosen point and is tangent to the streamline at that point at $t = 0$.
>
> > [!figure] The curve $\gamma(t)$ need not follow the field, but it is tangent to it at $\boldsymbol{x}$ — so its velocity there is exactly $\boldsymbol{v}(\boldsymbol{x})$. Carrying the curve through $\Phi$ and differentiating at $t=0$ sends that tangent vector to $\boldsymbol{v}'(\boldsymbol{x}')$, so the field is carried by the Jacobian rather than by $\Phi$ itself.
> > ![[velocity-field-transform.svg]]
>
> We require that the transformed field $\boldsymbol{v}'(\boldsymbol{x}')$ be equal to the velocity of the transformed curve $\Phi(\gamma(t))$. Calculating the velocity of the transformed curve, we are left with
>
> $$
> \begin{align}
> \boldsymbol{v}'(\boldsymbol{x}')
> = \frac{d}{dt} \Phi(\gamma(t))\; \Big|_{t = 0}
> = \frac{d\Phi}{dx}
> \frac{d\gamma}{dt} \Big|_{t = 0}
> = J(\boldsymbol{x}) \boldsymbol{v}(\boldsymbol{x})
> \end{align}
> $$
>
> where we have identified the derivative of the coordinate map as the Jacobian, $J$, at the point $\boldsymbol{x}$.

## Covector Fields

> [!note|margin] Recall
> Recall that a covector $\omega_{\boldsymbol{x}}$ is simply a linear map specified at a point $\boldsymbol{x}$ that eats a vector and returns a scalar. For instance, the bra's in quantum mechanics are covectors, or also a force field used to determine the amount of work done $\omega_x = \langle F(x) | \cdot \rangle$.

A covector field $\omega$ must transform in such a way that its contraction with a vector is unchanged, since that is just a scalar,
$$
\omega_{\boldsymbol{x}'}'(\boldsymbol{v}'(\boldsymbol{x}'))
= \omega_{\boldsymbol{x}}(\boldsymbol{v}(\boldsymbol{x})).
$$
For example, you can think of $\omega$ as returning the amount of work done in a given direction vector $\boldsymbol{v}$ at a point $\boldsymbol{x}$. Since we know how vectors transform, $\boldsymbol{v}' = J\boldsymbol{v}$, the covector transformation rule follows immediately[^index],
$$
\begin{align}
\omega'_k J^k{}_{j}v^j &= \omega_j v^j \\
(\omega'_k J^k{}_j - \omega_j )v^j &= 0 \\
\implies \omega'_i &= (J^{-1})^j{}_i \omega_j.
\end{align}
$$
This is equivalent to
$$
\begin{align}
% \label{eq:covector-transform}
 \omega'_{\boldsymbol{x}} = J^{-T}(g^{-1}\boldsymbol{x}) \omega_{g^{-1}\boldsymbol{x}}
\end{align}
$$
in index-free form.

## Tensor Fields

Now that we know how vectors and covectors transform, we can write down the transformation rule for arbitrary $(p,q)$-tensors. For a general group element $g\in G$, a tensor field $T$ transforms as

$$
(g \cdot T)(g\boldsymbol{x}) = \rho(J(\boldsymbol{x})) T(\boldsymbol{x})
$$

where

$$
\rho(J) = J^{\otimes p} \otimes ({J^{-T}}) ^{\otimes q}
$$

is a representation of $GL(n)$ on the space where $T$ lives. This simply says that the transformation rule for a tensor involves a copy of $J$ for each upper index and a copy of $J^{-T}$ for each lower index. As an example, let us consider the conductivity tensor that governs Ohm's law $j^i = \sigma^i{}_j E^j$. This is a $(1,1)$-tensor that transforms as
$$
\sigma'^i{}_j = J^i{}_m (J^{-1})^n{}_{j} \sigma^{m}{}_n.
$$

Since $(1,1)$ tensors transform by _similarity_ transformations, their eigenvalues and trace are invariant. This is why the principal axes of conductivity are meaningful physical quantities.

[^index]: Suppressing the base space evaluation points to avoid subscript hell