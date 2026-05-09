'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import type { BadgeCatalogEntry } from '@/lib/gamification/badge-catalog';
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
      {/* md+: tooltip — niet alleen hover (ook focus-within); mobiel: verborgen */}
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

type SheetProps = {
  entry: BadgeCatalogEntry | null;
  open: boolean;
  onClose: () => void;
};

export function HcpLockedBadgeDetailSheet({ entry, open, onClose }: SheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

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
        aria-labelledby="hcp-locked-badge-title"
        className={cn(
          'relative z-10 w-full max-w-md rounded-t-2xl border border-gray-100 bg-white shadow-2xl sm:rounded-2xl',
          'max-h-[min(85vh,540px)] overflow-y-auto outline-none',
          'pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 px-4 sm:p-6'
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
          <p className="text-3xl leading-none" aria-hidden>
            {iconKeyToDisplayIcon(entry.iconKey)}
          </p>
          <h2 id="hcp-locked-badge-title" className="mt-2 text-lg font-bold text-gray-900">
            {entry.name}
          </h2>
          <p className="mt-1 text-sm text-gray-600">{entry.description}</p>
          <p className="mt-4 text-sm font-semibold text-amber-950">Zo ontgrendel je deze badge</p>
          <p className="mt-1 text-sm text-gray-800 leading-relaxed">{entry.unlockHint}</p>
        </div>
      </div>
    </div>
  );
}
