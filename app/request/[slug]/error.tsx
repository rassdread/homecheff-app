'use client';

import { useEffect } from 'react';
import ListingDetailUnavailable from '@/components/product/ListingDetailUnavailable';
import { useTranslation } from '@/hooks/useTranslation';

export default function RequestDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error('[request-detail]', error);
  }, [error]);

  return (
    <ListingDetailUnavailable reason="network" t={t} onRetry={reset} />
  );
}
