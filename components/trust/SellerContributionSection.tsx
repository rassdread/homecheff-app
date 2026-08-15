'use client';

/**
 * TRUST-1.1 — subtle listing display of seller-declared contribution.
 */

import {
  labelForContributionType,
  parseSellerContributionTypes,
  type SellerContributionType,
} from '@/lib/trust/seller-contribution';
import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  types?: string[] | null;
  note?: string | null;
  className?: string;
};

export default function SellerContributionSection({
  types,
  note,
  className,
}: Props) {
  const { t, language } = useTranslation();
  const parsed = parseSellerContributionTypes(types);
  if (parsed.length === 0 && !note?.trim()) return null;

  const locale = language === 'en' ? 'en' : 'nl';

  return (
    <section
      data-hc-seller-contribution-display=""
      className={
        className ||
        'rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 space-y-2'
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('trust.contribution.displayTitle')}
        </h3>
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
          {t('trust.contribution.sellerDeclared')}
        </span>
      </div>
      {parsed.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {parsed.map((id: SellerContributionType) => (
            <li
              key={id}
              className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-800"
            >
              {labelForContributionType(id, locale)}
            </li>
          ))}
        </ul>
      ) : null}
      {note?.trim() ? (
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {note.trim()}
        </p>
      ) : null}
    </section>
  );
}
