import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { url } from "./paths";

// Blog posts that should be visible publicly. Drafts (`draft: true`) are excluded
// everywhere — listings, detail routes, OG images, RSS, and search. While the dev
// server is running we keep drafts so you can preview them locally.
export async function getPublishedPosts() {
  const posts = await getCollection("blog");
  if (import.meta.env.DEV) return posts;
  return posts.filter((p) => !p.data.draft);
}

// Same draft convention for projects: hidden in production, kept in dev so you
// can preview work in progress locally.
export async function getPublishedProjects() {
  const projects = await getCollection("projects");
  if (import.meta.env.DEV) return projects;
  return projects.filter((p) => !p.data.draft);
}

// Same draft convention for research entries.
export async function getPublishedResearch() {
  const research = await getCollection("research");
  if (import.meta.env.DEV) return research;
  return research.filter((p) => !p.data.draft);
}

// Where a Journal post's title should link, in one place so every surface (home,
// Journal list, tag pages, RSS) agrees. Four kinds of post:
//   - externalUrl  → link straight to the external article (opens in a new tab)
//   - linkTo       → link to another internal path
//   - noLink       → pointer/update post with no destination at all (href: null)
//   - otherwise    → its own generated detail page at /blog/{id}/
// `href` is already base-prefixed via url(); `external` drives target/rel;
// `hasPage` is false for both noLink and externalUrl/linkTo (no detail page is
// generated for those — see postHasDetailPage).
export type PostLink =
  | { href: string; external: boolean; hasPage: boolean }
  | { href: null; external: false; hasPage: false };

export function postLink(post: CollectionEntry<"blog">): PostLink {
  const { data, id } = post;
  if (data.externalUrl)
    return { href: data.externalUrl, external: true, hasPage: false };
  if (data.linkTo)
    return { href: url(data.linkTo), external: false, hasPage: false };
  if (data.noLink) return { href: null, external: false, hasPage: false };
  return { href: url(`/blog/${id}/`), external: false, hasPage: true };
}

// True only for posts that get a generated detail page under /blog/{id}/.
// Use to gate blog detail routes and their OG images so we never emit a page or
// image for a pointer (externalUrl/linkTo) or link-less (noLink) post.
export function postHasDetailPage(post: CollectionEntry<"blog">): boolean {
  return postLink(post).hasPage;
}
