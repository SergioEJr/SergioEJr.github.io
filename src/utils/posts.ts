import { getCollection } from 'astro:content';

// Blog posts that should be visible publicly. Drafts (`draft: true`) are excluded
// everywhere — listings, detail routes, OG images, RSS, and search. While the dev
// server is running we keep drafts so you can preview them locally.
export async function getPublishedPosts() {
	const posts = await getCollection('blog');
	if (import.meta.env.DEV) return posts;
	return posts.filter((p) => !p.data.draft);
}

// Same draft convention for projects: hidden in production, kept in dev so you
// can preview work in progress locally.
export async function getPublishedProjects() {
	const projects = await getCollection('projects');
	if (import.meta.env.DEV) return projects;
	return projects.filter((p) => !p.data.draft);
}

// Same draft convention for research entries.
export async function getPublishedResearch() {
	const research = await getCollection('research');
	if (import.meta.env.DEV) return research;
	return research.filter((p) => !p.data.draft);
}
