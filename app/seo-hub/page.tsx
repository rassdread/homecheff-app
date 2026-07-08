import type { Metadata } from "next";
import HomecheffSeoHub from "@/components/seo/HomecheffSeoHub";
import {
  SEO_HUB_CANONICAL_EN,
  SEO_HUB_CANONICAL_NL,
} from "@/lib/seo/homecheffSeoPages";
import { MAIN_DOMAIN } from "@/lib/seo/metadata";

const title = "Onderwerpen en gidsen | HomeCheff";
const description =
  "Gidsen over lokaal aanbieden en ontdekken: eten, tuin, creaties, diensten, ruil en community — alle onderwerpen op HomeCheff.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: SEO_HUB_CANONICAL_NL,
    languages: {
      "nl-NL": SEO_HUB_CANONICAL_NL,
      "en-US": SEO_HUB_CANONICAL_EN,
      "x-default": `${MAIN_DOMAIN}/`,
    },
  },
  openGraph: {
    title,
    description,
    url: SEO_HUB_CANONICAL_NL,
    siteName: "HomeCheff",
    locale: "nl_NL",
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export default function SeoHubNlPage() {
  return <HomecheffSeoHub locale="nl" />;
}
