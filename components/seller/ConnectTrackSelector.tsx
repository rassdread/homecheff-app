'use client';

import { useState } from 'react';
import { Building2, User, Check, ArrowLeft } from 'lucide-react';
import type { ConnectTrack } from '@/lib/stripe/connect-tracks';

type Props = {
  onSelect: (track: ConnectTrack) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  /** Migration confirmation for stuck/wrong Express / config mismatch. */
  recoveryMode?: boolean;
  /** Explicit mismatch copy for PARTICULAR non_profit/company. */
  mismatchMode?: boolean;
};

export default function ConnectTrackSelector({
  onSelect,
  loading,
  error,
  recoveryMode,
  mismatchMode,
}: Props) {
  const [pending, setPending] = useState<ConnectTrack | null>(null);
  const [confirmTrack, setConfirmTrack] = useState<ConnectTrack | null>(null);

  const choose = async (track: ConnectTrack) => {
    setPending(track);
    try {
      await onSelect(track);
    } finally {
      setPending(null);
    }
  };

  if (confirmTrack) {
    const isParticular = confirmTrack === 'PARTICULAR';
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Je hebt gekozen voor
          </p>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">
            {isParticular ? 'PARTICULIER' : 'BEDRIJF'}
          </h3>
        </div>

        {isParticular ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-sm font-medium text-emerald-950 mb-2">
              Stripe verifieert:
            </p>
            <ul className="space-y-1.5 text-sm text-emerald-900">
              <li className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 mt-0.5" /> je identiteit
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 mt-0.5" /> je persoonlijke
                gegevens
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 mt-0.5" /> je bankrekening
              </li>
            </ul>
            <p className="mt-3 text-sm text-emerald-900">
              Voor deze HomeCheff-verificatieroute vraagt Stripe geen
              KvK-gegevens.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <p className="text-sm font-medium text-blue-950 mb-2">
              Stripe kan controleren:
            </p>
            <ul className="space-y-1.5 text-sm text-blue-900">
              <li className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 mt-0.5" /> bedrijfsgegevens
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 mt-0.5" /> vertegenwoordiger
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 mt-0.5" /> bankrekening
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 mt-0.5" /> aanvullende
                bedrijfsdocumenten indien vereist
              </li>
            </ul>
          </div>
        )}

        <p className="text-sm text-slate-600">
          Je gaat nu naar Stripe om je identiteit en uitbetalingsrekening te
          verifiëren.
        </p>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        {/*
          CTA layout: 1-col full width below lg (phone + tablet portrait).
          From lg: primary gets minmax(16rem, 1fr), secondary stays content-sized.
          Avoids sm:flex-row + flex-1 (basis 0%) which crushed the Stripe CTA.
        */}
        <div className="grid w-full grid-cols-1 gap-2 lg:grid-cols-[minmax(16rem,1fr)_auto] lg:items-stretch">
          <button
            type="button"
            disabled={Boolean(loading || pending)}
            onClick={() => void choose(confirmTrack)}
            className="inline-flex min-h-[48px] w-full min-w-0 items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-center text-sm font-semibold leading-snug text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[16rem]"
          >
            {pending
              ? 'Bezig…'
              : isParticular
                ? 'Naar Stripe om te verifiëren'
                : 'Naar Stripe om te verifiëren'}
          </button>
          <button
            type="button"
            disabled={Boolean(loading || pending)}
            onClick={() => setConfirmTrack(null)}
            className="inline-flex min-h-[48px] w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold whitespace-nowrap text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Keuze wijzigen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Hoe verkoop je op HomeCheff?
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {mismatchMode
            ? 'Je betaalaccount is ingesteld als een organisatie, terwijl je HomeCheff gebruikt als particulier. Kies opnieuw hoe je wilt verkopen om de juiste verificatie te gebruiken.'
            : recoveryMode
              ? 'Je betaalprofiel is eerder via een andere Stripe-route gestart. Kies hoe je HomeCheff gebruikt, zodat we je betaalprofiel correct kunnen instellen.'
              : 'Kies de route die bij jouw situatie past. Dit bepaalt welke Stripe-verificatie nodig is.'}
        </p>
        {(recoveryMode || mismatchMode) && (
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
          onClick={() => setConfirmTrack('PARTICULAR')}
          className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50/40 disabled:opacity-60"
        >
          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-medium text-gray-900">Particulier</p>
              <p className="mt-1 text-xs font-medium text-emerald-800">
                Ik verkoop via HomeCheff als particulier.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-gray-600">
                Stripe controleert je identiteit en bankrekening zodat je via
                HomeCheff betalingen kunt ontvangen. Voor deze particuliere
                Stripe-verificatieroute vraagt Stripe geen KvK-gegevens.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">
                Je kunt HomeCheff ook gebruiken zonder het betaalaccount af te
                ronden. Voor betalingen via HomeCheff moet de Stripe-verificatie
                wel voltooid zijn.
              </p>
              <p className="mt-3 text-xs font-semibold text-emerald-800">
                Doorgaan als particulier →
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          disabled={Boolean(loading || pending)}
          onClick={() => setConfirmTrack('BUSINESS')}
          className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/40 disabled:opacity-60"
        >
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div>
              <p className="font-medium text-gray-900">Bedrijf</p>
              <p className="mt-1 text-xs font-medium text-blue-800">
                Ik verkoop via HomeCheff vanuit een onderneming.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-gray-600">
                Stripe controleert je zakelijke gegevens en uitbetalingsrekening.
                Afhankelijk van je onderneming kan Stripe aanvullende
                bedrijfsgegevens of documenten vragen.
              </p>
              <p className="mt-3 text-xs font-semibold text-blue-800">
                Doorgaan als bedrijf →
              </p>
            </div>
          </div>
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
