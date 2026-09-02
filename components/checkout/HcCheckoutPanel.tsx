'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type HcCheckoutQuote = {
  ok?: boolean;
  totalAvailableHc: number;
  eligibleHc: number;
  orderAmountCents: number;
  maxHcApplicable: number;
  remainingEurCents: number;
  marketplaceHcEnabled: boolean;
  mixedPaymentEnabled?: boolean;
  hcPaymentActionable: boolean;
  userMessageNl?: string;
  reasonCode?: string;
  paymentOptions?: { eurOnly: boolean; hcOnly: boolean; mixed: boolean };
};

type Props = {
  items: Array<{ productId: string; quantity: number }>;
  deliveryFeeCents: number;
  smsNotificationCostCents?: number;
  /** Selected HC amount (0 = do not use HC). Controlled by parent for checkout submit. */
  selectedHc: number;
  onSelectedHcChange: (hc: number) => void;
  enabled: boolean;
};

function formatHc(n: number): string {
  return n.toLocaleString('nl-NL');
}

function formatEur(cents: number): string {
  return `€${(Math.max(0, cents) / 100).toFixed(2)}`;
}

/**
 * Marketplace HC selection panel.
 * Server quote is authoritative — client never invents balance/rate/max.
 * Default selectedHc must remain 0 (explicit consent).
 */
export function HcCheckoutPanel({
  items,
  deliveryFeeCents,
  smsNotificationCostCents = 0,
  selectedHc,
  onSelectedHcChange,
  enabled,
}: Props) {
  const [quote, setQuote] = useState<HcCheckoutQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [useHc, setUseHc] = useState(false);

  const itemKey = useMemo(
    () =>
      items
        .map((i) => `${i.productId}:${i.quantity}`)
        .sort()
        .join('|'),
    [items],
  );

  const refreshQuote = useCallback(async () => {
    if (!enabled || items.length === 0) {
      setQuote(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/hc-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          items,
          deliveryFeeCents,
          smsNotificationCostCents,
        }),
      });
      const json = (await res.json()) as HcCheckoutQuote;
      if (res.ok && json) setQuote(json);
      else setQuote(null);
    } catch {
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, items, deliveryFeeCents, smsNotificationCostCents, itemKey]);

  useEffect(() => {
    void refreshQuote();
  }, [refreshQuote]);

  const maxHc = quote?.maxHcApplicable ?? 0;
  const actionable = Boolean(quote?.hcPaymentActionable && maxHc > 0);

  useEffect(() => {
    if (!useHc) {
      if (selectedHc !== 0) onSelectedHcChange(0);
      return;
    }
    if (selectedHc > maxHc) onSelectedHcChange(maxHc);
  }, [useHc, maxHc, selectedHc, onSelectedHcChange]);

  if (!enabled) return null;

  if (loading && !quote) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500">
        HC-saldo laden…
      </div>
    );
  }

  if (!quote?.marketplaceHcEnabled) {
    return null;
  }

  const hcUsed = useHc ? Math.min(selectedHc, maxHc) : 0;
  // Face value from server policy (1 HC = €0.01) — display only; server re-validates.
  const hcCreditCents = hcUsed;
  const remainingCents = Math.max(0, (quote.orderAmountCents ?? 0) - hcCreditCents);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-900">HC gebruiken</p>
          <p className="text-xs text-stone-500">Je HC-saldo: {formatHc(quote.totalAvailableHc)} HC</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={useHc}
          disabled={!actionable}
          onClick={() => {
            const next = !useHc;
            setUseHc(next);
            if (!next) onSelectedHcChange(0);
            else if (selectedHc === 0 && maxHc > 0) onSelectedHcChange(0);
          }}
          className={
            useHc
              ? 'relative h-7 w-12 rounded-full bg-emerald-600 transition-colors disabled:opacity-40'
              : 'relative h-7 w-12 rounded-full bg-stone-300 transition-colors disabled:opacity-40'
          }
        >
          <span
            className={
              useHc
                ? 'absolute left-6 top-0.5 size-6 rounded-full bg-white shadow'
                : 'absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow'
            }
          />
        </button>
      </div>

      {quote.eligibleHc < quote.totalAvailableHc ? (
        <p className="text-xs text-stone-600">
          Voor deze aankoop te gebruiken: maximaal {formatHc(quote.eligibleHc)} HC
        </p>
      ) : null}

      {!actionable && quote.userMessageNl ? (
        <p className="text-xs text-amber-800">{quote.userMessageNl}</p>
      ) : null}

      {useHc && actionable ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={maxHc}
              step={1}
              value={hcUsed}
              onChange={(e) => onSelectedHcChange(Number(e.target.value))}
              className="w-full accent-emerald-700"
              aria-label="HC voor deze bestelling"
            />
            <input
              type="number"
              min={0}
              max={maxHc}
              value={hcUsed}
              onChange={(e) => {
                const n = Math.floor(Number(e.target.value) || 0);
                onSelectedHcChange(Math.max(0, Math.min(maxHc, n)));
              }}
              className="w-24 rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
            onClick={() => onSelectedHcChange(maxHc)}
          >
            Maximaal gebruiken ({formatHc(maxHc)} HC)
          </button>
          <div className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-800 space-y-1">
            <div className="flex justify-between">
              <span>Je gebruikt</span>
              <span className="font-semibold">{formatHc(hcUsed)} HC</span>
            </div>
            <div className="flex justify-between">
              <span>HC-korting</span>
              <span>−{formatEur(hcCreditCents)}</span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-1 font-semibold">
              <span>Nog te betalen</span>
              <span>{formatEur(remainingCents)}</span>
            </div>
            {remainingCents === 0 ? (
              <p className="text-xs text-emerald-800 pt-1">Betaal volledig met HC</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
