/**
 * Programmeerbare SEO-landingspagina’s: bron in `seoLandingSources.ts`,
 * merge in `/api/i18n/[lang]` zodat `t("cookingEarningPage.title")` enz. werkt met de taalwisselaar.
 */

import {
  PROGRAMMATIC_PAGE_SOURCES,
  SEO_HUB_PROGRAMMATIC,
  type Bi,
} from "@/lib/i18n/seoLandingSources";

type LangCode = "nl" | "en";

function pickLang(lang: string): LangCode {
  return lang === "en" ? "en" : "nl";
}

function flattenBiSource(
  src: Record<string, Bi>,
  lang: string
): Record<string, string> {
  const L = pickLang(lang);
  const out: Record<string, string> = {};
  for (const [key, bi] of Object.entries(src)) {
    out[key] = bi[L];
  }
  return out;
}

/** Alle programmeerbare SEO-namespaces in één i18n-response (nl/en). */
export function mergeProgrammaticI18n(
  json: Record<string, unknown>,
  lang: string
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...json };
  for (const [ns, src] of Object.entries(PROGRAMMATIC_PAGE_SOURCES)) {
    out[ns] = flattenBiSource(src, lang);
  }
  return out;
}

/** @deprecated gebruik mergeProgrammaticI18n — alias voor API-compat. */
export function mergeHomeEarningIntoI18n(
  json: Record<string, unknown>,
  lang: string
): Record<string, unknown> {
  return mergeProgrammaticI18n(json, lang);
}

export function getProgrammaticSeoMeta(
  namespace: string,
  lang: string
): { title: string; description: string } {
  const src = PROGRAMMATIC_PAGE_SOURCES[namespace];
  if (!src?.metaTitle || !src?.metaDescription) {
    throw new Error(`getProgrammaticSeoMeta: unknown or incomplete namespace "${namespace}"`);
  }
  const L = pickLang(lang);
  return {
    title: src.metaTitle[L],
    description: src.metaDescription[L],
  };
}

export function getHomeEarningPageMeta(lang: string) {
  return getProgrammaticSeoMeta("homeEarningPage", lang);
}

export function getSeoHubProgrammaticSection(locale: "nl" | "en"): {
  title: string;
  links: { href: string; label: string }[];
} {
  const L = pickLang(locale);
  return {
    title: SEO_HUB_PROGRAMMATIC.sectionTitle[L],
    links: SEO_HUB_PROGRAMMATIC.links.map((item) => ({
      href: item.href,
      label: item.label[L],
    })),
  };
}
