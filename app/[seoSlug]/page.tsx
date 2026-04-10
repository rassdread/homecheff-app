import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomecheffSeoLanding from "@/components/seo/HomecheffSeoLanding";
import {
  getAllNlSeoSlugs,
  getSeoAlternateLanguageUrl,
  getSeoCanonicalUrl,
  getSeoPageByNlSlug,
} from "@/lib/seo/homecheffSeoPages";
import { MAIN_DOMAIN } from "@/lib/seo/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllNlSeoSlugs().map((seoSlug) => ({ seoSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: { seoSlug: string };
}): Promise<Metadata> {
  const page = getSeoPageByNlSlug(params.seoSlug);
  if (!page) {
    return { title: "HomeCheff" };
  }
  const { title, description } = page.nl;
  const canonical = getSeoCanonicalUrl(page, "nl");
  const enUrl = getSeoAlternateLanguageUrl(page, "nl");
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "nl-NL": canonical,
        "en-US": enUrl,
        "x-default": `${MAIN_DOMAIN}/`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "HomeCheff",
      locale: "nl_NL",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default function HomeCheffNlSeoPage({
  params,
}: {
  params: { seoSlug: string };
}) {
  const page = getSeoPageByNlSlug(params.seoSlug);
  if (!page) notFound();
  return <HomecheffSeoLanding page={page} locale="nl" />;
}
