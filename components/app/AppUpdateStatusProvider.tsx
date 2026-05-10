'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import { isNativeAndroid } from '@/lib/native/capacitor';
import { getCapacitorAppInfo } from '@/lib/native/getCapacitorAppInfo';
import { openExternalUrl } from '@/lib/native/openExternalUrl';
import { downloadApkAndOpenInstaller } from '@/lib/native/androidApkUpdateInstall';
import type { AppVersionApiResponse } from '@/lib/app-version-config';
import {
  deriveAndroidBetaUpdate,
  readOptionalDismissedSession,
  HC_APP_UPDATE_OPTIONAL_DISMISSED_EVENT,
} from '@/lib/android-beta-update-derived';
import { applyAndroidBetaInstallFlowAdjustments } from '@/lib/android-beta-install-flow-adjust';
import {
  readAndroidBetaInstallPersist,
  clearAndroidBetaInstallTracking,
  writeAndroidBetaLastInstalledSeen,
  type AndroidBetaInstallPersist,
} from '@/lib/native/android-beta-install-state';
import { isNativeApp } from '@/lib/native/capacitor';
import { shouldLogAppUpdateDebug } from '@/lib/app-update-debug';

export type AppUpdateStatusLine =
  | 'inactive'
  | 'loading'
  | 'disabled'
  | 'up_to_date'
  | 'force'
  | 'optional_modal'
  | 'optional_reminder';

type Ctx = {
  /** Native Android shell + bridge mounted. */
  scopeActive: boolean;
  loading: boolean;
  payload: AppVersionApiResponse | null;
  currentVersion: string | null;
  latestApkVersion: string;
  minRequiredApkVersion: string;
  derived: ReturnType<typeof deriveAndroidBetaUpdate> | null;
  statusLine: AppUpdateStatusLine;
  showOptionalReminder: boolean;
  showForceModal: boolean;
  showOptionalModal: boolean;
  refresh: () => void;
  syncInstallPersist: () => void;
  /** Same flow as AppUpdateGate primary CTA (HTTPS APK → installer; else open URL). */
  triggerApkDownload: () => Promise<void>;
};

const defaultCtx: Ctx = {
  scopeActive: false,
  loading: false,
  payload: null,
  currentVersion: null,
  latestApkVersion: '',
  minRequiredApkVersion: '',
  derived: null,
  statusLine: 'inactive',
  showOptionalReminder: false,
  showForceModal: false,
  showOptionalModal: false,
  refresh: () => {},
  syncInstallPersist: () => {},
  triggerApkDownload: async () => {},
};

const AppUpdateStatusContext = createContext<Ctx>(defaultCtx);

function resolveApkAbsoluteUrl(payload: AppVersionApiResponse | null): { resolvedApk: string; browserTarget: string } {
  if (typeof window === 'undefined') return { resolvedApk: '', browserTarget: '/app' };
  const origin = window.location.origin;
  const raw = (payload?.apkUrl ?? '').trim();
  const resolvedApk = raw.startsWith('/') ? `${origin}${raw}` : raw;
  let apk = payload?.apkUrl?.trim() ?? '';
  if (apk.startsWith('/')) apk = `${origin}${apk}`;
  const browserTarget = apk && /^https?:\/\//i.test(apk) ? apk : `${origin}/app`;
  return { resolvedApk, browserTarget };
}

const emptyPersist: AndroidBetaInstallPersist = {
  lastAttemptedVersion: '',
  lastInstalledVersionSeen: '',
  installStartedAt: 0,
  installerOpenedAt: 0,
  suppressModalUntil: 0,
};

export function AppUpdateStatusProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const nativeMounted = useIsNativeAppMounted();
  const scopeActive = nativeMounted && isNativeAndroid();

  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<AppVersionApiResponse | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [dismissTick, setDismissTick] = useState(0);
  const [installPersist, setInstallPersist] = useState<AndroidBetaInstallPersist>(emptyPersist);
  const [showApkSuccessToast, setShowApkSuccessToast] = useState(false);

  const dismissedOptional = scopeActive ? readOptionalDismissedSession() : false;

  const syncInstallPersist = useCallback(() => {
    if (typeof window === 'undefined') return;
    setInstallPersist(readAndroidBetaInstallPersist());
  }, []);

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
      syncInstallPersist();
    }
  }, [scopeActive, syncInstallPersist]);

  useEffect(() => {
    if (!scopeActive || typeof window === 'undefined') return;
    setInstallPersist(readAndroidBetaInstallPersist());
    const onCh = () => setInstallPersist(readAndroidBetaInstallPersist());
    window.addEventListener('hc-apk-install-persist-changed', onCh);
    return () => window.removeEventListener('hc-apk-install-persist-changed', onCh);
  }, [scopeActive]);

  useEffect(() => {
    if (!scopeActive) return;
    const t = window.setTimeout(() => {
      void runFetch();
    }, 650);
    return () => window.clearTimeout(t);
  }, [scopeActive, runFetch]);

  useEffect(() => {
    if (!scopeActive || typeof window === 'undefined') return;
    const onDismissed = () => setDismissTick((n) => n + 1);
    window.addEventListener(HC_APP_UPDATE_OPTIONAL_DISMISSED_EVENT, onDismissed);
    return () => window.removeEventListener(HC_APP_UPDATE_OPTIONAL_DISMISSED_EVENT, onDismissed);
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

  const derivedRaw = useMemo(() => {
    if (!payload || !scopeActive) return null;
    return deriveAndroidBetaUpdate(payload, currentVersion, readOptionalDismissedSession());
  }, [payload, scopeActive, currentVersion, dismissTick]);

  const derived = useMemo(() => {
    if (!derivedRaw || !scopeActive) return null;
    const now = Date.now();
    return applyAndroidBetaInstallFlowAdjustments(derivedRaw, {
      now,
      suppressModalUntil: installPersist.suppressModalUntil,
      installerOpenedAt: installPersist.installerOpenedAt,
      lastAttemptedVersion: installPersist.lastAttemptedVersion,
      currentVersion,
      latestApkVersion: (payload?.latestApkVersion ?? '').trim(),
    });
  }, [derivedRaw, scopeActive, installPersist, currentVersion, payload?.latestApkVersion]);

  const latestApkVersion = (payload?.latestApkVersion ?? '').trim();
  const minRequiredApkVersion = (payload?.minRequiredApkVersion ?? '').trim();

  const showForceModal = Boolean(scopeActive && payload?.enabled && derived?.forceUi);
  const showOptionalModal = Boolean(scopeActive && payload?.enabled && derived?.optionalModal);
  const showOptionalReminder = Boolean(scopeActive && payload?.enabled && derived?.optionalReminder);

  let statusLine: AppUpdateStatusLine = 'inactive';
  if (!scopeActive) statusLine = 'inactive';
  else if (loading && !payload) statusLine = 'loading';
  else if (!payload) statusLine = 'disabled';
  else if (!payload.enabled) statusLine = 'disabled';
  else if (!derived) statusLine = 'loading';
  else if (derived.forceUi) statusLine = 'force';
  else if (derived.optionalModal) statusLine = 'optional_modal';
  else if (derived.optionalReminder) statusLine = 'optional_reminder';
  else statusLine = 'up_to_date';

  const prevBelowLatestRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (!scopeActive || loading || !derived) return;
    const below = derived.belowLatest;
    if (prevBelowLatestRef.current === true && below === false) {
      setShowApkSuccessToast(true);
      clearAndroidBetaInstallTracking();
      if (currentVersion?.trim()) {
        writeAndroidBetaLastInstalledSeen(currentVersion.trim());
      }
      syncInstallPersist();
      const tmr = window.setTimeout(() => setShowApkSuccessToast(false), 5200);
      return () => window.clearTimeout(tmr);
    }
    prevBelowLatestRef.current = below;
  }, [scopeActive, loading, derived, currentVersion, syncInstallPersist]);

  const triggerApkDownload = useCallback(async () => {
    if (!scopeActive || typeof window === 'undefined') return;
    const p = payload;
    if (!p) return;
    const origin = window.location.origin;
    const raw = (p.apkUrl ?? '').trim();
    const resolvedApk = raw.startsWith('/') ? `${origin}${raw}` : raw;
    const { browserTarget } = resolveApkAbsoluteUrl(p);
    const useNativeInstall = isNativeAndroid() && /^https:\/\//i.test(resolvedApk);
    const targetVer = (p.latestApkVersion ?? '').trim();

    if (useNativeInstall) {
      const result = await downloadApkAndOpenInstaller(resolvedApk, targetVer, () => {});
      syncInstallPersist();
      if (!result.ok && result.fallbackToBrowser) {
        await openExternalUrl(resolvedApk);
      }
      return;
    }
    await openExternalUrl(browserTarget);
  }, [scopeActive, payload, syncInstallPersist]);

  const refresh = useCallback(() => {
    setDismissTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!shouldLogAppUpdateDebug() || typeof window === 'undefined') return;
    const now = Date.now();
    void (async () => {
      let capVersion: string | null = null;
      try {
        const info = await getCapacitorAppInfo();
        capVersion = info.version;
      } catch {
        capVersion = null;
      }
      console.info('[app-update-debug]', {
        nativeMounted,
        isNativeApp: isNativeApp(),
        isNativeAndroid: isNativeAndroid(),
        capAppGetInfoVersion: capVersion,
        dismissedOptional: readOptionalDismissedSession(),
        scopeActive,
        currentVersion,
        latestApkVersion,
        minRequiredApkVersion,
        forceUpdate: payload?.forceUpdate,
        enabled: payload?.enabled,
        belowMin: derived?.belowMin,
        belowLatest: derived?.belowLatest,
        hasValidCurrent: derived?.hasValidCurrent,
        derivedRawForceUi: derivedRaw?.forceUi,
        derivedForceUi: derived?.forceUi,
        dismissedOptional,
        showForceModal: Boolean(scopeActive && payload?.enabled && derived?.forceUi),
        showOptionalModal: Boolean(scopeActive && payload?.enabled && derived?.optionalModal),
        showOptionalReminder: Boolean(scopeActive && payload?.enabled && derived?.optionalReminder),
        suppressModalUntil: installPersist.suppressModalUntil,
        suppressModalActive: now < installPersist.suppressModalUntil,
        installStartedAt: installPersist.installStartedAt,
        installerOpenedAt: installPersist.installerOpenedAt,
        loading,
        hasPayload: Boolean(payload),
      });
    })();
  }, [
    nativeMounted,
    scopeActive,
    currentVersion,
    latestApkVersion,
    minRequiredApkVersion,
    payload?.enabled,
    payload?.forceUpdate,
    derived,
    derivedRaw,
    showForceModal,
    showOptionalModal,
    showOptionalReminder,
    installPersist.suppressModalUntil,
    installPersist.installStartedAt,
    installPersist.installerOpenedAt,
    loading,
    dismissTick,
  ]);

  const value = useMemo<Ctx>(
    () => ({
      scopeActive,
      loading,
      payload,
      currentVersion,
      latestApkVersion,
      minRequiredApkVersion,
      derived,
      statusLine,
      showOptionalReminder,
      showForceModal,
      showOptionalModal,
      refresh,
      syncInstallPersist,
      triggerApkDownload,
    }),
    [
      scopeActive,
      loading,
      payload,
      currentVersion,
      latestApkVersion,
      minRequiredApkVersion,
      derived,
      statusLine,
      showOptionalReminder,
      showForceModal,
      showOptionalModal,
      refresh,
      syncInstallPersist,
      triggerApkDownload,
    ]
  );

  return (
    <AppUpdateStatusContext.Provider value={value}>
      {scopeActive && showApkSuccessToast ? (
        <div
          className="pointer-events-none fixed bottom-28 left-1/2 z-[230] max-w-[min(92vw,22rem)] -translate-x-1/2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-center shadow-xl"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-emerald-900">
            {t('appUpdateGate.updateSuccessTitle')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-800/90">
            {t('appUpdateGate.updateSuccessBody')}
          </p>
        </div>
      ) : null}
      {children}
    </AppUpdateStatusContext.Provider>
  );
}

export function useAppUpdateStatus(): Ctx {
  return useContext(AppUpdateStatusContext);
}
