// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "Sergio Eraso";
export const SITE_DESCRIPTION =
  "Sergio Eraso — physicist working on nonequilibrium statistical physics and biophysics, building models, simulations, and tools for complex systems.";

// Short tagline shown in the footer (kept separate so it doesn't repeat the name).
export const SITE_TAGLINE =
  '"What is not surrounded by uncertainty cannot be the truth." ~ Feynman';

// Link to a CV/resume PDF. The button (footer + navbar icon) only appears once
// the file actually exists at public/resume.pdf (see src/utils/cv.ts).
export const CV_URL = "/resume_public.pdf";

export const CONTACT = {
  organization: "Sergio Eraso",
  addressLines: ["Department of Physics, MIT", "Cambridge, MA"],
  emails: ["sergioerasojr@gmail.com"],
};

// "Suggest a topic" — the last pill in the Journal's Notebook topic strip. The
// site is static (GitHub Pages), so there is nothing to POST to; a prefilled
// mailto needs no backend, no third-party form service, and no account on the
// reader's part, and the address is already public in the footer.
//
// The body is guidance the sender deletes, so it stays short and lowers the bar
// rather than reading like a form. Newlines are real here and get percent-
// encoded below — do not collapse them.
export const TOPIC_REQUEST_SUBJECT = "Notebook topic suggestion";
export const TOPIC_REQUEST_BODY = `Hi Sergio,

I'd like to see you write a note about:

(A sentence is plenty. If something specific tripped you up,
I would love to hear about it.)`;

export const TOPIC_REQUEST_MAILTO =
  `mailto:${CONTACT.emails[0]}` +
  `?subject=${encodeURIComponent(TOPIC_REQUEST_SUBJECT)}` +
  `&body=${encodeURIComponent(TOPIC_REQUEST_BODY)}`;

export type SocialIcon =
  "website" | "scholar" | "email" | "github" | "linkedin" | "twitter";

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
