'use client';

/**
 * TRUST-1.1 — multi-select seller contribution types + optional note.
 */

import { useTranslation } from '@/hooks/useTranslation';
import {
  SELLER_CONTRIBUTION_LABELS,
  SELLER_CONTRIBUTION_NOTE_MAX,
  type SellerContributionType,
} from '@/lib/trust/seller-contribution';
import { cn } from '@/lib/utils';

type Props = {
  selected: SellerContributionType[];
  note: string;
  onChangeSelected: (next: SellerContributionType[]) => void;
  onChangeNote: (next: string) => void;
  required?: boolean;
  disabled?: boolean;
  suggested?: SellerContributionType[];
  className?: string;
};

export default function SellerContributionSelector({
  selected,
  note,
  onChangeSelected,
  onChangeNote,
  required,
  disabled,
  suggested = [],
  className,
}: Props) {
  const { t, language } = useTranslation();
  const locale = language === 'en' ? 'en' : 'nl';

  const toggle = (id: SellerContributionType) => {
    if (disabled) return;
    if (selected.includes(id)) {
      onChangeSelected(selected.filter((x) => x !== id));
    } else {
      onChangeSelected([...selected, id]);
    }
  };

  return (
    <div
      data-hc-seller-contribution=""
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-3 sm:p-4 space-y-3',
        className,
      )}
    >
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {t('trust.contribution.question')}
          {required ? <span className="text-red-500"> *</span> : null}
        </p>
        <p className="mt-1 text-xs text-gray-600 leading-relaxed">
          {t('trust.contribution.help')}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {SELLER_CONTRIBUTION_LABELS.map((row) => {
          const active = selected.includes(row.id);
          const soft = suggested.includes(row.id) && !active;
          return (
            <button
              key={row.id}
              type="button"
              disabled={disabled}
              data-hc-contribution-type={row.id}
              aria-pressed={active}
              onClick={() => toggle(row.id)}
              className={cn(
                'min-h-[40px] rounded-full border px-3 py-1.5 text-xs font-medium transition-colors touch-manipulation',
                active
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                  : soft
                    ? 'border-emerald-200 bg-emerald-50/40 text-gray-700'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300',
                disabled && 'opacity-50',
              )}
            >
              {locale === 'en' ? row.labelEn : row.labelNl}
            </button>
          );
        })}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t('trust.contribution.noteLabel')}
        </label>
        <textarea
          data-hc-contribution-note=""
          value={note}
          disabled={disabled}
          maxLength={SELLER_CONTRIBUTION_NOTE_MAX}
          rows={3}
          onChange={(e) => onChangeNote(e.target.value)}
          placeholder={t('trust.contribution.notePlaceholder')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-[10px] text-gray-500">
          {note.trim().length}/{SELLER_CONTRIBUTION_NOTE_MAX}
        </p>
      </div>
    </div>
  );
}
