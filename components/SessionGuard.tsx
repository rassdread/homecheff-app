'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { clearNextAuthData, clearAllUserData } from '@/lib/session-cleanup';

/**
 * Component that guards against session data leakage
 * Automatically clears all user data when no valid session exists
 */
export default function SessionGuard() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only clear data if we're definitely unauthenticated (not loading)
    if (status === 'unauthenticated') {
      clearAllUserData();
      clearNextAuthData();
    }
  }, [status]);

  // This component doesn't render anything
  return null;
}
