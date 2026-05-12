'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppUpdateStatus } from '@/components/app/AppUpdateStatusProvider';
import {
  getPushPermissionForSettings,
  getLocationPermissionForSettings,
  requestPushPermissionFromSettings,
  type PermUiState,
} from '@/lib/client/app-permission-status';
import { isNativeApp } from '@/lib/native/capacitor';
import { requestAndGetNativeCurrentPosition } from '@/lib/native/location';
import NativePushManageSection from '@/components/native/NativePushManageSection';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';

type PushPrefsSlice = {
  pushNewMessages: boolean;
  pushNewOrders: boolean;
  pushOrderUpdates: boolean;
  pushDeliveryUpdates: boolean;
  pushHcpRewards: boolean;
  pushPromotionalUpdates: boolean;
  betaFeaturesEnabled: boolean;
};

export default function AppSettingsPage() {
  const { t } = useTranslation();
  const { status } = useSession();
  const appUpdate = useAppUpdateStatus();
  const nativeMounted = useIsNativeAppMounted();
  const [pushPerm, setPushPerm] = useState<{
    source: 'native' | 'browser';
    state: PermUiState;
  }>({ source: 'browser', state: 'prompt' });
  const [locPerm, setLocPerm] = useState<{
    source: 'native' | 'browser';
    state: PermUiState;
  }>({ source: 'browser', state: 'prompt' });
  const [pushBusy, setPushBusy] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [prefs, setPrefs] = useState<PushPrefsSlice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function permLabel(s: PermUiState): string {
    if (s === 'granted') return t('nativePush.statusAllowed');
    if (s === 'denied') return t('nativePush.statusDenied');
    if (s === 'unsupported') return t('nativePush.statusUnsupported');
    return t('nativePush.statusPrompt');
  }

  function sourceHint(source: 'native' | 'browser'): string {
    return source === 'native'
      ? t('appSettingsPage.sourceNative')
      : t('appSettingsPage.sourceBrowser');
  }

  async function refreshPermissions() {
    const [p, l] = await Promise.all([
      getPushPermissionForSettings(),
      getLocationPermissionForSettings(),
    ]);
    setPushPerm(p);
    setLocPerm(l);
  }

  useEffect(() => {
    void refreshPermissions();
    const id = window.setInterval(() => void refreshPermissions(), 4000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') {
      setPrefs(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/notifications/preferences', { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          if (!cancelled) setError(data?.error || t('appSettingsPage.errorLoadPrefs'));
          return;
        }
        const p = data.preferences;
        if (!cancelled && p) {
          setPrefs({
            pushNewMessages: Boolean(p.pushNewMessages ?? true),
            pushNewOrders: Boolean(p.pushNewOrders ?? true),
            pushOrderUpdates: Boolean(p.pushOrderUpdates ?? true),
            pushDeliveryUpdates: Boolean(p.pushDeliveryUpdates ?? true),
            pushHcpRewards: Boolean(p.pushHcpRewards ?? true),
            pushPromotionalUpdates: Boolean(p.pushPromotionalUpdates ?? false),
            betaFeaturesEnabled: Boolean(p.betaFeaturesEnabled ?? true),
          });
        }
      } catch {
        if (!cancelled) setError(t('appSettingsPage.errorNetwork'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, t]);

  async function updatePrefs(patch: Partial<PushPrefsSlice>) {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
    } catch {
      setError(t('appSettingsPage.errorSavePrefs'));
    }
  }

  async function handleRequestPush() {
    setPushBusy(true);
    try {
      await requestPushPermissionFromSettings();
      await refreshPermissions();
    } finally {
      setPushBusy(false);
    }
  }

  async function handleRequestLocation() {
    setLocBusy(true);
    setError(null);
    try {
      if (isNativeApp()) {
        await requestAndGetNativeCurrentPosition({
          enableHighAccuracy: false,
          maximumAge: 60_000,
          timeout: 15_000,
        });
      } else if (navigator.geolocation) {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(),
            (e) => reject(e),
            { maximumAge: 60_000, timeout: 15_000, enableHighAccuracy: false }
          );
        });
      }
    } catch {
      setError(t('appSettingsPage.locationError'));
    } finally {
      setLocBusy(false);
      void refreshPermissions();
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <Link href="/" className="text-sm text-emerald-700 hover:underline">
            {t('appSettingsPage.back')}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{t('appSettingsPage.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('appSettingsPage.intro')}</p>
        </div>

        {error ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
        ) : null}

        {appUpdate.scopeActive && (appUpdate.loading || Boolean(appUpdate.payload?.enabled)) ? (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">{t('appUpdateGate.settingsBetaTitle')}</h2>
            {appUpdate.loading && !appUpdate.payload ? (
              <p className="text-sm text-gray-500">{t('appSettingsPage.loading')}</p>
            ) : appUpdate.payload ? (
              <>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {t('appUpdateGate.yourVersionLabel')}
                    </dt>
                    <dd className="mt-0.5 font-medium text-gray-900">
                      {appUpdate.currentVersion?.trim() || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {t('appUpdateGate.latestVersionLabel')}
                    </dt>
                    <dd className="mt-0.5 font-medium text-gray-900">
                      {appUpdate.latestApkVersion || '—'}
                    </dd>
                  </div>
                </dl>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {t('appUpdateGate.statusLabel')}
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {appUpdate.statusLine === 'up_to_date'
                      ? t('appUpdateGate.upToDateStatus')
                      : appUpdate.statusLine === 'force'
                        ? t('appUpdateGate.forcedTitle')
                        : t('appUpdateGate.updateAvailableShort')}
                  </p>
                </div>
                {appUpdate.statusLine !== 'up_to_date' ? (
                  <button
                    type="button"
                    onClick={() => void appUpdate.triggerApkDownload()}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] touch-manipulation sm:w-auto"
                  >
                    {t('appUpdateGate.ctaDownload')}
                  </button>
                ) : null}
              </>
            ) : null}
          </section>
        ) : null}

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('appSettingsPage.notificationsHeading')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {t('settingsNotifications.osPermissionTitle')}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t('settingsNotifications.osPermissionBody')}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">{t('appSettingsPage.pushIntroShort')}</p>

          {nativeMounted ? (
            <NativePushManageSection onRegistered={() => void refreshPermissions()} />
          ) : (
            <>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">{t('settingsNotifications.osPermissionTitle')}:</span>{' '}
                <strong>{permLabel(pushPerm.state)}</strong>
                <span className="text-gray-500"> · {sourceHint(pushPerm.source)}</span>
              </p>
              {pushPerm.state === 'denied' ? (
                <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  {t('appSettingsPage.pushDeniedHint')}
                </p>
              ) : null}
              {pushPerm.state === 'prompt' || pushPerm.state === 'unsupported' ? (
                <button
                  type="button"
                  disabled={pushBusy || pushPerm.state === 'unsupported'}
                  onClick={() => void handleRequestPush()}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {pushBusy ? t('common.sending') : t('appSettingsPage.pushAsk')}
                </button>
              ) : null}
            </>
          )}

          <button
            type="button"
            className="text-sm font-medium text-emerald-700 hover:underline"
            onClick={() => {
              void refreshPermissions();
            }}
          >
            {t('appSettingsPage.refreshStatus')}
          </button>
        </section>

        {status === 'authenticated' ? (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">{t('appSettingsPage.accountPrefsHeading')}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{t('settingsNotifications.preferencesBody')}</p>
            {loading || !prefs ? (
              <p className="text-sm text-gray-500">{t('appSettingsPage.loading')}</p>
            ) : (
              <div className="space-y-4">
                <ToggleRow
                  label={t('settingsNotifications.pushChat')}
                  description={t('settingsNotifications.pushChatHint')}
                  checked={prefs.pushNewMessages}
                  onChange={(v) => void updatePrefs({ pushNewMessages: v })}
                />
                <ToggleRow
                  label={t('settingsNotifications.pushOrders')}
                  description={t('settingsNotifications.pushOrdersHint')}
                  checked={prefs.pushNewOrders}
                  onChange={(v) => void updatePrefs({ pushNewOrders: v })}
                />
                <ToggleRow
                  label={t('settingsNotifications.pushOrderUpdates')}
                  description={t('settingsNotifications.pushOrderUpdatesHint')}
                  checked={prefs.pushOrderUpdates}
                  onChange={(v) => void updatePrefs({ pushOrderUpdates: v })}
                />
                <ToggleRow
                  label={t('settingsNotifications.pushDelivery')}
                  description={t('settingsNotifications.pushDeliveryHint')}
                  checked={prefs.pushDeliveryUpdates}
                  onChange={(v) => void updatePrefs({ pushDeliveryUpdates: v })}
                />
                <ToggleRow
                  label={t('settingsNotifications.pushHcp')}
                  description={t('settingsNotifications.pushHcpHint')}
                  checked={prefs.pushHcpRewards}
                  onChange={(v) => void updatePrefs({ pushHcpRewards: v })}
                />
                <ToggleRow
                  label={t('settingsNotifications.pushMarketing')}
                  description={t('settingsNotifications.pushMarketingHint')}
                  checked={prefs.pushPromotionalUpdates}
                  onChange={(v) => void updatePrefs({ pushPromotionalUpdates: v })}
                />
                <ToggleRow
                  label={t('appSettingsPage.betaFeatures')}
                  description={t('appSettingsPage.betaFeaturesHint')}
                  checked={prefs.betaFeaturesEnabled}
                  onChange={(v) => void updatePrefs({ betaFeaturesEnabled: v })}
                />
              </div>
            )}
            <Link
              href="/profile"
              className="inline-block text-sm font-medium text-emerald-700 hover:underline"
            >
              {t('settingsNotifications.linkFullPrefs')}
            </Link>
          </section>
        ) : (
          <p className="text-sm text-gray-600 bg-white border border-gray-200 rounded-xl p-4">
            {t('appSettingsPage.loginForPrefs')}
          </p>
        )}

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('appSettingsPage.locationHeading')}</h2>
          <p className="text-sm text-gray-700">
            <span className="font-medium text-gray-900">{t('appSettingsPage.locationHeading')}:</span>{' '}
            <strong>{permLabel(locPerm.state)}</strong>
            <span className="text-gray-500"> · {sourceHint(locPerm.source)}</span>
          </p>
          <p className="text-xs text-gray-500">
            {t('appSettingsPage.locationIntro')}
          </p>
          {locPerm.state === 'denied' ? (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
              {t('appSettingsPage.locationDeniedHint')}
            </p>
          ) : null}
          {(locPerm.state === 'prompt' || locPerm.state === 'granted') && (
            <button
              type="button"
              disabled={locBusy}
              onClick={() => void handleRequestLocation()}
              className="w-full rounded-xl border border-emerald-600 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
            >
              {locBusy ? t('appSettingsPage.loading') : t('appSettingsPage.locationTest')}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

function ToggleRow(props: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer">
      <span>
        <span className="block text-sm font-medium text-gray-900">{props.label}</span>
        <span className="block text-xs text-gray-500 mt-0.5">{props.description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
    </label>
  );
}
