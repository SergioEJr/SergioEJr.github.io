import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { titlePlain } from '../utils/title';
import { getPublishedPosts } from '../utils/posts';

export async function GET(context) {
	const posts = await getPublishedPosts();
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			title: titlePlain(post.data.title),
			// Pointer posts link straight to their target article.
			link: post.data.externalUrl ?? post.data.linkTo ?? `/blog/${post.id}/`,
		})),
	});
}
