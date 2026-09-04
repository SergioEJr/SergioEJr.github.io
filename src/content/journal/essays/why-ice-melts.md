---
title: "Why does ice melt?"
description: "Ice, water, and steam are all made of the same molecule, so why does one turn into another at a sharp temperature? Melting is a trade: the ice gains entropy, the room pays for it, and temperature sets the exchange rate."
pubDate: "2024-08-30"
category: essays
subject: Science
authors:
 - sergio-eraso
toc: true
keywords:
 - statistical physics
 - thermodynamics
 - chemistry
draft: false # set to true to unpublish
---

Suppose all scientific knowledge has suddenly evaporated and you were tasked to pass along a single sentence to the next generation of scientists. What would you say? This scenario was posed to Nobel laureate and physicist Richard Feynman. His answer was the atomic hypothesis: everything is made of atoms.

Atoms are quite versatile. One particularly important group of atoms, the $H_2O$ molecule, makes up the ice you skate on, the water you drink, and the steam that powers your home. Ice, steam, and water behave very differently, despite all being made of the same molecule; have you ever stopped to think why we have states of matter at all?

## More is different

You may be tempted to say we have states of matter because of temperature. And you'd be right, but we can be little more fundamental than that. The essence is that a large collection of atoms is more than the sum of its parts. It doesn't make sense to melt a single H₂O molecule or to speak of a gas consisting of a single atom. We can't even talk about a phase of matter -- solid, liquid, or gas -- without considering a large number of atoms.

We know large collections of atoms undergo phase transitions at specific temperatures. This feels so familiar it may seem almost trivial, but it turns out that describing the physics of phase transitions took some major scientific developments. The key player is entropy, the counting of microscopic possibilities we built up in _[[entropy-arrow-of-time|Entropy and the arrow of time]]_.

## Balancing entropy and energy

Entropy seems to make our question worse before it makes it better. If entropy always increases, shouldn't a block of ice spontaneously melt, regardless of the temperature, thus releasing its molecules into the surrounding air to increase the entropy of the universe?

> [!note-margin] recall
> Recall that entropy counts the number of microscopic arrangements that produce the same big-picture state, with closed systems drifting toward the state with the most arrangements. Free-roaming vapor molecules have vastly more arrangements available to them than molecules locked in an ice crystal.

The short answer is that we have forgotten to take the conservation of energy into account. If the room is sealed off from the rest of the world, then the ice and the room together form a closed system, and their total energy must be conserved. It takes energy to rip molecules out of a rigid crystal, so the air in the room must give up some of its own heat to melt the cube, and parting with heat costs the air entropy. This competition between the energy and entropy of the system (the ice) and the environment (the room) is key to how physicists study phase transitions. To quantify the competition, physicists use a quantity known as the free energy.

> [!figure] Heat flows from the environment into the ice, so the environment loses entropy while the ice gains entropy. A colder environment loses more entropy than the ice gains, so melting is unfavorable; a warmer environment loses less entropy, so the ice melts.
> ![[entropy-ice-melting.svg]]

## The free energy

Keeping track of two entropies, one for the ice and one for the room, is clumsy; we would rather look at the ice alone. Instead of keeping track of the room's entropy, we can instead track its temperature $T$. The free energy then encapsulates the balance between the entropy and energy of the ice in terms of the room's temperature,

$$
F_{\text{ice}} = E_{\text{ice}} - TS_{\text{ice}}
$$

Maximizing the total entropy of the ice and the room together -- the second law -- is then exactly the same as minimizing the free energy of the ice alone.

## Phase transitions

And with that, the states of matter fall out. At low temperature, the $E$ term wins, and the molecules lock into the arrangement that costs the least energy: solid ice. At high temperature, the $TS$ term wins, and the molecules take the arrangement with the most possibilities: steam. The melting point is simply the temperature where the trade breaks even -- a phase transition. Next time you melt an ice cube, just remember the dance between energy and entropy that makes the world an exciting place to be.