'use client';

import {
  buildSubscriptionComparisonRows,
  subscriptionComparisonColumns,
  type ComparisonCell,
  type ComparisonColumnId,
} from '@/lib/business/subscription-comparison';
import { useTranslation } from '@/hooks/useTranslation';
import { Check, Minus } from 'lucide-react';

function Dots({ level, max = 4 }: { level: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            i < level ? 'bg-emerald-500' : 'bg-gray-200'
          }`}
        />
      ))}
    </span>
  );
}

function ComparisonCellView({ cell, t }: { cell: ComparisonCell; t: (k: string) => string }) {
  switch (cell.kind) {
    case 'percent':
      return <span className="font-medium text-gray-900">{cell.value}%</span>;
    case 'check':
      return (
        <span className="inline-flex text-emerald-600" aria-hidden>
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </span>
      );
    case 'dash':
      return (
        <span className="text-gray-300" aria-hidden>
          <Minus className="h-4 w-4 mx-auto" />
        </span>
      );
    case 'dots':
      return <Dots level={Number(cell.value ?? 0)} />;
    case 'label':
      return (
        <span className="text-xs font-medium text-gray-800 sm:text-sm">
          {t(String(cell.value))}
        </span>
      );
    case 'locations':
      return (
        <span className="text-sm text-gray-800">
          {Number(cell.value) >= 99
            ? t('business.dna.compare.locationsUnlimited')
            : String(cell.value)}
        </span>
      );
    case 'status':
      return (
        <span className="text-xs font-medium text-gray-700 sm:text-sm">
          {t(`business.dna.status.${cell.status ?? 'none'}`)}
        </span>
      );
    default:
      return null;
  }
}

const COLUMN_LABELS: Record<ComparisonColumnId, string> = {
  individual: 'business.dna.plan.individual',
  basic: 'business.dna.plan.basic',
  pro: 'business.dna.plan.pro',
  premium: 'business.dna.plan.premium',
};

export default function SubscriptionComparisonTable() {
  const { t } = useTranslation();
  const columns = subscriptionComparisonColumns();
  const rows = buildSubscriptionComparisonRows();

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80">
            <th
              scope="col"
              className="sticky left-0 z-10 min-w-[9rem] bg-gray-50/95 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              {t('business.dna.compare.feature')}
            </th>
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="min-w-[5.5rem] px-3 py-3 text-center text-xs font-semibold text-gray-900"
              >
                {t(COLUMN_LABELS[col])}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.featureKey} className="border-b border-gray-50 last:border-0">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-xs font-medium text-gray-600 sm:text-sm"
              >
                {t(row.featureKey)}
              </th>
              {columns.map((col) => (
                <td key={col} className="px-3 py-3 text-center">
                  <ComparisonCellView cell={row.cells[col]} t={t} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
