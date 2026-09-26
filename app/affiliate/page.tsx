import AffiliatePageClient from './page-client';
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

const faqsNl = [
  {
    q: 'Hoe verdient een HomeCheff-partner geld?',
    a: 'Je bouwt een klantenportefeuille. Commissie ontstaat alleen als een aangebrachte klant kwalificerende betaalde omzet maakt, volgens de regels van dat product. Geen vast salaris en geen gegarandeerd inkomen.',
  },
  {
    q: 'Hoe lang ontvang ik commissie?',
    a: 'Zolang de klant kwalificerende betaalde producten blijft gebruiken en de partnerrelatie geldig is. Een kalenderjaar laat die commissie niet vanzelf stoppen.',
  },
  {
    q: 'Wat gebeurt er als mijn klant later een ander HomeCheff-product gebruikt?',
    a: 'De klant blijft aan jouw partnerrelatie gekoppeld. Ook die omzet kan commissie opleveren, volgens de regels van dat product. Niet elk product betaalt hetzelfde percentage.',
  },
  {
    q: 'Kan ik dit naast mijn baan doen?',
    a: 'Ja. Je kunt klein beginnen naast je huidige werk. Dat is geen belofte dat je je baan kunt opzeggen.',
  },
  {
    q: 'Krijg ik altijd 50%?',
    a: 'Nee. Bij Marketplace-bestellingen is de pool maximaal 50% van de HomeCheff-platformfee, niet van het orderbedrag. Bij Growth is 50% het aandeel van de deelbare marge na de HC-reserve. Studio heeft een eigen restant.',
  },
  {
    q: 'Wat is het verschil tussen een affiliate en een partner?',
    a: 'Een affiliate brengt HomeCheff onder de aandacht. Een partner bouwt en onderhoudt een klantenportefeuille. MAIN en SUB zijn netwerkrollen: waar die verdeling geldt, is dat 40% voor SUB en 10% voor MAIN van de commissiegrondslag, niet van de omzet van de klant.',
  },
  {
    q: 'Waarover wordt Marketplace-commissie berekend?',
    a: 'Over de HomeCheff-platformfee van de order, nooit over het hele orderbedrag, het verkopersdeel of HomeCheff Credits (HC).',
  },
  {
    q: 'Wat gebeurt er als koper en verkoper via verschillende affiliates zijn aangebracht?',
    a: 'De pool splitst dan 25% + 25% van de fee. Bij dezelfde affiliate ontvangt die affiliate de volledige 50%-pool.',
  },
  {
    q: 'Wat gebeurt er als een klant opzegt of een betaling wordt terugbetaald?',
    a: 'Stopt de betaling, dan stopt de commissie op dat product. Een terugbetaling draait de commissie op die transactie terug.',
  },
];

const faqsEn = [
  {
    q: 'How does a HomeCheff partner earn?',
    a: 'You build a customer portfolio. Commission arises only when a referred customer creates qualifying paid revenue, under that product’s rules. No salary and no guaranteed income.',
  },
  {
    q: 'How long do I receive commission?',
    a: 'For as long as the customer keeps using qualifying paid products and the partner relationship stays valid. A calendar year does not by itself stop that commission.',
  },
  {
    q: 'What if my customer later uses another HomeCheff product?',
    a: 'The customer stays linked to your partner relationship. That revenue can earn commission too, under that product’s rules. Products do not all pay the same percentage.',
  },
  {
    q: 'Can I do this alongside a job?',
    a: 'Yes. You can start small alongside your current work. That is not a promise you can quit your job.',
  },
  {
    q: 'Do I always get 50%?',
    a: 'No. On Marketplace orders the pool is at most 50% of the HomeCheff platform fee, not of the order amount. On Growth, 50% is the share of the distributable margin after the HC reserve. Studio uses its own residual.',
  },
  {
    q: 'What is the difference between an affiliate and a partner?',
    a: 'An affiliate introduces HomeCheff. A partner builds and looks after a customer portfolio. MAIN and SUB are network roles: where that split applies, it is 40% for SUB and 10% for MAIN of the commission base, not of the customer’s revenue.',
  },
  {
    q: 'What is Marketplace commission calculated on?',
    a: 'On the HomeCheff platform fee of the order, never on the full order amount, the seller share, or HomeCheff Credits (HC).',
  },
  {
    q: 'What if the buyer and seller were referred by different affiliates?',
    a: 'The pool then splits 25% + 25% of the fee. If it is the same affiliate, that affiliate receives the full 50% pool.',
  },
  {
    q: 'What if a customer cancels or a payment is refunded?',
    a: 'If payment stops, commission on that product stops. A refund reverses the commission on that transaction.',
  },
];

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
  const faqs = en ? faqsEn : faqsNl;
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
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
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
      <AcquisitionLandingBeacon eventName="affiliate_landing_view" />
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
            {en ? 'Build your own customer portfolio' : 'Bouw je eigen klantenportefeuille'}
          </h1>
          <p className="mt-4 text-center text-base leading-relaxed text-slate-700">
            {en
              ? 'You are not only chasing one-off sales. You build a customer portfolio inside HomeCheff. For as long as the customers you referred keep using qualifying paid products, you can keep receiving recurring commission under that product’s rules. No guaranteed income.'
              : 'Je bouwt niet alleen aan losse verkopen, maar aan je eigen klantenportefeuille binnen HomeCheff. Zolang jouw aangebrachte klanten kwalificerende betaalde producten blijven gebruiken, kun je volgens de regels van dat product terugkerende commissie blijven ontvangen. Geen gegarandeerd inkomen.'}
          </p>
          <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">De affiliatepool</h2>
            <p>
              De pool is gebaseerd op de HomeCheff-platformfee, nooit op het verkopersdeel, de
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
              Gebruikt jouw aangebrachte lid later ook Growth of Studio? Dan blijft de oorspronkelijke
              partner de ecosysteemherkomst. Commissie ontstaat alleen bij kwalificerende betaalde omzet
              van dat product, volgens de regels van dat product.
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
            <h2 className="text-lg font-semibold">{en ? 'Questions' : 'Veelgestelde vragen'}</h2>
            {faqs.map((f) => (
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
