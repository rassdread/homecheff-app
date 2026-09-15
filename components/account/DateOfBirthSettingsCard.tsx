'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import {
  COMMERCIAL_DELIVERY_DOB_LOCKED_MESSAGE_NL,
  COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_NL,
  formatDateOfBirthNl,
} from '@/lib/delivery/delivery-age';

type Props = {
  initialDateOfBirth?: Date | string | null;
  onSaved?: () => void;
};

export default function DateOfBirthSettingsCard({
  initialDateOfBirth = null,
  onSaved,
}: Props) {
  const locked = Boolean(initialDateOfBirth);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [savedIso, setSavedIso] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash === '#leeftijd') {
      document.getElementById('leeftijd')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    let cancelled = false;
    void fetch('/api/profile/date-of-birth', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (typeof data.eligible === 'boolean') setEligible(data.eligible);
        if (typeof data.dateOfBirth === 'string') setSavedIso(data.dateOfBirth);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/profile/date-of-birth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateOfBirth: value }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        eligible?: boolean;
        dateOfBirth?: string;
      };
      if (!res.ok) {
        setError(data.error || 'Geboortedatum kon niet worden opgeslagen.');
        return;
      }
      setSavedIso(data.dateOfBirth ?? value);
      setEligible(Boolean(data.eligible));
      onSaved?.();
    } catch {
      setError('Geboortedatum kon niet worden opgeslagen.');
    } finally {
      setBusy(false);
    }
  };

  const displayLocked = savedIso
    ? formatDateOfBirthNl(savedIso)
    : formatDateOfBirthNl(initialDateOfBirth);

  return (
    <div
      id="leeftijd"
      className="scroll-mt-24 rounded-xl border bg-white p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-3">
        <Calendar className="h-6 w-6 text-primary-600" aria-hidden />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Leeftijd (18+)</h2>
          <p className="text-sm text-gray-500">
            Account-geboortedatum. Bezorgen via HomeCheff is vanaf 18 jaar. Deze
            datum wordt niet uit Stripe KYC overgenomen.
          </p>
        </div>
      </div>

      {locked || savedIso ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-800">
            Bevestigd: {displayLocked || 'opgeslagen'}
          </p>
          <p className="text-sm text-gray-600">
            {COMMERCIAL_DELIVERY_DOB_LOCKED_MESSAGE_NL}
          </p>
          {eligible === false ? (
            <p className="text-sm font-medium text-amber-800">
              {COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_NL}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700" htmlFor="account-dob">
            Geboortedatum
          </label>
          <input
            id="account-dob"
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full max-w-xs rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900"
            required
          />
          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy || !value}
            onClick={() => void handleSave()}
            className="inline-flex min-h-[44px] items-center rounded-xl bg-primary-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? 'Opslaan…' : 'Bevestigen'}
          </button>
        </div>
      )}
    </div>
  );
}
