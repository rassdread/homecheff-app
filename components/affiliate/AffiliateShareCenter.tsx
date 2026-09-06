'use client';

import { useTranslation } from '@/hooks/useTranslation';
import EcosystemShareAction from '@/components/share/EcosystemShareAction';
import {
  OPPORTUNITY_DESTINATIONS,
  type OpportunityId,
} from '@/lib/share/ecosystem-opportunities';

const SHARE_CENTER_IDS: OpportunityId[] = [
  'hub',
  'delivery_individual',
  'delivery_company',
  'affiliate',
  'affiliate_company',
  'studio',
  'growth',
  'seller',
];

/**
 * Compact "Deel & verdien" share center for Affiliate dashboard.
 */
export default function AffiliateShareCenter() {
  const { t } = useTranslation();

  return (
    <section
      aria-labelledby="share-center-heading"
      className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5"
    >
      <h2 id="share-center-heading" className="text-lg font-semibold text-slate-900">
        {t('verdienHub.shareCenter.title')}
      </h2>
      <p className="mt-1 text-sm text-slate-600">{t('verdienHub.shareCenter.body')}</p>
      <ul className="mt-4 divide-y divide-emerald-100/80">
        {SHARE_CENTER_IDS.map((id) => {
          const dest = OPPORTUNITY_DESTINATIONS[id];
          const titleKey =
            id === 'hub'
              ? 'verdienHub.title'
              : id === 'seller'
                ? 'verdienHub.cards.seller.title'
                : id === 'delivery_individual'
                  ? 'verdienHub.cards.delivery.title'
                  : id === 'delivery_company'
                    ? 'verdienHub.cards.deliveryCompany.title'
                    : id === 'affiliate'
                      ? 'verdienHub.cards.affiliate.title'
                      : id === 'affiliate_company'
                        ? 'verdienHub.cards.affiliateCompany.title'
                        : id === 'studio'
                          ? 'verdienHub.cards.studio.title'
                          : 'verdienHub.cards.growth.title';
          return (
            <li
              key={id}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{t(titleKey)}</p>
                <p className="truncate text-xs text-slate-500">{dest.href}</p>
              </div>
              <EcosystemShareAction
                destinationHref={dest.href}
                title={t(titleKey)}
                text={t(`verdienHub.shareCopy.${id === 'seller' ? 'seller' : id}`)}
                surface="affiliate_share_center"
                product={dest.product}
                opportunityId={id}
                labelKey="share.shareItem"
                variant="button"
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
