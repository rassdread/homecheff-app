/**
 * Hook for ensuring session isolation between users
 * Prevents data leakage between different user sessions
 */

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { clearAllUserData, setupSessionIsolation } from '@/lib/session-cleanup';

export function useSessionIsolation() {
  const { data: session, status } = useSession();

  useEffect(() => {
    setupSessionIsolation();
  }, []);

  useEffect(() => {
    // Clear only local/session storage when unauthenticated (no cookie wipe + reload).
    // Avoids reload loop in Chrome when session refetch fails temporarily.
    if (status === 'unauthenticated') {
      clearAllUserData();
    }
  }, [status]);

  // Return session data for convenience
  return { session, status };
}
