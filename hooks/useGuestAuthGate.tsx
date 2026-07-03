'use client';

import { useCallback, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import GuestExplanationPanel from '@/components/home/GuestExplanationPanel';
import { sanitizePostAuthRelativeUrl } from '@/lib/auth/post-auth-redirect';
import {
  guestAuthActionToPanel,
  type GuestAuthActionType,
} from '@/lib/guest/guest-auth-gate';

type OpenPanelState = {
  namespace: 'guestSalesPanels' | 'guestBottomNav';
  panel: string;
  registerHref: string;
  loginHref: string;
};

/**
 * Soft auth gate for homepage tiles, sidebar, and nav actions.
 * Guests see GuestExplanationPanel; signed-in users navigate normally.
 */
export function useGuestAuthGate() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [openPanel, setOpenPanel] = useState<OpenPanelState | null>(null);

  const isGuest = status !== 'loading' && !session?.user;
  const isAuthenticated = !!session?.user;

  const closeGuestPanel = useCallback(() => setOpenPanel(null), []);

  const requireAuthAction = useCallback(
    (action: GuestAuthActionType, href: string, e?: MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();

      if (isAuthenticated) {
        router.push(href);
        return true;
      }
      if (status === 'loading') return false;

      const mapped = guestAuthActionToPanel(action);
      const safeReturn = sanitizePostAuthRelativeUrl(href) || href;
      setOpenPanel({
        namespace: mapped.namespace,
        panel: mapped.panel,
        registerHref: `/register?returnUrl=${encodeURIComponent(safeReturn)}`,
        loginHref: `/login?callbackUrl=${encodeURIComponent(safeReturn)}`,
      });
      return false;
    },
    [isAuthenticated, status, router]
  );

  const guestAuthPanel = openPanel ? (
    <GuestExplanationPanel
      namespace={openPanel.namespace}
      panel={openPanel.panel}
      onClose={closeGuestPanel}
      registerHref={openPanel.registerHref}
      loginHref={openPanel.loginHref}
    />
  ) : null;

  return {
    isGuest,
    isAuthenticated,
    sessionStatus: status,
    requireAuthAction,
    closeGuestPanel,
    guestAuthPanel,
  };
}
