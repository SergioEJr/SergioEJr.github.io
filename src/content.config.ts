import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

type SchemaContext = { image: () => any };

// Journal posts. `category` drives the color-coded filters on the Journal page;
// `topic` sub-groups posts within the Notes category.
const journal = defineCollection({
  loader: glob({
    base: "./src/content/journal",
    pattern: "**/*.{md,mdx}",
    // Posts are filed on disk by register — essays/, notes/, updates/ — purely
    // so the folder is navigable. That folder must NOT reach the URL: a post's
    // register is mutable metadata (a note can be promoted to an essay) and a
    // permalink shouldn't encode something that can change under it. So the id
    // is the file's basename alone, and every post stays at /journal/<slug>/
    // regardless of which folder it lives in.
    generateId: ({ entry }) =>
      entry
        .split("/")
        .pop()!
        .replace(/\.mdx?$/, ""),
  }),
  schema: ({ image }: SchemaContext) =>
    z.object({
      title: z.string(),
      // OPTIONAL: a post is allowed to stand on its title alone. Some titles are
      // already the whole thought ("My personal philosophy"), and a required
      // field forces a restatement of the title in different words, which is
      // worse than nothing — it's the blurb every listing shows under the title.
      // Everywhere a description is rendered, it is rendered CONDITIONALLY; see
      // the row components, BaseHead's meta tags and rss.xml.ts. In particular
      // the <meta name="description"> is omitted rather than filled with the
      // site's blurb, because a shared generic description across many pages is
      // worse for search than none (the engine will pull a snippet from the body).
      description: z.string().optional(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      // Optional hero shown at the top of the post (off by default). Lives in
      // src/assets/photos/ and is referenced by ROOT-ABSOLUTE path, e.g.
      //   heroImage: /src/assets/photos/my-post.jpg
      // so Astro can optimize it (resize, webp/avif, hashing). Root-absolute
      // rather than relative so a post can be moved between essays/, notes/
      // and updates/ without rewriting every path inside it.
      heroImage: image().optional(),
      authors: z.array(z.string()).optional(),
      toc: z.boolean().optional(),
      keywords: z.array(z.string()).optional(),
      // Journal register: how the reader engages, not the subject.
      //   updates  → timeline (announcements, milestones)
      //   essays   → pop-sci/pop-math, big-picture, accessible
      //   notebook → notes/explainers on a topic, technical → simple
      category: z.enum(["updates", "essays", "notebook"]).default("updates"),
      // Front-page pick: hand-curated posts (essays or notebook) surfaced in
      // the homepage's lead "From the Journal" section. Curation, not recency
      // — the homepage falls back to the newest prose posts only when nothing
      // is flagged. `true` = featured (newest-first among unranked); a NUMBER
      // both features the post and sets its position (1 = first).
      featured: z.union([z.boolean(), z.number()]).default(false),
      topic: z.string().optional(), // groups Notebook posts (Math, Physics, Git, WebDev…)
      subject: z.enum(["Science", "Math", "Ideas"]).optional(), // Essays dot/underline color
      // "Pointer" posts: a Journal entry whose title/description are timeline-friendly
      // and that links straight to a full article instead of rendering its own page.
      // `externalUrl` → off-site link (opens in a new tab);
      // `linkTo` → another page on this site (e.g. /journal/full-post/ or /projects/foo/).
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
  loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    status: z.string().default("Completed"),
    // Drives the Projects page filters and the auto-generated hero-card badge.
    // A project may belong to both groups.
    categories: z
      .array(z.enum(["Technical", "Teaching"]))
      .default(["Technical"]),
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
    // Optional manual override. Projects with an `order` are listed first, in
    // ascending order; everything else falls back to reverse-chronological.
    order: z.number().optional(),
    // Draft projects are excluded from all listings, routes, and OG images.
    // Set `draft: true` while writing; set false (or remove) to publish.
    draft: z.boolean().default(false),
  }),
});

// Research projects. Each has a article-like overview page plus an optional link to
// the paper (arXiv/journal) and a BibTeX entry shown in a dropdown.
const research = defineCollection({
  loader: glob({ base: "./src/content/research", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    venue: z.string().optional(), // e.g. journal / conference / "In preparation"
    abstract: z.string().optional(), // shown in the inline "Abstract" dropdown
    paper: z.string().url().optional(), // external DOI / arXiv link ("Paper" button)
    poster: z.string().optional(), // path to a poster PDF, e.g. /posters/foo.pdf
    code: z.string().url().optional(), // external repo link ("Code" button)
    bibtex: z.string().optional(), // shown in the inline "BibTeX" dropdown
    authors: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    selected: z.boolean().default(false), // featured on the home page
    // Draft entries are excluded from all listings, routes, and OG images.
    // Set `draft: true` while writing; set false (or remove) to publish.
    draft: z.boolean().default(false),
  }),
});

export const collections = { journal, projects, research };
