'use client';

import Link from 'next/link';
import { useEffect } from 'react';
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

type CardDef = {
  id: OpportunityId;
  icon: LucideIcon;
  accent: string;
  titleKey: string;
  propKey: string;
  forKey: string;
  startKey: string;
  ctaKey: string;
  shareKey: string;
  anchor: string;
};

const CARDS: CardDef[] = [
  {
    id: 'seller',
    icon: Store,
    accent: 'bg-emerald-100 text-emerald-700',
    titleKey: 'verdienHub.cards.seller.title',
    propKey: 'verdienHub.cards.seller.proposition',
    forKey: 'verdienHub.cards.seller.forWhom',
    startKey: 'verdienHub.cards.seller.howStart',
    ctaKey: 'verdienHub.cards.seller.cta',
    shareKey: 'verdienHub.cards.seller.share',
    anchor: 'verkopen',
  },
  {
    id: 'delivery_individual',
    icon: Bike,
    accent: 'bg-sky-100 text-sky-700',
    titleKey: 'verdienHub.cards.delivery.title',
    propKey: 'verdienHub.cards.delivery.proposition',
    forKey: 'verdienHub.cards.delivery.forWhom',
    startKey: 'verdienHub.cards.delivery.howStart',
    ctaKey: 'verdienHub.cards.delivery.cta',
    shareKey: 'verdienHub.cards.delivery.share',
    anchor: 'bezorgen',
  },
  {
    id: 'delivery_company',
    icon: Building2,
    accent: 'bg-indigo-100 text-indigo-700',
    titleKey: 'verdienHub.cards.deliveryCompany.title',
    propKey: 'verdienHub.cards.deliveryCompany.proposition',
    forKey: 'verdienHub.cards.deliveryCompany.forWhom',
    startKey: 'verdienHub.cards.deliveryCompany.howStart',
    ctaKey: 'verdienHub.cards.deliveryCompany.cta',
    shareKey: 'verdienHub.cards.deliveryCompany.share',
    anchor: 'bezorgbedrijf',
  },
  {
    id: 'affiliate',
    icon: Share2,
    accent: 'bg-amber-100 text-amber-800',
    titleKey: 'verdienHub.cards.affiliate.title',
    propKey: 'verdienHub.cards.affiliate.proposition',
    forKey: 'verdienHub.cards.affiliate.forWhom',
    startKey: 'verdienHub.cards.affiliate.howStart',
    ctaKey: 'verdienHub.cards.affiliate.cta',
    shareKey: 'verdienHub.cards.affiliate.share',
    anchor: 'affiliate',
  },
  {
    id: 'affiliate_company',
    icon: Users,
    accent: 'bg-orange-100 text-orange-800',
    titleKey: 'verdienHub.cards.affiliateCompany.title',
    propKey: 'verdienHub.cards.affiliateCompany.proposition',
    forKey: 'verdienHub.cards.affiliateCompany.forWhom',
    startKey: 'verdienHub.cards.affiliateCompany.howStart',
    ctaKey: 'verdienHub.cards.affiliateCompany.cta',
    shareKey: 'verdienHub.cards.affiliateCompany.share',
    anchor: 'marketingpartner',
  },
  {
    id: 'studio',
    icon: Clapperboard,
    accent: 'bg-violet-100 text-violet-700',
    titleKey: 'verdienHub.cards.studio.title',
    propKey: 'verdienHub.cards.studio.proposition',
    forKey: 'verdienHub.cards.studio.forWhom',
    startKey: 'verdienHub.cards.studio.howStart',
    ctaKey: 'verdienHub.cards.studio.cta',
    shareKey: 'verdienHub.cards.studio.share',
    anchor: 'studio',
  },
  {
    id: 'growth',
    icon: TrendingUp,
    accent: 'bg-teal-100 text-teal-800',
    titleKey: 'verdienHub.cards.growth.title',
    propKey: 'verdienHub.cards.growth.proposition',
    forKey: 'verdienHub.cards.growth.forWhom',
    startKey: 'verdienHub.cards.growth.howStart',
    ctaKey: 'verdienHub.cards.growth.cta',
    shareKey: 'verdienHub.cards.growth.share',
    anchor: 'growth',
  },
  {
    id: 'jobs',
    icon: Briefcase,
    accent: 'bg-slate-100 text-slate-700',
    titleKey: 'verdienHub.cards.jobs.title',
    propKey: 'verdienHub.cards.jobs.proposition',
    forKey: 'verdienHub.cards.jobs.forWhom',
    startKey: 'verdienHub.cards.jobs.howStart',
    ctaKey: 'verdienHub.cards.jobs.cta',
    shareKey: 'verdienHub.cards.jobs.share',
    anchor: 'vacatures',
  },
];

const ORIENT = [
  { labelKey: 'verdienHub.orient.sell', href: '#verkopen' },
  { labelKey: 'verdienHub.orient.deliver', href: '#bezorgen' },
  { labelKey: 'verdienHub.orient.deliveryCompany', href: '#bezorgbedrijf' },
  { labelKey: 'verdienHub.orient.affiliate', href: '#affiliate' },
  { labelKey: 'verdienHub.orient.marketing', href: '#marketingpartner' },
  { labelKey: 'verdienHub.orient.studio', href: '#studio' },
  { labelKey: 'verdienHub.orient.growth', href: '#growth' },
  { labelKey: 'verdienHub.orient.jobs', href: '#vacatures' },
];

function trackHub(event: string, extra?: Record<string, unknown>) {
  trackOpportunityClient(event, { surface: 'verdien_hub', ...(extra || {}) });
}

export default function VerdienHubPage() {
  const { t } = useTranslation();

  useEffect(() => {
    trackHub('opportunity_hub_view');
  }, []);

  const hubDest = OPPORTUNITY_DESTINATIONS.hub;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 md:py-14">
        {/* Hero */}
        <header className="mb-10 text-center md:mb-14">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
            {t('verdienHub.eyebrow')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            {t('verdienHub.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            {t('verdienHub.subtitle')}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#mogelijkheden"
              className="inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              onClick={() => trackHub('opportunity_card_click', { id: 'hero_primary' })}
            >
              {t('verdienHub.ctaPrimary')}
            </a>
            <EcosystemShareAction
              destinationHref={hubDest.href}
              title={t('verdienHub.shareTitle')}
              text={t('verdienHub.shareText')}
              surface="verdien_hub"
              product="marketplace"
              opportunityId="hub"
              labelKey="verdienHub.ctaShareHub"
              variant="button"
            />
          </div>
          <p className="mt-4 text-xs text-slate-500">{t('verdienHub.noIncomePromise')}</p>
        </header>

        {/* Orientation */}
        <section aria-labelledby="orient-heading" className="mb-10 md:mb-12">
          <h2 id="orient-heading" className="mb-3 text-lg font-semibold text-slate-900">
            {t('verdienHub.orientTitle')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {ORIENT.map((o) => (
              <a
                key={o.href}
                href={o.href}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
              >
                {t(o.labelKey)}
              </a>
            ))}
          </div>
        </section>

        {/* Opportunity cards */}
        <section id="mogelijkheden" aria-labelledby="cards-heading" className="mb-12">
          <h2 id="cards-heading" className="sr-only">
            {t('verdienHub.cardsHeading')}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((card) => {
              const dest = OPPORTUNITY_DESTINATIONS[card.id];
              const Icon = card.icon;
              const isExternal = dest.href.startsWith('http');
              return (
                <article
                  key={card.id}
                  id={card.anchor}
                  className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full ${card.accent}`}>
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{t(card.titleKey)}</h3>
                  <p className="mt-2 text-sm font-medium text-slate-800">{t(card.propKey)}</p>
                  <p className="mt-2 text-sm text-slate-600">{t(card.forKey)}</p>
                  <p className="mt-1 text-sm text-slate-500">{t(card.startKey)}</p>
                  <div className="mt-auto flex flex-col gap-2 pt-5">
                    {isExternal ? (
                      <a
                        href={dest.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                        onClick={() =>
                          trackHub('opportunity_card_click', { id: card.id, href: dest.href })
                        }
                      >
                        {t(card.ctaKey)}
                      </a>
                    ) : (
                      <Link
                        href={dest.href}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                        onClick={() =>
                          trackHub('opportunity_card_click', { id: card.id, href: dest.href })
                        }
                      >
                        {t(card.ctaKey)}
                      </Link>
                    )}
                    <EcosystemShareAction
                      destinationHref={dest.href}
                      title={t(card.titleKey)}
                      text={t(`verdienHub.shareCopy.${card.id}`)}
                      surface="verdien_hub"
                      product={dest.product}
                      opportunityId={card.id}
                      labelKey={card.shareKey}
                      variant="text"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Delivery highlight */}
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
                {t('verdienHub.deliveryHighlight.title')}
              </h2>
              <p className="mt-2 text-sm text-slate-700">{t('verdienHub.deliveryHighlight.body')}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                <li>{t('verdienHub.deliveryHighlight.point1')}</li>
                <li>{t('verdienHub.deliveryHighlight.point2')}</li>
                <li>{t('verdienHub.deliveryHighlight.point3')}</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              <Link
                href="/delivery/signup"
                className="inline-flex justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
              >
                {t('verdienHub.cards.delivery.cta')}
              </Link>
              <Link
                href="/delivery/company/signup"
                className="inline-flex justify-center rounded-xl border border-sky-300 bg-white px-4 py-2.5 text-sm font-semibold text-sky-900 hover:bg-sky-50"
              >
                {t('verdienHub.cards.deliveryCompany.cta')}
              </Link>
              <EcosystemShareAction
                destinationHref="/delivery/signup"
                title={t('verdienHub.cards.delivery.title')}
                text={t('verdienHub.shareCopy.delivery_individual')}
                surface="verdien_hub_delivery"
                product="delivery"
                opportunityId="delivery_individual"
                labelKey="verdienHub.cards.delivery.share"
                variant="button"
              />
            </div>
          </div>
        </section>

        {/* Employment distinction */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center md:p-8">
          <h2 className="text-lg font-bold text-slate-900">{t('verdienHub.employment.title')}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
            {t('verdienHub.employment.body')}
          </p>
          <Link
            href="/werken-bij/vacatures"
            className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          >
            {t('verdienHub.employment.cta')}
          </Link>
        </section>
      </div>
    </div>
  );
}
