/**
 * Hook for ensuring session isolation between users
 * Prevents data leakage between different user sessions
 */

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { clearAllUserData, setupSessionIsolation, clearNextAuthData } from '@/lib/session-cleanup';

export function useSessionIsolation() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Setup session isolation on component mount
    setupSessionIsolation();
  }, []);

  useEffect(() => {
    // Only clear user data when definitely unauthenticated (not loading)
    if (status === 'unauthenticated') {
      clearAllUserData();
      clearNextAuthData();
    }
  }, [status]);

  // Return session data for convenience
  return { session, status };
}
