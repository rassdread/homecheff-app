import AffiliatePageClient from './page-client';
import AffiliateBusinessStory from '@/components/affiliate/AffiliateBusinessStory';
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

export default async function AffiliatePage() {
  const lang = await getCurrentLanguage();
  const en = lang === 'en';
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
          {presentation ? (
            <div className="mx-auto mt-4 max-w-2xl rounded-2xl border border-emerald-200 bg-white p-4 text-left">
              {presentation.copy.badge ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  {presentation.copy.badge}
                </p>
              ) : null}
              <p className="mt-1 text-sm leading-relaxed text-slate-800">{presentation.copy.lead}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{presentation.copy.follow}</p>
            </div>
          ) : null}
          <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight text-slate-900">
            {en ? 'Build your own customer portfolio' : 'Bouw je eigen klantenportefeuille'}
          </h1>
          <p className="mt-4 text-center text-base leading-relaxed text-slate-700">
            {en
              ? 'You are not only chasing one-off sales. You build a customer portfolio inside HomeCheff. For as long as the customers you referred keep using qualifying paid products, you can keep receiving recurring commission under that product’s rules. No guaranteed income.'
              : 'Je bouwt niet alleen aan losse verkopen, maar aan je eigen klantenportefeuille binnen HomeCheff. Zolang jouw aangebrachte klanten kwalificerende betaalde producten blijven gebruiken, kun je volgens de regels van dat product terugkerende commissie blijven ontvangen. Geen gegarandeerd inkomen.'}
          </p>
          <AffiliateBusinessStory
            lang={en ? 'en' : 'nl'}
            programName={presentation?.programName}
            showEarly={early}
          />
          <div className="mt-6 space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
            <h2 className="text-lg font-semibold text-emerald-950">
              {en ? 'Earn on other HomeCheff products too' : 'Ook verdienen op andere HomeCheff-producten'}
            </h2>
            <p className="text-sm text-slate-700">
              {en
                ? 'If a customer you referred later uses Growth or Studio, the original affiliate stays the ecosystem origin. Commission arises only on qualifying paid revenue of that product, under that product’s rules.'
                : 'Gebruikt een klant die jij hebt aangebracht later ook Growth of Studio? Dan blijft de oorspronkelijke affiliate de ecosysteemherkomst. Commissie ontstaat alleen bij kwalificerende betaalde omzet van dat product, volgens de regels van dat product.'}
            </p>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <a
                  href="https://growth.homecheff.eu/affiliate"
                  className="text-emerald-900 underline-offset-2 hover:underline"
                >
                  {en ? 'Earn as an affiliate with HomeCheff Growth' : 'Affiliate verdienen met HomeCheff Growth'}
                </a>
              </li>
              <li>
                <a
                  href="https://studio.homecheff.eu/affiliate"
                  className="text-emerald-900 underline-offset-2 hover:underline"
                >
                  {en ? 'Earn as an affiliate with HomeCheff Studio' : 'Affiliate verdienen met HomeCheff Studio'}
                </a>
              </li>
            </ul>
          </div>
          <p className="mt-6 text-center text-sm">
            <a
              href="/affiliate/dashboard"
              className="font-semibold text-emerald-800 underline-offset-2 hover:underline"
            >
              {en ? 'Open my affiliate dashboard' : 'Bekijk mijn affiliate-dashboard'}
            </a>
          </p>
        </div>
      </section>
      <AffiliatePageClient />
    </div>
  );
}
