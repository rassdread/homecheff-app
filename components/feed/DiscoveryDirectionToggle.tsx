'use client';

import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export type DiscoveryDirection = 'want' | 'offer';

type Props = {
  value: DiscoveryDirection;
  onChange: (value: DiscoveryDirection) => void;
  compact?: boolean;
  className?: string;
};

/** Bidirectional discovery toggle — Phase 8C. */
export default function DiscoveryDirectionToggle({
  value,
  onChange,
  compact = false,
  className,
}: Props) {
  const { t } = useTranslation();

  const chip = (active: boolean) =>
    cn(
      'flex-1 rounded-lg px-2.5 py-2 text-left font-semibold transition-colors',
      compact ? 'text-[11px]' : 'text-xs',
      active
        ? 'bg-white text-emerald-800 shadow-sm'
        : 'text-gray-600 hover:text-gray-900',
    );

  return (
    <section className={className} data-discovery-direction={value}>
      <p
        className={cn(
          'font-semibold uppercase tracking-wide text-gray-500 mb-2',
          compact ? 'text-[10px]' : 'text-[10px]',
        )}
      >
        {t('marketplace.discovery.direction.label')}
      </p>
      <div
        className="grid grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1"
        role="group"
        aria-label={t('marketplace.discovery.direction.label')}
      >
        <button
          type="button"
          className={chip(value === 'want')}
          aria-pressed={value === 'want'}
          onClick={() => onChange('want')}
        >
          <span className="block">{t('marketplace.discovery.direction.want')}</span>
          <span
            className={cn(
              'block font-normal text-gray-500 mt-0.5',
              compact ? 'text-[9px]' : 'text-[10px]',
            )}
          >
            {t('marketplace.discovery.direction.wantHint')}
          </span>
        </button>
        <button
          type="button"
          className={chip(value === 'offer')}
          aria-pressed={value === 'offer'}
          onClick={() => onChange('offer')}
        >
          <span className="block">{t('marketplace.discovery.direction.offer')}</span>
          <span
            className={cn(
              'block font-normal text-gray-500 mt-0.5',
              compact ? 'text-[9px]' : 'text-[10px]',
            )}
          >
            {t('marketplace.discovery.direction.offerHint')}
          </span>
        </button>
      </div>
      {value === 'offer' ? (
        <p
          className={cn(
            'mt-2 text-gray-600 leading-snug rounded-lg border border-emerald-100 bg-emerald-50/50 px-2.5 py-2',
            compact ? 'text-[10px]' : 'text-xs',
          )}
        >
          {t('marketplace.discovery.direction.offerEducation')}
        </p>
      ) : null}
    </section>
  );
}
