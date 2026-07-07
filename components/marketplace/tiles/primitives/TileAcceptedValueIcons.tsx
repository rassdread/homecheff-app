'use client';

import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import { cn } from '@/lib/utils';
import type { TileAcceptedValueIconsResult } from '@/lib/marketplace/tiles/build-tile-accepted-value-icons';

export default function TileAcceptedValueIcons({
  result,
  className,
}: {
  result: TileAcceptedValueIconsResult;
  className?: string;
}) {
  if (result.icons.length === 0) return null;

  return (
    <div
      className={cn('flex min-w-0 flex-nowrap items-center gap-1', className)}
      data-tile-accepted-values
      aria-label={result.icons.map((i) => i.ariaLabel).join(', ')}
    >
      {result.icons.map((icon) => (
        <span
          key={icon.taxonomyId}
          title={icon.tooltipLabel}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 ring-1 ring-gray-200/80"
          role="img"
          aria-label={icon.ariaLabel}
        >
          {icon.iconKind === 'emoji' ? (
            <span className="text-sm leading-none" aria-hidden>
              {icon.icon}
            </span>
          ) : (
            <TaxonomyLucideIcon name={icon.icon} className="h-3.5 w-3.5 text-gray-700" />
          )}
        </span>
      ))}
      {result.overflowCount > 0 ? (
        <span
          className="inline-flex h-6 shrink-0 items-center rounded-md bg-gray-100 px-1.5 text-[10px] font-semibold text-gray-600 ring-1 ring-gray-200/80"
          aria-label={`+${result.overflowCount}`}
        >
          +{result.overflowCount}
        </span>
      ) : null}
    </div>
  );
}
