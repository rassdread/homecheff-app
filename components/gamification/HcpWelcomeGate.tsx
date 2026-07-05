'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import HcpWelcomeSheet from '@/components/gamification/HcpWelcomeSheet';
import { useGamificationMe } from '@/hooks/useGamificationMe';
import { usePathname } from 'next/navigation';

/** Eénmalige welkom — alleen op /mijn-hcp en pas na eerste activiteit (niet op eerste homepage-bezoek). */
export default function HcpWelcomeGate() {
  const { status } = useSession();
  const pathname = usePathname();
  const { data, refetch } = useGamificationMe();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      setOpen(false);
      return;
    }
    if (!pathname?.startsWith('/mijn-hcp')) {
      setOpen(false);
      return;
    }
    if (!data?.hcpWelcomePending) {
      setOpen(false);
      return;
    }
    const hasActivity =
      (data.totalHcp ?? 0) > 0 ||
      (data.recentEvents?.length ?? 0) > 0 ||
      (data.badges?.length ?? 0) > 0;
    setOpen(hasActivity);
  }, [status, pathname, data?.hcpWelcomePending, data?.totalHcp, data?.recentEvents, data?.badges]);

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
