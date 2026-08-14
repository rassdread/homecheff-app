'use client';

import { useEffect, useRef } from 'react';
import { bindOverlayHistoryBack } from '@/lib/nav/overlay-history-back';

/**
 * Bind phone/browser Back to dismiss a local-state overlay while it is open.
 */
export function useOverlayHistoryBack(
  id: string,
  open: boolean,
  onDismiss: () => void,
): void {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!open) return;
    return bindOverlayHistoryBack({
      id,
      active: true,
      onDismiss: () => dismissRef.current(),
    });
  }, [id, open]);
}
