import AffiliatePageClient from './page-client';
import AffiliateBusinessStory from '@/components/affiliate/AffiliateBusinessStory';
import AffiliateHeroCtas from '@/components/affiliate/AffiliateHeroCtas';
import { loadPublicPresentation } from '@/lib/affiliate/program-store';
import AcquisitionLandingBeacon from '@/components/acquisition/AcquisitionLandingBeacon';
import type { Metadata } from 'next';
import {
  getCurrentDomain,
  getCurrentLanguage,
  seoHreflangLanguagesOnEu,
} from '@/lib/seo/metadata';
import { opportunityOgImageUrl } from '@/lib/share/homecheff-share-payload';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@/lib/share/og-opportunity';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const currentDomain = await getCurrentDomain();
  const path = '/affiliate';

  if (lang === 'en') {
    return {
      title: 'HomeCheff affiliate | build a customer portfolio',
      description:
        'Refer a HomeCheff user and earn from the eligible HomeCheff platform fee pool for as long as that customer generates qualifying paid revenue. Never from full order value, seller payout, or HomeCheff Credits (HC).',
      keywords: [
        'HomeCheff affiliate',
        'HomeCheff commissie',
        'affiliate marketing HomeCheff',
        'Marketplace affiliate',
        'HomeCheff referral',
      ],
      openGraph: {
        title: 'Promote HomeCheff. Earn with it.',
        description:
          'Share of HomeCheff platform fee revenue while qualifying paid use continues. Not GMV, not HC. No guaranteed income.',
        type: 'website',
        locale: 'en_US',
        url: `${currentDomain}${path}`,
        siteName: 'HomeCheff',
        images: [
          {
            url: opportunityOgImageUrl('affiliate', currentDomain),
            width: OG_IMAGE_WIDTH,
            height: OG_IMAGE_HEIGHT,
            alt: 'HomeCheff affiliate',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Promote HomeCheff. Earn with it.',
        description:
          'Share HomeCheff in your network. No guaranteed income, eligible platform revenue only.',
        images: [opportunityOgImageUrl('affiliate', currentDomain)],
      },
      alternates: {
        canonical: `${currentDomain}${path}`,
        languages: seoHreflangLanguagesOnEu(path),
      },
      robots: { index: true, follow: true },
    };
  }

  return {
    title: 'HomeCheff affiliate | bouw een klantenportefeuille',
    description:
      'Breng een gebruiker aan en ontvang een aandeel uit de HomeCheff-platformopbrengst zolang die gebruiker kwalificerende betaalde omzet genereert. Nooit over het hele orderbedrag, het verkopersdeel of HomeCheff Credits (HC).',
    keywords: [
      'HomeCheff affiliate',
      'HomeCheff commissie',
      'affiliate marketing HomeCheff',
      'Marketplace affiliate',
      'HomeCheff referral',
    ],
    openGraph: {
      title: 'Promoot HomeCheff. Verdien mee.',
      description:
        'Aandeel uit de HomeCheff-platformfee zolang kwalificerende betaalde omzet bestaat. Niet over GMV of HC. Geen gegarandeerd inkomen.',
      type: 'website',
      locale: 'nl_NL',
      url: `${currentDomain}${path}`,
      siteName: 'HomeCheff',
      images: [
        {
          url: opportunityOgImageUrl('affiliate', currentDomain),
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: 'HomeCheff affiliate',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Promoot HomeCheff. Verdien mee.',
      description:
        'Deel HomeCheff in je netwerk. Geen gegarandeerd inkomen, wel eligible platformomzet.',
      images: [opportunityOgImageUrl('affiliate', currentDomain)],
    },
    alternates: {
      canonical: `${currentDomain}${path}`,
      languages: seoHreflangLanguagesOnEu(path),
    },
    robots: { index: true, follow: true },
  };
}

export default async function AffiliatePage({
  searchParams,
}: {
  searchParams?: { product?: string };
}) {
  const lang = await getCurrentLanguage();
  const en = lang === 'en';
  const focusProduct =
    searchParams?.product === 'growth' ||
    searchParams?.product === 'studio' ||
    searchParams?.product === 'marketplace'
      ? searchParams.product
      : null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: 'HomeCheff Marketplace Affiliate',
        url: 'https://homecheff.eu/affiliate',
        description:
          'Aandeel uit de HomeCheff-platformfee-pool (max 50% van de fee) zolang de aangebrachte gebruiker kwalificerende betaalde omzet genereert.',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'HomeCheff', item: 'https://homecheff.eu' },
          { '@type': 'ListItem', position: 2, name: 'Affiliate', item: 'https://homecheff.eu/affiliate' },
        ],
      },
      {
        '@type': 'Organization',
        name: 'HomeCheff',
        url: 'https://homecheff.eu',
      },
    ],
  };

  const presentation = await loadPublicPresentation('NL').catch(() => null);
  const early = presentation?.copy.tone === 'EARLY';

  return (
    <div>
      <AcquisitionLandingBeacon eventName="affiliate_landing_view" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="border-b border-slate-200 bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            HomeCheff Affiliate · Marketplace
          </p>
          {presentation?.copy.badge ? (
            <p className="mt-4 text-center text-xs font-semibold uppercase tracking-wide text-emerald-800">
              {presentation.copy.badge}
            </p>
          ) : null}
          <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {en ? 'Build your own customer portfolio' : 'Bouw je eigen klantenportefeuille'}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-slate-700">
            {en
              ? 'Bring people and businesses to HomeCheff and earn when they use our services.'
              : 'Breng mensen en bedrijven naar HomeCheff en verdien mee wanneer zij gebruikmaken van onze diensten.'}
          </p>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-slate-600">
            {en
              ? 'What you build today can still create income later, for as long as the customer keeps making qualifying use of HomeCheff.'
              : 'Wat je vandaag opbouwt, kan ook later nog inkomsten opleveren zolang de klant kwalificerend gebruik blijft maken van HomeCheff.'}
          </p>
          <AffiliateHeroCtas lang={en ? 'en' : 'nl'} />
        </div>
      </section>
      <div className="bg-slate-50 px-4 pb-16 pt-2">
        <AffiliateBusinessStory
          lang={en ? 'en' : 'nl'}
          programName={presentation?.programName}
          showEarly={early}
          showNetwork={presentation ? presentation.publicMain || presentation.publicNetwork : true}
          showPromo={presentation ? presentation.publicPromo : true}
          focusProduct={focusProduct}
        />
        <AffiliatePageClient />
      </div>
    </div>
  );
}
