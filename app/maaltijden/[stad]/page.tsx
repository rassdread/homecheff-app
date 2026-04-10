import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentDomain, seoHreflangLanguagesOnEu } from "@/lib/seo/metadata";
import { LOCAL_SEO_CITIES } from "@/lib/seo/localCities";

export const dynamic = "force-static";

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

export default function MaaltijdenStadPage({
  params,
}: {
  params: { stad: string };
}) {
  const city = LOCAL_SEO_CITIES.find((c) => c.slug === params.stad);
  if (!city) notFound();

  return (
    <main className="min-h-screen bg-neutral-50">
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
            href="/dorpsplein"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Naar het dorpsplein
          </Link>
          <Link
            href="/inspiratie"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Inspiratie
          </Link>
        </div>
      </div>
    </main>
  );
}
