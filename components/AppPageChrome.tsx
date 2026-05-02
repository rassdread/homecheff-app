'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isBottomNavigationHidden } from '@/lib/bottomNavRoutes';
import { cn } from '@/lib/utils';

/**
 * Omsluit main + footer: reserveert onderaan ruimte voor de vaste bottom nav + iOS safe-area,
 * zodat knoppen en footers links blijven scrollen i.p.v. onder de balk te verdwijnen.
 */
export default function AppPageChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const navHidden = isBottomNavigationHidden(pathname);

  return (
    <div
      className={cn(
        'min-w-0 w-full max-w-full',
        !navHidden &&
          'pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]'
      )}
    >
      {children}
    </div>
  );
}
