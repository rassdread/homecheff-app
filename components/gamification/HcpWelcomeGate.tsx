'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import HcpWelcomeSheet from '@/components/gamification/HcpWelcomeSheet';
import { useGamificationMe } from '@/hooks/useGamificationMe';

/** Eénmalige HCP-welkom — data komt uit `/api/gamification/me` (`hcpWelcomePending`). Alleen ingelogde gebruikers; na dismiss schrijft de API `hcpWelcomeSeenAt`. */
export default function HcpWelcomeGate() {
  const { status } = useSession();
  const { data, refetch } = useGamificationMe();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      setOpen(false);
      return;
    }
    if (data?.hcpWelcomePending) setOpen(true);
  }, [status, data?.hcpWelcomePending]);

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
