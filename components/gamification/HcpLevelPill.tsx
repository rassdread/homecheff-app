import { cn } from '@/lib/utils';

export type HcpLevelPillTone = 'amber' | 'emerald';

export type HcpLevelPillProps = {
  level: number;
  size?: 'xs' | 'sm' | 'md';
  tone?: HcpLevelPillTone;
  className?: string;
  /** Ster als subtiele status-indicator; default aan. */
  showStar?: boolean;
};

const toneStyles: Record<HcpLevelPillTone, string> = {
  amber:
    'border-amber-200/90 bg-gradient-to-b from-white to-amber-50/75 text-amber-950/95 shadow-[0_1px_2px_rgba(146,64,14,0.06)]',
  emerald:
    'border-emerald-200/85 bg-gradient-to-b from-white to-emerald-50/70 text-emerald-950/95 shadow-[0_1px_2px_rgba(6,95,70,0.06)]',
};

const sizeStyles: Record<NonNullable<HcpLevelPillProps['size']>, string> = {
  xs: 'rounded-md px-1.5 py-[1px] text-[9px] gap-0.5 [&>.hc-level-star]:text-[8px]',
  sm: 'rounded-full px-2 py-0.5 text-[10px] gap-0.5 [&>.hc-level-star]:text-[9px]',
  md: 'rounded-full px-2.5 py-1 text-[11px] gap-1 [&>.hc-level-star]:text-[10px]',
};

/**
 * Creator status-tag voor HCP-level — los van titels/ondertitels (geen “L2 · …” in één zin).
 */
export function HcpLevelPill({
  level,
  size = 'sm',
  tone = 'amber',
  className,
  showStar = true,
}: HcpLevelPillProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full shrink-0 items-center border font-medium tabular-nums tracking-wide',
        toneStyles[tone],
        sizeStyles[size],
        className
      )}
      aria-label={`Level ${level}`}
    >
      {showStar ? (
        <span className="hc-level-star leading-none opacity-80" aria-hidden>
          ⭐
        </span>
      ) : null}
      <span className="truncate font-medium">Level {level}</span>
    </span>
  );
}
