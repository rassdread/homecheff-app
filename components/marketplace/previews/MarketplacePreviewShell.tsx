'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNarrowViewport } from '@/hooks/useNarrowViewport';
import type { MarketplaceTileModel, TranslateFn } from '@/lib/marketplace/tiles/types';
import {
  PREVIEW_HOVER_DELAY_MS,
  PREVIEW_LONG_PRESS_MS,
  PREVIEW_LONG_PRESS_MOVE_THRESHOLD_PX,
  previewStateManager,
  trackMarketplacePreviewClose,
  trackMarketplacePreviewInfoClick,
  trackMarketplacePreviewOpen,
  type PreviewCloseReason,
  type PreviewOpenSource,
} from '@/lib/marketplace/preview';
import MarketplaceHoverPreview from './MarketplaceHoverPreview';
import MarketplaceLongPressPreview from './MarketplaceLongPressPreview';
import { MarketplacePreviewShellProvider } from './MarketplacePreviewShellContext';

function isPreviewIgnoredTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('[data-preview-ignore]') ||
      target.closest('[data-marketplace-preview-card]'),
  );
}

function deviceFromNarrow(narrow: boolean): 'desktop' | 'mobile' {
  return narrow ? 'mobile' : 'desktop';
}

export default function MarketplacePreviewShell({
  model,
  t,
  locale,
  enabled = true,
  children,
}: {
  model: MarketplaceTileModel;
  t: TranslateFn;
  locale?: string;
  enabled?: boolean;
  children: ReactNode;
}) {
  const narrow = useNarrowViewport();
  const device = deviceFromNarrow(narrow);
  const listingId = model.id;
  const shellRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const overTileRef = useRef(false);
  const overPreviewRef = useRef(false);
  const tileVisibleRef = useRef(true);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const didLongPressRef = useRef(false);

  const syncOpenFromManager = useCallback(() => {
    setOpen(previewStateManager.isActive(listingId));
  }, [listingId]);

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return previewStateManager.subscribe(syncOpenFromManager);
  }, [syncOpenFromManager]);

  useEffect(() => {
    return previewStateManager.onClose((event) => {
      if (event.listingId !== listingId) return;
      if (event.source) {
        trackMarketplacePreviewClose({
          source: event.source,
          listingId,
          device,
          category: model.marketplaceCategory ?? null,
          openDuration: event.duration,
          closeReason: event.reason,
        });
      }
      overTileRef.current = false;
      overPreviewRef.current = false;
      clearOpenTimer();
      clearLongPressTimer();
      setOpen(false);
    });
  }, [
    clearLongPressTimer,
    clearOpenTimer,
    device,
    listingId,
    model.marketplaceCategory,
  ]);

  useEffect(() => {
    const el = shellRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        tileVisibleRef.current = entry?.isIntersecting ?? false;
        if (!tileVisibleRef.current && previewStateManager.isActive(listingId)) {
          previewStateManager.close(listingId, 'leave');
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [listingId]);

  const openPreview = useCallback(
    (source: PreviewOpenSource) => {
      previewStateManager.open(listingId, source);
      trackMarketplacePreviewOpen({
        source,
        listingId,
        device,
        category: model.marketplaceCategory ?? null,
      });
      setOpen(true);
    },
    [device, listingId, model.marketplaceCategory],
  );

  const closePreview = useCallback(
    (reason: PreviewCloseReason) => {
      previewStateManager.close(listingId, reason);
    },
    [listingId],
  );

  const scheduleDesktopOpen = useCallback(() => {
    if (narrow) return;
    clearOpenTimer();
    openTimerRef.current = setTimeout(() => {
      if (
        !overTileRef.current ||
        !tileVisibleRef.current ||
        !previewStateManager.canHoverOpen() ||
        previewStateManager.isScrollingNow()
      ) {
        return;
      }
      openPreview('hover');
    }, PREVIEW_HOVER_DELAY_MS);
  }, [clearOpenTimer, narrow, openPreview]);

  const handleTileEnter = useCallback(() => {
    if (!enabled || narrow) return;
    overTileRef.current = true;
    scheduleDesktopOpen();
  }, [enabled, narrow, scheduleDesktopOpen]);

  const handleTileLeave = useCallback(() => {
    overTileRef.current = false;
    clearOpenTimer();
    if (open && previewStateManager.getOpenSource(listingId) === 'hover') {
      closePreview('leave');
    }
  }, [clearOpenTimer, closePreview, listingId, open]);

  const handlePreviewEnter = useCallback(() => {
    overPreviewRef.current = true;
    clearOpenTimer();
  }, [clearOpenTimer]);

  const handlePreviewLeave = useCallback(() => {
    overPreviewRef.current = false;
    if (previewStateManager.getOpenSource(listingId) === 'hover') {
      closePreview('leave');
    }
  }, [closePreview, listingId]);

  const handleClose = useCallback(
    (reason: PreviewCloseReason = 'external') => {
      closePreview(reason);
    },
    [closePreview],
  );

  const togglePreview = useCallback(() => {
    const willOpen = !previewStateManager.isActive(listingId);
    trackMarketplacePreviewInfoClick({
      listingId,
      device,
      category: model.marketplaceCategory ?? null,
      willOpen,
    });
    if (willOpen) {
      openPreview('info_click');
    } else {
      closePreview('info_click');
    }
  }, [closePreview, device, listingId, model.marketplaceCategory, openPreview]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !narrow || isPreviewIgnoredTarget(e.target)) return;
      if (previewStateManager.isScrollingNow()) return;
      didLongPressRef.current = false;
      clearLongPressTimer();
      const touch = e.touches[0];
      if (!touch) return;
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      longPressTimerRef.current = setTimeout(() => {
        if (previewStateManager.isScrollingNow()) return;
        didLongPressRef.current = true;
        openPreview('long_press');
      }, PREVIEW_LONG_PRESS_MS);
    },
    [clearLongPressTimer, enabled, narrow, openPreview],
  );

  const handleTouchEnd = useCallback(() => {
    clearLongPressTimer();
    touchStartRef.current = null;
  }, [clearLongPressTimer]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const distance = Math.hypot(dx, dy);
      if (distance > PREVIEW_LONG_PRESS_MOVE_THRESHOLD_PX) {
        clearLongPressTimer();
        touchStartRef.current = null;
      }
    },
    [clearLongPressTimer],
  );

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (didLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      didLongPressRef.current = false;
    }
  }, []);

  useEffect(
    () => () => {
      clearOpenTimer();
      clearLongPressTimer();
      if (previewStateManager.isActive(listingId)) {
        previewStateManager.close(listingId, 'external');
      }
    },
    [clearLongPressTimer, clearOpenTimer, listingId],
  );

  if (!enabled) {
    return <>{children}</>;
  }

  const shellContext = {
    open,
    togglePreview,
    listingId,
  };

  return (
    <MarketplacePreviewShellProvider value={shellContext}>
      <div
        ref={shellRef}
        className="relative h-full"
        onMouseEnter={handleTileEnter}
        onMouseLeave={handleTileLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchCancel={handleTouchEnd}
        onClickCapture={handleClickCapture}
        data-marketplace-preview-shell
        data-listing-id={listingId}
      >
        {children}
        {!narrow ? (
          <MarketplaceHoverPreview
            open={open}
            anchorEl={shellRef.current}
            model={model}
            t={t}
            locale={locale}
            previewId={`marketplace-preview-${listingId}`}
            onClose={() => handleClose('escape')}
            onPreviewEnter={handlePreviewEnter}
            onPreviewLeave={handlePreviewLeave}
          />
        ) : (
          <MarketplaceLongPressPreview
            open={open}
            model={model}
            t={t}
            locale={locale}
            previewId={`marketplace-preview-${listingId}`}
            onClose={(reason) => handleClose(reason)}
          />
        )}
      </div>
    </MarketplacePreviewShellProvider>
  );
}
