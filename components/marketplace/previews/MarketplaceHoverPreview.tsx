'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MarketplaceTileModel, TranslateFn } from '@/lib/marketplace/tiles/types';
import { computePreviewPosition } from './compute-preview-position';
import MarketplacePreviewCard from './MarketplacePreviewCard';

export default function MarketplaceHoverPreview({
  open,
  anchorEl,
  model,
  t,
  locale,
  onClose,
  onPreviewEnter,
  onPreviewLeave,
}: {
  open: boolean;
  anchorEl: HTMLElement | null;
  model: MarketplaceTileModel;
  t: TranslateFn;
  locale?: string;
  onClose: () => void;
  onPreviewEnter: () => void;
  onPreviewLeave: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, maxWidth: 420 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !anchorEl) return;
    const update = () => {
      const rect = anchorEl.getBoundingClientRect();
      setPosition(computePreviewPosition(rect));
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, anchorEl]);

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

  if (!open || !mounted || !anchorEl) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t('marketplace.preview.ariaLabel')}
      className="fixed z-[140] animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: position.top,
        left: position.left,
        width: position.maxWidth,
        maxWidth: position.maxWidth,
      }}
      onMouseEnter={onPreviewEnter}
      onMouseLeave={onPreviewLeave}
      onFocus={onPreviewEnter}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          onPreviewLeave();
        }
      }}
    >
      <MarketplacePreviewCard
        model={model}
        t={t}
        locale={locale}
        onClose={onClose}
      />
    </div>,
    document.body,
  );
}
