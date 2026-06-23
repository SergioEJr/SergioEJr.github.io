import { getCollection } from 'astro:content';

// Blog posts that should be visible publicly. Drafts (`draft: true`) are excluded
// everywhere — listings, detail routes, OG images, RSS, and search. While the dev
// server is running we keep drafts so you can preview them locally.
export async function getPublishedPosts() {
	const posts = await getCollection('blog');
	if (import.meta.env.DEV) return posts;
	return posts.filter((p) => !p.data.draft);
}
