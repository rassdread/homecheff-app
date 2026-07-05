'use client';

import Link from 'next/link';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useOperationsTodayRoleData } from '@/hooks/useOperationsTodayRoleData';
import { useTranslation } from '@/hooks/useTranslation';
import {
  deriveRoleAttentionChips,
  type RoleAttentionChip,
} from '@/lib/operations/operations-today-helpers';
import { cn } from '@/lib/utils';

const toneClasses: Record<RoleAttentionChip['tone'], string> = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
  amber: 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100',
  gray: 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
  blue: 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
  red: 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
};

type Props = {
  className?: string;
};

export default function OperationsRoleAttentionChips({ className }: Props) {
  const { t, tOr } = useTranslation();
  const { actionCenter, earnings, ctx, loading: coreLoading } =
    useOperationsSidepanel();
  const { delivery, loading: roleLoading } = useOperationsTodayRoleData(ctx);

  const title = tOr(
    'operations.today.roleChips.title',
    'Needs attention',
    'Aandacht per rol',
  );

  const loading = coreLoading || roleLoading;
  const chips = deriveRoleAttentionChips(
    actionCenter,
    ctx,
    delivery,
    earnings,
  );

  if (loading) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-8 w-24 animate-pulse rounded-full bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (chips.length === 0) return null;

  return (
    <section className={className} aria-label={title}>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Link
            key={chip.id}
            href={chip.href}
            prefetch
            className={cn(
              'inline-flex max-w-full items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition touch-manipulation',
              toneClasses[chip.tone],
            )}
          >
            <span className="truncate">
              {chip.labelKey
                ? t(chip.labelKey, chip.labelParams)
                : chip.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
