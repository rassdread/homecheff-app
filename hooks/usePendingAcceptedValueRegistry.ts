'use client';

import { useEffect, useState } from 'react';
import {
  ensurePendingAcceptedValueRegistry,
  getPendingAcceptedValueRegistry,
} from '@/lib/marketplace/pending-accepted-values/client-registry';

/** Load pending accepted-value registry once per session (client-side). */
export function usePendingAcceptedValueRegistry(): {
  ready: boolean;
  registry: ReturnType<typeof getPendingAcceptedValueRegistry>;
} {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void ensurePendingAcceptedValueRegistry().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, registry: getPendingAcceptedValueRegistry() };
}
