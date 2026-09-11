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
          Je gebruikt HomeCheff als:
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
              <p className="mt-1 text-xs font-medium text-emerald-800">
                Verkoop je als particulier?
              </p>
              <ul className="mt-2 space-y-1 text-xs leading-relaxed text-gray-600 list-disc pl-4">
                <li>Stripe controleert je identiteit</li>
                <li>Bankrekening nodig voor uitbetaling</li>
                <li>Deze Stripe-verificatieroute vraagt geen KvK-gegevens</li>
                <li>
                  HomeCheff-profiel en listings kun je ook zonder betaalaccount
                  gebruiken
                </li>
                <li>
                  Betaling via HomeCheff wordt beschikbaar na verificatie
                </li>
              </ul>
            </div>
          </div>
          {pending === 'PARTICULAR' && (
            <p className="mt-3 text-xs text-emerald-800">
              Je gaat nu naar Stripe om je identiteit en uitbetalingsrekening te
              verifiëren…
            </p>
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
              <p className="mt-1 text-xs font-medium text-blue-800">
                Verkoop je vanuit een onderneming?
              </p>
              <ul className="mt-2 space-y-1 text-xs leading-relaxed text-gray-600 list-disc pl-4">
                <li>Zakelijke Stripe-verificatie</li>
                <li>Bedrijfsgegevens kunnen nodig zijn</li>
                <li>Stripe kan bedrijfsdocumenten opvragen</li>
              </ul>
            </div>
          </div>
          {pending === 'BUSINESS' && (
            <p className="mt-3 text-xs text-blue-800">
              Je gaat nu naar Stripe om je identiteit en uitbetalingsrekening te
              verifiëren…
            </p>
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
