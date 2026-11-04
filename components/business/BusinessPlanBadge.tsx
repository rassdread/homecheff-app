'use client';

import { businessPlanLabelKey, type BusinessPlanId } from '@/lib/business/visibility-profile';

const TONE: Record<Exclude<BusinessPlanId, 'individual'>, string> = {
  basic: 'bg-slate-50 text-slate-800 border-slate-300',
  pro: 'bg-[#e8f4ef] text-[#1a4a40] border-[#347266]/40 uppercase tracking-[0.08em]',
  premium: 'bg-[#f4f0fb] text-[#4c1d95] border-[#5b21b6]/35',
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
