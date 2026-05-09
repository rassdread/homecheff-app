'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import HcpRewardToastDock from '@/components/gamification/HcpRewardToast';
import { useGamificationMe } from '@/hooks/useGamificationMe';
import type { GamificationMeResponse } from '@/lib/gamification/gamification-me-types';

type Ctx = {
  refetchGamification: () => Promise<GamificationMeResponse | null>;
};

const HcpRewardUiContext = createContext<Ctx | null>(null);

export function useHcpRewardUi() {
  return useContext(HcpRewardUiContext);
}

/**
 * Bridges `/api/gamification/me` → `pendingClientRewards` into lightweight toasts (CSS only).
 */
export function HcpRewardProvider({ children }: { children: React.ReactNode }) {
  const { data, refetch } = useGamificationMe();

  const refetchGamification = useCallback(() => refetch(), [refetch]);

  const ctx = useMemo(() => ({ refetchGamification }), [refetchGamification]);

  return (
    <HcpRewardUiContext.Provider value={ctx}>
      <HcpRewardToastDock pending={data?.pendingClientRewards} />
      {children}
    </HcpRewardUiContext.Provider>
  );
}
