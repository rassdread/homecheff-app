'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AppVersionApiResponse } from '@/lib/app-version-config';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppUpdateStatus } from '@/components/app/AppUpdateStatusProvider';

const LS_LAST_WEB_VERSION = 'hc:lastSeenWebVersion';

/**
 * Soft web-content refresh toast for native shells when the server web version bumps.
 * APK OTA modals are disabled — see PlayStoreMigrationGate for sideload → Play migration.
 */
export default function AppUpdateGate() {
  const { t } = useTranslation();
  const router = useRouter();
  const { scopeActive, payload, apkUpdateEnabled } = useAppUpdateStatus();
  const [webToast, setWebToast] = useState(false);

  const runSoftWebRefresh = useCallback(
    (data: AppVersionApiResponse) => {
      if (apkUpdateEnabled || typeof window === 'undefined') return;
      try {
        const stored = localStorage.getItem(LS_LAST_WEB_VERSION);
        if (stored === data.latestWebVersion) return;
        localStorage.setItem(LS_LAST_WEB_VERSION, data.latestWebVersion);
        router.refresh();
        setWebToast(true);
        window.setTimeout(() => setWebToast(false), 4500);
      } catch {
        /* ignore */
      }
    },
    [router, apkUpdateEnabled],
  );

  useEffect(() => {
    if (!scopeActive || !payload) return;
    runSoftWebRefresh(payload);
  }, [scopeActive, payload, runSoftWebRefresh]);

  if (!webToast) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-24 left-1/2 z-[210] max-w-[min(92vw,20rem)] -translate-x-1/2 rounded-xl border border-emerald-100 bg-emerald-50/95 px-4 py-3 text-center text-sm font-medium text-emerald-900 shadow-lg"
      role="status"
      aria-live="polite"
    >
      {t('appUpdateGate.webVersionToast')}
    </div>
  );
}
