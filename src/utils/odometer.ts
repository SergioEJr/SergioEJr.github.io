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

const DURATION_MS = 1600;
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

    // In-flow ghost: holds the line height + width AND defines the host baseline.
    // It shows the widest number in the run so trailing text never shifts.
    const widest = Math.max(from, target);
    const ghost = document.createElement("span");
    ghost.textContent = String(widest);
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
      return;
    }
    // Start showing `from` (first row) at the bottom: shift the strip DOWN so its
    // first row sits in the window, then animate to 0 so it rolls to the target.
    strip.style.transition = "none";
    strip.style.transform = `translateY(${lastIndex * rowH}px)`;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        strip.style.transition = `transform ${DURATION_MS}ms ${EASE}`;
        strip.style.transform = "translateY(0)";
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
