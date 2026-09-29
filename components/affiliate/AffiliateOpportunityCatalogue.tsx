'use client';

import { useMemo } from 'react';
import AffiliateCommissionCatalog from '@/components/affiliate/AffiliateCommissionCatalog';
import { buildAffiliateCommissionCatalog } from '@/lib/affiliate/commission-catalog';
import { useTranslation } from '@/hooks/useTranslation';

/** Prospective catalogue. Amounts come from buildAffiliateCommissionCatalog, not a second price list. */
export default function AffiliateOpportunityCatalogue() {
  const { language, tOr } = useTranslation();
  const rows = useMemo(() => buildAffiliateCommissionCatalog(), []);
  const lang = language === 'en' ? 'en' : 'nl';
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">
        {tOr('affiliate.verdienen.title', 'What you can earn', 'Wat je kunt verdienen')}
      </h2>
      <p className="text-sm text-slate-600">
        {tOr(
          'affiliate.verdienen.intro',
          'Compare what you can promote and what you can earn. This is not money already earned.',
          'Vergelijk wat je kunt promoten en wat je daarmee kunt verdienen. Dit is geen overzicht van al verdiend geld.',
        )}
      </p>
      <AffiliateCommissionCatalog rows={rows} lang={lang} presentation="grouped" />
    </section>
  );
}
