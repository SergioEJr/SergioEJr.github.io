// A counting odometer for a small count element. Renders a vertical strip of
// WHOLE numbers and scrolls it so you literally see the count roll from the
// previous value to the target (e.g. 0,1,2,…,12 — or 9,8,…,3 when filtering
// down). Eases to a settle.
// - Honest sequence: every integer between from and target is shown, in order.
// - Width reserved via an invisible ghost of the widest number (trailing text
//   like a "+" never shifts); tabular-nums keeps glyph widths equal.
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

	// The window is one line tall and clips the off-screen rows. To keep the
	// visible digit on the surrounding text baseline, we DON'T use a fixed-em
	// nudge (font descenders vary). Instead the window and each row share the
	// same line-height, and the element stays vertical-align: baseline — an inline
	// box's baseline is the baseline of its last line, which (with a single 1em
	// line) lands exactly where surrounding text sits.
	el.style.display = "inline-block";
	el.style.position = "relative";
	el.style.height = "1em";
	el.style.overflow = "hidden";
	el.style.verticalAlign = "baseline";
	// An overflow box's baseline becomes its bottom edge, which leaves the digit
	// sitting ~0.23em above the surrounding text baseline; pull it back down so it
	// sits on the line. (Measured against the eyebrow text.)
	el.style.bottom = "-0.23em";
	el.style.fontVariantNumeric = "tabular-nums";
	el.style.lineHeight = "1em";

	function render(from: number, target: number) {
		from = Math.max(0, Math.round(from));
		target = Math.max(0, Math.round(target));
		el.textContent = "";

		// Ghost reserves width for the widest number in the run so trailing text
		// (e.g. a "+") never shifts as the digit count changes mid-roll.
		const widest = Math.max(from, target);
		const ghost = document.createElement("span");
		ghost.textContent = String(widest);
		ghost.style.visibility = "hidden";
		ghost.style.display = "block";
		el.appendChild(ghost);

		// Build the sequence from -> target (inclusive), ascending or descending.
		const seq: number[] = [];
		if (target >= from) for (let n = from; n <= target; n++) seq.push(n);
		else for (let n = from; n >= target; n--) seq.push(n);

		const strip = document.createElement("span");
		strip.style.position = "absolute";
		strip.style.left = "0";
		strip.style.right = "0";
		strip.style.top = "0";
		strip.style.display = "flex";
		strip.style.flexDirection = "column";
		strip.style.alignItems = "flex-end";
		strip.innerHTML = seq
			.map((n) => `<span style="height:1em;line-height:1">${n}</span>`)
			.join("");
		el.appendChild(strip);

		const lastIndex = seq.length - 1; // target is the last row
		if (reduce) {
			strip.style.transform = `translateY(-${lastIndex}em)`; // show target, no roll
			return;
		}
		// Start showing `from` (row 0), then scroll so `target` (last row) lands.
		strip.style.transition = "none";
		strip.style.transform = "translateY(0)";
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				strip.style.transition = `transform ${DURATION_MS}ms ${EASE}`;
				strip.style.transform = `translateY(-${lastIndex}em)`;
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
