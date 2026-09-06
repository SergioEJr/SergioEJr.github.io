// Shared category colors used across the Journal, Projects, post headers, and
// the generated OG hero cards so they always agree.

// Journal registers (organize by reader intent, not subject). The color drives
// the Journal header + filter pill. Each has a light/dark value. Keep these in
// sync with the --cat-* / --subj-* CSS vars in global.css (the render-time source
// of truth for theme-flipping).
export const BLOG_CATEGORY_COLORS: Record<
  string,
  { light: string; dark: string }
> = {
  updates: { light: "#2b4c7e", dark: "#60a5fa" },
  essays: { light: "#b0246f", dark: "#f472b6" },
  notebook: { light: "#8f560c", dark: "#f59e0b" },
};

export const BLOG_CATEGORY_LABELS: Record<string, string> = {
  updates: "Updates",
  essays: "Essays",
  notebook: "Notebook",
};

// Essays-only subject accent (dot + title underline), from the post's `subject`
// frontmatter. Falls back to the essays register color when absent/unknown.
export const ESSAY_SUBJECT_COLORS: Record<
  string,
  { light: string; dark: string }
> = {
  Science: { light: "#1d6b62", dark: "#2dd4bf" },
  Math: { light: "#5a3d9c", dark: "#a78bfa" },
  Ideas: { light: "#a34a15", dark: "#fb923c" },
};

// Project categories (Technical / Teaching). Technical echoes the Math purple,
// Teaching the Science teal, so they read as part of the site palette.
//
// The Projects PAGE uses theme-flipping CSS vars (defined in global.css) so the
// pill/hover colors adapt to light/dark and meet WCAG AA in every context. Use
// PROJECT_CATEGORY_VARS there (a `var(--proj-*)` reference).
export const PROJECT_CATEGORY_VARS: Record<string, string> = {
  Technical: "var(--proj-technical)",
  Teaching: "var(--proj-teaching)",
};

// Card badges sit on a dark photo overlay in both themes, so they always use the
// pastel variant (legible on dark) rather than the theme-flipping pill color.
export const PROJECT_CATEGORY_BADGE_VARS: Record<string, string> = {
  Technical: "var(--proj-technical-badge)",
  Teaching: "var(--proj-teaching-badge)",
};

// The OG image route can't resolve CSS vars (satori renders to a static PNG on a
// fixed dark card), so it needs concrete hexes. The OG card ground is dark, so we
// use the PASTEL variants — the same ones the card badges use — which are legible
// on it. Keep both maps in sync with the --proj-* vars in global.css.
export const PROJECT_CATEGORY_COLORS: Record<string, string> = {
  Technical: "#a78bfa",
  Teaching: "#2dd4bf",
};
