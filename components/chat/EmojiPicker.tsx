'use client';

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Smile, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Categories } from 'emoji-picker-react';

// Dynamically import emoji picker to avoid SSR issues
const EmojiPickerReact = dynamic(
  () => import('emoji-picker-react'),
  { ssr: false }
);

/** Geen suggested/recent (vaak leeg), geen custom stickers-tab, geen flags/dieren — alleen bruikbare groepen. */
const STANDARD_EMOJI_PICKER_CATEGORIES = [
  Categories.SMILEYS_PEOPLE,
  Categories.FOOD_DRINK,
  Categories.ACTIVITIES,
  Categories.TRAVEL_PLACES,
  Categories.OBJECTS,
  Categories.SYMBOLS,
] as const;

interface EmojiPickerProps {
  onEmojiClick: (emoji: string) => void;
  className?: string;
  category?: 'CHEFF' | 'GARDEN' | 'DESIGNER' | 'auto'; // Auto-detect from pathname
}

type EmojiTheme = 'homecheff' | 'garden' | 'designer' | 'whatsapp' | 'native' | 'apple' | 'google' | 'facebook' | 'twitter';

// HomeCheff/Keuken emoji's (15 emoji's)
const HOMECHEFF_EMOJIS = [
  '👨‍🍳', '🍳', '🥘', '🍲', '🥗', '🍕', '🍝', '🥖', '🧀', '🥩',
  '🍗', '🌶️', '🧄', '🥕', '🍅', '🥑', '🥦', '🍞', '🥐', '🥚'
];

// Garden/Tuin emoji's (15 emoji's)
const GARDEN_EMOJIS = [
  '🌱', '🌿', '🍀', '🌾', '🌻', '🌷', '🌹', '🌺', '🌸', '💐',
  '🌼', '🌵', '🌲', '🌳', '🍃', '🌰', '🥜', '🍄', '🥕', '🌽'
];

// Designer/Atelier emoji's (15 emoji's)
const DESIGNER_EMOJIS = [
  '🎨', '🖌️', '🖼️', '🖊️', '✏️', '🖍️', '📐', '✂️', '🧵', '🪡',
  '🧶', '🪢', '💎', '🔨', '⚒️', '🛠️', '🔧', '⚙️', '🎭', '🎪'
];

// Mensen & Relaties emoji's (inclusief oude WhatsApp stijl)
const PEOPLE_EMOJIS = [
  '👤', '👥', '👨', '👩', '👨‍❤️‍👨', '👩‍❤️‍👩', '👨‍❤️‍👩', 
  '👨‍👩‍👧', '👨‍👩‍👦', '👨‍👩‍👧‍👦', '👨‍👨‍👦', '👩‍👩‍👧',
  '👨‍👨‍👧‍👦', '👩‍👩‍👧‍👦', '👨‍👨‍👧', '👩‍👩‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧'
];

// Oude WhatsApp emoji stijl - klassieke emoji's
const WHATSAPP_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😜', '😝', '😎', '🤩', '🥳', '😏', '😒', '😞',
  '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢',
  '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱',
  '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶',
  '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱',
  '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷',
  '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩',
  '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹',
  '😻', '😼', '😽', '🙀', '😿', '😾'
];

const EMOJI_THEMES: { value: EmojiTheme; label: string; icon: string; description?: string; color?: string }[] = [
  { value: 'homecheff', label: 'Keuken', icon: '👨‍🍳', description: 'Keuken & Koken', color: 'from-primary-50 to-primary-100' },
  { value: 'garden', label: 'Tuin', icon: '🌱', description: 'Garden & Groeien', color: 'from-green-50 to-emerald-100' },
  { value: 'designer', label: 'Atelier', icon: '🎨', description: 'Design & Creatief', color: 'from-purple-50 to-pink-100' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬', description: 'Klassieke WhatsApp', color: 'from-green-50 to-teal-100' },
  { value: 'native', label: 'Native', icon: '😀' },
  { value: 'apple', label: 'Apple', icon: '🍎' },
  { value: 'google', label: 'Google', icon: '🔍' },
  { value: 'facebook', label: 'Facebook', icon: '👤' },
  { value: 'twitter', label: 'Twitter', icon: '🐦' },
];

// Detect category from pathname
function detectCategory(pathname: string | null, category?: 'CHEFF' | 'GARDEN' | 'DESIGNER' | 'auto'): 'CHEFF' | 'GARDEN' | 'DESIGNER' | null {
  if (category && category !== 'auto') {
    return category;
  }
  
  if (!pathname) return null;
  
  // Check pathname for category indicators
  if (pathname.includes('/garden') || pathname.includes('/tuin') || pathname.includes('GARDEN')) {
    return 'GARDEN';
  }
  if (pathname.includes('/design') || pathname.includes('/atelier') || pathname.includes('DESIGNER')) {
    return 'DESIGNER';
  }
  if (pathname.includes('/chef') || pathname.includes('/keuken') || pathname.includes('CHEFF')) {
    return 'CHEFF';
  }
  
  return null;
}

type DesktopPanelGeom = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export default function EmojiPickerButton({ onEmojiClick, className = '', category = 'auto' }: EmojiPickerProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState<'CHEFF' | 'GARDEN' | 'DESIGNER' | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetNarrow = useMediaQuery('(max-width: 1023px)');
  const [desktopGeom, setDesktopGeom] = useState<DesktopPanelGeom | null>(null);
  const [emojiLibSize, setEmojiLibSize] = useState({ width: 360, height: 380 });

  const HEADER_THEME_ROW_H = 112;

  const layoutPickerDimensions = useCallback(() => {
    if (typeof window === 'undefined') return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (sheetNarrow) {
      const sheetMax = Math.floor(vh * 0.55);
      const sheetMin = Math.floor(vh * 0.4);
      const sheetH = Math.max(sheetMin, Math.min(sheetMax, vh - 120));
      const innerH = Math.max(260, sheetH - HEADER_THEME_ROW_H - 24);
      const innerW = Math.max(280, vw - 16);
      setEmojiLibSize({ width: innerW, height: innerH });
      return;
    }

    if (desktopGeom) {
      const innerW = Math.max(304, desktopGeom.width - 16);
      const innerH = Math.max(
        300,
        desktopGeom.height - HEADER_THEME_ROW_H - 16
      );
      setEmojiLibSize({
        width: Math.min(innerW, vw - 24),
        height: Math.min(innerH, vh - 24),
      });
    }
  }, [sheetNarrow, desktopGeom]);

  // Detect category on mount and when pathname changes
  useEffect(() => {
    const cat = detectCategory(pathname, category);
    setDetectedCategory(cat);
    
    // Set default theme based on detected category
    if (cat === 'GARDEN') {
      setSelectedTheme('garden');
    } else if (cat === 'DESIGNER') {
      setSelectedTheme('designer');
    } else if (cat === 'CHEFF') {
      setSelectedTheme('homecheff');
    }
  }, [pathname, category]);

  // Determine default theme
  const getDefaultTheme = (): EmojiTheme => {
    if (detectedCategory === 'GARDEN') return 'garden';
    if (detectedCategory === 'DESIGNER') return 'designer';
    if (detectedCategory === 'CHEFF') return 'homecheff';
    return 'homecheff'; // Default to HomeCheff
  };

  const [selectedTheme, setSelectedTheme] = useState<EmojiTheme>(getDefaultTheme());

  const handleEmojiClick = (emojiData: any) => {
    onEmojiClick(emojiData.emoji);
  };

  const togglePicker = () => {
    setIsOpen((o) => !o);
  };

  const closePicker = useCallback(() => setIsOpen(false), []);

  /** Desktop popover: positie t.o.v. trigger, min 320×360 inhoud. */
  useLayoutEffect(() => {
    if (!isOpen || sheetNarrow || !triggerRef.current) {
      if (!isOpen) setDesktopGeom(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const panelW = Math.max(320, Math.min(440, vw - 16));
    const panelH = Math.min(520, Math.max(380, Math.floor(vh * 0.58)));
    let left = rect.right - panelW;
    left = Math.max(8, Math.min(left, vw - panelW - 8));
    let top = rect.top - panelH - 10;
    if (top < 8) top = rect.bottom + 10;
    if (top + panelH > vh - 8) top = Math.max(8, vh - panelH - 8);
    setDesktopGeom({ top, left, width: panelW, height: panelH });
  }, [isOpen, sheetNarrow, pathname]);

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

  /** Voorkom body-scroll achter bottom sheet (mobiel). */
  useEffect(() => {
    if (!isOpen || !sheetNarrow) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, sheetNarrow]);

  // Get emoji set based on theme
  const getEmojiSet = (theme: EmojiTheme): string[] => {
    switch (theme) {
      case 'homecheff':
        return HOMECHEFF_EMOJIS;
      case 'garden':
        return GARDEN_EMOJIS;
      case 'designer':
        return DESIGNER_EMOJIS;
      case 'whatsapp':
        return WHATSAPP_EMOJIS;
      default:
        return [];
    }
  };

  // Get theme colors
  const getThemeColors = (theme: EmojiTheme): { bg: string; border: string; header: string } => {
    switch (theme) {
      case 'homecheff':
        return {
          bg: 'from-primary-50 via-amber-50 to-orange-50',
          border: 'border-primary-200',
          header: 'bg-primary-600 text-white'
        };
      case 'garden':
        return {
          bg: 'from-green-50 via-emerald-50 to-teal-50',
          border: 'border-green-200',
          header: 'bg-green-600 text-white'
        };
      case 'designer':
        return {
          bg: 'from-purple-50 via-pink-50 to-indigo-50',
          border: 'border-purple-200',
          header: 'bg-purple-600 text-white'
        };
      case 'whatsapp':
        return {
          bg: 'from-green-50 via-teal-50 to-cyan-50',
          border: 'border-green-200',
          header: 'bg-green-600 text-white'
        };
      default:
        return {
          bg: 'from-gray-50 to-gray-100',
          border: 'border-gray-200',
          header: 'bg-gray-600 text-white'
        };
    }
  };

  const isCustomTheme = ['homecheff', 'garden', 'designer', 'whatsapp'].includes(selectedTheme);
  const emojiSet = getEmojiSet(selectedTheme);
  const themeColors = getThemeColors(selectedTheme);
  const themeInfo = EMOJI_THEMES.find(t => t.value === selectedTheme);

  const themeSelectorRow = (
    <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100 p-2">
      {EMOJI_THEMES.map((theme) => (
        <button
          key={theme.value}
          type="button"
          onClick={() => setSelectedTheme(theme.value)}
          className={`relative rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
            selectedTheme === theme.value
              ? isCustomTheme
                ? themeColors.header
                : 'bg-blue-500 text-white'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title={theme.description || theme.label}
        >
          <span className="text-base">{theme.icon}</span>
          {isCustomTheme && selectedTheme === theme.value && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-white bg-green-500" />
          )}
        </button>
      ))}
      <button
        type="button"
        onClick={closePicker}
        className="ml-auto rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
        aria-label={t('buttons.close')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  const pickerBody = isCustomTheme ? (
    <div
      className={`min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 bg-gradient-to-br ${themeColors.bg}`}
    >
      <div
        className={`mb-4 rounded-lg border ${themeColors.border} bg-white p-3 shadow-sm`}
      >
        <h3 className="mb-1 flex items-center gap-2 text-sm font-bold">
          <span className="text-xl">{themeInfo?.icon}</span>
          <span
            className={
              selectedTheme === 'whatsapp'
                ? 'text-green-800'
                : selectedTheme === 'garden'
                  ? 'text-green-800'
                  : selectedTheme === 'designer'
                    ? 'text-purple-800'
                    : 'text-primary-800'
            }
          >
            {themeInfo?.description || themeInfo?.label}
          </span>
        </h3>
        <p className="text-xs text-gray-600">
          {selectedTheme === 'whatsapp'
            ? "Klassieke WhatsApp emoji's"
            : selectedTheme === 'garden'
              ? t('chat.chooseEmoji.garden')
              : selectedTheme === 'designer'
                ? t('chat.chooseEmoji.designer')
                : t('chat.chooseEmoji.chef')}
        </p>
      </div>

      <div className="mb-4">
        <h4
          className={`mb-2 text-xs font-semibold ${
            selectedTheme === 'whatsapp'
              ? 'text-green-800'
              : selectedTheme === 'garden'
                ? 'text-green-800'
                : selectedTheme === 'designer'
                  ? 'text-purple-800'
                  : 'text-primary-800'
          }`}
        >
          👥 Mensen & Relaties
        </h4>
        <div className="mb-3 grid grid-cols-8 gap-2">
          {PEOPLE_EMOJIS.map((emoji, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onEmojiClick(emoji)}
              className={`rounded-lg border border-transparent p-2 text-2xl transition-all duration-200 hover:scale-125 hover:bg-white hover:shadow-lg active:scale-110 ${
                selectedTheme === 'whatsapp'
                  ? 'hover:border-green-300'
                  : selectedTheme === 'garden'
                    ? 'hover:border-green-300'
                    : selectedTheme === 'designer'
                      ? 'hover:border-purple-300'
                      : 'hover:border-primary-300'
              }`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
        {emojiSet.map((emoji, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onEmojiClick(emoji)}
            className="rounded-lg border border-transparent p-2 text-2xl transition-all duration-200 hover:scale-125 hover:border-primary-300 hover:bg-white hover:shadow-lg active:scale-110"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className={`mt-4 border-t pt-4 ${themeColors.border}`}>
        <p className="flex items-center justify-center gap-1 text-center text-xs text-gray-500">
          <span>💡</span>
          <span>{t('chat.emojiTip')}</span>
        </p>
      </div>
    </div>
  ) : (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col items-stretch overflow-hidden px-1 pb-2 pt-1">
      <EmojiPickerReact
        onEmojiClick={handleEmojiClick}
        categories={[...STANDARD_EMOJI_PICKER_CATEGORIES]}
        skinTonesDisabled={false}
        searchDisabled={false}
        previewConfig={{ showPreview: true }}
        height={emojiLibSize.height}
        width={emojiLibSize.width}
        lazyLoadEmojis={true}
        allowExpandReactions={false}
        emojiStyle={
          selectedTheme === 'native'
            ? 'native'
            : (selectedTheme.toUpperCase() as import('emoji-picker-react').EmojiStyle)
        }
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
            className="fixed inset-x-0 bottom-0 z-[260] flex max-h-[55vh] min-h-[40vh] w-full flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl supports-[padding:max(0px,1px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            {themeSelectorRow}
            <div className="flex min-h-0 flex-1 flex-col">{pickerBody}</div>
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
            className="fixed z-[260] flex flex-col overflow-hidden rounded-xl border-2 border-primary-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {themeSelectorRow}
            <div className="flex min-h-0 flex-1 flex-col">{pickerBody}</div>
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
