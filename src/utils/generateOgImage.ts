import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import satori from "satori";
import { html } from "satori-html";
import { Resvg } from "@resvg/resvg-js";

// Vendored Inter (latin) from @fontsource/inter — read once at module load, not
// per image. Previously each OG image fetched Inter from Google Fonts twice
// (~112 network requests across a full build, and the build hard-failed offline
// or if Google's CSS format changed). Satori accepts woff, and the latin subset
// covers every glyph these cards render (ASCII + the punctuation below).
const require = createRequire(import.meta.url);
const readFont = (file: string) =>
  readFileSync(require.resolve(`@fontsource/inter/files/${file}`));
const fontDataRegular = readFont("inter-latin-400-normal.woff");
const fontDataBold = readFont("inter-latin-700-normal.woff");

// A pill badge shown at the top-left of the OG card.
export type OgBadge = { label: string; color?: string };

export async function generateOgImage(
  title: string,
  subtitle: string | OgBadge[],
  badgeColor?: string,
) {
  // Normalize to a list of badges. A plain string → a single white pill
  // (with an optional color override); an array → one pill per entry.
  const badges: OgBadge[] = Array.isArray(subtitle)
    ? subtitle
    : [{ label: subtitle, color: badgeColor }];

  // We interpolate text into a raw HTML string below, so escape angle brackets
  // and ampersands to keep the markup valid.
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const pillMarkup = badges
    .map((b) => {
      const color = b.color ?? "#ffffff";
      const border = b.color ? `${b.color}99` : "rgba(255, 255, 255, 0.2)";
      return `
                <div style="display: flex; align-items: center; padding: 12px 24px; background-color: rgba(255, 255, 255, 0.1); border-radius: 999px; border: 1px solid ${border};">
                    <span style="color: ${color}; font-size: 24px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                        ${esc(b.label)}
                    </span>
                </div>`;
    })
    .join("");

  // Build the full markup as a single string. We call html() with a string
  // (not as a tagged template) so the pill markup isn't HTML-escaped.
  const markupString = `
        <div style="background-color: #0f172a; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; font-family: 'Inter';">

            <div style="display: flex; position: absolute; top: -150px; right: -50px; width: 600px; height: 600px; background-image: linear-gradient(135deg, rgba(56, 189, 248, 0.4), rgba(49, 46, 129, 0)); border-radius: 50%;"></div>
            <div style="display: flex; position: absolute; bottom: -150px; left: -50px; width: 600px; height: 600px; background-image: linear-gradient(45deg, rgba(167, 139, 250, 0.4), rgba(88, 28, 135, 0)); border-radius: 50%;"></div>

            <div style="display: flex; flex-direction: column; justify-content: space-between; padding: 80px; width: 100%; height: 100%;">
                <div style="display: flex; justify-content: flex-start; align-items: flex-start; gap: 16px; width: 100%;">
                    ${pillMarkup}
                </div>

                <div style="display: flex; flex-direction: column; gap: 24px; margin-bottom: 20px;">
                    <div style="display: flex; color: #ffffff; font-size: 84px; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; margin: 0; max-width: 900px; overflow: hidden; max-height: 280px;">
                        ${esc(title)}
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%;">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <span style="color: #94a3b8; font-size: 28px; font-weight: 400;">sejr.me</span>
                        <span style="color: #cbd5e1; font-size: 32px; font-weight: 700;">Sergio Eraso</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: center; width: 80px; height: 80px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    `;
  const markup = html(markupString);

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Inter", data: fontDataRegular, weight: 400, style: "normal" },
      { name: "Inter", data: fontDataBold, weight: 700, style: "normal" },
    ],
  });

  const resvg = new Resvg(svg);
  const pngData = resvg.render();
  return new Uint8Array(pngData.asPng());
}
