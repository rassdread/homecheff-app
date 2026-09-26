'use client';

import { useMemo, useState } from 'react';
import {
  feePercentForSellerTier,
  marketplaceSaleEconomics,
} from '@/lib/affiliate/marketplace-sale-economics';
import { PUBLIC_MARKETPLACE_SELLER_FEES } from '@/lib/earn/public-economics';

function eur(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function SellerKeepCalculator() {
  const [euros, setEuros] = useState('50');
  const [tier, setTier] = useState<keyof typeof PUBLIC_MARKETPLACE_SELLER_FEES>('individual');
  const quote = useMemo(() => {
    const sale = Math.round(Number(euros.replace(',', '.')) * 100);
    if (!Number.isFinite(sale) || sale <= 0) return null;
    return marketplaceSaleEconomics({
      saleCents: sale,
      feePercent: feePercentForSellerTier(tier),
    });
  }, [euros, tier]);

  return (
    <section className="mx-auto mb-10 max-w-xl rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Bereken wat je overhoudt</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Vul je verkoopprijs in. Je ziet de platformfee en wat er voor jou overblijft. Dit is de
        productprijs vóór eventuele betaalkosten die de koper apart ziet. Affiliatecommissie komt
        uit de fee en verandert dit bedrag niet.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="text-sm text-slate-700">
          Verkoopprijs (€)
          <input
            value={euros}
            onChange={(event) => setEuros(event.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm text-slate-700">
          Tarief
          <select
            value={tier}
            onChange={(event) =>
              setTier(event.target.value as keyof typeof PUBLIC_MARKETPLACE_SELLER_FEES)
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="individual">Particulier {PUBLIC_MARKETPLACE_SELLER_FEES.individual.percent}%</option>
            <option value="basic">Basic {PUBLIC_MARKETPLACE_SELLER_FEES.basic.percent}%</option>
            <option value="pro">Pro {PUBLIC_MARKETPLACE_SELLER_FEES.pro.percent}%</option>
            <option value="premium">Premium {PUBLIC_MARKETPLACE_SELLER_FEES.premium.percent}%</option>
          </select>
        </label>
      </div>
      {quote ? (
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt>Klant betaalt (product)</dt>
            <dd className="font-semibold">{eur(quote.saleCents)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Platformfee ({quote.feePercent}%)</dt>
            <dd className="font-semibold">{eur(quote.platformFeeCents)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-slate-100 pt-2">
            <dt>Jij houdt over</dt>
            <dd className="font-semibold">{eur(quote.sellerProceedsCents)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Vul een prijs boven nul in.</p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        HomeCheff bepaalt niet of je juridisch een onderneming bent. Voor belastingvragen kun je
        VerdienCheck gebruiken. Een bedrijfsabonnement is een HomeCheff-tarief, geen oordeel over
        je rechtsvorm.
      </p>
    </section>
  );
}
