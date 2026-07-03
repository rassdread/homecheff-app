'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import GuestExplanationPanel from '@/components/home/GuestExplanationPanel';
import { sanitizePostAuthRelativeUrl } from '@/lib/auth/post-auth-redirect';
import type { GuestBottomNavPanelId } from '@/lib/guest/guest-explanation-panels';
import { savePendingIntent } from '@/lib/onboarding/pending-intent';

type GuestPanelAuthPaths = {
  register: string;
  login: string;
};

/**
 * Guest explanation panels for bottom-nav-style actions (messages, profile, …).
 * Matches BottomNavigation openGuestBottomNavPanel + handleMessagesClick behavior.
 */
export function useGuestBottomNavPanel() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [guestBottomNavPanel, setGuestBottomNavPanel] = useState<GuestBottomNavPanelId | null>(
    null
  );
  const [guestPanelAuthPaths, setGuestPanelAuthPaths] = useState<GuestPanelAuthPaths>({
    register: '/register',
    login: '/login',
  });

  const openGuestBottomNavPanel = useCallback(
    (id: GuestBottomNavPanelId, returnPath: string, onBeforeOpen?: () => void) => {
      onBeforeOpen?.();
      const safeReturn = sanitizePostAuthRelativeUrl(returnPath) || returnPath;
      setGuestPanelAuthPaths({
        register: `/register?returnUrl=${encodeURIComponent(safeReturn)}`,
        login: `/login?callbackUrl=${encodeURIComponent(safeReturn)}`,
      });
      setGuestBottomNavPanel(id);
    },
    []
  );

  const closeGuestPanel = useCallback(() => setGuestBottomNavPanel(null), []);

  const handleGuestMessagesClick = useCallback(() => {
    if (!session?.user && sessionStatus === 'unauthenticated') {
      const p = sanitizePostAuthRelativeUrl('/messages') || '/messages';
      openGuestBottomNavPanel('messages', p, () => {
        savePendingIntent({ type: 'complete_profile', returnPath: p });
      });
      return;
    }
    router.push('/messages');
  }, [session?.user, sessionStatus, openGuestBottomNavPanel, router]);

  const handleGuestReputationClick = useCallback(() => {
    if (!session?.user && sessionStatus === 'unauthenticated') {
      const p = sanitizePostAuthRelativeUrl('/mijn-hcp') || '/mijn-hcp';
      openGuestBottomNavPanel('reputation', p, () => {
        savePendingIntent({ type: 'complete_profile', returnPath: p });
      });
      return;
    }
    router.push('/mijn-hcp');
  }, [session?.user, sessionStatus, openGuestBottomNavPanel, router]);

  const guestBottomNavPanelEl = (
    <GuestExplanationPanel
      namespace="guestBottomNav"
      panel={guestBottomNavPanel}
      onClose={closeGuestPanel}
      registerHref={guestPanelAuthPaths.register}
      loginHref={guestPanelAuthPaths.login}
    />
  );

  return {
    sessionStatus,
    openGuestBottomNavPanel,
    handleGuestMessagesClick,
    handleGuestReputationClick,
    guestBottomNavPanelEl,
    closeGuestPanel,
  };
}
