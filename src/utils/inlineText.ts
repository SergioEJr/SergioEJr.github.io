import katex from "katex";

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

// Site-wide KaTeX macros. Must mirror `katexMacros` in astro.config.mjs so the
// same shorthands work in captions/frontmatter (rendered here) and post bodies
// (rendered by rehype-katex). Keep the two in sync.
// Deliberately empty — see the rationale in astro.config.mjs.
const KATEX_MACROS = {};

// Escape the five HTML-significant characters. Quotes are escaped too so the
// result is safe in attribute contexts (e.g. `title="${escapeHtml(x)}"`), not
// just element content — callers shouldn't have to know which context they're
// in. `&` must be replaced first so the entities it introduces aren't re-escaped.
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
  let out = "";
  let last = 0;
  const pattern = /\$([^$\n]+?)\$/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(input)) !== null) {
    out += applyText(input.slice(last, m.index), strike);
    try {
      out += katex.renderToString(m[1], {
        throwOnError: false,
        macros: KATEX_MACROS,
      });
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
  if (strike) html = html.replace(/~~(.+?)~~/g, "<s>$1</s>");
  return html;
}

export function stripInline(input: string): string {
  return input
    .replace(/~~(.+?)~~/g, "$1") // drop strikethrough markers
    .replace(/\$([^$\n]+?)\$/g, "$1"); // drop inline-math delimiters
}

/**
 * Wrap the final word of `html`, plus `icon`, in a `white-space: nowrap` span
 * so a link icon can never be stranded on its own line by a wrapped title.
 *
 * Every tidier fix fails: an `<svg>` (or a masked inline-block) is an ATOMIC
 * INLINE, and UAX #14 LB20 permits a line break before one even with no
 * whitespace preceding it. A word joiner should prohibit that under LB11, but
 * Chromium breaks anyway. `white-space: nowrap` is unambiguous — nothing inside
 * it can break — so the tail word and the icon travel together while the rest of
 * the title wraps normally.
 *
 * Splits at the last whitespace OUTSIDE a tag, so a title ending in markup
 * (e.g. `…<del>learning</del> grades`) still splits on real text. The caller
 * supplies trusted icon markup; `html` is already-sanitised output of
 * renderInline.
 */
export function bindTrailingIcon(html: string, icon: string): string {
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < html.length; i++) {
    const c = html[i];
    if (c === "<") depth++;
    else if (c === ">") depth--;
    else if (depth === 0 && /\s/.test(c)) cut = i;
  }
  const head = cut >= 0 ? html.slice(0, cut + 1) : "";
  const tail = cut >= 0 ? html.slice(cut + 1) : html;
  return `${head}<span class="j-tail">${tail}${icon}</span>`;
}
