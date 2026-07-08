'use client';

import { businessPlanLabelKey, type BusinessPlanId } from '@/lib/business/visibility-profile';

const TONE: Record<Exclude<BusinessPlanId, 'individual'>, string> = {
  basic: 'bg-slate-100 text-slate-700 border-slate-200',
  pro: 'bg-blue-50 text-blue-800 border-blue-200',
  premium: 'bg-violet-50 text-violet-800 border-violet-200',
};

type Props = {
  plan: BusinessPlanId;
  t: (key: string) => string;
  className?: string;
  size?: 'sm' | 'md';
};

export default function BusinessPlanBadge({
  plan,
  t,
  className = '',
  size = 'sm',
}: Props) {
  if (plan === 'individual') return null;
  const labelKey = businessPlanLabelKey(plan);
  if (!labelKey) return null;

  const sizeClass =
    size === 'md'
      ? 'px-2.5 py-0.5 text-xs'
      : 'px-2 py-0.5 text-[10px]';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizeClass} ${TONE[plan]} ${className}`}
    >
      {t(labelKey)}
    </span>
  );
}
