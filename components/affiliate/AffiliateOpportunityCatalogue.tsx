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
          'Current opportunities and rates. This is not a statement of money already earned.',
          'Huidige mogelijkheden en tarieven. Dit is geen overzicht van al verdiende commissie.',
        )}
      </p>
      <AffiliateCommissionCatalog rows={rows} lang={lang} />
    </section>
  );
}
