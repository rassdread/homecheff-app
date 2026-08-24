import {
  HOMECHEFF_SEO_PAGE_DEFS,
  getSeoPagePath,
} from "@/lib/seo/homecheffSeoPages";
import { ETEN_VERKOPEN_CITY_SLUGS } from "@/lib/seo/etenVerkopenCities";
import { MAIN_DOMAIN } from "@/lib/seo/metadata";
import { LOCAL_SEO_CITIES } from "@/lib/seo/localCities";
import { CATEGORY_ECOSYSTEM_SLUGS } from "@/lib/community/categoryEcosystemSlugs";
import { COMPARISON_PAGE_REGISTRY } from "@/lib/seo/comparison-pages";
import { collectOpenKnowledgePublicPaths } from "@/lib/open-knowledge/docs-registry";
import { collectLivingPlatformPublicPaths } from "@/lib/living-platform/registry";
import { getEcosystemHubForCitySlug } from "@/lib/community/getEcosystemHubForCitySlug";
import { shouldIndexCityHub } from "@/lib/seo/city-indexability";

/** Vaste paden (NL marketing + hubs), zonder domein — volgorde = huidige sitemap. */
const EXTRA_STATIC_PATHS: readonly string[] = [
  "/",
  "/wat-is-homecheff",
  "/hoe-homecheff-werkt",
  "/vergelijken",
  "/persoonlijk-vakmanschap",
  "/ontmoet-de-maker",
  "/lokaal-verdienen",
  "/buurthulp",
  "/buurt-economie",
  "/wat-we-niet-zijn",
  "/sergio-arrias",
  "/oorsprong-homecheff",
  "/waarom-homecheff",
  "/arriassisme",
  "/seo-hub",
  "/en/seo-hub",
  "/affiliate",
  "/ecosystem",
  "/studio",
  "/growth",
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
  "/manifest",
  "/constitution",
  "/llms.txt",
  "/ai.txt",
  "/.well-known/security.txt",
  "/en/what-is-homecheff",
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

  // City meal hubs: only paths that are currently indexable (see shouldIndexCityHub).

  for (const seg of CATEGORY_ECOSYSTEM_SLUGS) {
    push(`/gemeenschap/${seg}`);
  }

  for (const page of COMPARISON_PAGE_REGISTRY) {
    push(page.path);
  }

  for (const path of collectOpenKnowledgePublicPaths()) {
    push(path);
  }

  for (const path of collectLivingPlatformPublicPaths()) {
    push(path);
  }

  for (const page of HOMECHEFF_SEO_PAGE_DEFS) {
    push(getSeoPagePath(page, "nl"));
    push(getSeoPagePath(page, "en"));
  }

  return out;
}

/** Static/marketing paths + only indexable city hubs (SEO 0 — no noindex URLs in sitemap). */
export async function collectSitemapLocUrlsAsync(): Promise<string[]> {
  const base = collectSitemapLocUrls();
  const seen = new Set(base);
  const out = [...base];

  for (const c of LOCAL_SEO_CITIES) {
    const hub = await getEcosystemHubForCitySlug(c.slug);
    if (!shouldIndexCityHub(hub)) continue;
    const loc = absoluteLoc(`/maaltijden/${c.slug}`);
    if (seen.has(loc)) continue;
    seen.add(loc);
    out.push(loc);
  }

  return out;
}

export type SitemapUrlEntry = {
  loc: string;
  lastmod?: string;
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSitemapXmlFromEntries(entries: SitemapUrlEntry[]): string {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : "";
      return `<url><loc>${escapeXml(entry.loc)}</loc>${lastmod}</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

/**
 * Sitemap 0.9 als één compacte string: per url-entry één regel, geen overbodige whitespace in <loc>.
 */
export function buildSitemapXmlDocument(lastModified: Date): string {
  const lastmod = lastModified.toISOString();
  const locs = collectSitemapLocUrls();
  return buildSitemapXmlFromEntries(
    locs.map((loc) => ({ loc, lastmod })),
  );
}

/** SEO 0 — static sitemap with honest city hub inclusion only. */
export async function buildSitemapXmlDocumentAsync(
  lastModified: Date,
): Promise<string> {
  const lastmod = lastModified.toISOString();
  const locs = await collectSitemapLocUrlsAsync();
  return buildSitemapXmlFromEntries(locs.map((loc) => ({ loc, lastmod })));
}
