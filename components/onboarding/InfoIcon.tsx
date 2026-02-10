'use client';

import { useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import { HintConfig } from '@/lib/onboarding/hints';
import { isHintDismissed, dismissHint } from '@/lib/onboarding/storage';
import { useTranslation } from '@/hooks/useTranslation';

interface InfoIconProps {
  hint: HintConfig;
  pageId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function InfoIcon({ hint, pageId, size = 'md', className = '' }: InfoIconProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  
  // FIX: Ensure component only renders in browser
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check if mobile on mount
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 640);
      }
    };
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, [mounted]);
  
  // Check if hint is dismissed
  useEffect(() => {
    setIsDismissed(isHintDismissed(hint.id));
  }, [hint.id]);
  
  // Close on outside click
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen && typeof document !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        if (typeof document !== 'undefined') {
          document.removeEventListener('mousedown', handleClickOutside);
        }
      };
    }
  }, [isOpen]);

  // Don't render until mounted
  if (!mounted) {
    return null;
  }

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const handleDismiss = () => {
    dismissHint(hint.id);
    setIsDismissed(true);
    setIsOpen(false);
  };

  const placement = hint.placement || 'top';
  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-blue-500 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
        aria-label="Info"
      >
        <Info className={sizeClasses[size]} />
      </button>

      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={popoverRef}
            className={`
              fixed sm:absolute z-50
              w-[calc(100vw-1rem)] sm:w-72 md:w-80
              max-w-[calc(100vw-1rem)] sm:max-w-sm
            `}
            style={isMobile ? {
              position: 'fixed',
              left: '50%',
              bottom: '1rem',
              transform: 'translateX(-50%)',
              maxWidth: 'calc(100vw - 1rem)',
            } : {
              position: 'absolute',
            }}
          >
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 relative max-h-[70vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={t('buttons.close')}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="pr-6">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                {hint.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {hint.description}
              </p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="mt-3 w-full text-xs text-gray-500 hover:text-gray-700 transition-colors underline"
            >
              Niet meer tonen
            </button>

            {/* Arrow */}
            <div
              className={`absolute w-2 h-2 bg-white border border-gray-200 ${
                placement === 'top'
                  ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 border-t-0 border-l-0'
                  : placement === 'bottom'
                  ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b-0 border-r-0'
                  : placement === 'left'
                  ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 border-l-0 border-b-0'
                  : 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-45 border-r-0 border-t-0'
              }`}
            />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

