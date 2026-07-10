'use client';

import { useEffect } from 'react';
import ListingDetailUnavailable from '@/components/product/ListingDetailUnavailable';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProductDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error('[product-detail]', error);
  }, [error]);

  return (
    <ListingDetailUnavailable reason="network" t={t} onRetry={reset} />
  );
}
