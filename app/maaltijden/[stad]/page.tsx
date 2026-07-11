import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { getCurrentDomain, seoHreflangLanguagesOnEu } from "@/lib/seo/metadata";
import { LOCAL_SEO_CITIES } from "@/lib/seo/localCities";
import { getEcosystemHubForCitySlug } from "@/lib/community/getEcosystemHubForCitySlug";
import { shouldIndexCityHub } from "@/lib/seo/city-indexability";
import CityHubSection from "@/components/community/CityHubSection";
import EcosystemBackLink from "@/components/community/EcosystemBackLink";

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
    return { title: "Lokaal aanbod | HomeCheff", robots: { index: false } };
  }
  const hub = await getEcosystemHubForCitySlug(city.slug);
  const indexable = shouldIndexCityHub(hub);
  const currentDomain = await getCurrentDomain();
  const title = `Lokaal aanbod in ${city.label} | HomeCheff`;
  const description = `Ontdek lokale makers, vakmanschap en buurtaanbod in ${city.label} via HomeCheff — eten, tuin, creaties, diensten en hulp.`;
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
    robots: { index: indexable, follow: true },
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
      name: `Lokaal aanbod in ${city.label} | HomeCheff`,
      description: `Lokaal ecosysteem rond ${city.label} op HomeCheff — producten, diensten, makers en dorpsplein.`,
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
        <div className="mb-6">
          <EcosystemBackLink />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          Lokaal aanbod in {city.label}
        </h1>
        <p className="mt-4 text-lg text-neutral-600">
          Op het dorpsplein vind je lokale makers, vakmanschap en buurtaanbod — eten is
          één categorie naast tuin, creaties, diensten en hulp. De persoon achter het aanbod staat centraal.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/?place=${encodeURIComponent(city.label)}&chip=sale#homecheff-feed`}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Naar het dorpsplein
          </Link>
          <Link
            href="/ontmoet-de-maker"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Ontmoet de maker
          </Link>
          <Link
            href="/evidence"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Platformbewijs
          </Link>
          <Link
            href="/wat-is-homecheff"
            className="inline-flex items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50/80 px-5 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-100/80"
          >
            Wat is HomeCheff?
          </Link>
        </div>
        {hub ? <CityHubSection initial={hub} /> : null}
      </div>
    </main>
  );
}
