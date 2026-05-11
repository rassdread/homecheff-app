'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { syncNavPath } from '@/lib/navigation/backHistory';

/** Keeps sessionStorage hints so BackButton can fall back when history is shallow. */
export default function NavigationHistorySync() {
  const pathname = usePathname();
  useEffect(() => {
    syncNavPath(pathname || '/');
  }, [pathname]);
  return null;
}
