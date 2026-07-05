'use client';

import { useCommsUnreadContext } from '@/components/communication/CommsUnreadProvider';

export type CommsUnreadState = {
  count: number;
  loading: boolean;
  refresh: () => Promise<number>;
};

const noopRefresh = async () => 0;

/**
 * Message unread badge hook — reads from CommsUnreadProvider when mounted.
 * Falls back to inert state outside provider (should not happen in app shell).
 */
export function useCommsUnread(_enabled = true): CommsUnreadState {
  const ctx = useCommsUnreadContext();

  if (!ctx) {
    return { count: 0, loading: false, refresh: noopRefresh };
  }

  return ctx;
}
