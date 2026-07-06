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
import MarketplaceHoverPreview from './MarketplaceHoverPreview';
import MarketplaceLongPressPreview from './MarketplaceLongPressPreview';

const HOVER_OPEN_MS = 300;
const LONG_PRESS_MS = 500;

function isPreviewIgnoredTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('[data-preview-ignore]') ||
      target.closest('[data-marketplace-preview-card]'),
  );
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
  const shellRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const overTileRef = useRef(false);
  const overPreviewRef = useRef(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);

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

  const syncOpen = useCallback(() => {
    if (overTileRef.current || overPreviewRef.current) {
      if (!open) setOpen(true);
    } else {
      setOpen(false);
    }
  }, [open]);

  const scheduleDesktopOpen = useCallback(() => {
    clearOpenTimer();
    openTimerRef.current = setTimeout(() => {
      if (overTileRef.current || overPreviewRef.current) {
        setOpen(true);
      }
    }, HOVER_OPEN_MS);
  }, [clearOpenTimer]);

  const handleTileEnter = useCallback(() => {
    if (!enabled || narrow) return;
    overTileRef.current = true;
    scheduleDesktopOpen();
  }, [enabled, narrow, scheduleDesktopOpen]);

  const handleTileLeave = useCallback(() => {
    overTileRef.current = false;
    clearOpenTimer();
    syncOpen();
  }, [clearOpenTimer, syncOpen]);

  const handlePreviewEnter = useCallback(() => {
    overPreviewRef.current = true;
    clearOpenTimer();
    setOpen(true);
  }, [clearOpenTimer]);

  const handlePreviewLeave = useCallback(() => {
    overPreviewRef.current = false;
    syncOpen();
  }, [syncOpen]);

  const handleClose = useCallback(() => {
    overTileRef.current = false;
    overPreviewRef.current = false;
    clearOpenTimer();
    clearLongPressTimer();
    setOpen(false);
  }, [clearLongPressTimer, clearOpenTimer]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !narrow || isPreviewIgnoredTarget(e.target)) return;
      didLongPressRef.current = false;
      clearLongPressTimer();
      longPressTimerRef.current = setTimeout(() => {
        didLongPressRef.current = true;
        setOpen(true);
      }, LONG_PRESS_MS);
    },
    [clearLongPressTimer, enabled, narrow],
  );

  const handleTouchEnd = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleTouchMove = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (didLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      didLongPressRef.current = false;
    }
  }, []);

  const handleFocus = useCallback(() => {
    if (!enabled || narrow) return;
    overTileRef.current = true;
    scheduleDesktopOpen();
  }, [enabled, narrow, scheduleDesktopOpen]);

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (!enabled || narrow) return;
      if (shellRef.current?.contains(e.relatedTarget as Node)) return;
      overTileRef.current = false;
      clearOpenTimer();
      syncOpen();
    },
    [clearOpenTimer, enabled, narrow, syncOpen],
  );

  useEffect(
    () => () => {
      clearOpenTimer();
      clearLongPressTimer();
    },
    [clearLongPressTimer, clearOpenTimer],
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div
      ref={shellRef}
      className="relative h-full"
      tabIndex={0}
      onMouseEnter={handleTileEnter}
      onMouseLeave={handleTileLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchCancel={handleTouchEnd}
      onClickCapture={handleClickCapture}
      data-marketplace-preview-shell
    >
      {children}
      {!narrow ? (
        <MarketplaceHoverPreview
          open={open}
          anchorEl={shellRef.current}
          model={model}
          t={t}
          locale={locale}
          onClose={handleClose}
          onPreviewEnter={handlePreviewEnter}
          onPreviewLeave={handlePreviewLeave}
        />
      ) : (
        <MarketplaceLongPressPreview
          open={open}
          model={model}
          t={t}
          locale={locale}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
