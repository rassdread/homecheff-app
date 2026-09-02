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

export function MijnHomecheffHcWalletClient() {
  const [data, setData] = useState<WalletPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [promoErr, setPromoErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/me/hc-wallet', {
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const json = (await res.json()) as WalletPayload;
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function redeemPromo(e: React.FormEvent) {
    e.preventDefault();
    setPromoMsg(null);
    setPromoErr(null);
    const res = await fetch('/api/me/hc-wallet/redeem-promo', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const json = (await res.json()) as { ok?: boolean; message?: string };
    if (!res.ok || !json.ok) {
      setPromoErr(json.message ?? 'Inwisselen mislukt.');
      return;
    }
    setPromoMsg(json.message ?? 'HC toegevoegd.');
    setCode('');
    void reload();
  }

  if (loading && !data) {
    return <p className="text-sm text-stone-600">HC-saldo laden…</p>;
  }

  const available = data?.availableHc ?? 0;
  const eligible = data?.sellerPrincipalEligibleHc ?? 0;
  const activity = data?.activity ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <p className="text-sm font-medium text-stone-600">HC-saldo</p>
        <p className="mt-1 text-3xl font-bold text-stone-900">{available.toLocaleString('nl-NL')} HC</p>
        {eligible < available ? (
          <p className="mt-2 text-sm text-stone-600">
            Voor aankopen te gebruiken: maximaal{' '}
            <span className="font-semibold">{eligible.toLocaleString('nl-NL')} HC</span>
          </p>
        ) : null}
        {eligible < available ? (
          <p className="mt-1 text-xs text-stone-500">
            Een deel van je HC is binnenkort beschikbaar voor aankopen.
          </p>
        ) : null}
      </div>

      <form onSubmit={(e) => void redeemPromo(e)} className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">Promocode</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="VLAARDINGEN500"
            className="min-h-[44px] flex-1 rounded-lg border border-stone-200 px-3 text-sm"
          />
          <button
            type="submit"
            className="min-h-[44px] rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Inwisselen
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
