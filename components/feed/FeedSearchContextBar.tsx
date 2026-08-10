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
  /** Open/focus existing location control (no new location state). */
  onLocationActivate?: () => void;
  /** Open/focus existing radius control. */
  onRadiusActivate?: () => void;
  /** Open/focus existing sort control. */
  onSortActivate?: () => void;
  /** Open/focus existing category/search filters. */
  onCategoryActivate?: () => void;
  /** Open/focus existing search query control. */
  onQueryActivate?: () => void;
  /** Accessible name builders (localized). */
  locationActionAria?: (value: string) => string;
  radiusActionAria?: (value: string) => string;
  sortActionAria?: (value: string) => string;
  categoryActionAria?: (value: string) => string;
  queryActionAria?: (value: string) => string;
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

function actionFor(
  id: SearchContextChip['id'],
  props: FeedSearchContextBarProps,
): (() => void) | undefined {
  switch (id) {
    case 'location':
      return props.onLocationActivate;
    case 'radius':
      return props.onRadiusActivate;
    case 'sort':
      return props.onSortActivate;
    case 'category':
      return props.onCategoryActivate;
    case 'query':
      return props.onQueryActivate;
    default:
      return undefined;
  }
}

function ariaFor(
  chip: SearchContextChip,
  props: FeedSearchContextBarProps,
): string {
  switch (chip.id) {
    case 'location':
      return props.locationActionAria?.(chip.value) ?? chip.value;
    case 'radius':
      return props.radiusActionAria?.(chip.value) ?? chip.value;
    case 'sort':
      return props.sortActionAria?.(chip.value) ?? chip.value;
    case 'category':
      return props.categoryActionAria?.(chip.value) ?? chip.value;
    case 'query':
      return props.queryActionAria?.(chip.value) ?? chip.value;
    default:
      return chip.value;
  }
}

const chipButtonClass =
  'inline-flex max-w-full min-w-0 items-baseline gap-1 rounded-lg border border-transparent px-1.5 py-0.5 text-left leading-snug transition-colors hover:border-emerald-200 hover:bg-emerald-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-1';

/**
 * Lightweight search context strip above the feed.
 * Shows applied GeoFeed state; optional chip actions open existing controls
 * (no second filter/location/sort ownership).
 */
export default function FeedSearchContextBar(props: FeedSearchContextBarProps) {
  const { ariaLabel, chips } = props;
  if (chips.length === 0) return null;

  return (
    <div
      data-testid="feed-search-context-bar"
      role="region"
      aria-label={ariaLabel}
      className="rounded-xl border border-emerald-200/70 bg-white/90 px-3 py-2 text-xs text-emerald-950 shadow-sm sm:text-[13px]"
    >
      <ul className="m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-1.5 p-0">
        {chips.map((chip) => {
          const prefix = prefixFor(chip.id, props);
          const onActivate = actionFor(chip.id, props);
          const content = (
            <>
              <span aria-hidden className="shrink-0 select-none">
                {chip.marker}
              </span>
              <span className="min-w-0 truncate">
                <span className="font-medium text-emerald-900/80">{prefix}:</span>{' '}
                <span className="font-semibold text-emerald-950">{chip.value}</span>
              </span>
            </>
          );

          return (
            <li
              key={chip.id}
              data-testid={`feed-search-context-${chip.id}`}
              className="inline-flex min-w-0 max-w-full items-baseline"
            >
              {onActivate ? (
                <button
                  type="button"
                  onClick={onActivate}
                  className={chipButtonClass}
                  aria-label={ariaFor(chip, props)}
                  data-testid={`feed-search-context-${chip.id}-action`}
                >
                  {content}
                </button>
              ) : (
                <span className="inline-flex min-w-0 max-w-full items-baseline gap-1 px-1.5 py-0.5 leading-snug">
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
