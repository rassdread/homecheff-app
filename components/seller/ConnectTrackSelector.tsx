'use client';

import { useState } from 'react';
import { Building2, User } from 'lucide-react';
import type { ConnectTrack } from '@/lib/stripe/connect-tracks';

type Props = {
  onSelect: (track: ConnectTrack) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  /** Migration confirmation for stuck/wrong Express accounts. */
  recoveryMode?: boolean;
};

export default function ConnectTrackSelector({
  onSelect,
  loading,
  error,
  recoveryMode,
}: Props) {
  const [pending, setPending] = useState<ConnectTrack | null>(null);

  const choose = async (track: ConnectTrack) => {
    setPending(track);
    try {
      await onSelect(track);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Hoe gebruik je HomeCheff?
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {recoveryMode
            ? 'Je betaalprofiel is eerder via een andere Stripe-route gestart. Kies hoe je HomeCheff gebruikt, zodat we je betaalprofiel correct kunnen instellen.'
            : 'Kies de route die bij jouw situatie past. Dit bepaalt welke Stripe-verificatie nodig is.'}
        </p>
        {recoveryMode && (
          <p className="mt-2 text-xs text-gray-500">
            Je HomeCheff-profiel, advertenties, berichten, reviews en
            bestellingen blijven behouden.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={Boolean(loading || pending)}
          onClick={() => void choose('PARTICULAR')}
          className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50/40 disabled:opacity-60"
        >
          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-medium text-gray-900">Particulier</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                Voor verkoop als particulier. Stripe controleert je identiteit
                en bankrekening. Voor deze verificatieroute vraagt Stripe geen
                KvK-inschrijving.
              </p>
            </div>
          </div>
          {pending === 'PARTICULAR' && (
            <p className="mt-3 text-xs text-emerald-800">Bezig…</p>
          )}
        </button>

        <button
          type="button"
          disabled={Boolean(loading || pending)}
          onClick={() => void choose('BUSINESS')}
          className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/40 disabled:opacity-60"
        >
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div>
              <p className="font-medium text-gray-900">Bedrijf</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                Voor verkoop vanuit een onderneming. Je bestaande zakelijke
                Stripe-verificatie wordt gebruikt of hervat.
              </p>
            </div>
          </div>
          {pending === 'BUSINESS' && (
            <p className="mt-3 text-xs text-blue-800">Bezig…</p>
          )}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
