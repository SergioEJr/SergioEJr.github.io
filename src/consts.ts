// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "Sergio Eraso";
export const SITE_DESCRIPTION =
  "Sergio Eraso — physicist working on nonequilibrium statistical physics and biophysics, building models, simulations, and tools for complex systems.";

// Short tagline shown in the footer (kept separate so it doesn't repeat the name).
export const SITE_TAGLINE =
  '"What is not surrounded by uncertainty cannot be the truth" ~ Feynman';

// Link to a CV/resume PDF. The button (footer + navbar icon) only appears once
// the file actually exists at public/resume.pdf (see src/utils/cv.ts).
export const CV_URL = "/resume_public.pdf";

export const CONTACT = {
  organization: "Sergio Eraso",
  addressLines: ["Department of Physics, MIT", "Cambridge, MA"],
  emails: ["sergioerasojr@gmail.com"],
};

export type SocialIcon =
  | "website"
  | "scholar"
  | "email"
  | "github"
  | "linkedin"
  | "twitter";

export const SOCIAL_LINKS: ReadonlyArray<{
  label: string;
  href: string;
  icon: SocialIcon;
}> = [
  {
    label: "GitHub",
    href: "https://github.com/SergioEJr",
    icon: "github",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/sergio-eraso-jr/",
    icon: "linkedin",
  },
  {
    label: "Email",
    href: "mailto:sergioerasojr@gmail.com",
    icon: "email",
  },
];

// Credit to the theme author (astro-scholar by Shravan Goswami). Please keep.
export const FOOTER_CREDIT = {
  designerName: "Shravan Goswami",
  designerUrl: "https://shravangoswami.com",
  sourceLabel: "Astro Scholar",
  sourceUrl: "https://github.com/shravanngoswamii/astro-scholar",
};

// Umami analytics — disabled unless PUBLIC_UMAMI_WEBSITE_ID is set.
export const UMAMI_SRC =
  import.meta.env.PUBLIC_UMAMI_SRC ?? "https://cloud.umami.is/script.js";
export const UMAMI_WEBSITE_ID = import.meta.env.PUBLIC_UMAMI_WEBSITE_ID ?? "";
