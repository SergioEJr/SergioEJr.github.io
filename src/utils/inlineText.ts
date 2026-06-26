import katex from 'katex';

// Inline formatting for frontmatter strings (titles, abstracts, …) that don't go
// through the Markdown pipeline. Supported markup:
//   ~~text~~      → strikethrough
//   $math$        → inline KaTeX   (math option)
//
// Math in these contexts is always inline — display ($$...$$) is intentionally
// not supported; put display equations in the post body instead.
//
// `renderInline` returns safe HTML for visible contexts (use with set:html).
// `stripInline` returns plain text for metadata contexts (<title>, OG image, RSS).
//
// KaTeX output needs the KaTeX stylesheet, which BaseHead.astro loads on every page.

export function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

interface InlineOptions {
	/** Render ~~text~~ as <s>text</s>. Default true. */
	strike?: boolean;
	/** Render $...$ as inline KaTeX. Default false. */
	math?: boolean;
}

export function renderInline(input: string, opts: InlineOptions = {}): string {
	const { strike = true, math = false } = opts;
	if (!math) return applyText(input, strike);

	// Walk the string, KaTeX-rendering inline $...$ spans and escaping the rest.
	let out = '';
	let last = 0;
	const pattern = /\$([^$\n]+?)\$/g;
	let m: RegExpExecArray | null;
	while ((m = pattern.exec(input)) !== null) {
		out += applyText(input.slice(last, m.index), strike);
		try {
			out += katex.renderToString(m[1], { throwOnError: false });
		} catch {
			out += escapeHtml(m[0]);
		}
		last = pattern.lastIndex;
	}
	out += applyText(input.slice(last), strike);
	return out;
}

// Escape a non-math text run, then apply the simple text markers.
function applyText(s: string, strike: boolean): string {
	let html = escapeHtml(s);
	if (strike) html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');
	return html;
}

export function stripInline(input: string): string {
	return input
		.replace(/~~(.+?)~~/g, '$1') // drop strikethrough markers
		.replace(/\$([^$\n]+?)\$/g, '$1'); // drop inline-math delimiters
}
