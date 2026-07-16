import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { stripInline } from '../utils/inlineText';
import { getPublishedPosts, postLink } from '../utils/posts';

export const GET: APIRoute = async (context) => {
	const posts = (await getPublishedPosts())
		// Newest first, with an id tiebreak so same-date posts order stably.
		.sort(
			(a, b) =>
				b.data.pubDate.valueOf() - a.data.pubDate.valueOf() ||
				a.id.localeCompare(b.id),
		);

	const items = posts
		// Drop link-less update posts: they have no destination, so there's nothing
		// to link a feed item to. Pointer posts (externalUrl/linkTo) keep their
		// target link via postLink().
		.filter((post) => postLink(post).href !== null)
		.map((post) => ({
			// Map explicit RSS fields only — spreading post.data would leak non-RSS
			// frontmatter (heroImage ImageMetadata, draft, toc, category…) into items.
			title: stripInline(post.data.title),
			description: stripInline(post.data.description),
			pubDate: post.data.pubDate,
			link: postLink(post).href!,
		}));

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site!,
		items,
	});
};
