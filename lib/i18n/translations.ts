/**
 * Programmeerbare SEO-landingspagina’s: bron in `seoLandingSources.ts`,
 * merge in `/api/i18n/[lang]` zodat `t("cookingEarningPage.title")` enz. werkt met de taalwisselaar.
 */

import {
  PROGRAMMATIC_PAGE_SOURCES,
  SEO_HUB_PROGRAMMATIC_SECTIONS,
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

function applyVars(s: string, vars?: Record<string, string>): string {
  if (!vars) return s;
  let out = s;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

export function getProgrammaticSeoMeta(
  namespace: string,
  lang: string,
  vars?: Record<string, string>
): { title: string; description: string } {
  const src = PROGRAMMATIC_PAGE_SOURCES[namespace];
  if (!src?.metaTitle || !src?.metaDescription) {
    throw new Error(`getProgrammaticSeoMeta: unknown or incomplete namespace "${namespace}"`);
  }
  const L = pickLang(lang);
  return {
    title: applyVars(src.metaTitle[L], vars),
    description: applyVars(src.metaDescription[L], vars),
  };
}

export function getHomeEarningPageMeta(lang: string) {
  return getProgrammaticSeoMeta("homeEarningPage", lang);
}

export function getSeoHubProgrammaticSections(locale: "nl" | "en"): {
  title: string;
  links: { href: string; label: string }[];
}[] {
  const L = pickLang(locale);
  return SEO_HUB_PROGRAMMATIC_SECTIONS.map((section) => ({
    title: section.sectionTitle[L],
    links: section.links.map((item) => ({
      href: item.href,
      label: item.label[L],
    })),
  }));
}

/** @deprecated Gebruik getSeoHubProgrammaticSections. */
export function getSeoHubProgrammaticSection(locale: "nl" | "en") {
  const all = getSeoHubProgrammaticSections(locale);
  return {
    title: all[0]?.title ?? "",
    links: all.flatMap((s) => s.links),
  };
}
