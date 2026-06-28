// Page transitions are intentionally INSTANT (no cross-fade). A fading swap
// leaves a window where the view-transition snapshots composite against the
// browser's default white base, causing a whole-page white flash on navigation
// in every browser. A zero-duration animation makes the swap happen in one frame
// with no flash. `transition:animate={pageFade}` stays on each <main> so its
// view-transition naming/scoping is preserved — it just doesn't animate.
// (global.css also forces ::view-transition-* { animation: none } as a backstop.)
const instant = {
	old: { name: 'none', duration: 0, easing: 'linear', fillMode: 'both' },
	new: { name: 'none', duration: 0, easing: 'linear', fillMode: 'both' },
};

export const pageFade = {
	forwards: instant,
	backwards: instant,
};
