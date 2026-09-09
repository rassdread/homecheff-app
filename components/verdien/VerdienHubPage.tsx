'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import {
  Bike,
  Building2,
  Briefcase,
  Clapperboard,
  Package,
  Share2,
  Store,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import EcosystemShareAction from '@/components/share/EcosystemShareAction';
import {
  OPPORTUNITY_DESTINATIONS,
  type OpportunityId,
} from '@/lib/share/ecosystem-opportunities';
import { trackOpportunityClient } from '@/lib/analytics/opportunity-analytics-client';
import {
  getVerdienHubCopy,
  type VerdienHubCopy,
  type VerdienHubLang,
} from '@/lib/i18n/verdienHubSources';

type CardDef = {
  id: OpportunityId;
  icon: LucideIcon;
  accent: string;
  anchor: string;
  cardKey:
    | 'seller'
    | 'delivery'
    | 'deliveryCompany'
    | 'affiliate'
    | 'affiliateCompany'
    | 'studio'
    | 'growth'
    | 'jobs';
};

const CARDS: CardDef[] = [
  {
    id: 'seller',
    icon: Store,
    accent: 'bg-emerald-100 text-emerald-700',
    anchor: 'verkopen',
    cardKey: 'seller',
  },
  {
    id: 'delivery_individual',
    icon: Bike,
    accent: 'bg-sky-100 text-sky-700',
    anchor: 'bezorgen',
    cardKey: 'delivery',
  },
  {
    id: 'delivery_company',
    icon: Building2,
    accent: 'bg-indigo-100 text-indigo-700',
    anchor: 'bezorgbedrijf',
    cardKey: 'deliveryCompany',
  },
  {
    id: 'affiliate',
    icon: Share2,
    accent: 'bg-amber-100 text-amber-800',
    anchor: 'affiliate',
    cardKey: 'affiliate',
  },
  {
    id: 'affiliate_company',
    icon: Users,
    accent: 'bg-orange-100 text-orange-800',
    anchor: 'marketingpartner',
    cardKey: 'affiliateCompany',
  },
  {
    id: 'studio',
    icon: Clapperboard,
    accent: 'bg-violet-100 text-violet-700',
    anchor: 'studio',
    cardKey: 'studio',
  },
  {
    id: 'growth',
    icon: TrendingUp,
    accent: 'bg-teal-100 text-teal-800',
    anchor: 'growth',
    cardKey: 'growth',
  },
  {
    id: 'jobs',
    icon: Briefcase,
    accent: 'bg-slate-100 text-slate-700',
    anchor: 'vacatures',
    cardKey: 'jobs',
  },
];

const ORIENT: { key: keyof VerdienHubCopy['orient']; href: string }[] = [
  { key: 'sell', href: '#verkopen' },
  { key: 'deliver', href: '#bezorgen' },
  { key: 'deliveryCompany', href: '#bezorgbedrijf' },
  { key: 'affiliate', href: '#affiliate' },
  { key: 'marketing', href: '#marketingpartner' },
  { key: 'studio', href: '#studio' },
  { key: 'growth', href: '#growth' },
  { key: 'jobs', href: '#vacatures' },
];

function trackHub(event: string, extra?: Record<string, unknown>) {
  trackOpportunityClient(event, { surface: 'verdien_hub', ...(extra || {}) });
}

function shareCopyFor(
  copy: VerdienHubCopy,
  id: OpportunityId,
): string {
  if (id === 'hub') return copy.shareText;
  if (id === 'seller') return copy.shareCopy.seller;
  if (id === 'delivery_individual') return copy.shareCopy.delivery_individual;
  if (id === 'delivery_company') return copy.shareCopy.delivery_company;
  if (id === 'affiliate') return copy.shareCopy.affiliate;
  if (id === 'affiliate_company') return copy.shareCopy.affiliate_company;
  if (id === 'studio') return copy.shareCopy.studio;
  if (id === 'growth') return copy.shareCopy.growth;
  if (id === 'jobs') return copy.shareCopy.jobs;
  return copy.shareText;
}

type Props = {
  copy: VerdienHubCopy;
  initialLang: VerdienHubLang;
};

export default function VerdienHubPage({ copy: serverCopy, initialLang }: Props) {
  const { language, isReady } = useTranslation();

  const copy = useMemo(() => {
    if (isReady && (language === 'en' || language === 'nl')) {
      return getVerdienHubCopy(language);
    }
    return serverCopy;
  }, [isReady, language, serverCopy]);

  useEffect(() => {
    trackHub('opportunity_hub_view', { lang: initialLang });
  }, [initialLang]);

  const hubDest = OPPORTUNITY_DESTINATIONS.hub;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 md:py-14">
        <header className="mb-10 text-center md:mb-14">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
            {copy.eyebrow}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            {copy.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            {copy.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#mogelijkheden"
              className="inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              onClick={() => trackHub('opportunity_card_click', { id: 'hero_primary' })}
            >
              {copy.ctaPrimary}
            </a>
            <EcosystemShareAction
              destinationHref={hubDest.href}
              title={copy.shareTitle}
              text={copy.shareText}
              surface="verdien_hub"
              product="marketplace"
              opportunityId="hub"
              label={copy.ctaShareHub}
              variant="button"
            />
          </div>
          <p className="mt-4 text-xs text-slate-500">{copy.noIncomePromise}</p>
        </header>

        <section aria-labelledby="orient-heading" className="mb-10 md:mb-12">
          <h2 id="orient-heading" className="mb-3 text-lg font-semibold text-slate-900">
            {copy.orientTitle}
          </h2>
          <div className="flex flex-wrap gap-2">
            {ORIENT.map((o) => (
              <a
                key={o.href}
                href={o.href}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
              >
                {copy.orient[o.key]}
              </a>
            ))}
          </div>
        </section>

        <section id="mogelijkheden" aria-labelledby="cards-heading" className="mb-12">
          <h2 id="cards-heading" className="sr-only">
            {copy.cardsHeading}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((card) => {
              const dest = OPPORTUNITY_DESTINATIONS[card.id];
              const Icon = card.icon;
              const isExternal = dest.href.startsWith('http');
              const cardCopy = copy.cards[card.cardKey];
              return (
                <article
                  key={card.id}
                  id={card.anchor}
                  className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                >
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full ${card.accent}`}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{cardCopy.title}</h3>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {cardCopy.proposition}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{cardCopy.forWhom}</p>
                  <p className="mt-1 text-sm text-slate-500">{cardCopy.howStart}</p>
                  <div className="mt-auto flex flex-col gap-2 pt-5">
                    {isExternal ? (
                      <a
                        href={dest.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                        onClick={() =>
                          trackHub('opportunity_card_click', {
                            id: card.id,
                            href: dest.href,
                          })
                        }
                      >
                        {cardCopy.cta}
                      </a>
                    ) : (
                      <Link
                        href={dest.href}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                        onClick={() =>
                          trackHub('opportunity_card_click', {
                            id: card.id,
                            href: dest.href,
                          })
                        }
                      >
                        {cardCopy.cta}
                      </Link>
                    )}
                    <EcosystemShareAction
                      destinationHref={dest.href}
                      title={cardCopy.title}
                      text={shareCopyFor(copy, card.id)}
                      surface="verdien_hub"
                      product={dest.product}
                      opportunityId={card.id}
                      label={cardCopy.share}
                      variant="text"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="delivery-highlight"
          className="mb-12 rounded-2xl border border-sky-200 bg-sky-50/60 p-6 md:p-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <Package className="h-5 w-5" aria-hidden />
              </div>
              <h2 id="delivery-highlight" className="text-xl font-bold text-slate-900">
                {copy.deliveryHighlight.title}
              </h2>
              <p className="mt-2 text-sm text-slate-700">{copy.deliveryHighlight.body}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                <li>{copy.deliveryHighlight.point1}</li>
                <li>{copy.deliveryHighlight.point2}</li>
                <li>{copy.deliveryHighlight.point3}</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              <Link
                href="/delivery/signup"
                className="inline-flex justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
              >
                {copy.cards.delivery.cta}
              </Link>
              <Link
                href="/delivery/company/signup"
                className="inline-flex justify-center rounded-xl border border-sky-300 bg-white px-4 py-2.5 text-sm font-semibold text-sky-900 hover:bg-sky-50"
              >
                {copy.cards.deliveryCompany.cta}
              </Link>
              <EcosystemShareAction
                destinationHref="/delivery/signup"
                title={copy.cards.delivery.title}
                text={copy.shareCopy.delivery_individual}
                surface="verdien_hub_delivery"
                product="delivery"
                opportunityId="delivery_individual"
                label={copy.cards.delivery.share}
                variant="button"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center md:p-8">
          <h2 className="text-lg font-bold text-slate-900">{copy.employment.title}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
            {copy.employment.body}
          </p>
          <Link
            href="/werken-bij/vacatures"
            className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          >
            {copy.employment.cta}
          </Link>
        </section>
      </div>
    </div>
  );
}
