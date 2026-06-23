import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

type SchemaContext = { image: () => any };

// Journal posts. `category` drives the color-coded filters on the Journal page;
// `topic` sub-groups posts within the Notes category.
const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }: SchemaContext) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			// Optional hero shown at the top of the post (off by default). Lives in
			// src/assets/blog/ and is referenced relative to the post file, e.g.
			//   heroImage: ../../assets/blog/my-post.jpg
			// so Astro can optimize it (resize, webp/avif, hashing).
			heroImage: image().optional(),
			authors: z.array(z.string()).optional(),
			toc: z.boolean().optional(),
			tags: z.array(z.string()).optional(),
			category: z.enum(['news', 'math', 'physics', 'notes']).default('news'),
			topic: z.string().optional(), // used to group Notes posts
			// "Pointer" posts: a Journal entry whose title/description are timeline-friendly
			// and that links straight to a full article instead of rendering its own page.
			// `externalUrl` → off-site link (opens in a new tab);
			// `linkTo` → another page on this site (e.g. /blog/full-post/ or /projects/foo/).
			// Leave both unset for a normal standalone post with its own detail page.
			externalUrl: z.string().url().optional(),
			linkTo: z.string().optional(),
			// Link-less "update" posts: shown in the Journal timeline as just a
			// title + description (e.g. a short News update). No link is rendered
			// and no detail page is generated. Any body text is ignored.
			noLink: z.boolean().default(false),
			// Draft posts are excluded from all listings, routes, feeds, and search.
			// Set `draft: true` while writing; remove it (or set false) to publish.
			draft: z.boolean().default(false),
		}),
});

// Personal/technical projects. Each renders a detail page; the body can use
// Markdown/MDX with math, code, images, and components.
const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		date: z.coerce.date(),
		status: z.string().default('Completed'),
		// Drives the Projects page filters and the auto-generated hero-card badge.
		// A project may belong to both groups.
		categories: z.array(z.enum(['Technical', 'Teaching'])).default(['Technical']),
		// Optional custom thumbnail for the Projects listing card (path under
		// /public, e.g. /projects/foo.jpeg). When set, it replaces the
		// auto-generated hero card, with the category pills overlaid on top.
		image: z.string().optional(),
		// Optional image shown at the top of the project's article page (no
		// overlay, nothing by default). Same /public path convention.
		articleImage: z.string().optional(),
		tags: z.array(z.string()).default([]),
		repo: z.string().url().optional(),
		link: z.string().url().optional(),
		featured: z.boolean().default(false),
		order: z.number().default(0),
	}),
});

// Research projects. Each has a blog-like overview page plus an optional link to
// the paper (arXiv/journal) and a BibTeX entry shown in a dropdown.
const research = defineCollection({
	loader: glob({ base: './src/content/research', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		date: z.coerce.date(),
		venue: z.string().optional(), // e.g. journal / conference / "In preparation"
		paper: z.string().url().optional(), // arXiv or journal link
		poster: z.string().optional(), // path to a poster PDF in the repo, e.g. /posters/foo.pdf
		bibtex: z.string().optional(),
		authors: z.array(z.string()).default([]),
		tags: z.array(z.string()).default([]),
		selected: z.boolean().default(false), // featured on the home page
		order: z.number().default(0),
	}),
});

export const collections = { blog, projects, research };
