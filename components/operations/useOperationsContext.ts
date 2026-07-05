'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  primaryDashboardContextFromUser,
  resolveOperationsEntryFromUser,
} from '@/lib/navigation/primary-dashboard';
import type { SettingsHubContext } from '@/lib/settings/settings-hub';
import type { OperationsEntryResult } from '@/lib/operations/operations-entry';

export function useOperationsContext(): {
  ctx: SettingsHubContext | null;
  entry: OperationsEntryResult;
} {
  const { data: session } = useSession();
  const user = session?.user as Record<string, unknown> | undefined;

  const ctx = useMemo(
    () => primaryDashboardContextFromUser(user),
    [user],
  );

  const entry = useMemo(
    () => resolveOperationsEntryFromUser(user),
    [user],
  );

  return { ctx, entry };
}
