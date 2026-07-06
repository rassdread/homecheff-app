'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { MarketplaceTileModel, TranslateFn } from '@/lib/marketplace/tiles/types';
import MarketplacePreviewCard from './MarketplacePreviewCard';

const SWIPE_CLOSE_THRESHOLD = 72;

export default function MarketplaceLongPressPreview({
  open,
  model,
  t,
  locale,
  onClose,
}: {
  open: boolean;
  model: MarketplaceTileModel;
  t: TranslateFn;
  locale?: string;
  onClose: () => void;
}) {
  const touchStartY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-end justify-center bg-black/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label={t('marketplace.preview.ariaLabel')}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        className="w-full max-h-[88dvh] animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0]?.clientY ?? null;
        }}
        onTouchMove={(e) => {
          if (touchStartY.current == null) return;
          const delta = e.touches[0]!.clientY - touchStartY.current;
          if (delta > SWIPE_CLOSE_THRESHOLD) {
            touchStartY.current = null;
            onClose();
          }
        }}
        onTouchEnd={() => {
          touchStartY.current = null;
        }}
      >
        <div className="rounded-t-2xl border border-gray-200/80 bg-white shadow-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
            <div className="flex flex-1 justify-center lg:hidden">
              <span className="h-1 w-10 rounded-full bg-gray-200" aria-hidden />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-full p-2 text-gray-500 hover:bg-gray-100"
              aria-label={t('buttons.close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <MarketplacePreviewCard
            model={model}
            t={t}
            locale={locale}
            onClose={onClose}
            className="max-h-none rounded-none border-0 shadow-none"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
