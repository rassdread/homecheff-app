import { MetadataRoute } from "next";
import {
  HOMECHEFF_SEO_PAGE_DEFS,
  getSeoPagePath,
} from "@/lib/seo/homecheffSeoPages";

const BASE_URL = "https://homecheff.eu";

function staticSeoEntries(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return HOMECHEFF_SEO_PAGE_DEFS.flatMap((p) => [
    {
      url: `${BASE_URL}${getSeoPagePath(p, "nl")}`,
      lastModified,
    },
    {
      url: `${BASE_URL}${getSeoPagePath(p, "en")}`,
      lastModified,
    },
  ]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  return [
    {
      url: `${BASE_URL}/`,
      lastModified,
    },
    {
      url: `${BASE_URL}/seo-hub`,
      lastModified,
    },
    {
      url: `${BASE_URL}/en/seo-hub`,
      lastModified,
    },
    {
      url: `${BASE_URL}/growth`,
      lastModified,
    },
    {
      url: `${BASE_URL}/affiliate`,
      lastModified,
    },
    ...staticSeoEntries(),
  ];
}
