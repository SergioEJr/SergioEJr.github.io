// A counting odometer for a small count element. Renders a vertical strip of
// WHOLE numbers and scrolls it so you literally see the count roll from the
// previous value to the target (e.g. 0,1,2,…,12 — or 9,8,…,3 when filtering
// down). Eases to a settle.
// - Honest sequence: every integer between from and target is shown, in order.
// - Width reserved via an in-flow ghost of the widest number, which ALSO anchors
//   the host's baseline (the host stays a normal inline box; the clipping window
//   that holds the rolling strip is an inner absolutely-positioned layer, so the
//   overflow never redefines the host baseline). tabular-nums keeps glyphs equal.
// - First run gated on document.fonts.ready (kills the hard-refresh jitter).
// - prefers-reduced-motion: sets the final number instantly, no roll.

// Duration scales with the DISTANCE rolled, clamped. A fixed duration has to
// serve both a 1-stop change (4 -> 5) and a 13-stop one (0 -> 13 on load): at
// 1600ms the short roll crawled, and the long one spent its first ~800ms showing
// two half-clipped digits stacked in the window — the number was illegible for
// longer than a filter click takes to feel done. Worse, the roll does not even
// start until ~180ms after the click (fadeApply defers the data-count write by
// 160ms, plus this file's double rAF), so the whole envelope was ~1.8s.
// The clamp lands inside the site's existing motion vocabulary (0.15s/0.2s/0.3s
// for state changes, 0.45s the longest non-hero transition): 1 stop = 280ms,
// 9 stops = 600ms, 13 stops = 720ms.
const MIN_MS = 240;
const PER_STEP_MS = 40;
const MAX_MS = 720;
const EASE = "cubic-bezier(.12,.9,.18,1)"; // strong ease-out settle

export function createOdometer(el: HTMLElement) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Always start the first roll from 0 (the server-rendered text is the target,
  // which the caller passes to the first to()). Subsequent calls roll from the
  // previously-displayed value.
  let current = 0;
  let fontsReady = !(document.fonts && document.fonts.ready);
  if (!fontsReady) document.fonts.ready.then(() => (fontsReady = true));

  // Host stays a normal inline box: its baseline is its text baseline, so it
  // aligns to surrounding characters with no font-metric nudge. line-height: 1
  // makes the host box exactly one glyph tall, so the rolling strip's bottom row
  // coincides with the ghost glyph (no extra half-leading pushing it down).
  el.style.display = "inline-block";
  el.style.position = "relative";
  el.style.lineHeight = "1";
  el.style.fontVariantNumeric = "tabular-nums";

  function render(from: number, target: number) {
    from = Math.max(0, Math.round(from));
    target = Math.max(0, Math.round(target));
    el.textContent = "";
    // Clicking a second filter mid-roll re-enters here with the host still part
    // way through its width animation. Drop both, unanimated, so the new roll
    // measures and starts from a clean box instead of easing out of a stale one.
    el.style.transition = "none";
    el.style.width = "";

    // In-flow ghost: holds the line height AND defines the host baseline. It
    // shows the TARGET, not the widest number in the run, because it is what the
    // host is left sized to once the roll settles — sizing it to the widest is
    // what used to leave "13 pieces" -> "4 pieces" rendering as a single glyph
    // right-aligned in a two-glyph column, i.e. a stray space after the "·".
    // The same view then looked different depending on which register you arrived
    // from (All 13 -> Essays 4 kept the gap; Notebook 4 -> Updates 5 did not).
    //
    // Width during the roll is handled separately, by animating the HOST (below):
    // wide enough for the widest frame at the start, narrowing to the target in
    // lockstep with the strip so the trailing text glides instead of jumping.
    const widest = Math.max(from, target);
    const ghost = document.createElement("span");
    ghost.textContent = String(target);
    ghost.style.visibility = "hidden";

    // Build the sequence from -> target (inclusive), ascending or descending.
    const seq: number[] = [];
    if (target >= from) for (let n = from; n <= target; n++) seq.push(n);
    else for (let n = from; n >= target; n--) seq.push(n);

    // Clip window overlays the ghost exactly; overflow lives HERE, not on the host.
    const win = document.createElement("span");
    win.style.position = "absolute";
    win.style.left = "0";
    win.style.right = "0";
    win.style.top = "0";
    win.style.bottom = "0";
    win.style.overflow = "hidden";

    const strip = document.createElement("span");
    strip.style.position = "absolute";
    strip.style.left = "0";
    strip.style.right = "0";
    strip.style.bottom = "0";
    strip.style.display = "flex";
    strip.style.flexDirection = "column";
    strip.style.alignItems = "flex-end";
    strip.innerHTML = seq
      .map((n) => `<span style="line-height:inherit">${n}</span>`)
      .join("");
    win.appendChild(strip);

    el.appendChild(ghost);
    el.appendChild(win);

    // Each row is one line tall; the strip is anchored at the bottom so its last
    // row (the target) coincides with the ghost. Roll by translating UP from the
    // first row (from) to the last (target). 1em ≈ one row, but use the measured
    // row height so non-unit line-heights stay exact.
    const rowH = strip.firstElementChild
      ? (strip.firstElementChild as HTMLElement).offsetHeight
      : el.offsetHeight;
    const lastIndex = seq.length - 1;

    if (reduce) {
      strip.style.transform = "translateY(0)"; // last row (target) already at bottom
      el.style.width = ""; // no roll, so nothing to reserve beyond the ghost
      return;
    }

    // Measure the two widths off the ghost itself, so this stays correct for any
    // font/size the host inherits (tabular-nums makes every digit equal, but the
    // glyph width is still whatever the register's type gives us).
    const targetW = ghost.offsetWidth;
    ghost.textContent = String(widest);
    const widestW = ghost.offsetWidth;
    ghost.textContent = String(target);

    const durationMs = Math.min(MAX_MS, MIN_MS + lastIndex * PER_STEP_MS);

    // Start showing `from` (first row) at the bottom: shift the strip DOWN so its
    // first row sits in the window, then animate to 0 so it rolls to the target.
    strip.style.transition = "none";
    strip.style.transform = `translateY(${lastIndex * rowH}px)`;
    // Hold the widest frame's width up front. Same duration and ease as the roll,
    // so the box is always at least as wide as the digits currently showing —
    // the ease is a strong ease-out, so both the strip and the width are ~85% of
    // the way there by a quarter of the duration, and the multi-digit rows are
    // long gone by then. Clearing `width` afterwards hands sizing back to the
    // ghost, which is already the target.
    if (widestW !== targetW) el.style.width = `${widestW}px`;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        strip.style.transition = `transform ${durationMs}ms ${EASE}`;
        strip.style.transform = "translateY(0)";
        if (widestW !== targetW) {
          el.style.transition = `width ${durationMs}ms ${EASE}`;
          el.style.width = `${targetW}px`;
        }
      }),
    );
  }

  function to(target: number) {
    target = Math.max(0, Math.round(target));
    const from = current;
    current = target;
    if (reduce || fontsReady) {
      render(from, target);
    } else {
      document.fonts.ready.then(() => render(from, target));
    }
  }

  return { to };
}
