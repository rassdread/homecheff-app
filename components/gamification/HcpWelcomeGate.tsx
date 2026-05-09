'use client';

import { useEffect, useState } from 'react';
import HcpWelcomeSheet from '@/components/gamification/HcpWelcomeSheet';
import { useGamificationMe } from '@/hooks/useGamificationMe';

/** Eénmalige HCP-welkom — data komt uit `/api/gamification/me` (`hcpWelcomePending`). */
export default function HcpWelcomeGate() {
  const { data, refetch } = useGamificationMe();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (data?.hcpWelcomePending) setOpen(true);
  }, [data?.hcpWelcomePending]);

  if (!open) return null;

  return (
    <HcpWelcomeSheet
      open={open}
      onDismiss={() => {
        setOpen(false);
        void refetch();
      }}
    />
  );
}
