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
			heroImage: image().optional(),
			authors: z.array(z.string()).optional(),
			toc: z.boolean().optional(),
			tags: z.array(z.string()).optional(),
			category: z.enum(['news', 'math', 'physics', 'notes']).default('news'),
			topic: z.string().optional(), // used to group Notes posts
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
		bibtex: z.string().optional(),
		authors: z.array(z.string()).default([]),
		tags: z.array(z.string()).default([]),
		selected: z.boolean().default(false), // featured on the home page
		order: z.number().default(0),
	}),
});

export const collections = { blog, projects, research };
