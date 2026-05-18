'use client';

import { useCallback, useEffect, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { isNativeAndroid } from '@/lib/native/capacitor';
import { openExternalUrl } from '@/lib/native/openExternalUrl';
import {
  ANDROID_BETA_EXPORT_APK_FILE_NAME,
  copyCachedBetaApkToDownloads,
  downloadApkAndOpenInstaller,
  openCachedApkInstallerOnly,
  type ApkInstallPhase,
  type ApkInstallFailureKind,
} from '@/lib/native/androidApkUpdateInstall';
import { writeAndroidBetaInstallerOpened } from '@/lib/native/android-beta-install-state';
import type { AppVersionApiResponse } from '@/lib/app-version-config';
import { useTranslation } from '@/hooks/useTranslation';
import { markOptionalDismissedSession } from '@/lib/android-beta-update-derived';
import { useAppUpdateStatus } from '@/components/app/AppUpdateStatusProvider';
import { HomecheffApkInstaller } from '@/lib/native/homecheffApkInstaller';
import { isHomecheffApkInstallerNativeAvailable } from '@/lib/native/isHomecheffApkInstallerNativeAvailable';
import { shouldLogAppUpdateDebug } from '@/lib/app-update-debug';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import { apkInstallUserMessage } from '@/lib/native/apkInstallUserMessage';

const LS_LAST_WEB_VERSION = 'hc:lastSeenWebVersion';

type GateMode = 'idle' | 'force' | 'optional';

function StepRow(props: {
  n: number;
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          props.done
            ? 'bg-emerald-600 text-white'
            : props.active
              ? 'bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500/30'
              : 'bg-gray-100 text-gray-500'
        }`}
      >
        {props.done ? '✓' : props.n}
      </div>
      <p
        className={`text-sm leading-snug ${
          props.active ? 'font-semibold text-gray-900' : 'text-gray-600'
        }`}
      >
        {props.label}
      </p>
    </div>
  );
}

export default function AppUpdateGate() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    scopeActive,
    payload,
    derived,
    showForceModal,
    showOptionalModal,
    syncInstallPersist,
  } = useAppUpdateStatus();

  const mode: GateMode = showForceModal ? 'force' : showOptionalModal ? 'optional' : 'idle';

  const [webToast, setWebToast] = useState(false);
  const [installPhase, setInstallPhase] = useState<ApkInstallPhase>('idle');
  const [installPct, setInstallPct] = useState<number | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const [failureKind, setFailureKind] = useState<ApkInstallFailureKind | null>(null);
  const [showPostGuide, setShowPostGuide] = useState(false);
  const [installFallbackReason, setInstallFallbackReason] = useState<string | null>(null);
  const [installCachedApkAvailable, setInstallCachedApkAvailable] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [exportAllowsDownloadsFolder, setExportAllowsDownloadsFolder] = useState(false);
  const [saveToDownloadsBusy, setSaveToDownloadsBusy] = useState(false);
  const [exportSaveError, setExportSaveError] = useState<string | null>(null);
  const nativeMounted = useIsNativeAppMounted();

  const runSoftWebRefresh = useCallback(
    (data: AppVersionApiResponse, apkBlocksSoft: boolean) => {
      if (apkBlocksSoft || typeof window === 'undefined') return;
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
    [router]
  );

  useEffect(() => {
    if (!scopeActive || !payload) return;
    if (showForceModal || showOptionalModal) return;
    runSoftWebRefresh(payload, Boolean(derived?.apkBlocksSoft));
  }, [scopeActive, payload, showForceModal, showOptionalModal, derived?.apkBlocksSoft, runSoftWebRefresh]);

  const resolveApkUrl = useCallback((): string => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    let apk = payload?.apkUrl?.trim() ?? '';
    if (apk.startsWith('/')) apk = `${origin}${apk}`;
    return apk && /^https?:\/\//i.test(apk) ? apk : `${origin}/app`;
  }, [payload?.apkUrl]);

  const resetInstallUi = useCallback(() => {
    setInstallPhase('idle');
    setInstallPct(null);
    setInstallError(null);
    setFailureKind(null);
    setShowPostGuide(false);
    setInstallFallbackReason(null);
    setInstallCachedApkAvailable(false);
  }, []);

  const onUpdateNow = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const p = payload;
    if (!p) return;
    const origin = window.location.origin;
    const raw = (p.apkUrl ?? '').trim();
    const resolvedApk = raw.startsWith('/') ? `${origin}${raw}` : raw;
    const browserTarget = resolveApkUrl();
    const useNativeInstall =
      isNativeAndroid() &&
      isHomecheffApkInstallerNativeAvailable() &&
      /^https:\/\//i.test(resolvedApk);
    const targetVer = (p.latestApkVersion ?? '').trim();

    const logFlow = (extra: Record<string, unknown>) => {
      if (
        !shouldLogAppUpdateDebug() &&
        process.env.NEXT_PUBLIC_DEBUG_APK_INSTALL !== 'true'
      ) {
        return;
      }
      console.info('[apk-update-flow]', {
        nativeMounted,
        isNativeAndroid: isNativeAndroid(),
        resolvedApk: resolvedApk.slice(0, 80),
        willUseNativeInstaller: useNativeInstall,
        ...extra,
      });
    };

    logFlow({ stage: 'cta' });

    if (useNativeInstall) {
      setInstallError(null);
      setFailureKind(null);
      setShowPostGuide(false);
      setInstallFallbackReason(null);
      setInstallCachedApkAvailable(false);
      setInstallPhase('downloading');
      const result = await downloadApkAndOpenInstaller(resolvedApk, targetVer, (phase, pct) => {
        setInstallPhase(phase);
        setInstallPct(phase === 'downloading' && pct != null ? pct : null);
      });
      syncInstallPersist();
      if (!result.ok) {
        setFailureKind(result.kind);
        setInstallError(apkInstallUserMessage(result.kind, t, result.message));
        setInstallFallbackReason(result.fallbackReason ?? null);
        setInstallCachedApkAvailable(Boolean(result.cachedApkMayExist));
        setInstallPhase('error');
        logFlow({
          stage: 'native-failed',
          fallbackReason: result.fallbackReason,
          kind: result.kind,
          offerBrowserFallback: result.fallbackToBrowser,
        });
        return;
      }
      logFlow({ stage: 'native-ok' });
      setInstallCachedApkAvailable(false);
      setInstallPhase('done');
      setShowPostGuide(true);
      return;
    }

    logFlow({ stage: 'browser-only' });
    await openExternalUrl(browserTarget);
  }, [payload, resolveApkUrl, syncInstallPersist, nativeMounted]);

  const onLater = useCallback(() => {
    resetInstallUi();
    markOptionalDismissedSession();
    if (payload) runSoftWebRefresh(payload, false);
  }, [payload, runSoftWebRefresh, resetInstallUi]);

  const openUnknownSourcesSettings = useCallback(async () => {
    if (!isHomecheffApkInstallerNativeAvailable()) return;
    try {
      await HomecheffApkInstaller.openManageUnknownAppSources();
    } catch {
      /* plugin / OEM */
    }
  }, []);

  const openDownloadsFolderAfterExport = useCallback(async () => {
    if (!isHomecheffApkInstallerNativeAvailable()) return;
    try {
      await HomecheffApkInstaller.openSystemDownloads();
    } catch {
      /* OEM */
    }
  }, []);

  const onSaveApkToDownloads = useCallback(async () => {
    if (typeof window === 'undefined' || !payload) return;
    setExportSaveError(null);
    setSaveToDownloadsBusy(true);
    const r = await copyCachedBetaApkToDownloads();
    setSaveToDownloadsBusy(false);
    if (!r.success) {
      setExportSaveError(t('appUpdateGate.exportSaveFailed'));
      return;
    }
    const isPublic = r.method === 'mediastore' || r.method === 'public_dir';
    setExportAllowsDownloadsFolder(isPublic);
    setExportNotice(
      isPublic
        ? t('appUpdateGate.exportedToDownloadsPublic', {
            file: ANDROID_BETA_EXPORT_APK_FILE_NAME,
          })
        : t('appUpdateGate.exportedToAppStorage'),
    );
    if (!isHomecheffApkInstallerNativeAvailable()) {
      setExportSaveError(t('appUpdateGate.exportSaveFailed'));
      return;
    }
    try {
      await HomecheffApkInstaller.openPackageInstaller({ uri: r.uri });
      writeAndroidBetaInstallerOpened();
      syncInstallPersist();
      setInstallError(null);
      setFailureKind(null);
      setInstallFallbackReason(null);
      setInstallCachedApkAvailable(false);
      setExportNotice(null);
      setExportAllowsDownloadsFolder(false);
      setInstallPhase('done');
      setShowPostGuide(true);
    } catch (e) {
      setInstallFallbackReason(
        e instanceof Error ? `export_then_installer:${e.message}` : 'export_then_installer',
      );
    }
  }, [payload, syncInstallPersist, t]);

  const onOpenCachedApk = useCallback(async () => {
    if (typeof window === 'undefined' || !payload) return;
    const targetVer = (payload.latestApkVersion ?? '').trim();
    setInstallError(null);
    setFailureKind(null);
    setInstallFallbackReason(null);
    setShowPostGuide(false);
    setInstallPhase('preparing');
    const result = await openCachedApkInstallerOnly(targetVer, (phase, pct) => {
      setInstallPhase(phase);
      setInstallPct(phase === 'downloading' && pct != null ? pct : null);
    });
    syncInstallPersist();
    if (!result.ok) {
      setFailureKind(result.kind);
      setInstallError(apkInstallUserMessage(result.kind, t, result.message));
      setInstallFallbackReason(result.fallbackReason ?? null);
      setInstallCachedApkAvailable(Boolean(result.cachedApkMayExist));
      setInstallPhase('error');
      return;
    }
    setInstallCachedApkAvailable(false);
    setInstallPhase('done');
    setShowPostGuide(true);
  }, [payload, syncInstallPersist]);

  const openBrowserDownloadFallback = useCallback(async () => {
    if (!payload || typeof window === 'undefined') return;
    const origin = window.location.origin;
    const raw = (payload.apkUrl ?? '').trim();
    const resolved = raw.startsWith('/') ? `${origin}${raw}` : raw;
    await openExternalUrl(resolved || `${origin}/app`);
  }, [payload]);

  if (!scopeActive) return null;
  if (mode === 'idle' && !webToast) return null;

  const busyNative =
    installPhase === 'downloading' ||
    installPhase === 'preparing' ||
    installPhase === 'opening' ||
    saveToDownloadsBusy;

  const rank: Record<ApkInstallPhase, number> = {
    idle: 0,
    downloading: 1,
    preparing: 2,
    opening: 3,
    done: 4,
    error: 1,
  };
  const pr = rank[installPhase] ?? 0;
  const step1Active = installPhase === 'downloading';
  const step2Active = installPhase === 'preparing';
  const step3Active = installPhase === 'opening';
  const step1Done = pr >= 2 || showPostGuide;
  const step2Done = pr >= 3 || showPostGuide;
  const step3Done = pr >= 4 || showPostGuide;
  const step4Done = showPostGuide;
  const step5Done = showPostGuide;
  const step4Active = showPostGuide;

  return (
    <>
      {(mode === 'force' || mode === 'optional') && payload && (
        <div
          className="fixed inset-0 z-[220] flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hc-app-update-title"
        >
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            aria-hidden
            {...(mode === 'optional'
              ? {
                  tabIndex: -1,
                  onClick: onLater,
                  onKeyDown: (e: KeyboardEvent) => {
                    if (e.key === 'Escape') onLater();
                  },
                }
              : {})}
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl">
            <div className="max-h-[min(78dvh,560px)] touch-pan-y overflow-y-auto overscroll-y-contain px-5 pb-5 pt-6">
              <h2
                id="hc-app-update-title"
                className="text-lg font-semibold leading-snug text-gray-900 sm:text-xl"
              >
                {mode === 'force'
                  ? payload.updateTitleForced?.trim() || t('appUpdateGate.forcedTitle')
                  : payload.updateTitle?.trim() || t('appUpdateGate.optionalTitle')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {mode === 'force'
                  ? payload.updateMessageForced?.trim() || t('appUpdateGate.forcedMessage')
                  : payload.updateMessage?.trim() || t('appUpdateGate.optionalMessage')}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-emerald-900/90 bg-emerald-50/80 border border-emerald-100 rounded-lg px-3 py-2">
                {t('appUpdateGate.reassuranceData')}
              </p>

              {(() => {
                const lines = (payload.changelog ?? [])
                  .map((line) => String(line).trim())
                  .filter(Boolean)
                  .slice(0, 5);
                return lines.length ? (
                  <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-gray-700">
                    {lines.map((line, i) => (
                      <li key={`${i}-${line.slice(0, 48)}`}>{line}</li>
                    ))}
                  </ul>
                ) : null;
              })()}

              {(busyNative || showPostGuide || installPhase === 'done' || installPhase === 'error') && (
                <div className="mt-5 space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('appUpdateGate.stepsHeading')}
                  </p>
                  <StepRow
                    n={1}
                    active={step1Active}
                    done={step1Done}
                    label={t('appUpdateGate.stepDownload')}
                  />
                  <StepRow
                    n={2}
                    active={step2Active}
                    done={step2Done}
                    label={t('appUpdateGate.stepPrepare')}
                  />
                  <StepRow
                    n={3}
                    active={step3Active}
                    done={step3Done}
                    label={t('appUpdateGate.stepAndroidOpen')}
                  />
                  <StepRow
                    n={4}
                    active={step4Active}
                    done={step4Done}
                    label={t('appUpdateGate.stepTapInstall')}
                  />
                  <StepRow
                    n={5}
                    active={false}
                    done={step5Done}
                    label={t('appUpdateGate.stepReopen')}
                  />

                  {step1Active && installPct != null ? (
                    <p className="text-center text-xs font-medium text-emerald-800" role="status">
                      {installPct}%
                    </p>
                  ) : null}
                  {step3Active ? (
                    <p className="text-center text-sm font-semibold text-emerald-900" role="status">
                      {t('appUpdateGate.openingInstallerStatus')}
                    </p>
                  ) : null}
                </div>
              )}

              {showPostGuide && installPhase !== 'error' ? (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-3 text-sm text-emerald-950">
                  <p className="font-semibold">{t('appUpdateGate.postGuideTitle')}</p>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-900/95">
                    {t('appUpdateGate.postGuideBody')}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      resetInstallUi();
                    }}
                    className="mt-3 w-full rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 touch-manipulation"
                  >
                    {t('appUpdateGate.postGuideDismiss')}
                  </button>
                </div>
              ) : null}

              {installPhase === 'error' && installError ? (
                <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-3 text-sm text-amber-950">
                  {failureKind === 'unknown_sources' ? (
                    <>
                      <p className="font-semibold">{t('appUpdateGate.unknownSourcesTitle')}</p>
                      <p className="text-xs leading-relaxed text-amber-900/95">
                        {t('appUpdateGate.unknownSourcesBody')}
                      </p>
                      <button
                        type="button"
                        onClick={() => void openUnknownSourcesSettings()}
                        className="w-full rounded-xl bg-amber-800 px-3 py-2.5 text-sm font-semibold text-white hover:bg-amber-900 touch-manipulation"
                      >
                        {t('appUpdateGate.btnOpenAndroidSettings')}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">{t('appUpdateGate.errorTitle')}</p>
                      <p className="text-xs leading-relaxed text-amber-900/95">
                        {failureKind === 'download_timeout'
                          ? t('appUpdateGate.downloadStalled')
                          : installCachedApkAvailable
                            ? t('appUpdateGate.cacheFallbackLead')
                            : t('appUpdateGate.errorBodyNoCache')}
                      </p>
                      {installCachedApkAvailable && exportNotice ? (
                        <p className="rounded-lg border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-xs font-medium leading-relaxed text-emerald-950">
                          {exportNotice}
                        </p>
                      ) : null}
                      {exportSaveError ? (
                        <p className="text-xs font-medium text-red-800">{exportSaveError}</p>
                      ) : null}
                      <p className="text-[11px] leading-relaxed text-amber-900/80">
                        {t('appUpdateGate.browserLastResortHint')}
                      </p>
                    </>
                  )}
                  {installFallbackReason &&
                  (shouldLogAppUpdateDebug() ||
                    process.env.NEXT_PUBLIC_DEBUG_APK_INSTALL === 'true') ? (
                    <p className="rounded bg-amber-100/50 px-2 py-1 font-mono text-[10px] text-amber-950/90 break-all">
                      {installFallbackReason}
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-2">
                    {failureKind !== 'unknown_sources' && installCachedApkAvailable ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void onOpenCachedApk()}
                          className="w-full rounded-xl border border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-100 touch-manipulation"
                        >
                          {t('appUpdateGate.btnOpenCachedApk')}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onSaveApkToDownloads()}
                          disabled={saveToDownloadsBusy}
                          className="w-full rounded-xl border border-amber-400 bg-white px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50 touch-manipulation disabled:opacity-60"
                        >
                          {saveToDownloadsBusy
                            ? t('appUpdateGate.saveToDownloadsBusy')
                            : t('appUpdateGate.btnSaveApkToDownloads')}
                        </button>
                      </>
                    ) : null}
                    {failureKind !== 'unknown_sources' ? (
                      <button
                        type="button"
                        onClick={() => {
                          resetInstallUi();
                          void onUpdateNow();
                        }}
                        className="w-full rounded-xl border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 touch-manipulation"
                      >
                        {t('appUpdateGate.btnRetryDownload')}
                      </button>
                    ) : null}
                    {failureKind !== 'unknown_sources' &&
                    exportAllowsDownloadsFolder &&
                    installCachedApkAvailable ? (
                      <button
                        type="button"
                        onClick={() => void openDownloadsFolderAfterExport()}
                        className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 touch-manipulation"
                      >
                        {t('appUpdateGate.btnOpenDownloadsFolder')}
                      </button>
                    ) : null}
                    {failureKind !== 'unknown_sources' ? (
                      <button
                        type="button"
                        onClick={() => void openBrowserDownloadFallback()}
                        className="w-full rounded-xl border border-gray-400 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 touch-manipulation"
                      >
                        {t('appUpdateGate.btnDownloadAgainViaBrowser')}
                      </button>
                    ) : null}
                    {failureKind === 'unknown_sources' ? (
                      <button
                        type="button"
                        onClick={() => {
                          resetInstallUi();
                          void onUpdateNow();
                        }}
                        className="w-full rounded-xl border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 touch-manipulation"
                      >
                        {t('appUpdateGate.btnRetryDownload')}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => resetInstallUi()}
                      className="text-center text-xs font-semibold text-amber-900 underline touch-manipulation"
                    >
                      {t('appUpdateGate.errorDismiss')}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse sm:justify-end">
                <button
                  type="button"
                  onClick={() => void onUpdateNow()}
                  disabled={busyNative}
                  className="min-h-[48px] w-full rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] enabled:hover:bg-emerald-700 disabled:opacity-60 sm:w-auto sm:min-w-[10rem] touch-manipulation"
                >
                  {busyNative
                    ? t('appUpdateGate.ctaBusy')
                    : mode === 'force'
                      ? t('appUpdateGate.ctaDownload')
                      : t('appUpdateGate.ctaUpdate')}
                </button>
                {mode === 'optional' ? (
                  <button
                    type="button"
                    onClick={onLater}
                    className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-800 transition active:bg-gray-50 sm:w-auto touch-manipulation"
                  >
                    {t('appUpdateGate.later')}
                  </button>
                ) : null}
              </div>

              {mode === 'force' ? (
                <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">
                  {t('appUpdateGate.installHintAndroid')}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {webToast ? (
        <div
          className="pointer-events-none fixed bottom-24 left-1/2 z-[210] max-w-[min(92vw,20rem)] -translate-x-1/2 rounded-xl border border-emerald-100 bg-emerald-50/95 px-4 py-3 text-center text-sm font-medium text-emerald-900 shadow-lg"
          role="status"
        >
          {t('appUpdateGate.webVersionToast')}
        </div>
      ) : null}
    </>
  );
}
