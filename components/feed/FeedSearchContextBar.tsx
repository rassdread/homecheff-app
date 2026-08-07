'use client';

import type { SearchContextChip } from '@/lib/feed/feed-search-context';

export type FeedSearchContextBarProps = {
  /** Region aria-label (localized). */
  ariaLabel: string;
  /** Prefix for location chip, e.g. "Searching from". */
  locationPrefix: string;
  /** Prefix for radius chip, e.g. "Radius". */
  radiusPrefix: string;
  /** Prefix for category chip. */
  categoryPrefix: string;
  /** Prefix for sort chip. */
  sortPrefix: string;
  /** Prefix for query chip. */
  queryPrefix: string;
  chips: readonly SearchContextChip[];
};

function prefixFor(
  id: SearchContextChip['id'],
  props: FeedSearchContextBarProps,
): string {
  switch (id) {
    case 'location':
      return props.locationPrefix;
    case 'radius':
      return props.radiusPrefix;
    case 'category':
      return props.categoryPrefix;
    case 'sort':
      return props.sortPrefix;
    case 'query':
      return props.queryPrefix;
    default:
      return '';
  }
}

/**
 * Read-only search context strip above the feed.
 * Displays applied GeoFeed state only — never draft filter values.
 */
export default function FeedSearchContextBar({
  ariaLabel,
  chips,
  ...prefixes
}: FeedSearchContextBarProps) {
  if (chips.length === 0) return null;

  return (
    <div
      data-testid="feed-search-context-bar"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className="rounded-xl border border-emerald-200/70 bg-white/90 px-3 py-2 text-xs text-emerald-950 shadow-sm sm:text-[13px]"
    >
      <ul className="m-0 flex list-none flex-wrap items-center gap-x-3 gap-y-1.5 p-0">
        {chips.map((chip) => {
          const prefix = prefixFor(chip.id, {
            ariaLabel,
            chips,
            ...prefixes,
          });
          return (
            <li
              key={chip.id}
              data-testid={`feed-search-context-${chip.id}`}
              className="inline-flex min-w-0 max-w-full items-baseline gap-1 leading-snug"
            >
              <span aria-hidden className="shrink-0 select-none">
                {chip.marker}
              </span>
              <span className="min-w-0 truncate">
                <span className="font-medium text-emerald-900/80">{prefix}:</span>{' '}
                <span className="font-semibold text-emerald-950">{chip.value}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
