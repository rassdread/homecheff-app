import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StandaloneDeliveryRequest } from '@/components/delivery/StandaloneDeliveryRequest';
import { transportProposalsEnabled } from '@/lib/delivery/transport-job';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function StandaloneDeliveryPage({
  searchParams,
}: {
  searchParams?: { request?: string };
}) {
  return (
    <Suspense fallback={null}>
      <StandaloneDeliveryRequest
        transportEnabled={transportProposalsEnabled()}
        initialRequestId={searchParams?.request || ''}
      />
    </Suspense>
  );
}
