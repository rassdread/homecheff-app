'use client';

import { buildDnaPreviewTileModel } from '@/lib/business/dna-preview-tile';
import type { BusinessPlanId } from '@/lib/business/visibility-profile';
import BusinessPlanBadge from '@/components/business/BusinessPlanBadge';
import MarketplaceTileCompact from '@/components/marketplace/tiles/MarketplaceTileCompact';
import ProductDetailTrustBlock from '@/components/product/detail/ProductDetailTrustBlock';
import type { DiscoveryTrustContract } from '@/lib/discovery/contracts/discovery-trust-contract';
import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  plan: BusinessPlanId;
  sellerName?: string;
  companyName?: string | null;
  className?: string;
};

function buildPreviewTrust(plan: BusinessPlanId): DiscoveryTrustContract {
  const tier = plan === 'premium' ? 4 : plan === 'pro' ? 3 : plan === 'basic' ? 2 : 1;
  return {
    product: { reviewCount: 4, averageRating: 4.8 },
    deal: { reviewCount: 0, averageRating: 0 },
    courier: { reviewCount: 0, averageRating: 0 },
    completedDeals: 2,
    completedDeliveries: 0,
    repeatCustomers: 1,
    trustBadges: [],
    sellerTier: tier,
    businessPlan: plan,
  };
}

export default function BusinessDnaProductPreview({
  plan,
  sellerName,
  companyName,
  className = '',
}: Props) {
  const { t, language } = useTranslation();
  const displayName = sellerName ?? t('business.dna.preview.sampleSeller');
  const tile = buildDnaPreviewTileModel(plan, displayName);
  const trust = buildPreviewTrust(plan);

  return (
    <section className={`space-y-4 ${className}`} data-dna-product-preview={plan}>
      <h3 className="text-sm font-semibold text-gray-900">
        {t('business.dna.preview.productTitle')}
      </h3>
      <p className="text-xs text-gray-600">{t('business.dna.preview.productSubtitle')}</p>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {t('business.dna.preview.surface.tile')}
          </p>
          <div className="pointer-events-none max-w-[220px]">
            <MarketplaceTileCompact
              model={tile}
              t={t}
              locale={language === 'en' ? 'en-GB' : 'nl-NL'}
              enablePreview={false}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {t('business.dna.preview.surface.profile')}
          </p>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                {displayName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{displayName}</p>
                {companyName ? (
                  <p className="truncate text-xs text-gray-500">{companyName}</p>
                ) : null}
                {plan !== 'individual' ? (
                  <div className="mt-1">
                    <BusinessPlanBadge plan={plan} t={t} size="sm" />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {t('business.dna.preview.surface.detail')}
          </p>
          <ProductDetailTrustBlock trust={trust} listingKind="PRODUCT" compact />
        </div>
      </div>
    </section>
  );
}
