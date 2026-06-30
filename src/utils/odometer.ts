// A rolling-digit odometer for a small count element. Builds per-digit columns
// whose strips scroll DOWNWARD to land on the target digits, easing to a settle.
// - Honest digits: each column shows 0..9; no random filler.
// - Width reserved via an invisible ghost of the target (trailing text holds).
// - First animated run gated on document.fonts.ready (kills hard-refresh jitter).
// - prefers-reduced-motion: sets the final number instantly, no roll.

const DURATION_MS = 1600;
const EASE = "cubic-bezier(.12,.9,.18,1)"; // strong ease-out settle

export function createOdometer(el: HTMLElement) {
	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	let current = parseInt(el.textContent || "0", 10) || 0;
	let fontsReady = !(document.fonts && document.fonts.ready);
	if (!fontsReady) document.fonts.ready.then(() => (fontsReady = true));

	// The element becomes a flex row of digit columns. tabular-nums for equal width.
	el.style.display = "inline-flex";
	el.style.alignItems = "flex-end";
	el.style.fontVariantNumeric = "tabular-nums";
	el.style.lineHeight = "1";

	function render(target: number) {
		target = Math.max(0, Math.round(target));
		const digits = String(target).split("");
		el.textContent = "";

		digits.forEach((d) => {
			const col = document.createElement("span"); // 1em-tall window
			col.style.height = "1em";
			col.style.overflow = "hidden";
			col.style.display = "inline-block";
			col.style.position = "relative";

			// ghost reserves this column's width
			const ghost = document.createElement("span");
			ghost.textContent = d;
			ghost.style.visibility = "hidden";
			ghost.style.display = "block";

			const strip = document.createElement("span");
			strip.style.position = "absolute";
			strip.style.left = "0";
			strip.style.bottom = "0";
			strip.style.display = "flex";
			strip.style.flexDirection = "column";
			strip.style.alignItems = "center";

			// Strip rows: target at TOP, then 9..0, ending on target at BOTTOM. Start
			// showing the bottom row; animate translateY(0) so it rolls DOWN to the top
			// target row. (Mirrors the brainstormed v6 behavior.)
			const target_d = parseInt(d, 10);
			const rows: number[] = [target_d];
			for (let n = 9; n >= 0; n--) rows.push(n);
			rows.push(target_d);
			strip.innerHTML = rows
				.map((n) => `<span style="height:1em;line-height:1">${n}</span>`)
				.join("");

			col.appendChild(ghost);
			col.appendChild(strip);
			el.appendChild(col);

			if (reduce) {
				strip.style.transform = "translateY(0)"; // rest on top target row
				return;
			}
			const last = rows.length - 1;
			strip.style.transition = "none";
			strip.style.transform = `translateY(-${last}em)`; // start at bottom row
			requestAnimationFrame(() =>
				requestAnimationFrame(() => {
					strip.style.transition = `transform ${DURATION_MS}ms ${EASE}`;
					strip.style.transform = "translateY(0)"; // roll down to target
				}),
			);
		});
	}

	function to(target: number) {
		current = Math.max(0, Math.round(target));
		if (reduce || fontsReady) {
			render(current);
		} else {
			document.fonts.ready.then(() => render(current));
		}
	}

	return { to };
}
