import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomecheffSeoLanding from "@/components/seo/HomecheffSeoLanding";
import {
  RESERVED_EN_SINGLE_SEGMENTS,
  getAllEnSeoSlugs,
  getSeoAlternateLanguageUrl,
  getSeoCanonicalUrl,
  getSeoPageByEnSlug,
} from "@/lib/seo/homecheffSeoPages";
import { MAIN_DOMAIN } from "@/lib/seo/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllEnSeoSlugs()
    .filter((s) => !RESERVED_EN_SINGLE_SEGMENTS.has(s))
    .map((seoSlug) => ({ seoSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: { seoSlug: string };
}): Promise<Metadata> {
  if (RESERVED_EN_SINGLE_SEGMENTS.has(params.seoSlug)) {
    return { title: "HomeCheff" };
  }
  const page = getSeoPageByEnSlug(params.seoSlug);
  if (!page) {
    return { title: "HomeCheff" };
  }
  const { title, description } = page.en;
  const canonical = getSeoCanonicalUrl(page, "en");
  const nlUrl = getSeoAlternateLanguageUrl(page, "en");
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "nl-NL": nlUrl,
        "en-US": canonical,
        "x-default": `${MAIN_DOMAIN}/`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "HomeCheff",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default function HomeCheffEnSeoPage({
  params,
}: {
  params: { seoSlug: string };
}) {
  if (RESERVED_EN_SINGLE_SEGMENTS.has(params.seoSlug)) notFound();
  const page = getSeoPageByEnSlug(params.seoSlug);
  if (!page) notFound();
  return <HomecheffSeoLanding page={page} locale="en" />;
}
