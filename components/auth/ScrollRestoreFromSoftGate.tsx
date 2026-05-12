'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { consumeScrollRestoreY } from '@/lib/onboarding/soft-gate-scroll';

/** Restores scroll after soft-gate → auth → return (one shot per navigation). */
export default function ScrollRestoreFromSoftGate() {
  const pathname = usePathname();

  useEffect(() => {
    const y = consumeScrollRestoreY();
    if (y == null) return;
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: 'auto' });
    });
  }, [pathname]);

  return null;
}
