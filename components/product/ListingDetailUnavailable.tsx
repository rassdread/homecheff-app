'use client';

import { AlertCircle, Package, RefreshCw } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import type { ListingDetailLoadError } from '@/lib/marketplace/detail/listing-detail-route';

type Props = {
  reason: ListingDetailLoadError;
  t: (key: string, params?: Record<string, string | number>) => string;
  onRetry?: () => void;
};

export default function ListingDetailUnavailable({ reason, t, onRetry }: Props) {
  const titleKey =
    reason === 'missing_param'
      ? 'product.detailError.missingParam'
      : reason === 'not_found'
        ? 'product.notFound'
        : reason === 'invalid'
          ? 'product.detailError.invalid'
          : 'product.detailError.network';

  const descKey =
    reason === 'network'
      ? 'product.detailError.networkHint'
      : reason === 'not_found'
        ? 'product.detailError.notFoundHint'
        : 'product.detailError.genericHint';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+6rem)]">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-200">
          {reason === 'network' ? (
            <AlertCircle className="h-12 w-12 text-amber-600" aria-hidden />
          ) : (
            <Package className="h-12 w-12 text-gray-400" aria-hidden />
          )}
        </div>
        <h1 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl">{t(titleKey)}</h1>
        <p className="mb-6 text-sm leading-relaxed text-gray-600">{t(descKey)}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              {t('product.detailError.retry')}
            </button>
          ) : null}
          <BackButton label={t('product.backToOverview')} />
        </div>
      </div>
    </main>
  );
}
