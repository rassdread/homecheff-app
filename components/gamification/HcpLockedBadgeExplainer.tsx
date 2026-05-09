'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import type { BadgeCatalogEntry } from '@/lib/gamification/badge-catalog';
import type { BadgeDetailExtras } from '@/lib/gamification/badge-detail-extras';
import { earnedReasonNlForSlug, formatEarnedAtNl } from '@/lib/gamification/badge-earned-reason-nl';
import { iconKeyToDisplayIcon } from '@/lib/gamification/author-badge-summaries';
import { cn } from '@/lib/utils';

type ButtonProps = {
  entry: BadgeCatalogEntry;
  onOpen: () => void;
  /** Toont of het detailpaneel voor deze badge open is (aria-expanded). */
  expanded?: boolean;
};

/** Klik/tap opent sheet; op md+ verschijnt ook een tooltip bij hover of toetsenbordfocus. */
export function HcpLockedBadgeButton({ entry, onOpen, expanded = false }: ButtonProps) {
  const tooltipId = useId();

  return (
    <div className="group relative inline-flex max-w-full align-middle">
      <button
        type="button"
        aria-label={`Bekijk hoe je ${entry.name} ontgrendelt`}
        aria-expanded={expanded}
        onClick={onOpen}
        className={cn(
          'inline-flex max-w-full items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600',
          'transition-colors hover:border-amber-200 hover:bg-amber-50/90 hover:text-gray-900 active:bg-amber-100/80',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2'
        )}
      >
        <span aria-hidden className="shrink-0">
          {iconKeyToDisplayIcon(entry.iconKey)}
        </span>
        <span className="truncate">{entry.name}</span>
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 top-full z-40 mt-2 hidden w-max max-w-[min(288px,calc(100vw-2rem))] -translate-x-1/2 md:block',
          'rounded-xl border border-amber-100 bg-white px-3 py-2 text-left text-xs leading-snug text-gray-700 shadow-lg ring-1 ring-black/5',
          'opacity-0 transition-opacity duration-150',
          'group-hover:opacity-100 group-focus-within:opacity-100'
        )}
      >
        <span className="font-semibold text-gray-900">{entry.name}</span>
        <p className="mt-1 text-gray-700">{entry.unlockHint}</p>
      </div>
    </div>
  );
}

/** Behaalde badge: tik opent zelfde detail-sheet als vergrendeld, met “Behaald”-accent. */
export function HcpEarnedBadgeButton({ entry, onOpen, expanded = false }: ButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Bekijk details van ${entry.name}`}
      aria-expanded={expanded}
      onClick={onOpen}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50/95 px-2.5 py-1.5 text-xs font-medium text-emerald-950',
        'shadow-[0_0_12px_rgba(16,185,129,0.12)] ring-1 ring-emerald-400/25',
        'transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-[0_0_14px_rgba(16,185,129,0.18)] active:bg-emerald-100/80',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2'
      )}
    >
      <span
        className="shrink-0 rounded-full bg-emerald-700/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900"
        aria-hidden
      >
        Behaald
      </span>
      <span aria-hidden className="shrink-0">
        {iconKeyToDisplayIcon(entry.iconKey)}
      </span>
      <span className="truncate">{entry.name}</span>
    </button>
  );
}

export type HcpBadgeDetailMode = 'locked' | 'earned';

export type HcpBadgeDetailSheetProps = {
  open: boolean;
  onClose: () => void;
  mode: HcpBadgeDetailMode;
  entry: BadgeCatalogEntry | null;
  /** ISO van `UserBadge.awardedAt` (API: `awardedAt`). */
  earnedAtIso?: string | null;
  earnedReasonOverride?: string | null;
  /** Optioneel: voortgang bij vergrendelde badges (bijv. “3/5”). */
  progressLabel?: string | null;
  extras?: BadgeDetailExtras | null;
};

export function HcpBadgeDetailSheet({
  open,
  onClose,
  mode,
  entry,
  earnedAtIso = null,
  earnedReasonOverride = null,
  progressLabel = null,
  extras = null,
}: HcpBadgeDetailSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    queueMicrotask(() => closeRef.current?.focus());
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !entry) return null;

  const isEarned = mode === 'earned';
  const earnedReason =
    earnedReasonOverride?.trim() ||
    (isEarned ? earnedReasonNlForSlug(entry.slug, entry.unlockHint) : '');
  const earnedAtFormatted = earnedAtIso ? formatEarnedAtNl(earnedAtIso) : '';

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/45"
        aria-label="Sluit uitleg"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 w-full max-w-md rounded-t-2xl border bg-white shadow-2xl sm:rounded-2xl outline-none',
          'max-h-[min(88vh,560px)] flex flex-col overflow-hidden',
          isEarned
            ? 'border-emerald-200/90 ring-2 ring-emerald-400/20 shadow-emerald-900/10'
            : 'border-gray-100'
        )}
      >
        <div
          className={cn(
            'shrink-0 border-b px-4 pb-3 pt-4 sm:p-6 sm:pb-4',
            isEarned ? 'border-emerald-100/80 bg-gradient-to-b from-emerald-50/90 to-white' : 'border-gray-100 bg-white'
          )}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className={cn(
              'absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2'
            )}
            aria-label="Sluiten"
          >
            <X className="h-5 w-5 shrink-0" aria-hidden />
          </button>
          <div className="pr-10">
            {isEarned ? (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-emerald-700 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                  Behaald
                </span>
              </div>
            ) : null}
            <p
              className={cn(
                'text-3xl leading-none',
                isEarned && 'drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]'
              )}
              aria-hidden
            >
              {iconKeyToDisplayIcon(entry.iconKey)}
            </p>
            <h2 id={titleId} className="mt-2 text-lg font-bold text-gray-900">
              {entry.name}
            </h2>
            <p className="mt-1 text-sm text-gray-600">{entry.description}</p>
          </div>
        </div>

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:p-6 sm:pt-4',
            /* Ruimte boven vaste bottom nav + safe area (WebView/mobiel) */
            'pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+5.25rem))]'
          )}
        >
          {isEarned ? (
            <>
              <p className="text-sm font-semibold text-emerald-950">Waarom je deze badge hebt</p>
              <p className="mt-1 text-sm text-gray-800 leading-relaxed">{earnedReason}</p>
              {earnedAtFormatted ? (
                <p className="mt-4 text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">Behaald op</span>{' '}
                  <time dateTime={earnedAtIso ?? undefined}>{earnedAtFormatted}</time>
                </p>
              ) : null}
              {entry.unlockHint ? (
                <>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Voorwaarde (ter referentie)
                  </p>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">{entry.unlockHint}</p>
                </>
              ) : null}
            </>
          ) : (
            <>
              {progressLabel ? (
                <p className="mb-3 text-sm font-medium text-gray-700">
                  Voortgang: <span className="tabular-nums text-emerald-800">{progressLabel}</span>
                </p>
              ) : null}
              <p className="text-sm font-semibold text-amber-950">Zo ontgrendel je deze badge</p>
              <p className="mt-1 text-sm text-gray-800 leading-relaxed">{entry.unlockHint}</p>
            </>
          )}

          {extras &&
          (extras.rewardSummary != null ||
            extras.hcpBonus != null ||
            extras.campagneLabel != null ||
            extras.expiresAtIso) ? (
            <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-3 text-sm text-gray-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Extra</p>
              {extras.rewardSummary ? <p className="mt-1">{extras.rewardSummary}</p> : null}
              {extras.hcpBonus != null ? (
                <p className="mt-1 font-medium text-emerald-800">+{extras.hcpBonus} HCP</p>
              ) : null}
              {extras.campagneLabel ? <p className="mt-1 text-gray-600">{extras.campagneLabel}</p> : null}
              {extras.expiresAtIso ? (
                <p className="mt-1 text-xs text-gray-500">
                  Tot {formatEarnedAtNl(extras.expiresAtIso)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Dunne wrapper: zelfde sheet als `HcpBadgeDetailSheet` met `mode="locked"`. */
export function HcpLockedBadgeDetailSheet({
  entry,
  open,
  onClose,
}: {
  entry: BadgeCatalogEntry | null;
  open: boolean;
  onClose: () => void;
}) {
  return <HcpBadgeDetailSheet open={open} onClose={onClose} mode="locked" entry={entry} />;
}
