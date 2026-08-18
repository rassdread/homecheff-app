/**
 * Hook for ensuring session isolation between users
 * Prevents data leakage between different user sessions
 */

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { clearSensitiveUserDataOnLogout, setupSessionIsolation } from '@/lib/session-cleanup';

export function useSessionIsolation() {
  const { data: session, status } = useSession();
  const prev = useRef<typeof status | null>(null);

  useEffect(() => {
    setupSessionIsolation();
  }, []);

  useEffect(() => {
    // Match SessionGuard: only wipe on a confirmed logout.
    // A brief NextAuth "unauthenticated" flicker on /sell/new remount must not
    // clear hc-px4a-item-form:v1 during a HomeCheff → Studio → HomeCheff round-trip.
    if (prev.current === 'authenticated' && status === 'unauthenticated') {
      clearSensitiveUserDataOnLogout();
    }
    prev.current = status;
  }, [status]);

  return { session, status };
}
