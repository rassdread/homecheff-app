import {
  HOMECHEFF_SEO_PAGE_DEFS,
  getSeoPagePath,
} from "@/lib/seo/homecheffSeoPages";
import { ETEN_VERKOPEN_CITY_SLUGS } from "@/lib/seo/etenVerkopenCities";
import { MAIN_DOMAIN } from "@/lib/seo/metadata";
import { LOCAL_SEO_CITIES } from "@/lib/seo/localCities";
import { CATEGORY_ECOSYSTEM_SLUGS } from "@/lib/community/categoryEcosystemSlugs";

/** Vaste paden (NL marketing + hubs), zonder domein — volgorde = huidige sitemap. */
const EXTRA_STATIC_PATHS: readonly string[] = [
  "/",
  "/seo-hub",
  "/en/seo-hub",
  "/growth",
  "/affiliate",
  "/verdienen-zonder-dropshipping",
  "/lokale-producten-verkopen",
  "/unieke-producten-verkopen",
  "/bezorger-worden",
  "/alternatief-voor-dropshipping",
  "/eten-verkopen-vanuit-huis",
  "/thuisgekookt-eten-verkopen",
  "/bijverdienen-vanuit-huis",
  "/zelfgemaakt-eten-verkopen",
  "/lokaal-eten-verkopen",
  "/faq",
  "/over-ons",
] as const;

function absoluteLoc(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p === "/") return `${MAIN_DOMAIN}/`;
  return `${MAIN_DOMAIN}${p}`;
}

/** Alle <loc>-URL’s in vaste volgorde (geen dubbele loc’s). */
export function collectSitemapLocUrls(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (path: string) => {
    const loc = absoluteLoc(path);
    if (seen.has(loc)) return;
    seen.add(loc);
    out.push(loc);
  };

  for (const path of EXTRA_STATIC_PATHS) {
    push(path);
  }

  for (const stad of ETEN_VERKOPEN_CITY_SLUGS) {
    push(`/eten-verkopen-${stad}`);
  }

  for (const c of LOCAL_SEO_CITIES) {
    push(`/maaltijden/${c.slug}`);
  }

  for (const seg of CATEGORY_ECOSYSTEM_SLUGS) {
    push(`/gemeenschap/${seg}`);
  }

  for (const page of HOMECHEFF_SEO_PAGE_DEFS) {
    push(getSeoPagePath(page, "nl"));
    push(getSeoPagePath(page, "en"));
  }

  return out;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sitemap 0.9 als één compacte string: per url-entry één regel, geen overbodige whitespace in <loc>.
 */
export function buildSitemapXmlDocument(lastModified: Date): string {
  const lastmod = lastModified.toISOString();
  const locs = collectSitemapLocUrls();
  const body = locs
    .map(
      (loc) =>
        `<url><loc>${escapeXml(loc)}</loc><lastmod>${escapeXml(lastmod)}</lastmod></url>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}
