'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Smile, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// Dynamically import emoji picker to avoid SSR issues
const EmojiPicker = dynamic(
  () => import('emoji-picker-react'),
  { ssr: false }
);

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

export default function EmojiPickerButton({ onEmojiClick, className = '', category = 'auto' }: EmojiPickerProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState<'CHEFF' | 'GARDEN' | 'DESIGNER' | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

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
    setIsOpen(!isOpen);
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <button
        onClick={togglePicker}
        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 flex-shrink-0 active:scale-95 transition-all rounded-full hover:bg-gray-100"
        aria-label={t('common.addEmoji')}
        type="button"
      >
        <Smile className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          {/* Overlay to close picker when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Emoji Picker Container */}
          <div className="absolute bottom-full right-0 mb-2 z-50 bg-white rounded-lg shadow-2xl border-2 border-primary-200 overflow-hidden w-[380px] max-w-[90vw]">
            {/* Theme Selector */}
            <div className="flex items-center gap-1 p-2 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200 flex-wrap">
              {EMOJI_THEMES.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => setSelectedTheme(theme.value)}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all relative ${
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
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </button>
              ))}
              <button
                onClick={() => setIsOpen(false)}
                className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                aria-label={t('buttons.close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Custom Emoji Grids */}
            {isCustomTheme ? (
              <div className={`max-h-[400px] overflow-y-auto p-4 bg-gradient-to-br ${themeColors.bg}`}>
                <div className={`mb-4 p-3 rounded-lg border ${themeColors.border} shadow-sm ${selectedTheme === 'whatsapp' ? 'bg-white' : 'bg-white'}`}>
                  <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
                    <span className="text-xl">{themeInfo?.icon}</span>
                    <span className={selectedTheme === 'whatsapp' ? 'text-green-800' : selectedTheme === 'garden' ? 'text-green-800' : selectedTheme === 'designer' ? 'text-purple-800' : 'text-primary-800'}>
                      {themeInfo?.description || themeInfo?.label}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-600">
                    {selectedTheme === 'whatsapp' 
                      ? 'Klassieke WhatsApp emoji\'s' 
                      : selectedTheme === 'garden'
                      ? t('chat.chooseEmoji.garden')
                      : selectedTheme === 'designer'
                      ? t('chat.chooseEmoji.designer')
                      : t('chat.chooseEmoji.chef')}
                  </p>
                </div>
                
                {/* Special section for people emojis - always available */}
                <div className="mb-4">
                  <h4 className={`text-xs font-semibold mb-2 ${
                    selectedTheme === 'whatsapp' ? 'text-green-800' : 
                    selectedTheme === 'garden' ? 'text-green-800' : 
                    selectedTheme === 'designer' ? 'text-purple-800' : 
                    'text-primary-800'
                  }`}>
                    👥 Mensen & Relaties
                  </h4>
                  <div className="grid grid-cols-8 gap-2 mb-3">
                    {PEOPLE_EMOJIS.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          onEmojiClick(emoji);
                        }}
                        className={`text-2xl hover:bg-white hover:scale-125 rounded-lg p-2 transition-all duration-200 hover:shadow-lg active:scale-110 border border-transparent ${
                          selectedTheme === 'whatsapp' ? 'hover:border-green-300' :
                          selectedTheme === 'garden' ? 'hover:border-green-300' :
                          selectedTheme === 'designer' ? 'hover:border-purple-300' :
                          'hover:border-primary-300'
                        }`}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main emoji grid */}
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
                  {emojiSet.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        onEmojiClick(emoji);
                      }}
                      className="text-2xl hover:bg-white hover:scale-125 rounded-lg p-2 transition-all duration-200 hover:shadow-lg active:scale-110 border border-transparent hover:border-primary-300"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                
                <div className={`mt-4 pt-4 border-t ${themeColors.border}`}>
                  <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-1">
                    <span>💡</span>
                    <span>{t('chat.emojiTip')}</span>
                  </p>
                </div>
              </div>
            ) : (
              /* Standard Emoji Picker */
              <div className="max-h-[400px] overflow-y-auto">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  skinTonesDisabled={false}
                  searchDisabled={false}
                  previewConfig={{
                    showPreview: true
                  }}
                  height={400}
                  width={350}
                  lazyLoadEmojis={true}
                  emojiStyle={selectedTheme === 'native' ? 'native' : selectedTheme.toUpperCase() as any}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
