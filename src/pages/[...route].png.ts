import type { APIRoute } from "astro";
import { generateOgImage, type OgBadge } from "../utils/generateOgImage";
import { stripInline } from "../utils/inlineText";
import {
  getPublishedPosts,
  getPublishedProjects,
  getPublishedResearch,
  postHasDetailPage,
} from "../utils/posts";
import { SITE_TITLE, SITE_DESCRIPTION } from "../consts";
import { PROJECT_CATEGORY_COLORS } from "../utils/categories";

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  const projects = await getPublishedProjects();
  const research = await getPublishedResearch();

  // Base static pages
  const staticPages = [
    {
      params: { route: "og" },
      props: { title: SITE_TITLE, subtitle: SITE_DESCRIPTION },
    },
    {
      params: { route: "about" },
      props: { title: "About", subtitle: SITE_TITLE },
    },
    {
      params: { route: "projects" },
      props: { title: "Projects", subtitle: SITE_TITLE },
    },
    {
      params: { route: "research" },
      props: { title: "Publications", subtitle: SITE_TITLE },
    },
    {
      params: { route: "journal" },
      props: { title: "Journal", subtitle: SITE_TITLE },
    },
  ];

  // Dynamic Journal posts — only those with a real detail page. Skips pointer
  // posts (externalUrl/linkTo) AND link-less update posts (noLink), matching
  // the Journal detail route so we never emit an OG image for a page that 404s.
  const journalPages = posts.filter(postHasDetailPage).map((post) => ({
    params: { route: `journal/${post.id}` },
    props: { title: stripInline(post.data.title), subtitle: "Journal" },
  }));

  const projectPages = projects.map((project) => {
    const cats = project.data.categories.length
      ? project.data.categories
      : ["Project"];
    return {
      params: { route: `projects/${project.id}` },
      props: {
        title: project.data.title,
        // One colored pill per category.
        badges: cats.map((c) => ({
          label: c,
          color: PROJECT_CATEGORY_COLORS[c],
        })),
      },
    };
  });

  const researchPages = research.map((entry) => ({
    params: { route: `research/${entry.id}` },
    props: { title: entry.data.title, subtitle: "Research" },
  }));

  return [...staticPages, ...journalPages, ...projectPages, ...researchPages];
}

export const GET: APIRoute = async ({ props }) => {
  const safeTitle = (props.title as string).replace(/&/g, "and");
  const subtitle =
    (props.badges as OgBadge[] | undefined) ?? (props.subtitle as string);
  return new Response(await generateOgImage(safeTitle, subtitle), {
    headers: { "Content-Type": "image/png" },
  });
};
