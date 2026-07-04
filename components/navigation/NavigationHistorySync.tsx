'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { syncNavPath } from '@/lib/navigation/backHistory';

/** Keeps sessionStorage hints so BackButton can fall back when history is shallow. */
export default function NavigationHistorySync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams?.toString();
    const search = q ? `?${q}` : '';
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    syncNavPath(`${pathname || '/'}${search}${hash}`);
  }, [pathname, searchParams]);
  return null;
}
