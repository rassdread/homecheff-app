'use client';

import { useState } from 'react';
import { Shield } from 'lucide-react';
import DateOfBirthFields, {
  emptyDateOfBirthParts,
  isoFromParts,
  partsFromIso,
  slashFromParts,
  type DateOfBirthParts,
} from '@/components/account/DateOfBirthFields';
import {
  COMMERCIAL_DELIVERY_DOB_LOCKED_MESSAGE_NL,
  COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_NL,
} from '@/lib/delivery/delivery-age';

type Props = {
  dateOfBirthIso?: string | null;
  locked?: boolean;
  eligible?: boolean;
  under18?: boolean;
  onSaved?: (payload: {
    dateOfBirthIso: string | null;
    locked: boolean;
    eligible: boolean;
    under18: boolean;
  }) => void;
};

export default function DeliveryAgeConfirmCard({
  dateOfBirthIso,
  locked = false,
  eligible = false,
  under18 = false,
  onSaved,
}: Props) {
  const [parts, setParts] = useState<DateOfBirthParts>(() => partsFromIso(dateOfBirthIso));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localLocked, setLocalLocked] = useState(locked);
  const [localEligible, setLocalEligible] = useState(eligible);
  const [localUnder18, setLocalUnder18] = useState(under18);
  const [localIso, setLocalIso] = useState(dateOfBirthIso || null);

  const confirmed = localLocked && Boolean(localIso);

  async function confirm() {
    if (localLocked) return;
    setSaving(true);
    setError(null);
    try {
      const iso = isoFromParts(parts);
      const slash = slashFromParts(parts);
      const res = await fetch('/api/account/date-of-birth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateOfBirth: iso || slash }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === 'string'
            ? data.error
            : 'Geboortedatum kon niet worden opgeslagen.',
        );
        return;
      }
      const nextIso = typeof data.dateOfBirthIso === 'string' ? data.dateOfBirthIso : iso;
      const nextEligible = Boolean(data.deliveryAgeEligible);
      const nextUnder18 = data.deliveryAgeStatus === 'DELIVERY_UNDER_18';
      setLocalIso(nextIso);
      setLocalLocked(true);
      setLocalEligible(nextEligible);
      setLocalUnder18(nextUnder18);
      onSaved?.({
        dateOfBirthIso: nextIso,
        locked: true,
        eligible: nextEligible,
        under18: nextUnder18,
      });
    } catch {
      setError('Geboortedatum kon niet worden opgeslagen.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      id="leeftijd"
      className="scroll-mt-24 rounded-xl border bg-white p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary-600" />
        <h2 className="text-xl font-semibold text-gray-900">Leeftijd bevestigen</h2>
      </div>
      <p className="mb-5 text-sm text-gray-600">
        Om via HomeCheff te bezorgen moet je minimaal 18 jaar zijn.
      </p>

      {confirmed ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
          <p>
            Geboortedatum:{' '}
            <span className="font-medium tabular-nums">
              {localIso ? localIso.split('-').reverse().join('-') : 'bevestigd'}
            </span>
          </p>
          {localUnder18 ? (
            <p className="mt-2 font-medium text-red-700">
              {COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_NL}
            </p>
          ) : localEligible ? (
            <p className="mt-2 text-green-800">Je leeftijd is bevestigd. Je voldoet aan de 18+-regel.</p>
          ) : null}
          <p className="mt-2 text-xs text-gray-500">{COMMERCIAL_DELIVERY_DOB_LOCKED_MESSAGE_NL}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-800">Geboortedatum</p>
          <DateOfBirthFields
            value={parts}
            onChange={setParts}
            disabled={saving}
            error={error}
            idPrefix="delivery-dob"
          />
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={saving}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? 'Bevestigen…' : 'Bevestigen'}
          </button>
        </div>
      )}
    </section>
  );
}
