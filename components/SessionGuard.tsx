'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { clearSensitiveUserDataOnLogout } from '@/lib/session-cleanup';
import { clearPx4aItemFormDraft } from '@/lib/studio/px4a-item-form-draft';

/**
 * Clears sensitive storage only on a confirmed transition to logged-out
 * (avoids wiping create-flow drafts / pending intent on a brief "unauthenticated" flicker).
 */
export default function SessionGuard() {
  const { status } = useSession();
  const prev = useRef<typeof status | null>(null);

  useEffect(() => {
    if (prev.current === 'authenticated' && status === 'unauthenticated') {
      clearSensitiveUserDataOnLogout();
      clearPx4aItemFormDraft();
    }
    prev.current = status;
  }, [status]);

  return null;
}
