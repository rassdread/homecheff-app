'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import { isNativeAndroid } from '@/lib/native/capacitor';
import { getCapacitorAppInfo } from '@/lib/native/getCapacitorAppInfo';
import { openExternalUrl } from '@/lib/native/openExternalUrl';
import type { AppVersionApiResponse } from '@/lib/app-version-config';
import {
  getGooglePlayOpenTestingUrl,
  isPlayOpenTestingUrlConfigured,
  readPlayMigrationDismissed,
  writePlayMigrationDismissed,
} from '@/lib/app-distribution';
import {
  getAndroidInstallSource,
  type AndroidInstallSource,
} from '@/lib/native/getAndroidInstallSource';
import { shouldLogAppUpdateDebug } from '@/lib/app-update-debug';

export type AppUpdateStatusLine =
  | 'inactive'
  | 'loading'
  | 'disabled'
  | 'up_to_date'
  | 'play_managed'
  | 'play_migration';

type Ctx = {
  scopeActive: boolean;
  loading: boolean;
  payload: AppVersionApiResponse | null;
  currentVersion: string | null;
  latestApkVersion: string;
  installSource: AndroidInstallSource | null;
  installSourceLoading: boolean;
  playStoreUrl: string;
  playMigrationEnabled: boolean;
  apkUpdateEnabled: boolean;
  statusLine: AppUpdateStatusLine;
  showPlayMigration: boolean;
  showPlayMigrationStrip: boolean;
  /** @deprecated Legacy sideload APK flow — disabled for Play distribution. */
  showOptionalReminder: boolean;
  showForceModal: boolean;
  showOptionalModal: boolean;
  refresh: () => void;
  openPlayStore: () => Promise<void>;
  dismissPlayMigration: () => void;
  /** @deprecated Legacy sideload APK flow. Disabled for Play distribution. */
  triggerApkDownload: () => Promise<void>;
  syncInstallPersist: () => void;
};

const defaultCtx: Ctx = {
  scopeActive: false,
  loading: false,
  payload: null,
  currentVersion: null,
  latestApkVersion: '',
  installSource: null,
  installSourceLoading: false,
  playStoreUrl: '',
  playMigrationEnabled: false,
  apkUpdateEnabled: false,
  statusLine: 'inactive',
  showPlayMigration: false,
  showPlayMigrationStrip: false,
  showOptionalReminder: false,
  showForceModal: false,
  showOptionalModal: false,
  refresh: () => {},
  openPlayStore: async () => {},
  dismissPlayMigration: () => {},
  triggerApkDownload: async () => {},
  syncInstallPersist: () => {},
};

const AppUpdateStatusContext = createContext<Ctx>(defaultCtx);

export const HC_PLAY_MIGRATION_DISMISSED_EVENT = 'hc-play-migration-dismissed';

export function AppUpdateStatusProvider({ children }: { children: React.ReactNode }) {
  const nativeMounted = useIsNativeAppMounted();
  const scopeActive = nativeMounted && isNativeAndroid();

  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<AppVersionApiResponse | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [installSource, setInstallSource] = useState<AndroidInstallSource | null>(null);
  const [installSourceLoading, setInstallSourceLoading] = useState(false);
  const [migrationDismissed, setMigrationDismissed] = useState(false);

  const playStoreUrlClient = getGooglePlayOpenTestingUrl();
  const playStoreUrl = (payload?.playStoreUrl ?? '').trim() || playStoreUrlClient;
  const playMigrationEnabled = Boolean(
    payload?.playMigrationEnabled ??
      (isPlayOpenTestingUrlConfigured(playStoreUrlClient) &&
        (process.env.NEXT_PUBLIC_APP_DISTRIBUTION ?? 'play') === 'play'),
  );
  const apkUpdateEnabled = Boolean(payload?.apkUpdateEnabled);

  useEffect(() => {
    if (!scopeActive || typeof window === 'undefined') return;
    setMigrationDismissed(readPlayMigrationDismissed());
    const onDismissed = () => setMigrationDismissed(readPlayMigrationDismissed());
    window.addEventListener(HC_PLAY_MIGRATION_DISMISSED_EVENT, onDismissed);
    return () => window.removeEventListener(HC_PLAY_MIGRATION_DISMISSED_EVENT, onDismissed);
  }, [scopeActive]);

  const runFetch = useCallback(async () => {
    if (!scopeActive) {
      setPayload(null);
      setCurrentVersion(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [res, appInfo] = await Promise.all([
        fetch('/api/app-version', { credentials: 'same-origin', cache: 'no-store' }),
        getCapacitorAppInfo(),
      ]);
      if (!res.ok) {
        setPayload(null);
        setCurrentVersion(appInfo.version?.trim() || null);
        return;
      }
      const data = (await res.json()) as AppVersionApiResponse;
      setPayload(data);
      setCurrentVersion(appInfo.version?.trim() || null);
    } catch {
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [scopeActive]);

  useEffect(() => {
    if (!scopeActive) return;
    const tmr = window.setTimeout(() => {
      void runFetch();
    }, 650);
    return () => window.clearTimeout(tmr);
  }, [scopeActive, runFetch]);

  useEffect(() => {
    if (!scopeActive) {
      setInstallSource(null);
      return;
    }
    let cancelled = false;
    setInstallSourceLoading(true);
    void getAndroidInstallSource().then((src) => {
      if (!cancelled) {
        setInstallSource(src);
        setInstallSourceLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [scopeActive]);

  useEffect(() => {
    if (!scopeActive || typeof document === 'undefined') return;
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      window.setTimeout(() => {
        void runFetch();
      }, 2000);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [scopeActive, runFetch]);

  const isPlayInstall = Boolean(installSource?.isPlayStoreInstall);
  const needsPlayMigration =
    scopeActive &&
    playMigrationEnabled &&
    !migrationDismissed &&
    isPlayOpenTestingUrlConfigured(playStoreUrl) &&
    !installSourceLoading &&
    installSource != null &&
    !isPlayInstall &&
    Boolean(installSource.isSideloadInstall || installSource.unknown);

  const openPlayStore = useCallback(async () => {
    const url = playStoreUrl.trim();
    if (!url || !isPlayOpenTestingUrlConfigured(url)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[app-update] NEXT_PUBLIC_GOOGLE_PLAY_OPEN_TESTING_URL is not configured');
      }
      return;
    }
    await openExternalUrl(url);
  }, [playStoreUrl]);

  const dismissPlayMigration = useCallback(() => {
    writePlayMigrationDismissed();
    setMigrationDismissed(true);
  }, []);

  /** Legacy sideload APK OTA — disabled for Play distribution. */
  const triggerApkDownload = useCallback(async () => {
    if (!apkUpdateEnabled) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[app-update] triggerApkDownload ignored — APK updates disabled (Play distribution)');
      }
      await openPlayStore();
      return;
    }
  }, [apkUpdateEnabled, openPlayStore]);

  const refresh = useCallback(() => {
    void runFetch();
    void getAndroidInstallSource().then(setInstallSource);
  }, [runFetch]);

  const latestApkVersion = (payload?.latestApkVersion ?? '').trim();

  let statusLine: AppUpdateStatusLine = 'inactive';
  if (!scopeActive) statusLine = 'inactive';
  else if (loading && !payload) statusLine = 'loading';
  else if (isPlayInstall) statusLine = 'play_managed';
  else if (needsPlayMigration) statusLine = 'play_migration';
  else if (!payload) statusLine = 'disabled';
  else statusLine = 'up_to_date';

  useEffect(() => {
    if (!shouldLogAppUpdateDebug() || typeof window === 'undefined' || !scopeActive) return;
    console.info('[app-update-debug]', {
      scopeActive,
      currentVersion,
      latestApkVersion,
      apkUpdateEnabled,
      playMigrationEnabled,
      playStoreUrl: playStoreUrl ? '(set)' : '(missing)',
      installSource,
      needsPlayMigration,
      migrationDismissed,
    });
  }, [
    scopeActive,
    currentVersion,
    latestApkVersion,
    apkUpdateEnabled,
    playMigrationEnabled,
    playStoreUrl,
    installSource,
    needsPlayMigration,
    migrationDismissed,
  ]);

  const value = useMemo<Ctx>(
    () => ({
      scopeActive,
      loading,
      payload,
      currentVersion,
      latestApkVersion,
      installSource,
      installSourceLoading,
      playStoreUrl,
      playMigrationEnabled,
      apkUpdateEnabled,
      statusLine,
      showPlayMigration: needsPlayMigration,
      showPlayMigrationStrip: needsPlayMigration,
      showOptionalReminder: false,
      showForceModal: false,
      showOptionalModal: false,
      refresh,
      openPlayStore,
      dismissPlayMigration,
      triggerApkDownload,
      syncInstallPersist: () => {},
    }),
    [
      scopeActive,
      loading,
      payload,
      currentVersion,
      latestApkVersion,
      installSource,
      installSourceLoading,
      playStoreUrl,
      playMigrationEnabled,
      apkUpdateEnabled,
      statusLine,
      needsPlayMigration,
      refresh,
      openPlayStore,
      dismissPlayMigration,
      triggerApkDownload,
    ],
  );

  return (
    <AppUpdateStatusContext.Provider value={value}>{children}</AppUpdateStatusContext.Provider>
  );
}

export function useAppUpdateStatus(): Ctx {
  return useContext(AppUpdateStatusContext);
}
