'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  readHeroCollapsedFromStorage,
  readHeroCollapsedPreference,
  writeHeroCollapsed,
} from '@/lib/homeUiPreferences';

export function useHomeHeroCollapsed() {
  const { status } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  useLayoutEffect(() => {
    setCollapsed(readHeroCollapsedFromStorage());
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/user/home-ui', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { hideHomeHero?: boolean };
        const localPref = readHeroCollapsedPreference();
        const server = Boolean(json.hideHomeHero);
        const next = localPref ?? server;
        if (cancelled) return;
        setCollapsed(next);
        writeHeroCollapsed(next);
        if (next !== server) {
          await fetch('/api/user/home-ui', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hideHomeHero: next }),
          });
        }
      } catch {
        /* keep local preference */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const setHeroCollapsed = useCallback(
    (next: boolean) => {
      setCollapsed(next);
      writeHeroCollapsed(next);
      if (status === 'authenticated') {
        void fetch('/api/user/home-ui', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hideHomeHero: next }),
        }).catch(() => {});
      }
    },
    [status],
  );

  const toggle = useCallback(() => {
    setHeroCollapsed(!collapsed);
  }, [collapsed, setHeroCollapsed]);

  return { collapsed, setHeroCollapsed, toggle };
}
