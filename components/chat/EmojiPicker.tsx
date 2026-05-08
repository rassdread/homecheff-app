'use client';

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { Smile, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Categories, EmojiStyle, Theme } from 'emoji-picker-react';

/** Dynamisch laden — geen SSR. */
const EmojiPickerReact = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
});

/**
 * Alleen categorieën met volledige emoji-set in de library.
 * Geen suggested/recent (leeg), geen custom-tab, geen flags/dieren tenzij later gewenst.
 */
const STANDARD_EMOJI_PICKER_CATEGORIES = [
  Categories.SMILEYS_PEOPLE,
  Categories.FOOD_DRINK,
  Categories.ACTIVITIES,
  Categories.TRAVEL_PLACES,
  Categories.OBJECTS,
  Categories.SYMBOLS,
] as const;

/** Compacte titelbalk (sluitknop); geen thema-tabrij meer. */
const HEADER_BAR_HEIGHT_PX = 48;

interface EmojiPickerProps {
  onEmojiClick: (emoji: string) => void;
  className?: string;
  /** Behouden voor backwards compatibility (CompactChefForm etc.); niet meer gebruikt in UI. */
  category?: 'CHEFF' | 'GARDEN' | 'DESIGNER' | 'auto';
}

type DesktopPanelGeom = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export default function EmojiPickerButton({
  onEmojiClick,
  className = '',
}: EmojiPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetNarrow = useMediaQuery('(max-width: 1023px)');
  const [desktopGeom, setDesktopGeom] = useState<DesktopPanelGeom | null>(null);
  const [emojiLibSize, setEmojiLibSize] = useState({ width: 360, height: 380 });

  const layoutPickerDimensions = useCallback(() => {
    if (typeof window === 'undefined') return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (sheetNarrow) {
      const sheetMax = Math.floor(vh * 0.55);
      const sheetMin = Math.floor(vh * 0.4);
      const sheetH = Math.max(sheetMin, Math.min(sheetMax, vh - 120));
      const innerH = Math.max(260, sheetH - HEADER_BAR_HEIGHT_PX - 16);
      const innerW = Math.max(280, Math.min(vw - 16, vw));
      setEmojiLibSize({ width: innerW, height: innerH });
      return;
    }

    if (desktopGeom) {
      const innerW = Math.max(304, desktopGeom.width - 16);
      const innerH = Math.max(
        300,
        desktopGeom.height - HEADER_BAR_HEIGHT_PX - 16
      );
      setEmojiLibSize({
        width: Math.min(innerW, vw - 24),
        height: Math.min(innerH, vh - 24),
      });
    }
  }, [sheetNarrow, desktopGeom]);

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    onEmojiClick(emojiData.emoji);
  };

  const togglePicker = () => setIsOpen((o) => !o);
  const closePicker = useCallback(() => setIsOpen(false), []);

  useLayoutEffect(() => {
    if (!isOpen || sheetNarrow || !triggerRef.current) {
      if (!isOpen) setDesktopGeom(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const panelW = Math.max(340, Math.min(440, vw - 16));
    const panelH = Math.min(520, Math.max(400, Math.floor(vh * 0.58)));
    let left = rect.right - panelW;
    left = Math.max(8, Math.min(left, vw - panelW - 8));
    let top = rect.top - panelH - 10;
    if (top < 8) top = rect.bottom + 10;
    if (top + panelH > vh - 8) top = Math.max(8, vh - panelH - 8);
    setDesktopGeom({ top, left, width: panelW, height: panelH });
  }, [isOpen, sheetNarrow]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    layoutPickerDimensions();
  }, [isOpen, sheetNarrow, desktopGeom, layoutPickerDimensions]);

  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => layoutPickerDimensions();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, layoutPickerDimensions]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePicker();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closePicker]);

  useEffect(() => {
    if (!isOpen || !sheetNarrow) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, sheetNarrow]);

  const headerBar = (
    <div
      className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3"
      style={{ minHeight: HEADER_BAR_HEIGHT_PX }}
    >
      <span className="truncate text-sm font-medium text-gray-800">
        {t('common.addEmoji')}
      </span>
      <button
        type="button"
        onClick={closePicker}
        className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
        aria-label={t('buttons.close')}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  const pickerBody = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white px-0 pb-1 pt-0 [&_.EmojiPickerReact]:max-w-full [&_.epr-body]:min-h-0 [&_.epr-emoji]:box-border [&_.epr-emoji]:flex [&_.epr-emoji]:min-h-[2.75rem] [&_.epr-emoji]:min-w-[2.75rem] [&_.epr-emoji]:items-center [&_.epr-emoji]:justify-center [&_.epr-emoji]:text-[1.35rem] [&_.epr-category-nav]:px-1">
      <EmojiPickerReact
        onEmojiClick={handleEmojiClick}
        theme={Theme.LIGHT}
        emojiStyle={EmojiStyle.GOOGLE}
        categories={[...STANDARD_EMOJI_PICKER_CATEGORIES]}
        skinTonesDisabled={false}
        searchDisabled={false}
        autoFocusSearch={false}
        previewConfig={{ showPreview: true }}
        height={emojiLibSize.height}
        width={emojiLibSize.width}
        lazyLoadEmojis
        allowExpandReactions={false}
        className="hc-standard-emoji-picker min-h-0 min-w-0 max-w-full flex-1"
      />
    </div>
  );

  const portalPanel =
    typeof document !== 'undefined' &&
    isOpen &&
    createPortal(
      <>
        <div
          className="fixed inset-0 z-[250] touch-none bg-black/45 backdrop-blur-[1px] md:bg-black/30"
          aria-hidden
          onClick={closePicker}
          onKeyDown={(e) => e.key === 'Escape' && closePicker()}
        />
        {sheetNarrow ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('common.addEmoji')}
            className="fixed inset-x-0 bottom-0 z-[260] flex max-h-[55vh] min-h-[40vh] w-full max-w-[100vw] flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl supports-[padding:max(0px,1px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            {headerBar}
            <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden">
              {pickerBody}
            </div>
          </div>
        ) : desktopGeom ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('common.addEmoji')}
            style={{
              top: desktopGeom.top,
              left: desktopGeom.left,
              width: desktopGeom.width,
              height: desktopGeom.height,
            }}
            className="fixed z-[260] flex max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-xl border-2 border-primary-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {headerBar}
            <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden">
              {pickerBody}
            </div>
          </div>
        ) : null}
      </>,
      document.body
    );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        onClick={togglePicker}
        className="flex-shrink-0 rounded-full p-2 text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700 active:scale-95 disabled:opacity-50"
        aria-label={t('common.addEmoji')}
        aria-expanded={isOpen}
        type="button"
      >
        <Smile className="h-5 w-5" />
      </button>
      {portalPanel}
    </div>
  );
}
