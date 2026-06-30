// Shared category colors used across the Journal, Projects, post headers, and
// the generated OG hero cards so they always agree.

// Journal post categories.
export const BLOG_CATEGORY_COLORS: Record<string, string> = {
	news: '#3b82f6',
	math: '#8b5cf6',
	physics: '#10b981',
	notes: '#f59e0b',
};

export const BLOG_CATEGORY_LABELS: Record<string, string> = {
	news: 'News',
	math: 'Math',
	physics: 'Physics',
	notes: 'Notebook',
};

// Project categories. Technical reuses the Journal "Math" purple; Teaching reuses
// the "Physics" green.
export const PROJECT_CATEGORY_COLORS: Record<string, string> = {
	Technical: '#8b5cf6',
	Teaching: '#10b981',
};
