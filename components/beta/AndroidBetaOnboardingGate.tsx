'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  getPushPermissionForSettings,
  getLocationPermissionForSettings,
} from '@/lib/client/app-permission-status';

type Step = 0 | 1 | 2 | 3;

function permShort(s: 'granted' | 'denied' | 'prompt' | 'unsupported'): string {
  if (s === 'granted') return 'toegestaan';
  if (s === 'denied') return 'geweigerd';
  if (s === 'unsupported') return 'n.v.t.';
  return 'nog niet gevraagd';
}

export default function AndroidBetaOnboardingGate() {
  const { status } = useSession();
  const [step, setStep] = useState<Step>(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pushPermLine, setPushPermLine] = useState<string>('');
  const [locPermLine, setLocPermLine] = useState<string>('');

  const refreshOpen = useCallback(async () => {
    if (status !== 'authenticated') {
      setOpen(false);
      return;
    }
    try {
      const res = await fetch('/api/user/beta-status', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      setOpen(Boolean(data.needsOnboarding));
      if (data.needsOnboarding) setStep(0);
    } catch {
      setOpen(false);
    }
  }, [status]);

  useEffect(() => {
    void refreshOpen();
  }, [refreshOpen]);

  useEffect(() => {
    if (!open || step !== 1) return;
    let cancelled = false;
    void (async () => {
      const p = await getPushPermissionForSettings();
      if (!cancelled) {
        setPushPermLine(`${permShort(p.state)} (${p.source === 'native' ? 'app' : 'browser'})`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, step]);

  useEffect(() => {
    if (!open || step !== 2) return;
    let cancelled = false;
    void (async () => {
      const p = await getLocationPermissionForSettings();
      if (!cancelled) {
        setLocPermLine(`${permShort(p.state)} (${p.source === 'native' ? 'app' : 'browser'})`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, step]);

  async function finishOnboarding() {
    setBusy(true);
    try {
      await fetch('/api/beta/onboarding/complete', { method: 'POST', credentials: 'include' });
      setOpen(false);
    } catch {
      /* keep open */
    } finally {
      setBusy(false);
    }
  }

  async function requestNotifications() {
    try {
      if (typeof Notification !== 'undefined' && Notification.requestPermission) {
        await Notification.requestPermission();
      }
    } catch {
      /* ignore */
    }
    setStep(2);
  }

  function skipNotifications() {
    setStep(2);
  }

  function requestGeolocation() {
    if (!navigator.geolocation) {
      setStep(3);
      return;
    }
    try {
      localStorage.setItem('homecheff_beta_location_mode', 'gps');
    } catch {
      /* ignore */
    }
    navigator.geolocation.getCurrentPosition(
      () => setStep(3),
      () => setStep(3),
      { maximumAge: 60_000, timeout: 15_000, enableHighAccuracy: false },
    );
  }

  function profileLocationOnly() {
    try {
      localStorage.setItem('homecheff_beta_location_mode', 'profile');
    } catch {
      /* ignore */
    }
    setStep(3);
  }

  function skipLocation() {
    setStep(3);
  }

  if (!open || status !== 'authenticated') return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/45 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-onb-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {step === 0 ? (
            <>
              <h2 id="beta-onb-title" className="text-xl font-bold text-gray-900">
                Welkom bij de HomeCheff beta
              </h2>
              <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                <li>Test nieuwe HomeCheff-functies vóór iedereen.</li>
                <li>Ontdek makers bij jou in de buurt.</li>
                <li>Verdien HCP door actief mee te doen.</li>
                <li>Help de app beter te maken met je feedback.</li>
              </ul>
              <button
                type="button"
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
                onClick={() => setStep(1)}
              >
                Volgende
              </button>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <h2 className="text-xl font-bold text-gray-900">Meldingen</h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                Meldingen helpen je bij berichten, reacties, verkopen, HCP-beloningen en lokale updates.
              </p>
              {pushPermLine ? (
                <p className="text-xs text-gray-500">
                  Huidige status: <strong className="text-gray-800">{pushPermLine}</strong>
                </p>
              ) : null}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
                  onClick={() => void requestNotifications()}
                >
                  Meldingen aanzetten
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-900 font-medium py-3"
                  onClick={skipNotifications}
                >
                  Later
                </button>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h2 className="text-xl font-bold text-gray-900">Locatie</h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                Locatie helpt met makers in je buurt, lokale ranglijsten en regionale acties.
              </p>
              {locPermLine ? (
                <p className="text-xs text-gray-500">
                  Huidige status: <strong className="text-gray-800">{locPermLine}</strong>
                </p>
              ) : null}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
                  onClick={requestGeolocation}
                >
                  Huidige locatie gebruiken
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-900 font-medium py-3"
                  onClick={profileLocationOnly}
                >
                  Alleen profiel-locatie
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl border border-gray-200 text-gray-700 font-medium py-3"
                  onClick={skipLocation}
                >
                  Later
                </button>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h2 className="text-xl font-bold text-gray-900">HCP &amp; beta tester</h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                Als beta tester kun je straks extra HCP, badges of zichtbaarheid verdienen via testacties. Dit is
                geen garantie op contante uitbetaling — het gaat om punten en voordelen binnen HomeCheff.
              </p>
              <button
                type="button"
                disabled={busy}
                className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 disabled:opacity-60"
                onClick={() => void finishOnboarding()}
              >
                {busy ? 'Bezig…' : 'Start HomeCheff'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
