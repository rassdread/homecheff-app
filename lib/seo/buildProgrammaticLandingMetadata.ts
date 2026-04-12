import type { Metadata } from "next";
import {
  getCurrentDomain,
  getCurrentLanguage,
  seoHreflangLanguagesOnEu,
} from "@/lib/seo/metadata";
import { getProgrammaticSeoMeta } from "@/lib/i18n/translations";

export async function buildProgrammaticLandingMetadata(
  path: string,
  namespace: string,
  vars?: Record<string, string>
): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const { title, description } = getProgrammaticSeoMeta(namespace, lang, vars);
  const currentDomain = await getCurrentDomain();
  const canonical = `${currentDomain}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: seoHreflangLanguagesOnEu(path),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "HomeCheff",
      locale: lang === "en" ? "en_US" : "nl_NL",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}
