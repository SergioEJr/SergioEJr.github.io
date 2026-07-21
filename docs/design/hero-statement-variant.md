# "Statement" hero variant (P4 from the 2026-07 hero-card exploration)

Shelved candidate from the profile-hero redesign that chose the "in his
element" podium-photo card. Kept because the concept may suit another slot —
it was designed as a deliberate contrast to the busy hero simulation: one
quiet serif thesis sentence, the name demoted to a byline. A natural fit for
the **About page opener**, where the reader has already met the face.

## Concept

- The research thesis is the hero, set large in the site serif.
- Sergio's face appears **inline in the sentence** as a small pill-cropped
  photo (an editorial trick — memorable, but it needs a photo where the face
  reads at ~1em tall).
- Name + role demoted to a bold byline below; quiet arrow text-links.

## Caveats learned

- The record-wall square (`/about/profile.jpeg`) is a marginal source for the
  pill: the face is small in a busy frame. It was made workable with a
  wrapper-zoom crop (below), but a tighter headshot would look intentional
  rather than salvaged. If a new headshot exists, drop the transform zoom.
- The zoom is calibrated to the face sitting at ~44% / 37% of that square
  image — recalibrate `object-position` / `transform-origin` for any other
  photo.

## Markup (Astro)

```astro
<div class="p4">
  <p class="p4-statement">
    Finding the simple local rules
    <span class="p4-facewrap"
      ><img
        class="p4-face"
        src={url("/about/profile.jpeg")}
        width="520"
        height="520"
        alt="Sergio Eraso"
        loading="lazy"
      /></span>
    that add up to complex collective behavior.
  </p>
  <div class="p4-byline">
    <span class="p4-who">Sergio Eraso</span>
    <span class="p4-role"
      >— PhD candidate in Physics, MIT. Nonequilibrium statistical physics
      &amp; biophysics.</span
    >
  </div>
  <p class="p4-links">
    <a href={url("/publications")}>View research &rarr;</a>
    <a href={url("/about")}>About &rarr;</a>
  </p>
</div>
```

## Styles

```css
.p4 {
  max-width: 58rem;
  width: 100%;
  padding: 0 1rem;
}
.p4-statement {
  margin: 0 0 2.2rem;
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: clamp(2.1rem, 4.6vw, 3.5rem);
  line-height: 1.18;
  color: var(--color-text-main);
}
.p4-facewrap {
  display: inline-block;
  width: 2.1em;
  height: 1.15em;
  border-radius: 999px;
  overflow: hidden;
  vertical-align: -0.18em;
  margin: 0 0.08em;
}
.p4-face {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 44% 37%;
  /* Zoom in on the face (it sits around 44% / 37% of the square source);
     loose enough that the chin isn't clipped. */
  transform: scale(1.55);
  transform-origin: 44% 37%;
  filter: grayscale(1);
}
.p4-byline {
  margin: 0 0 1.1rem;
  font-size: 1rem;
  line-height: 1.5;
}
.p4-who {
  font-weight: 700;
  color: var(--color-accent);
}
.p4-role {
  color: var(--color-text-muted);
}
.p4-links {
  margin: 0;
  display: flex;
  gap: 1.4rem;
}
.p4-links a {
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.95rem;
}
.p4-links a:hover {
  text-decoration: underline;
}
/* Mobile: left-align links (was flex-start in the lab's ≤768px block). */
```
