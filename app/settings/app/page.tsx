'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PermState = 'granted' | 'denied' | 'prompt' | 'unsupported';

function notificationBrowserState(): PermState {
  if (typeof Notification === 'undefined') return 'unsupported';
  const p = Notification.permission;
  if (p === 'granted') return 'granted';
  if (p === 'denied') return 'denied';
  return 'prompt';
}

async function geolocationPermissionState(): Promise<PermState> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) return 'prompt';
  try {
    const r = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    if (r.state === 'granted') return 'granted';
    if (r.state === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'prompt';
  }
}

function permLabel(s: PermState): string {
  if (s === 'granted') return 'toegestaan';
  if (s === 'denied') return 'geweigerd';
  if (s === 'unsupported') return 'niet beschikbaar';
  return 'nog niet gevraagd';
}

export default function AppSettingsPage() {
  const [notifPerm, setNotifPerm] = useState<PermState>('prompt');
  const [geoPerm, setGeoPerm] = useState<PermState>('prompt');
  const [prefs, setPrefs] = useState<{
    pushHcpRewards: boolean;
    pushPromotionalUpdates: boolean;
    betaFeaturesEnabled: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshPermissions() {
    setNotifPerm(notificationBrowserState());
    setGeoPerm(await geolocationPermissionState());
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

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Meldingen</h2>
          <p className="text-xs text-gray-500">
            Status browser: <strong>{permLabel(notifPerm)}</strong>
          </p>
          {notifPerm === 'denied' ? (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Zet dit aan via je apparaatinstellingen (Android: Instellingen → Apps → HomeCheff →
              Meldingen).
            </p>
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
          <p className="text-xs text-gray-500">
            Status browser: <strong>{permLabel(geoPerm)}</strong>
          </p>
          {geoPerm === 'denied' ? (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Zet locatie toe via je apparaatinstellingen om makers in de buurt te tonen.
            </p>
          ) : null}
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
