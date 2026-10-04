'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { primaryDashboardContextFromUser } from '@/lib/navigation/primary-dashboard';
import {
  readPresentationModePreference,
  writePresentationModePreference,
} from '@/lib/homeUiPreferences';
import {
  resolvePresentationMode,
  userCanAccessWorkspace,
  userHasActiveWorkspaceRoles,
  type HomePresentationMode,
} from '@/lib/home/presentation-mode';

/**
 * Session flags choose the default. localStorage overrides after mount.
 * First paint uses the default so server and client match.
 */
export function useHomePresentationMode() {
  const { data: session, status } = useSession();
  const ctx =
    status === 'authenticated'
      ? primaryDashboardContextFromUser(
          (session?.user ?? null) as Record<string, unknown> | null,
        )
      : null;
  const available = userCanAccessWorkspace(ctx);
  const hasActiveRoles = userHasActiveWorkspaceRoles(ctx);
  const [saved, setSaved] = useState<HomePresentationMode | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSaved(readPresentationModePreference());
    setHydrated(true);
  }, []);

  const mode = resolvePresentationMode(ctx, hydrated ? saved : null);

  const setMode = (next: HomePresentationMode) => {
    if (!available) return;
    setSaved(next);
    writePresentationModePreference(next);
  };

  return { mode, available, hasActiveRoles, setMode };
}
