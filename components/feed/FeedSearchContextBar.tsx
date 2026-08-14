'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Loader2, MapPin } from 'lucide-react';
import type { SearchContextChip } from '@/lib/feed/feed-search-context';
import type { FeedClientSortField } from '@/lib/feed/feed-client-sort';
import { useOverlayHistoryBack } from '@/hooks/useOverlayHistoryBack';

export type ContextBarSortOption = {
  id: FeedClientSortField;
  label: string;
};

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
  /** Category/query still open the advanced filter surface. */
  onCategoryActivate?: () => void;
  onQueryActivate?: () => void;
  /** Accessible name builders (localized). */
  locationActionAria?: (value: string) => string;
  radiusActionAria?: (value: string) => string;
  sortActionAria?: (value: string) => string;
  categoryActionAria?: (value: string) => string;
  queryActionAria?: (value: string) => string;

  /** Canonical sort — same state as Filters. */
  sortBy: FeedClientSortField;
  sortOptions: readonly ContextBarSortOption[];
  onSort: (field: FeedClientSortField) => void;

  /** Canonical radius — same state as Filters. */
  radiusKm: number;
  radiusOptions: readonly number[];
  radiusOptionLabel: (km: number) => string;
  onRadiusChange: (km: number) => void;

  /** Canonical place draft + apply (same as Filters place field). */
  placeDraft: string;
  onPlaceDraftChange: (value: string) => void;
  onPlaceApply: (place: string) => void;
  onUseMyLocation: () => void;
  locationBusy?: boolean;
  placePlaceholder: string;
  applyLabel: string;
  useMyLocationLabel: string;
  currentLocationSummary?: string | null;
};

type PanelId = 'location' | 'radius' | 'sort';

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

const panelSurfaceClass =
  'rounded-xl border border-emerald-200/80 bg-white shadow-lg shadow-emerald-900/10';

function useAnchoredPanel(open: boolean, triggerRef: RefObject<HTMLElement | null>) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 280, mode: 'popover' as 'popover' | 'sheet' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(typeof document !== 'undefined');
  }, []);

  const update = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const sheet = vw < 480;
    if (sheet) {
      setPos({
        top: 0,
        left: 0,
        width: vw,
        mode: 'sheet',
      });
      return;
    }
    const width = Math.min(320, Math.max(240, vw - 24));
    const left = Math.max(12, Math.min(rect.left, vw - width - 12));
    const top = Math.min(rect.bottom + 8, window.innerHeight - 12);
    setPos({ top, left, width, mode: 'popover' });
  }, [triggerRef]);

  useLayoutEffect(() => {
    if (!open) return;
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, update]);

  return { pos, mounted };
}

function ContextBarPanel({
  open,
  panelId,
  labelledBy,
  triggerRef,
  onClose,
  children,
}: {
  open: boolean;
  panelId: string;
  labelledBy: string;
  triggerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { pos, mounted } = useAnchoredPanel(open, triggerRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };
    // click (not mousedown) so option press registers first
    document.addEventListener('click', onPointer);
    return () => document.removeEventListener('click', onPointer);
  }, [open, onClose, triggerRef]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const focusable = panelRef.current.querySelector<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus({ preventScroll: true });
  }, [open]);

  if (!open || !mounted) return null;

  const body =
    pos.mode === 'sheet' ? (
      <div
        className="fixed inset-0 z-[99990] flex items-end justify-center bg-black/25 p-0 sm:p-3"
        role="presentation"
        onClick={onClose}
      >
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          data-testid="feed-search-context-panel"
          data-context-panel-mode="sheet"
          className={`${panelSurfaceClass} w-full max-h-[70vh] overflow-y-auto rounded-b-none rounded-t-2xl px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    ) : (
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        data-testid="feed-search-context-panel"
        data-context-panel-mode="popover"
        className={`${panelSurfaceClass} fixed z-[99990] max-h-[min(70vh,24rem)] overflow-y-auto px-2.5 py-2`}
        style={{ top: pos.top, left: pos.left, width: pos.width }}
      >
        {children}
      </div>
    );

  return createPortal(body, document.body);
}

/**
 * Search context strip with inline location / radius / sort popovers.
 * Writes only to GeoFeed canonical filter state (no duplicate ownership).
 */
export default function FeedSearchContextBar(props: FeedSearchContextBarProps) {
  const { ariaLabel, chips } = props;
  const baseId = useId();
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const locationBtnRef = useRef<HTMLButtonElement>(null);
  const radiusBtnRef = useRef<HTMLButtonElement>(null);
  const sortBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRefFor =
    openPanel === 'location'
      ? locationBtnRef
      : openPanel === 'radius'
        ? radiusBtnRef
        : sortBtnRef;

  const closePanel = useCallback(() => {
    const which = openPanel;
    setOpenPanel(null);
    queueMicrotask(() => {
      if (which === 'location') locationBtnRef.current?.focus();
      else if (which === 'radius') radiusBtnRef.current?.focus();
      else if (which === 'sort') sortBtnRef.current?.focus();
    });
  }, [openPanel]);

  useOverlayHistoryBack(
    'feed-search-context-panel',
    openPanel !== null,
    closePanel,
  );

  const togglePanel = useCallback((id: PanelId) => {
    setOpenPanel((prev) => (prev === id ? null : id));
  }, []);

  if (chips.length === 0) return null;

  const locationPanelId = `${baseId}-location-panel`;
  const radiusPanelId = `${baseId}-radius-panel`;
  const sortPanelId = `${baseId}-sort-panel`;

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

          const isLocation = chip.id === 'location';
          const isRadius = chip.id === 'radius';
          const isSort = chip.id === 'sort';
          const isInline = isLocation || isRadius || isSort;
          const panelOpen =
            (isLocation && openPanel === 'location') ||
            (isRadius && openPanel === 'radius') ||
            (isSort && openPanel === 'sort');

          let onActivate: (() => void) | undefined;
          let btnRef: RefObject<HTMLButtonElement | null> | undefined;
          let controls: string | undefined;
          if (isLocation) {
            onActivate = () => togglePanel('location');
            btnRef = locationBtnRef;
            controls = locationPanelId;
          } else if (isRadius) {
            onActivate = () => togglePanel('radius');
            btnRef = radiusBtnRef;
            controls = radiusPanelId;
          } else if (isSort) {
            onActivate = () => togglePanel('sort');
            btnRef = sortBtnRef;
            controls = sortPanelId;
          } else if (chip.id === 'category') {
            onActivate = props.onCategoryActivate;
          } else if (chip.id === 'query') {
            onActivate = props.onQueryActivate;
          }

          return (
            <li
              key={chip.id}
              data-testid={`feed-search-context-${chip.id}`}
              className="inline-flex min-w-0 max-w-full items-baseline"
            >
              {onActivate ? (
                <button
                  ref={btnRef}
                  type="button"
                  id={
                    isLocation
                      ? `${baseId}-location-trigger`
                      : isRadius
                        ? `${baseId}-radius-trigger`
                        : isSort
                          ? `${baseId}-sort-trigger`
                          : undefined
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onActivate();
                  }}
                  className={chipButtonClass}
                  aria-label={ariaFor(chip, props)}
                  aria-expanded={isInline ? panelOpen : undefined}
                  aria-haspopup={isInline ? 'dialog' : undefined}
                  aria-controls={isInline && panelOpen ? controls : undefined}
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

      <ContextBarPanel
        open={openPanel === 'location'}
        panelId={locationPanelId}
        labelledBy={`${baseId}-location-trigger`}
        triggerRef={triggerRefFor}
        onClose={closePanel}
      >
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-900/70">
          {props.locationPrefix}
        </p>
        {props.currentLocationSummary ? (
          <p
            className="mb-2 truncate text-sm font-medium text-emerald-950"
            data-testid="feed-search-context-location-current"
          >
            {props.currentLocationSummary}
          </p>
        ) : null}
        <input
          type="text"
          value={props.placeDraft}
          onChange={(e) => props.onPlaceDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const next = props.placeDraft.trim();
              if (!next) return;
              props.onPlaceApply(next);
              closePanel();
            }
          }}
          placeholder={props.placePlaceholder}
          autoComplete="postal-code"
          inputMode="search"
          enterKeyHint="search"
          className="mb-2 w-full rounded-lg border border-gray-200 bg-[#faf8f4] px-2.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
          data-testid="feed-search-context-location-input"
          aria-label={props.placePlaceholder}
        />
        <div className="flex flex-col gap-1.5 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              const next = props.placeDraft.trim();
              if (!next) return;
              props.onPlaceApply(next);
              closePanel();
            }}
            disabled={!props.placeDraft.trim()}
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="feed-search-context-location-apply"
          >
            {props.applyLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              props.onUseMyLocation();
              closePanel();
            }}
            disabled={props.locationBusy}
            aria-busy={props.locationBusy || undefined}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
            data-testid="feed-search-context-location-gps"
          >
            {props.locationBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {props.useMyLocationLabel}
          </button>
        </div>
      </ContextBarPanel>

      <ContextBarPanel
        open={openPanel === 'radius'}
        panelId={radiusPanelId}
        labelledBy={`${baseId}-radius-trigger`}
        triggerRef={triggerRefFor}
        onClose={closePanel}
      >
        <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-900/70">
          {props.radiusPrefix}
        </p>
        <ul className="m-0 list-none space-y-0.5 p-0" role="listbox" aria-label={props.radiusPrefix}>
          {props.radiusOptions.map((km) => {
            const selected = props.radiusKm === km;
            return (
              <li key={km} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    props.onRadiusChange(km);
                    closePanel();
                  }}
                  className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                    selected
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'text-gray-800 hover:bg-emerald-50'
                  }`}
                  data-testid={`feed-search-context-radius-option-${km}`}
                >
                  {props.radiusOptionLabel(km)}
                </button>
              </li>
            );
          })}
        </ul>
      </ContextBarPanel>

      <ContextBarPanel
        open={openPanel === 'sort'}
        panelId={sortPanelId}
        labelledBy={`${baseId}-sort-trigger`}
        triggerRef={triggerRefFor}
        onClose={closePanel}
      >
        <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-900/70">
          {props.sortPrefix}
        </p>
        <ul className="m-0 list-none space-y-0.5 p-0" role="listbox" aria-label={props.sortPrefix}>
          {props.sortOptions.map((option) => {
            const selected = props.sortBy === option.id;
            return (
              <li key={option.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    props.onSort(option.id);
                    closePanel();
                  }}
                  className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                    selected
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'text-gray-800 hover:bg-emerald-50'
                  }`}
                  data-testid={`feed-search-context-sort-option-${option.id}`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      </ContextBarPanel>
    </div>
  );
}
