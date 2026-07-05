'use client';

import { cn } from '@/lib/utils';

type Props = {
  count: number;
  className?: string;
  /** Inline next to label vs absolute on icon corner */
  variant?: 'inline' | 'corner';
};

export function formatCommsUnreadCount(count: number): string {
  if (count <= 0) return '';
  return count > 99 ? '99+' : String(count);
}

/** Shared unread badge — matches NavBar / BottomNavigation styling. */
export default function CommsUnreadBadge({
  count,
  className,
  variant = 'inline',
}: Props) {
  if (count <= 0) return null;

  const label = formatCommsUnreadCount(count);

  if (variant === 'corner') {
    return (
      <span
        className={cn(
          'absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white',
          className,
        )}
        aria-hidden
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'ml-auto flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white',
        className,
      )}
      aria-label={label}
    >
      {label}
    </span>
  );
}
