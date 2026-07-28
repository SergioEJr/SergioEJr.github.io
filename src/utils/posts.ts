import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { url } from "./paths";

// Journal posts that should be visible publicly. Drafts (`draft: true`) are excluded
// everywhere — listings, detail routes, OG images, RSS, and search. While the dev
// server is running we keep drafts so you can preview them locally.
export async function getPublishedPosts() {
  const posts = await getCollection("journal");
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
//   - otherwise    → its own generated detail page at /journal/{id}/
// `href` is already base-prefixed via url(); `external` drives target/rel;
// `hasPage` is false for both noLink and externalUrl/linkTo (no detail page is
// generated for those — see postHasDetailPage).
export type PostLink =
  | { href: string; external: boolean; hasPage: boolean }
  | { href: null; external: false; hasPage: false };

export function postLink(post: CollectionEntry<"journal">): PostLink {
  const { data, id } = post;
  if (data.externalUrl)
    return { href: data.externalUrl, external: true, hasPage: false };
  if (data.linkTo)
    return { href: url(data.linkTo), external: false, hasPage: false };
  if (data.noLink) return { href: null, external: false, hasPage: false };
  return { href: url(`/journal/${id}/`), external: false, hasPage: true };
}

// True only for posts that get a generated detail page under /journal/{id}/.
// Use to gate Journal detail routes and their OG images so we never emit a page or
// image for a pointer (externalUrl/linkTo) or link-less (noLink) post.
export function postHasDetailPage(post: CollectionEntry<"journal">): boolean {
  return postLink(post).hasPage;
}

// Rough read time in minutes, from the raw Markdown body, for the Journal's
// essay rows. Returns null when there's no usable body — pointer/link-less posts
// carry no prose, and stub bodies (a placeholder line or two) would otherwise
// advertise a misleading "1 min read". Code fences, math, HTML/JSX tags, and
// link URLs are stripped first so they don't inflate the count.
const WORDS_PER_MINUTE = 200;
const MIN_WORDS_FOR_READ_TIME = 60;

export function readingMinutes(
  post: CollectionEntry<"journal">,
): number | null {
  const body = post.body;
  if (!body) return null;
  const prose = body
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/`[^`\n]*`/g, " ") // inline code
    .replace(/\$\$[\s\S]*?\$\$/g, " ") // display math
    .replace(/\$[^$\n]*\$/g, " ") // inline math
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → their text
    .replace(/<[^>]+>/g, " ") // HTML / JSX tags
    .replace(/^\s*(import|export)\s.+$/gm, " ") // MDX module lines
    .replace(/[#>*_~`|-]+/g, " "); // Markdown punctuation
  const words = prose.split(/\s+/).filter(Boolean).length;
  if (words < MIN_WORDS_FOR_READ_TIME) return null;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

// Host of an external pointer post, e.g. "emorywheel.com" — shown in the
// Journal's essay meta line in place of a read time, since the piece lives
// somewhere else. Null for every non-external post.
export function externalHost(post: CollectionEntry<"journal">): string | null {
  const href = post.data.externalUrl;
  if (!href) return null;
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
