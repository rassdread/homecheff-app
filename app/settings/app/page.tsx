'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

function permLabel(s: PermUiState): string {
  if (s === 'granted') return 'toegestaan';
  if (s === 'denied') return 'geweigerd';
  if (s === 'unsupported') return 'niet beschikbaar';
  return 'nog niet gevraagd';
}

function sourceHint(source: 'native' | 'browser'): string {
  return source === 'native' ? 'HomeCheff-app (systeem)' : 'browser';
}

export default function AppSettingsPage() {
  const { t } = useTranslation();
  const appUpdate = useAppUpdateStatus();
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
  const [prefs, setPrefs] = useState<{
    pushHcpRewards: boolean;
    pushPromotionalUpdates: boolean;
    betaFeaturesEnabled: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/notifications/preferences', { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          if (!cancelled) setError(data?.error || 'Kon voorkeuren niet laden');
          return;
        }
        const p = data.preferences;
        if (!cancelled && p) {
          setPrefs({
            pushHcpRewards: Boolean(p.pushHcpRewards ?? true),
            pushPromotionalUpdates: Boolean(p.pushPromotionalUpdates ?? false),
            betaFeaturesEnabled: Boolean(p.betaFeaturesEnabled ?? true),
          });
        }
      } catch {
        if (!cancelled) setError('Netwerkfout');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function updatePrefs(patch: Partial<{ pushHcpRewards: boolean; pushPromotionalUpdates: boolean; betaFeaturesEnabled: boolean }>) {
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
      setError('Opslaan mislukt');
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
      setError('Locatie kon niet worden opgevraagd. Controleer de rechten of probeer later opnieuw.');
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
            ← Terug
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">App-instellingen</h1>
          <p className="text-sm text-gray-600 mt-1">
            Browser- en systeemrechten voor de beta/webapp. Je kunt dit later altijd aanpassen.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
        ) : null}

        {appUpdate.scopeActive && (appUpdate.loading || Boolean(appUpdate.payload?.enabled)) ? (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">{t('appUpdateGate.settingsBetaTitle')}</h2>
            {appUpdate.loading && !appUpdate.payload ? (
              <p className="text-sm text-gray-500">Laden…</p>
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
          <h2 className="font-semibold text-gray-900">Meldingen</h2>
          <p className="text-sm text-gray-700">
            <span className="font-medium text-gray-900">Meldingen:</span>{' '}
            <strong>{permLabel(pushPerm.state)}</strong>
            <span className="text-gray-500"> · {sourceHint(pushPerm.source)}</span>
          </p>
          <p className="text-xs text-gray-500">
            Op Android 13+ vraagt de app apart om meldingen (POST_NOTIFICATIONS). We vragen dit niet automatisch
            bij openen; je ziet eerst uitleg in de beta of na inloggen.
          </p>
          {pushPerm.state === 'denied' ? (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Zet dit aan via je apparaatinstellingen (Android: Instellingen → Apps → HomeCheff → Meldingen; iOS:
              Instellingen → HomeCheff → Meldingen).
            </p>
          ) : null}
          {pushPerm.state === 'prompt' || pushPerm.state === 'unsupported' ? (
            <button
              type="button"
              disabled={pushBusy || pushPerm.state === 'unsupported'}
              onClick={() => void handleRequestPush()}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {pushBusy ? 'Bezig…' : 'Toestemming voor meldingen vragen'}
            </button>
          ) : null}
          <button
            type="button"
            className="text-sm font-medium text-emerald-700 hover:underline"
            onClick={() => {
              void refreshPermissions();
            }}
          >
            Status vernieuwen
          </button>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Locatie</h2>
          <p className="text-sm text-gray-700">
            <span className="font-medium text-gray-900">Locatie:</span>{' '}
            <strong>{permLabel(locPerm.state)}</strong>
            <span className="text-gray-500"> · {sourceHint(locPerm.source)}</span>
          </p>
          <p className="text-xs text-gray-500">
            Je exacte GPS-coördinaten worden niet openbaar getoond; ze worden alleen gebruikt als jij zelf
            locatie deelt (bijv. makers in de buurt) via een knop in de app.
          </p>
          {locPerm.state === 'denied' ? (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Zet locatie toe via je apparaatinstellingen om makers in de buurt te tonen (Android: Instellingen →
              Apps → HomeCheff → Machtigingen → Locatie).
            </p>
          ) : null}
          {(locPerm.state === 'prompt' || locPerm.state === 'granted') && (
            <button
              type="button"
              disabled={locBusy}
              onClick={() => void handleRequestLocation()}
              className="w-full rounded-xl border border-emerald-600 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
            >
              {locBusy ? 'Bezig…' : 'Locatieprompt testen (één keer opvragen)'}
            </button>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Voorkeuren (account)</h2>
          {loading || !prefs ? (
            <p className="text-sm text-gray-500">Laden…</p>
          ) : (
            <div className="space-y-4">
              <ToggleRow
                label="HCP-meldingen"
                description="Punten, badges en belangrijke HCP-updates."
                checked={prefs.pushHcpRewards}
                onChange={(v) => void updatePrefs({ pushHcpRewards: v })}
              />
              <ToggleRow
                label="Promoties &amp; updates"
                description="Productnieuws en acties (marketing-achtig)."
                checked={prefs.pushPromotionalUpdates}
                onChange={(v) => void updatePrefs({ pushPromotionalUpdates: v })}
              />
              <ToggleRow
                label="Beta-functies"
                description="Experimentele functies in de app."
                checked={prefs.betaFeaturesEnabled}
                onChange={(v) => void updatePrefs({ betaFeaturesEnabled: v })}
              />
            </div>
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
