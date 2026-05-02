'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { clearAllUserData } from '@/lib/session-cleanup';

/**
 * Component that guards against session data leakage.
 * When unauthenticated we only clear local/session storage (clearAllUserData).
 * We do NOT call clearNextAuthData() here: that wipes cookies and reloads, and would
 * trigger on transient refetch failures in Chrome (refetchOnWindowFocus), causing reload loops.
 * clearNextAuthData + hard redirect is only a fallback if signOut throws.
 */
export default function SessionGuard() {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      clearAllUserData();
    }
  }, [status]);

  return null;
}
