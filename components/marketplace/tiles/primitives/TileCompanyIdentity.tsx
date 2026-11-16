'use client';

import { Building2, Check } from 'lucide-react';
import type { MarketplaceTileModel, TranslateFn } from '@/lib/marketplace/tiles';

/**
 * Sender row for a listing published for a company.
 * Reuses the emerald company mark from the earlier product badge,
 * without covering the product photo.
 * The word Premium and the check appear only when HomeCheff assigned them.
 */
export default function TileCompanyIdentity({
  model,
  t,
}: {
  model: MarketplaceTileModel;
  t: TranslateFn;
}) {
  const publisher = model.publisher;
  if (!publisher || publisher.kind !== 'company') return null;

  const showPremium = publisher.plan === 'premium';

  return (
    <div className="flex min-w-0 items-center gap-2" data-listing-publisher="company">
      {publisher.logoUrl ? (
        <img
          src={publisher.logoUrl}
          alt=""
          className="h-7 w-7 shrink-0 rounded-md object-cover ring-1 ring-emerald-800/30"
        />
      ) : (
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white"
          aria-hidden
        >
          <Building2 className="h-4 w-4" />
        </span>
      )}
      <span className="min-w-0 truncate text-sm font-semibold tracking-tight text-emerald-950">
        {publisher.companyName}
      </span>
      {publisher.verified ? (
        <Check
          className="h-3.5 w-3.5 shrink-0 text-emerald-700"
          aria-label={t('business.dna.benefit.verified')}
        />
      ) : null}
      {showPremium ? (
        <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-800">
          {t('business.plan.badge.premium')}
        </span>
      ) : null}
    </div>
  );
}
