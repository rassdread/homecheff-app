'use client';

import { cn } from '@/lib/utils';

export type UserBadgeChipItem = { key: string; name: string; icon: string };

type Props = {
  badges: UserBadgeChipItem[] | null | undefined;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
};

export default function UserBadgeChips({ badges, max = 2, size = 'sm', className }: Props) {
  const list = (badges ?? []).filter(Boolean).slice(0, max);
  if (list.length === 0) return null;

  const chip =
    size === 'md'
      ? 'text-xs px-2 py-0.5 gap-1'
      : 'text-[10px] leading-tight px-1.5 py-0.5 gap-0.5';

  return (
    <div
      className={cn('flex flex-wrap items-center gap-1', className)}
      aria-label="Badges"
    >
      {list.map((b) => (
        <span
          key={b.key}
          className={cn(
            'inline-flex max-w-full items-center rounded-full border border-amber-200/80 bg-amber-50/90 font-medium text-amber-950',
            chip
          )}
          title={b.name}
        >
          <span className="shrink-0" aria-hidden>
            {b.icon}
          </span>
          <span className="truncate">{b.name}</span>
        </span>
      ))}
    </div>
  );
}
