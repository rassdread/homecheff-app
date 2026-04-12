import Link from "next/link";
import Script from "next/script";
import { ArrowLeft } from "lucide-react";
import {
  HOMECHEFF_SEO_HUB_SECTIONS,
  SEO_HUB_CANONICAL_EN,
  SEO_HUB_CANONICAL_NL,
  getSeoPageById,
  getSeoPagePath,
} from "@/lib/seo/homecheffSeoPages";
import { MAIN_DOMAIN } from "@/lib/seo/metadata";
import { getSeoHubProgrammaticSection } from "@/lib/i18n/translations";

export default function HomecheffSeoHub({ locale }: { locale: "nl" | "en" }) {
  const isNl = locale === "nl";
  const canonical = isNl ? SEO_HUB_CANONICAL_NL : SEO_HUB_CANONICAL_EN;
  const otherHub = isNl ? "/en/seo-hub" : "/seo-hub";
  const programmatic = getSeoHubProgrammaticSection(locale);

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: isNl ? "Onderwerpen en gidsen | HomeCheff" : "Guides and topics | HomeCheff",
    description: isNl
      ? "Overzicht van HomeCheff-gidsen: eten kopen, verkopen, uitleg en lokale pagina’s."
      : "Overview of HomeCheff guides: buying, selling, explainers, and local pages.",
    url: canonical,
    inLanguage: isNl ? "nl-NL" : "en-US",
    isPartOf: { "@type": "WebSite", name: "HomeCheff", url: MAIN_DOMAIN },
  };

  return (
    <>
      <Script
        id="seo-hub-webpage-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
      />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <div className="container mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
          <Link
            href="/"
            className="mb-8 inline-flex items-center text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            {isNl ? "Terug naar home" : "Back to home"}
          </Link>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {isNl ? "Onderwerpen en gidsen" : "Guides and topics"}
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            {isNl
              ? "Kies een onderwerp om meer te lezen over kopen, verkopen en lokaal eten op HomeCheff."
              : "Pick a topic to read more about buying, selling, and local food on HomeCheff."}
          </p>

          <div className="mt-10 space-y-12">
            {HOMECHEFF_SEO_HUB_SECTIONS.map((section) => (
              <section key={section.id}>
                <h2 className="text-xl font-semibold text-gray-900">
                  {isNl ? section.titleNl : section.titleEn}
                </h2>
                <ul className="mt-4 space-y-2 text-emerald-800">
                  {section.pageIds.map((id) => {
                    const p = getSeoPageById(id);
                    if (!p) return null;
                    const path = getSeoPagePath(p, locale);
                    const title = (isNl ? p.nl : p.en).h1;
                    return (
                      <li key={id}>
                        <Link href={path} className="hover:underline">
                          {title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                {programmatic.title}
              </h2>
              <ul className="mt-4 space-y-2 text-emerald-800">
                {programmatic.links.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mt-14 border-t border-gray-200 pt-8 text-sm text-gray-600">
            <p>
              {isNl ? "Engelse versie:" : "Dutch version:"}{" "}
              <Link href={otherHub} className="font-medium text-emerald-700 hover:underline">
                {isNl ? "Guides (English)" : "Gidsen (Nederlands)"}
              </Link>
            </p>
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              <Link href="/dorpsplein" className="text-emerald-700 hover:underline">
                {isNl ? "Dorpsplein" : "Village square"}
              </Link>
              <Link href="/sell" className="text-emerald-700 hover:underline">
                {isNl ? "Verkopen" : "Sell"}
              </Link>
              <Link href="/contact" className="text-emerald-700 hover:underline">
                Contact
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
