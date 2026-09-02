import AffiliatePageClient from './page-client';
import type { Metadata } from 'next';
import {
  getCurrentDomain,
  getCurrentLanguage,
  seoHreflangLanguagesOnEu,
} from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

const faqsNl = [
  {
    q: 'Waarover wordt affiliatecommissie berekend?',
    a: 'Over de HomeCheff-platformfee van de order — nooit over het hele orderbedrag, het verkopersdeel of HomeCheff Credits (HC).',
  },
  {
    q: 'Krijg ik commissie over het hele orderbedrag?',
    a: 'Nee. De affiliatepool is maximaal 50% van de werkelijke HomeCheff-platformfee.',
  },
  {
    q: 'Wat gebeurt er als koper en verkoper via affiliates zijn aangebracht?',
    a: 'Bij verschillende affiliates splitst de pool 25% + 25% van de fee. Bij dezelfde affiliate ontvangt die affiliate de volledige 50%-pool.',
  },
  {
    q: 'Tellen Growth en Studio ook mee?',
    a: 'Ja. Binnen dezelfde 12 maanden kunnen in aanmerking komende platformopbrengsten op Growth en Studio meetellen.',
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const currentDomain = await getCurrentDomain();
  const path = '/affiliate';

  if (lang === 'en') {
    return {
      title: 'HomeCheff Marketplace Affiliate | 50% platform fee pool · 12 months',
      description:
        'Refer a HomeCheff user and earn for 12 months from the eligible HomeCheff platform fee pool — never from full order value, seller payout, or HomeCheff Credits (HC).',
      keywords: [
        'HomeCheff affiliate',
        'HomeCheff commissie',
        'affiliate marketing HomeCheff',
        'Marketplace affiliate',
        'HomeCheff referral',
      ],
      openGraph: {
        title: 'Earn with HomeCheff Marketplace',
        description:
          '12 months · share of HomeCheff platform fee revenue. Not GMV, not HC. Growth and Studio can also count.',
        type: 'website',
        locale: 'en_US',
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

  return {
    title: 'HomeCheff Affiliate | 50% platformfee-pool · 12 maanden',
    description:
      'Breng een gebruiker aan en ontvang 12 maanden een aandeel uit de HomeCheff-platformopbrengst via die gebruiker. Nooit over het hele orderbedrag, het verkopersdeel of HomeCheff Credits (HC).',
    keywords: [
      'HomeCheff affiliate',
      'HomeCheff commissie',
      'affiliate marketing HomeCheff',
      'Marketplace affiliate',
      'HomeCheff referral',
    ],
    openGraph: {
      title: 'Verdien mee met HomeCheff',
      description:
        '12 maanden · aandeel uit de HomeCheff-platformfee. Niet over GMV of HC. Growth en Studio kunnen ook meetellen.',
      type: 'website',
      locale: 'nl_NL',
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

export default async function AffiliatePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: 'HomeCheff Marketplace Affiliate',
        url: 'https://homecheff.eu/affiliate',
        description:
          '12 maanden aandeel uit de HomeCheff-platformfee-pool (max 50% van de fee) per aangebrachte gebruiker.',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'HomeCheff', item: 'https://homecheff.eu' },
          { '@type': 'ListItem', position: 2, name: 'Affiliate', item: 'https://homecheff.eu/affiliate' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqsNl.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'Organization',
        name: 'HomeCheff',
        url: 'https://homecheff.eu',
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="border-b border-slate-200 bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            HomeCheff Affiliate · Marketplace
          </p>
          <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight text-slate-900">
            Verdien mee met HomeCheff
          </h1>
          <p className="mt-4 text-center text-base leading-relaxed text-slate-700">
            HomeCheff Marketplace is de lokale buurtmarkt van HomeCheff — voor eten, oogst, creaties
            en diensten dichtbij. Breng een gebruiker aan en ontvang 12 maanden lang een aandeel uit
            de HomeCheff-platformopbrengst die via die gebruiker wordt gegenereerd.
          </p>
          <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">De affiliatepool</h2>
            <p>
              De pool is gebaseerd op de HomeCheff-platformfee — nooit op het verkopersdeel, de
              volledige orderwaarde of HomeCheff Credits (HC).
            </p>
            <p>
              Voorbeeld: order €20, platformfee €1,80 → maximale affiliatepool €0,90 (50%). Als één
              kwalificerende referral aan het event hangt, kan die affiliate de volledige pool
              ontvangen. Bij koper én verkoper met verschillende affiliates: 25% + 25% van de fee.
            </p>
          </div>
          <div className="mt-6 space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
            <h2 className="text-lg font-semibold text-emerald-950">
              Ook verdienen op andere HomeCheff-platformen
            </h2>
            <p className="text-sm text-slate-700">
              Gebruikt jouw aangebrachte lid later ook Growth of Studio? Dan kunnen ook daar in
              aanmerking komende platformopbrengsten meetellen binnen dezelfde 12 maanden.
            </p>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <a
                  href="https://growth.homecheff.eu/affiliate"
                  className="text-emerald-900 underline-offset-2 hover:underline"
                >
                  Affiliate verdienen met HomeCheff Growth
                </a>
              </li>
              <li>
                <a
                  href="https://studio.homecheff.eu/affiliate"
                  className="text-emerald-900 underline-offset-2 hover:underline"
                >
                  Affiliate verdienen met HomeCheff Studio
                </a>
              </li>
            </ul>
          </div>
          <div className="mt-8 space-y-3">
            <h2 className="text-lg font-semibold">Veelgestelde vragen</h2>
            {faqsNl.map((f) => (
              <div key={f.q} className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm">
            <a
              href="/affiliate/dashboard"
              className="font-semibold text-emerald-800 underline-offset-2 hover:underline"
            >
              Bekijk mijn affiliate-dashboard
            </a>
          </p>
        </div>
      </section>
      <AffiliatePageClient />
    </div>
  );
}
