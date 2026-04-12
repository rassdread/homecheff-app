import { MetadataRoute } from "next";
import {
  HOMECHEFF_SEO_PAGE_DEFS,
  getSeoPagePath,
} from "@/lib/seo/homecheffSeoPages";
import { ETEN_VERKOPEN_CITY_SLUGS } from "@/lib/seo/etenVerkopenCities";

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
    {
      url: `${BASE_URL}/verdienen-zonder-dropshipping`,
      lastModified,
    },
    {
      url: `${BASE_URL}/lokale-producten-verkopen`,
      lastModified,
    },
    {
      url: `${BASE_URL}/unieke-producten-verkopen`,
      lastModified,
    },
    {
      url: `${BASE_URL}/bezorger-worden`,
      lastModified,
    },
    {
      url: `${BASE_URL}/alternatief-voor-dropshipping`,
      lastModified,
    },
    {
      url: `${BASE_URL}/eten-verkopen-vanuit-huis`,
      lastModified,
    },
    {
      url: `${BASE_URL}/thuisgekookt-eten-verkopen`,
      lastModified,
    },
    {
      url: `${BASE_URL}/bijverdienen-vanuit-huis`,
      lastModified,
    },
    {
      url: `${BASE_URL}/zelfgemaakt-eten-verkopen`,
      lastModified,
    },
    {
      url: `${BASE_URL}/lokaal-eten-verkopen`,
      lastModified,
    },
    ...ETEN_VERKOPEN_CITY_SLUGS.map((stad) => ({
      url: `${BASE_URL}/eten-verkopen-${stad}`,
      lastModified,
    })),
    ...staticSeoEntries(),
  ];
}
