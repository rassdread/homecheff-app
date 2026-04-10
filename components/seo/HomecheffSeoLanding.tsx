import Link from "next/link";
import Script from "next/script";
import { ArrowLeft } from "lucide-react";
import type { SeoPageDefinition } from "@/lib/seo/homecheffSeoPages";
import {
  getRelatedHomecheffSeoPages,
  getSeoCanonicalUrl,
} from "@/lib/seo/homecheffSeoPages";
import { MAIN_DOMAIN } from "@/lib/seo/metadata";

type Props = {
  page: SeoPageDefinition;
  locale: "nl" | "en";
};

export default function HomecheffSeoLanding({ page, locale }: Props) {
  const c = locale === "nl" ? page.nl : page.en;
  const canonical = getSeoCanonicalUrl(page, locale);
  const homeHref = "/";
  const backLabel = locale === "nl" ? "Terug naar home" : "Back to home";
  const seoHubHref = locale === "nl" ? "/seo-hub" : "/en/seo-hub";
  const related = getRelatedHomecheffSeoPages(page, locale, 3);

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: c.h1,
    description: c.description,
    url: canonical,
    inLanguage: locale === "nl" ? "nl-NL" : "en-US",
    isPartOf: {
      "@type": "WebSite",
      name: "HomeCheff",
      url: MAIN_DOMAIN,
    },
  };

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.h1,
    description: c.description,
    inLanguage: locale === "nl" ? "nl-NL" : "en-US",
    url: canonical,
    author: {
      "@type": "Organization",
      name: "HomeCheff",
      url: MAIN_DOMAIN,
    },
    publisher: {
      "@type": "Organization",
      name: "HomeCheff",
      url: MAIN_DOMAIN,
    },
  };

  return (
    <>
      <Script
        id={`seo-ld-webpage-${page.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
      />
      <Script
        id={`seo-ld-article-${page.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <div className="container mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
          <Link
            href={homeHref}
            className="mb-8 inline-flex items-center text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            {backLabel}
          </Link>

          <article>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {c.h1}
            </h1>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-gray-700">
              {c.intro.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <section className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900">
                {c.howItWorks.title}
              </h2>
              <div className="mt-4 space-y-3 text-gray-700">
                {c.howItWorks.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900">
                {c.audience.title}
              </h2>
              <div className="mt-4 space-y-3 text-gray-700">
                {c.audience.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900">
                {c.whyLocal.title}
              </h2>
              <div className="mt-4 space-y-3 text-gray-700">
                {c.whyLocal.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900">
                {c.discover.title}
              </h2>
              <div className="mt-4 space-y-3 text-gray-700">
                {c.discover.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>

            <section className="mt-14 rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                {locale === "nl" ? "Aan de slag" : "Get started"}
              </h2>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={c.cta.primary.href}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  {c.cta.primary.label}
                </Link>
                <Link
                  href={c.cta.secondary.href}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-center text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  {c.cta.secondary.label}
                </Link>
              </div>
            </section>

            <section className="mt-14 border-t border-gray-200 pt-10">
              <h2 className="text-xl font-semibold text-gray-900">
                {locale === "nl" ? "Meer ontdekken" : "Explore more"}
              </h2>
              <ul className="mt-4 space-y-2 text-emerald-800">
                {related.map((r) => (
                  <li key={r.href}>
                    <Link href={r.href} className="hover:underline">
                      {r.title}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href={seoHubHref} className="hover:underline">
                    {locale === "nl"
                      ? "SEO-overzicht (alle onderwerpen)"
                      : "SEO overview (all topics)"}
                  </Link>
                </li>
                <li>
                  <Link href="/dorpsplein" className="hover:underline">
                    {locale === "nl" ? "Dorpsplein" : "Village square"}
                  </Link>
                </li>
                <li>
                  <Link href="/sell" className="hover:underline">
                    {locale === "nl" ? "Verkopen op HomeCheff" : "Sell on HomeCheff"}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:underline">
                    {locale === "nl" ? "Contact" : "Contact"}
                  </Link>
                </li>
              </ul>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
