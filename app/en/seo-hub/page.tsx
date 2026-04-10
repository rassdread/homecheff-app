import type { Metadata } from "next";
import HomecheffSeoHub from "@/components/seo/HomecheffSeoHub";
import {
  SEO_HUB_CANONICAL_EN,
  SEO_HUB_CANONICAL_NL,
} from "@/lib/seo/homecheffSeoPages";
import { MAIN_DOMAIN } from "@/lib/seo/metadata";

const title = "Guides and topics | HomeCheff";
const description =
  "Guides on buying home-cooked food, selling from home, local makers, and rules — all HomeCheff topics in one place.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: SEO_HUB_CANONICAL_EN,
    languages: {
      "nl-NL": SEO_HUB_CANONICAL_NL,
      "en-US": SEO_HUB_CANONICAL_EN,
      "x-default": `${MAIN_DOMAIN}/`,
    },
  },
  openGraph: {
    title,
    description,
    url: SEO_HUB_CANONICAL_EN,
    siteName: "HomeCheff",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export default function SeoHubEnPage() {
  return <HomecheffSeoHub locale="en" />;
}
