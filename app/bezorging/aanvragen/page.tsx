'use client';

import { Suspense } from 'react';
import { StandaloneDeliveryRequest } from '@/components/delivery/StandaloneDeliveryRequest';

export default function StandaloneDeliveryPage() {
  return (
    <Suspense fallback={null}>
      <StandaloneDeliveryRequest />
    </Suspense>
  );
}
