/**
 * Hook for ensuring session isolation between users
 * Prevents data leakage between different user sessions
 */

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { setupSessionIsolation } from '@/lib/session-cleanup';
import { clearPx4aItemFormDraft } from '@/lib/studio/px4a-item-form-draft';

export function useSessionIsolation() {
  const { data: session, status } = useSession();
  const prev = useRef<typeof status | null>(null);

  useEffect(() => {
    setupSessionIsolation();
  }, []);

  useEffect(() => {
    // A brief NextAuth "unauthenticated" flicker is not a logout. It must not
    // delete the account cart. Confirmed logout still clears that cart in
    // performLogout and SessionGuard. The listing-draft clear below stays.
    if (prev.current === 'authenticated' && status === 'unauthenticated') {
      clearPx4aItemFormDraft();
    }
    prev.current = status;
  }, [status]);

  return { session, status };
}
