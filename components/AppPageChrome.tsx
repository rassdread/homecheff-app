'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isBottomNavigationHidden } from '@/lib/bottomNavRoutes';
import { useLandscapeWorkPosture } from '@/components/adaptive-workspace/WorkspaceChromeProvider';
import { cn } from '@/lib/utils';

/**
 * Omsluit main + footer: reserveert onderaan ruimte voor de vaste bottom nav + iOS safe-area,
 * zodat knoppen en footers links blijven scrollen i.p.v. onder de balk te verdwijnen.
 *
 * WX 1B.4: Landscape Work Posture collapses the bottom button menu — drop reserved pad.
 *
 * Bottom pad uses --hc-bottom-nav-offset (globals.css SSOT) so /messages height and
 * other routes share the same clearance math.
 */
export default function AppPageChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const landscape = useLandscapeWorkPosture();
  const navHidden = isBottomNavigationHidden(pathname);
  /** Berichten: eigen hoogte/padding (split-view, fixed chat) — dubbele marge met tabbalk voorkomen. */
  const messagesOwnInset = Boolean(pathname?.startsWith('/messages'));
  const bottomNavVisible =
    !navHidden && !landscape.bottomNavCollapsed;
  const applyNavBottomPad = bottomNavVisible && !messagesOwnInset;

  return (
    <div
      data-homecheff-app-chrome=""
      data-bottom-nav-visible={bottomNavVisible ? 'true' : 'false'}
      data-wx-landscape-work={landscape.workPostureActive ? '1' : '0'}
      data-messages-route={messagesOwnInset ? 'true' : 'false'}
      className={cn(
        'min-w-0 w-full max-w-full',
        applyNavBottomPad && 'max-lg:pb-[var(--hc-bottom-nav-offset)]'
      )}
    >
      {children}
    </div>
  );
}
