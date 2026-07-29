# Photos

Photographs used in Journal posts. Referenced by **root-absolute** path so a
post can be refiled between `essays/`, `notes/` and `updates/` without rewriting
anything inside it:

```yaml
heroImage: /src/assets/photos/my-photo.jpeg
```

```md
![Alt text](/src/assets/photos/my-photo.jpeg)
```

Generated diagrams do **not** belong here — they live in `../diagrams/` and are
built from `figures/*.tex` by `./fig.sh`. See that folder's README.

## Downscale before committing

**Target: 2560px on the long edge.** Not arbitrary — `BlogPost.astro` renders a
hero at `width={1020}` with `densities={[1, 2]}`, so the widest variant Astro
ever emits is **2040px**. Everything above that is discarded at build time, so a
full-resolution camera export costs visitors nothing while sitting in git
history forever. 2560 keeps 25% headroom over the ceiling.

```sh
node -e "require('sharp')('IN.jpeg').rotate()
  .resize({width:2560,withoutEnlargement:true,kernel:'lanczos3'})
  .jpeg({quality:92,mozjpeg:true,chromaSubsampling:'4:2:0'})
  .keepIccProfile().toFile('OUT.jpeg')"
```

Keep the ICC profile (color fidelity); EXIF/XMP is dropped, which also strips
any GPS coordinates. Scans of documents stay **PNG** — JPEG rings on text.

This is measured, not guessed. Rendering an original and a 2560px version down
to the 2040px the site serves differs by ~1.3/255 mean absolute error, and that
residual is two-step resampling arithmetic rather than quality loss — it barely
moves between quality 88 and 95. A 1:1 crop of a saturated, detailed subject is
indistinguishable. If a photo ever *does* look soft, the cause is a source below
2040px, not this pipeline.
