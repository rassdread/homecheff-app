'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import { isNativeAndroid } from '@/lib/native/capacitor';
import { getCapacitorAppInfo } from '@/lib/native/getCapacitorAppInfo';
import { openExternalUrl } from '@/lib/native/openExternalUrl';
import { isSemverLessThan } from '@/lib/app-version-semver';
import type { AppVersionApiResponse } from '@/lib/app-version-config';

const LS_LAST_WEB_VERSION = 'hc:lastSeenWebVersion';
const SS_OPTIONAL_DISMISS = 'hc:appUpdateOptionalDismissed';

type GateMode = 'idle' | 'force' | 'optional';

export default function AppUpdateGate() {
  const nativeMounted = useIsNativeAppMounted();
  const router = useRouter();
  const [mode, setMode] = useState<GateMode>('idle');
  const [payload, setPayload] = useState<AppVersionApiResponse | null>(null);
  const [webToast, setWebToast] = useState(false);
  const payloadRef = useRef<AppVersionApiResponse | null>(null);
  payloadRef.current = payload;

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
    if (!nativeMounted || !isNativeAndroid()) return;

    let cancelled = false;

    const run = async () => {
      try {
        const [res, appInfo] = await Promise.all([
          fetch('/api/app-version', { credentials: 'same-origin', cache: 'no-store' }),
          getCapacitorAppInfo(),
        ]);
        if (cancelled) return;
        if (!res.ok) return;
        const data = (await res.json()) as AppVersionApiResponse;
        if (cancelled) return;
        setPayload(data);

        if (!data.enabled) {
          runSoftWebRefresh(data, false);
          return;
        }

        const cur = appInfo.version;
        const belowMin =
          cur != null && isSemverLessThan(cur, data.minRequiredApkVersion) === true;
        const belowLatest =
          cur != null && isSemverLessThan(cur, data.latestApkVersion) === true;

        const forceUi = belowMin || (Boolean(data.forceUpdate) && belowLatest);
        const dismissed = sessionStorage.getItem(SS_OPTIONAL_DISMISS) === '1';
        const optionalUi =
          Boolean(belowLatest) && !belowMin && !data.forceUpdate && !dismissed && cur != null;

        const apkBlocksSoft = Boolean(belowMin || (data.forceUpdate && belowLatest));

        if (forceUi) {
          setMode('force');
        } else if (optionalUi) {
          setMode('optional');
        } else {
          setMode('idle');
        }

        if (!forceUi && !optionalUi) {
          runSoftWebRefresh(data, apkBlocksSoft);
        }
      } catch {
        /* geen crash in WebView */
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [nativeMounted, runSoftWebRefresh]);

  const onUpdateNow = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    let apk = payload?.apkUrl?.trim() ?? '';
    if (apk.startsWith('/')) apk = `${origin}${apk}`;
    const target =
      apk && /^https?:\/\//i.test(apk) ? apk : `${origin}/app`;
    await openExternalUrl(target);
  }, [payload?.apkUrl]);

  const onLater = useCallback(() => {
    try {
      sessionStorage.setItem(SS_OPTIONAL_DISMISS, '1');
    } catch {
      /* ignore */
    }
    setMode('idle');
    const p = payloadRef.current;
    if (p) runSoftWebRefresh(p, false);
  }, [runSoftWebRefresh]);

  if (!nativeMounted || !isNativeAndroid()) return null;
  if (mode === 'idle' && !webToast) return null;

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
                {payload.updateTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{payload.updateMessage}</p>

              {payload.changelog?.length ? (
                <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-gray-700">
                  {payload.changelog.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse sm:justify-end">
                <button
                  type="button"
                  onClick={() => void onUpdateNow()}
                  className="min-h-[48px] w-full rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] sm:w-auto sm:min-w-[10rem] touch-manipulation"
                >
                  {mode === 'force' ? 'Update downloaden' : 'Nu updaten'}
                </button>
                {mode === 'optional' ? (
                  <button
                    type="button"
                    onClick={onLater}
                    className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-800 transition active:bg-gray-50 sm:w-auto touch-manipulation"
                  >
                    Later
                  </button>
                ) : null}
              </div>

              {mode === 'force' ? (
                <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">
                  Android vraagt om bevestiging om de APK te installeren — dat hoort zo.
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
          Nieuwe versie geladen
        </div>
      ) : null}
    </>
  );
}
