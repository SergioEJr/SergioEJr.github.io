// Shared category colors used across the Journal, Projects, post headers, and
// the generated OG hero cards so they always agree.

// Journal registers (organize by reader intent, not subject). The color drives
// the Journal header + filter pill. Each has a light/dark value. Keep these in
// sync with the --cat-* / --subj-* CSS vars in global.css (the render-time source
// of truth for theme-flipping).
export const BLOG_CATEGORY_COLORS: Record<string, { light: string; dark: string }> = {
	updates: { light: '#2563eb', dark: '#60a5fa' },
	essays: { light: '#db2777', dark: '#f472b6' },
	notebook: { light: '#d97706', dark: '#fbbf24' },
};

export const BLOG_CATEGORY_LABELS: Record<string, string> = {
	updates: 'Updates',
	essays: 'Essays',
	notebook: 'Notebook',
};

// Essays-only subject accent (dot + title underline), from the post's `subject`
// frontmatter. Falls back to the essays register color when absent/unknown.
export const ESSAY_SUBJECT_COLORS: Record<string, { light: string; dark: string }> = {
	Science: { light: '#0d9488', dark: '#2dd4bf' },
	Math: { light: '#7c3aed', dark: '#a78bfa' },
	Ideas: { light: '#c2410c', dark: '#fb923c' },
};

// Project categories. Technical reuses the Journal "Math" purple; Teaching reuses
// the "Physics" green.
export const PROJECT_CATEGORY_COLORS: Record<string, string> = {
	Technical: '#8b5cf6',
	Teaching: '#10b981',
};
