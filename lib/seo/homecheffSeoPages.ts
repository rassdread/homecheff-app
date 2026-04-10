import type { SeoHubSection, SeoPageDefinition } from "./homecheffSeoTypes";
import { HOMECHEFF_SEO_PAGE_DEFS } from "./homecheffSeoPages.data";
import { MAIN_DOMAIN } from "./metadata";

export type { SeoHubSection, SeoLocaleBlock, SeoPageDefinition } from "./homecheffSeoTypes";
export { HOMECHEFF_SEO_PAGE_DEFS } from "./homecheffSeoPages.data";

/** Secties op /seo-hub en /en/seo-hub */
export const HOMECHEFF_SEO_HUB_SECTIONS: SeoHubSection[] = [
  {
    id: "buy",
    titleNl: "Eten kopen",
    titleEn: "Buying food",
    pageIds: [
      "thuisgekookt-kopen",
      "eten-bij-particulieren",
      "maaltijden-aan-huis",
      "wat-eten-vandaag",
      "gezonde-maaltijden",
      "lokale-producten",
      "alternatief-thuisbezorgd",
    ],
  },
  {
    id: "sell",
    titleNl: "Verkopen vanuit huis",
    titleEn: "Selling from home",
    pageIds: [
      "geld-koken",
      "verkopen-huis",
      "begin-thuiskok",
      "koken-voor-anderen",
      "hobby-koken",
    ],
  },
  {
    id: "explain",
    titleNl: "Uitleg en regels",
    titleEn: "Guides and rules",
    pageIds: ["platform-thuiskoks", "wat-is-thuisgekookt", "regels-verkopen"],
  },
  {
    id: "local",
    titleNl: "Lokale pagina’s",
    titleEn: "Local pages",
    pageIds: [
      "meals-rotterdam",
      "meals-amsterdam",
      "meals-den-haag",
      "meals-utrecht",
      "meals-eindhoven",
    ],
  },
];

const byNl = new Map(
  HOMECHEFF_SEO_PAGE_DEFS.map((p) => [p.nlSlug, p])
);
const byEn = new Map(
  HOMECHEFF_SEO_PAGE_DEFS.map((p) => [p.enSlug, p])
);
const byId = new Map(HOMECHEFF_SEO_PAGE_DEFS.map((p) => [p.id, p]));

export function getSeoPageByNlSlug(
  slug: string
): SeoPageDefinition | undefined {
  return byNl.get(slug);
}

export function getSeoPageByEnSlug(
  slug: string
): SeoPageDefinition | undefined {
  return byEn.get(slug);
}

export function getSeoPageById(id: string): SeoPageDefinition | undefined {
  return byId.get(id);
}

/** Pad op de site (NL root of /en/...). */
export function getSeoPagePath(
  page: SeoPageDefinition,
  locale: "nl" | "en"
): string {
  return locale === "nl" ? `/${page.nlSlug}` : `/en/${page.enSlug}`;
}

/**
 * Canonieke URL op het officiële domein homecheff.eu (NL- en EN-routes).
 * homecheff.nl redirect naar .eu en is geen canonieke basis voor SEO.
 */
export function getSeoCanonicalUrl(
  page: SeoPageDefinition,
  locale: "nl" | "en"
): string {
  return `${MAIN_DOMAIN}${getSeoPagePath(page, locale)}`;
}

/** hreflang-URL voor de andere taalvariant, altijd op .eu. */
export function getSeoAlternateLanguageUrl(
  page: SeoPageDefinition,
  locale: "nl" | "en"
): string {
  const other: "nl" | "en" = locale === "nl" ? "en" : "nl";
  return getSeoCanonicalUrl(page, other);
}

export const SEO_HUB_CANONICAL_NL = `${MAIN_DOMAIN}/seo-hub`;
export const SEO_HUB_CANONICAL_EN = `${MAIN_DOMAIN}/en/seo-hub`;

export function getSeoAlternateUrl(
  page: SeoPageDefinition,
  locale: "nl" | "en"
): string {
  return getSeoAlternateLanguageUrl(page, locale);
}

export type RelatedSeoLink = { href: string; title: string };

/**
 * Gerelateerde SEO-pagina's voor interne links (standaard 3).
 */
export function getRelatedHomecheffSeoPages(
  page: SeoPageDefinition,
  locale: "nl" | "en",
  max = 3
): RelatedSeoLink[] {
  const block = locale === "nl" ? page.nl : page.en;
  const out: RelatedSeoLink[] = [];
  for (const rid of page.relatedIds) {
    if (out.length >= max) break;
    const rel = byId.get(rid);
    if (!rel || rel.id === page.id) continue;
    out.push({
      href: getSeoPagePath(rel, locale),
      title: (locale === "nl" ? rel.nl : rel.en).h1,
    });
  }
  return out;
}

export function getAllNlSeoSlugs(): string[] {
  return HOMECHEFF_SEO_PAGE_DEFS.map((p) => p.nlSlug);
}

export function getAllEnSeoSlugs(): string[] {
  return HOMECHEFF_SEO_PAGE_DEFS.map((p) => p.enSlug);
}

/** Gereserveerd onder /en/* (bestaande routes). */
export const RESERVED_EN_SINGLE_SEGMENTS = new Set(["welkom"]);
