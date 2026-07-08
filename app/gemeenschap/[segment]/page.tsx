import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { cookies, headers } from 'next/headers';
import {
  CATEGORY_ECOSYSTEM_SLUGS,
  getCategoryEcosystem,
  type CategoryEcosystemSlug,
} from '@/lib/community/getCategoryEcosystem';
import { getCurrentDomain, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';
import CategoryEcosystemClient from '@/components/community/CategoryEcosystemClient';

export const revalidate = 300;

export function generateStaticParams() {
  return CATEGORY_ECOSYSTEM_SLUGS.map((segment) => ({ segment }));
}

const META: Record<
  CategoryEcosystemSlug,
  { titleNl: string; titleEn: string; descNl: string; descEn: string }
> = {
  keuken: {
    titleNl: 'Keuken-ecosysteem | HomeCheff',
    titleEn: 'Kitchen ecosystem | HomeCheff',
    descNl: 'Ontdek actieve thuiskeukens en lokaal aanbod op HomeCheff — echte activiteit, geen groepsdruk.',
    descEn: 'Discover active home kitchens and local supply on HomeCheff — real activity, calm discovery.',
  },
  tuin: {
    titleNl: 'Tuin-ecosysteem | HomeCheff',
    titleEn: 'Garden ecosystem | HomeCheff',
    descNl: 'Tuinmakers en lokale oogst op HomeCheff — zichtbaar via echte listings en inspiratie.',
    descEn: 'Garden makers and local harvest on HomeCheff — visible through real listings and inspiration.',
  },
  studio: {
    titleNl: 'Studio-ecosysteem | HomeCheff',
    titleEn: 'Studio ecosystem | HomeCheff',
    descNl: 'Creatieve studio-makers op HomeCheff — design en ambacht met rustige momentum-signalen.',
    descEn: 'Creative studio makers on HomeCheff — design and craft with calm momentum signals.',
  },
  inspiratie: {
    titleNl: 'Inspiratie-ecosysteem | HomeCheff',
    titleEn: 'Inspiration ecosystem | HomeCheff',
    descNl: 'Inspiratie en makers die delen op HomeCheff — ontdek wat er leeft zonder social-ruis.',
    descEn: 'Inspiration and makers sharing on HomeCheff — discover what is alive without social noise.',
  },
  community: {
    titleNl: 'Community & affiliate | HomeCheff',
    titleEn: 'Community & affiliate | HomeCheff',
    descNl: 'Mensen die HomeCheff verder helpen bouwen — affiliate en community builders, transparant.',
    descEn: 'People helping build HomeCheff — affiliate and community builders, transparently.',
  },
};

async function resolvePageLanguage(): Promise<'nl' | 'en'> {
  const headersList = await headers();
  const languageHeader = headersList.get('X-HomeCheff-Language');
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get('homecheff-language');

  if (languageHeader === 'nl' || languageHeader === 'en') {
    return languageHeader;
  }
  if (languageCookie?.value === 'nl' || languageCookie?.value === 'en') {
    return languageCookie.value as 'nl' | 'en';
  }
  return 'nl';
}

export async function generateMetadata({
  params,
}: {
  params: { segment: string };
}): Promise<Metadata> {
  const slug = params.segment as CategoryEcosystemSlug;
  if (!CATEGORY_ECOSYSTEM_SLUGS.includes(slug)) {
    return { title: 'HomeCheff', robots: { index: false } };
  }
  const m = META[slug];
  const lang = await resolvePageLanguage();
  const title = lang === 'en' ? m.titleEn : m.titleNl;
  const description = lang === 'en' ? m.descEn : m.descNl;
  const currentDomain = await getCurrentDomain();
  const path = `/gemeenschap/${slug}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${currentDomain}${path}`,
      siteName: 'HomeCheff',
    },
    alternates: {
      canonical: `${currentDomain}${path}`,
      languages: seoHreflangLanguagesOnEu(path),
    },
    robots: { index: true, follow: true },
  };
}

export default async function GemeenschapSegmentPage({
  params,
}: {
  params: { segment: string };
}) {
  const slug = params.segment as CategoryEcosystemSlug;
  if (!CATEGORY_ECOSYSTEM_SLUGS.includes(slug)) notFound();

  const data = await getCategoryEcosystem(slug);
  if (!data) notFound();

  const currentDomain = await getCurrentDomain();
  const url = `${currentDomain}/gemeenschap/${slug}`;
  const m = META[slug];

  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: m.titleNl,
    description: m.descNl,
    url,
    isPartOf: { '@type': 'WebSite', name: 'HomeCheff', url: currentDomain },
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      <Script
        id={`ecosystem-ld-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
      />
      <CategoryEcosystemClient data={data} />
    </main>
  );
}
