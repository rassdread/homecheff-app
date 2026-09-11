'use client';

import { useState } from 'react';
import { Building2, User } from 'lucide-react';
import type { ConnectTrack } from '@/lib/stripe/connect-tracks';

type Props = {
  onSelect: (track: ConnectTrack) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  /** Show recovery copy when user is stuck on Express as particular. */
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
          {recoveryMode
            ? 'Betaalprofiel opnieuw instellen'
            : 'Hoe gebruik je HomeCheff?'}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {recoveryMode
            ? 'Je betaalprofiel is eerder gestart via onze zakelijke verificatieroute. Omdat je HomeCheff als particulier gebruikt, kunnen we je betaalprofiel opnieuw instellen via de particuliere verificatie. Listings, reviews, chat en orders blijven behouden.'
            : 'Kies de route die bij jouw situatie past. Dit bepaalt welke Stripe-verificatie nodig is.'}
        </p>
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
                Voor verkopen als particulier. Stripe verifieert je identiteit
                en bankrekening; een KvK-inschrijving is voor deze
                verificatieroute niet nodig.
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                HomeCheff kiest hiermee alleen de Stripe Connect-route.
                Eventuele wettelijke of fiscale verplichtingen blijven afhankelijk
                van jouw activiteit en situatie.
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
                Je verkoopt via een onderneming en hebt een KvK-inschrijving.
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                Stripe vraagt bedrijfsgegevens en KvK-verificatie voor deze
                route.
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
