// Minimal inline formatting for titles. Titles are frontmatter strings, but we
// occasionally want a touch of markup (e.g. a strikethrough). Supported syntax:
//   ~~text~~  → strikethrough
//
// `titleHtml` returns safe HTML for visible contexts (render with set:html).
// `titlePlain` strips the markers for plain-text contexts (<title>, OG image, RSS).

const escapeHtml = (s: string) =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');

export function titleHtml(title: string): string {
	// Escape first so any stray HTML in the title is inert, then apply our markers.
	return escapeHtml(title).replace(/~~(.+?)~~/g, '<s>$1</s>');
}

export function titlePlain(title: string): string {
	return title.replace(/~~(.+?)~~/g, '$1');
}
