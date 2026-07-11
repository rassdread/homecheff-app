/**
 * Programmeerbare SEO-landingspagina’s: bron in `seoLandingSources.ts`,
 * merge in `/api/i18n/[lang]` zodat `t("cookingEarningPage.title")` enz. werkt met de taalwisselaar.
 */

import {
  PROGRAMMATIC_PAGE_SOURCES,
  SEO_HUB_PROGRAMMATIC_SECTIONS,
  type Bi,
} from "@/lib/i18n/seoLandingSources";
import {
  PILLAR_HUB_SECTION,
  PILLAR_PAGE_SOURCES,
} from "@/lib/i18n/pillarPageSources";
import { COMPARISON_PAGE_SOURCES } from "@/lib/i18n/comparisonPageSources";
import { ECOSYSTEM_MAP_SOURCES } from "@/lib/i18n/ecosystemMapSources";
import { MANIFEST_PAGE_SOURCES } from "@/lib/i18n/manifestPageSources";
import { OPEN_KNOWLEDGE_SOURCES } from "@/lib/i18n/openKnowledgeSources";
import { LIVING_PLATFORM_SOURCES } from "@/lib/i18n/livingPlatformSources";
import { OPERATING_SYSTEM_PAGE_SOURCES } from "@/lib/i18n/operatingSystemSources";
import { FOOD_CATEGORY_CONTEXT_SOURCES } from "@/lib/i18n/foodCategoryContextSources";

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
  for (const [ns, src] of Object.entries(PILLAR_PAGE_SOURCES)) {
    out[ns] = flattenBiSource(src, lang);
  }
  for (const [ns, src] of Object.entries(COMPARISON_PAGE_SOURCES)) {
    out[ns] = flattenBiSource(src, lang);
  }
  for (const [ns, src] of Object.entries(ECOSYSTEM_MAP_SOURCES)) {
    out[ns] = flattenBiSource(src, lang);
  }
  for (const [ns, src] of Object.entries(MANIFEST_PAGE_SOURCES)) {
    out[ns] = flattenBiSource(src, lang);
  }
  for (const [ns, src] of Object.entries(OPEN_KNOWLEDGE_SOURCES)) {
    out[ns] = flattenBiSource(src, lang);
  }
  for (const [ns, src] of Object.entries(LIVING_PLATFORM_SOURCES)) {
    out[ns] = flattenBiSource(src, lang);
  }
  for (const [ns, src] of Object.entries(OPERATING_SYSTEM_PAGE_SOURCES)) {
    out[ns] = flattenBiSource(src, lang);
  }
  for (const [ns, src] of Object.entries(FOOD_CATEGORY_CONTEXT_SOURCES)) {
    out[ns] = flattenBiSource(src, lang);
  }
  return out;
}

export function getPillarSeoMeta(
  namespace: string,
  lang: string,
): { title: string; description: string } {
  const src = PILLAR_PAGE_SOURCES[namespace];
  if (!src?.metaTitle || !src?.metaDescription) {
    throw new Error(`getPillarSeoMeta: unknown namespace "${namespace}"`);
  }
  const L = pickLang(lang);
  return {
    title: src.metaTitle[L],
    description: src.metaDescription[L],
  };
}

export function getPillarHubSection(locale: "nl" | "en"): {
  title: string;
  links: { href: string; label: string }[];
} {
  const L = pickLang(locale);
  return {
    title: PILLAR_HUB_SECTION.sectionTitle[L],
    links: PILLAR_HUB_SECTION.links.map((item) => ({
      href: item.href,
      label: item.label[L],
    })),
  };
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
