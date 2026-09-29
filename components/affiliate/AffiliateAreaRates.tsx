'use client';

import { useState } from 'react';
import { buildAffiliateCommissionCatalog, type CatalogRow } from '@/lib/affiliate/commission-catalog';
import { useTranslation } from '@/hooks/useTranslation';

/** Rate next to the opportunity. Amounts come from the commission catalogue. */
export default function AffiliateAreaRates({
  match,
}: {
  match: (row: CatalogRow) => boolean;
}) {
  const { language, tOr } = useTranslation();
  const en = language === 'en';
  const rows = buildAffiliateCommissionCatalog().filter(match);
  const [open, setOpen] = useState<string | null>(null);

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2" data-affiliate-area-rates>
      {rows.map((row) => {
        const details = en ? row.detailEn : row.detailNl;
        return (
          <article key={row.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <h3 className="text-sm font-semibold text-slate-900">{row.product}</h3>
            <p className="mt-1 text-sm text-slate-600">{en ? row.fitEn : row.fitNl}</p>
            <p className="mt-2 text-sm font-semibold text-emerald-950">{en ? row.earningLabelEn : row.earningLabelNl}</p>
            <button
              type="button"
              className="mt-2 min-h-11 text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline"
              aria-expanded={open === row.id}
              onClick={() => setOpen((current) => (current === row.id ? null : row.id))}
            >
              {tOr('affiliate.rates.details', 'Details', 'Details')}
            </button>
            {open === row.id ? (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                {details.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
