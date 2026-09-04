'use client';

import { useCallback, useEffect, useState } from 'react';

type Activity = {
  id: string;
  deltaHc: number;
  direction: 'credit' | 'debit';
  labelNl: string;
  createdAt: string;
};

type WalletPayload = {
  ok?: boolean;
  availableHc?: number;
  reservedHc?: number;
  sellerPrincipalEligibleHc?: number;
  marketplaceEligibleHc?: number;
  marketplacePendingHc?: number;
  marketplacePendingUnlockAt?: string | null;
  marketplaceNotEligibleHc?: number;
  studioEligibleHc?: number;
  growthEligibleHc?: number;
  paidBackedHc?: number;
  promotionalHc?: number;
  activity?: Activity[];
  identityResolved?: boolean;
  walletResolved?: boolean;
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDateOnly(iso: string): string {
  try {
    return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function MijnHomecheffHcWalletClient() {
  const [data, setData] = useState<WalletPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [promoErr, setPromoErr] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [whereOpen, setWhereOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/me/hc-wallet', {
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const json = (await res.json()) as WalletPayload;
      if (!res.ok) {
        setLoadError('HC-saldo kon niet worden geladen.');
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setLoadError('HC-saldo kon niet worden geladen.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function redeemPromo(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || promoLoading) return;
    setPromoMsg(null);
    setPromoErr(null);
    setPromoLoading(true);
    try {
      const res = await fetch('/api/me/hc-wallet/redeem-promo', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setPromoErr(json.message ?? 'Inwisselen mislukt.');
        return;
      }
      setPromoMsg(json.message ?? 'HC toegevoegd.');
      setCode('');
      void reload();
    } catch {
      setPromoErr('Inwisselen mislukt. Probeer het later opnieuw.');
    } finally {
      setPromoLoading(false);
    }
  }

  if (loading && !data) {
    return <p className="text-sm text-stone-600">HC-saldo laden…</p>;
  }

  if (loadError && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
        {loadError}
        <button
          type="button"
          className="mt-2 block font-semibold underline"
          onClick={() => void reload()}
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  const available = data?.availableHc ?? 0;
  const reserved = data?.reservedHc ?? 0;
  const marketplaceEligible =
    data?.marketplaceEligibleHc ?? data?.sellerPrincipalEligibleHc ?? 0;
  const marketplacePending = data?.marketplacePendingHc ?? 0;
  const marketplacePendingUnlockAt = data?.marketplacePendingUnlockAt ?? null;
  const promotional = data?.promotionalHc ?? 0;
  const marketplaceNotEligible =
    data?.marketplaceNotEligibleHc ??
    Math.max(0, available - marketplaceEligible - marketplacePending);
  const studioEligible = data?.studioEligibleHc ?? available;
  const growthEligible = data?.growthEligibleHc ?? available;
  const activity = data?.activity ?? [];
  const showDestinationBreakdown =
    marketplaceEligible < available || marketplacePending > 0 || reserved > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <p className="text-sm font-medium text-stone-600">HC-saldo</p>
        <p className="mt-1 text-3xl font-bold text-stone-900">
          {available.toLocaleString('nl-NL')} HC
        </p>
        <p className="mt-1 text-xs text-stone-500">
          Eén HomeCheff-tegoed voor heel het ecosysteem. Waar je het kunt gebruiken hangt af van de
          herkomst van je HC.
        </p>

        {showDestinationBreakdown ? (
          <div className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">Daarvan</p>
            <p>
              Marketplace:{' '}
              <span className="font-semibold">
                {marketplaceEligible.toLocaleString('nl-NL')} HC beschikbaar
              </span>
            </p>
            <p>
              Studio:{' '}
              <span className="font-semibold">
                {studioEligible.toLocaleString('nl-NL')} HC beschikbaar
              </span>
            </p>
            <p>
              Growth:{' '}
              <span className="font-semibold">
                {growthEligible.toLocaleString('nl-NL')} HC beschikbaar
              </span>
            </p>
            {reserved > 0 ? (
              <p>
                Gereserveerd:{' '}
                <span className="font-semibold">{reserved.toLocaleString('nl-NL')} HC</span>
              </p>
            ) : null}
            {marketplacePending > 0 && marketplacePendingUnlockAt ? (
              <p className="text-stone-600">
                {marketplacePending.toLocaleString('nl-NL')} HC wordt beschikbaar voor Marketplace op{' '}
                {formatDateOnly(marketplacePendingUnlockAt)}.
              </p>
            ) : null}
            {marketplaceNotEligible > 0 && marketplacePending === 0 ? (
              <p className="text-stone-600">
                {(() => {
                  const paid = data?.paidBackedHc ?? 0;
                  const promo = promotional;
                  if (marketplaceEligible > 0 && promo > 0 && marketplaceNotEligible === promo) {
                    return `${marketplaceEligible.toLocaleString('nl-NL')} HC komt uit een betaald abonnement of HC-pakket en is binnen het HomeCheff-ecosysteem te gebruiken, inclusief Marketplace. ${promo.toLocaleString('nl-NL')} HC is promotietegoed met beperkte inzetbaarheid.`;
                  }
                  if (marketplaceEligible > 0 && paid > 0 && promo === 0) {
                    return `${marketplaceEligible.toLocaleString('nl-NL')} HC komt uit een betaald abonnement of HC-pakket en is binnen het HomeCheff-ecosysteem te gebruiken, inclusief Marketplace.`;
                  }
                  if (paid > 0 && promo > 0 && marketplaceEligible === 0) {
                    return `${paid.toLocaleString('nl-NL')} HC abonnementstegoed en ${promo.toLocaleString('nl-NL')} HC actietegoed zijn beschikbaar in Studio/Growth. Marketplace-vrijgave volgt de herkomstregels van elk tegoed.`;
                  }
                  if (paid > 0 && marketplaceEligible === 0) {
                    return `${paid.toLocaleString('nl-NL')} HC abonnementstegoed is beschikbaar in Studio/Growth. Marketplace-vrijgave volgt de betaal- en herkomstregels.`;
                  }
                  if (promo > 0) {
                    return `${promo.toLocaleString('nl-NL')} HC is promotietegoed met beperkte inzetbaarheid — niet automatisch voor Marketplace-aankopen.`;
                  }
                  return 'Niet al je HC is geschikt voor Marketplace-aankopen.';
                })()}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4">
          <button
            type="button"
            className="text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline"
            aria-expanded={whereOpen}
            onClick={() => setWhereOpen((v) => !v)}
          >
            Waar kan ik mijn HC gebruiken?
          </button>
          {whereOpen ? (
            <ul className="mt-2 space-y-1.5 text-sm text-stone-700">
              <li>
                Marketplace —{' '}
                {marketplaceEligible > 0
                  ? `✓ ${marketplaceEligible.toLocaleString('nl-NL')} HC beschikbaar`
                  : '0 HC beschikbaar voor aankopen'}
              </li>
              <li>
                Studio — ✓ {studioEligible.toLocaleString('nl-NL')} HC beschikbaar
              </li>
              <li>
                Growth — ✓ {growthEligible.toLocaleString('nl-NL')} HC beschikbaar
              </li>
              {promotional > 0 || (data?.paidBackedHc ?? 0) > 0 ? (
                <li>
                  {(data?.paidBackedHc ?? 0) > 0
                    ? `Abonnementstegoed — ${(data?.paidBackedHc ?? 0).toLocaleString('nl-NL')} HC voor HomeCheff-diensten (niet automatisch Marketplace)`
                    : null}
                  {(data?.paidBackedHc ?? 0) > 0 && promotional > 0 ? <br /> : null}
                  {promotional > 0
                    ? `Promotietegoed — ${promotional.toLocaleString('nl-NL')} HC voor HomeCheff-diensten (niet automatisch Marketplace)`
                    : null}
                </li>
              ) : null}
              {marketplacePending > 0 && marketplacePendingUnlockAt ? (
                <li>
                  Binnenkort Marketplace — {marketplacePending.toLocaleString('nl-NL')} HC op{' '}
                  {formatDateOnly(marketplacePendingUnlockAt)}
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </div>

      <form onSubmit={(e) => void redeemPromo(e)} className="rounded-xl border border-stone-200 bg-white p-4">
        <label htmlFor="hc-promocode" className="text-sm font-semibold text-stone-900">
          Promocode
        </label>
        <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row sm:items-stretch">
          <input
            id="hc-promocode"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (promoErr) setPromoErr(null);
              if (promoMsg) setPromoMsg(null);
            }}
            placeholder="Voer je promocode in"
            autoComplete="off"
            disabled={promoLoading}
            className="min-h-[44px] w-full min-w-0 flex-1 rounded-lg border border-stone-200 px-3 text-sm sm:min-w-[12rem]"
          />
          <button
            type="submit"
            disabled={promoLoading || !code.trim()}
            className="min-h-[44px] w-full shrink-0 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 sm:w-auto"
          >
            {promoLoading ? 'Bezig…' : 'Inwisselen'}
          </button>
        </div>
        {promoMsg ? <p className="mt-2 text-sm text-emerald-800">{promoMsg}</p> : null}
        {promoErr ? (
          <p className="mt-2 text-sm text-red-700" role="alert">
            {promoErr}
          </p>
        ) : null}
      </form>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-stone-900">Activiteit</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-stone-600">Nog geen HC-activiteit.</p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
            {activity.map((row) => (
              <li key={row.id} className="flex justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {row.direction === 'credit' ? '+' : '−'}
                    {Math.abs(row.deltaHc).toLocaleString('nl-NL')} HC
                  </p>
                  <p className="text-sm text-stone-600">{row.labelNl}</p>
                  <p className="text-xs text-stone-400">{formatWhen(row.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
