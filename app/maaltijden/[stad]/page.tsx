import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { getCurrentDomain, seoHreflangLanguagesOnEu } from "@/lib/seo/metadata";
import { LOCAL_SEO_CITIES } from "@/lib/seo/localCities";
import { getEcosystemHubForCitySlug } from "@/lib/community/getEcosystemHubForCitySlug";
import CityHubSection from "@/components/community/CityHubSection";

export const revalidate = 300;

export function generateStaticParams() {
  return LOCAL_SEO_CITIES.map(({ slug }) => ({ stad: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { stad: string };
}): Promise<Metadata> {
  const city = LOCAL_SEO_CITIES.find((c) => c.slug === params.stad);
  if (!city) {
    return { title: "Maaltijden | HomeCheff", robots: { index: false } };
  }
  const currentDomain = await getCurrentDomain();
  const title = `Maaltijden in ${city.label} | HomeCheff`;
  const description = `Ontdek thuisgemaakte maaltijden en lokaal aanbod in ${city.label} via HomeCheff.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${currentDomain}/maaltijden/${city.slug}`,
      siteName: "HomeCheff",
    },
    alternates: {
      canonical: `${currentDomain}/maaltijden/${city.slug}`,
      languages: seoHreflangLanguagesOnEu(`/maaltijden/${city.slug}`),
    },
    robots: { index: true, follow: true },
  };
}

export default async function MaaltijdenStadPage({
  params,
}: {
  params: { stad: string };
}) {
  const city = LOCAL_SEO_CITIES.find((c) => c.slug === params.stad);
  if (!city) notFound();

  const hub = await getEcosystemHubForCitySlug(city.slug);
  const currentDomain = await getCurrentDomain();
  const pageUrl = `${currentDomain}/maaltijden/${city.slug}`;
  const collectionLd =
    hub &&
    ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Maaltijden in ${city.label} | HomeCheff`,
      description: `Lokaal ecosysteem rond ${city.label} op HomeCheff — makers, momentum en dorpsplein.`,
      url: pageUrl,
      isPartOf: { '@type': 'WebSite', name: 'HomeCheff', url: currentDomain },
      mainEntity: {
        '@type': 'Place',
        name: city.label,
        containedInPlace: { '@type': 'Country', name: 'Netherlands' },
      },
      about: {
        '@type': 'Thing',
        name: 'Local creator activity',
        description: `Approx. ${hub.activeCreatorsWeek} active creators (7d) and ${hub.newListingsWeek} new listings (7d) within ${hub.radiusKm} km (aggregated).`,
      },
    } as const);

  return (
    <main className="min-h-screen bg-neutral-50">
      {collectionLd ? (
        <Script
          id={`maaltijden-ld-${city.slug}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
        />
      ) : null}
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          Maaltijden in {city.label}
        </h1>
        <p className="mt-4 text-lg text-neutral-600">
          Op het dorpsplein vind je lokale makers, gerechten en meer — filter op jouw
          regio om het aanbod bij jou in de buurt te zien.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/?place=${encodeURIComponent(city.label)}&chip=sale#homecheff-feed`}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Naar het dorpsplein
          </Link>
          <Link
            href="/#homecheff-feed"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Inspiratie
          </Link>
          <Link
            href="/gemeenschap/keuken"
            className="inline-flex items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50/80 px-5 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-100/80"
          >
            Keuken-ecosysteem
          </Link>
        </div>
        {hub ? <CityHubSection initial={hub} /> : null}
      </div>
    </main>
  );
}
