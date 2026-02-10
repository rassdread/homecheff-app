'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { HintConfig, getTourStepsForPage } from '@/lib/onboarding/hints';
import {
  isTourCompletedForPage,
  markTourCompletedForPage,
  loadOnboardingPreferences,
  saveOnboardingPreferences,
} from '@/lib/onboarding/storage';

interface OnboardingTourProps {
  pageId: string;
  onComplete?: () => void;
  autoStart?: boolean; // Start automatisch bij eerste bezoek
}

export default function OnboardingTour({
  pageId,
  onComplete,
  autoStart = false,
}: OnboardingTourProps) {
  // ALWAYS declare all hooks before any conditional returns
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<HintConfig[]>([]);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const startedRef = useRef(false);
  
  // Simple cross-page chain support to continue tour seamlessly
  const CHAIN_KEY = 'homecheff_onboarding_chain';
  const CHAIN_SUPPRESS_KEY = 'homecheff_onboarding_chain_nomore';
  const getChainedTarget = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(CHAIN_KEY);
    } catch {
      return null;
    }
  }, []);

  const setChainedTarget = useCallback((targetPageId: string | null) => {
    if (typeof window === 'undefined') return;
    try {
      if (targetPageId) {
        window.localStorage.setItem(CHAIN_KEY, targetPageId);
      } else {
        window.localStorage.removeItem(CHAIN_KEY);
      }
    } catch {}
  }, []);

  const setChainSuppress = useCallback((value: boolean) => {
    if (typeof window === 'undefined') return;
    try {
      if (value) {
        window.localStorage.setItem(CHAIN_SUPPRESS_KEY, '1');
      } else {
        window.localStorage.removeItem(CHAIN_SUPPRESS_KEY);
      }
    } catch {}
  }, []);

  const getChainSuppress = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(CHAIN_SUPPRESS_KEY) === '1';
    } catch {
      return false;
    }
  }, []);

  // Callbacks - define all before useEffect
  const completeTour = useCallback(() => {
    // If we are at home and want to chain to inspiratie, don't finish yet
    if (pageId === 'home') {
      try {
        if (typeof window !== 'undefined') {
          // Persist suppress preference across the chain
          setChainSuppress(dontShowAgain);
          setChainedTarget('inspiratie');
          try { (window as any).__homecheffTourActive = false; } catch {}
          window.location.href = '/inspiratie?tour=chain';
          return; // do not mark completed yet
        }
      } catch {}
    }

    // If arriving on inspiratie via chain, finish everything here
    const chained = getChainedTarget();
    if (pageId === 'inspiratie' && chained === 'inspiratie') {
      try {
        setChainedTarget(null);
        const prefs = loadOnboardingPreferences();
        const suppress = getChainSuppress();
        if (suppress || dontShowAgain) {
          prefs.tourCompleted = true;
        }
        saveOnboardingPreferences(prefs);
        markTourCompletedForPage('home');
        markTourCompletedForPage('inspiratie');
        setChainSuppress(false);
      } catch {}
    } else {
      // Normal single-page completion
      try {
        if (dontShowAgain) {
          const prefs = loadOnboardingPreferences();
          prefs.tourCompleted = true;
          saveOnboardingPreferences(prefs);
        }
      } catch {}
      try { markTourCompletedForPage(pageId); } catch {}
    }

    setIsActive(false);
    setCurrentStep(0);
    startedRef.current = false;
    try { (window as any).__homecheffTourActive = false; } catch {}
    if (onComplete) {
      onComplete();
    }
  }, [pageId, onComplete, getChainedTarget, setChainedTarget, setChainSuppress, getChainSuppress, dontShowAgain]);

  const startTour = useCallback(() => {
    if (steps.length === 0) return;
    setIsActive(true);
    setCurrentStep(0);
  }, [steps]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  }, [currentStep, steps, completeTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    const prefs = loadOnboardingPreferences();
    prefs.tourCompleted = true;
    saveOnboardingPreferences(prefs);
    // Also mark this page as completed so it never auto-starts here again
    try {
      markTourCompletedForPage(pageId);
      setChainedTarget(null);
    } catch {}
    setIsActive(false);
    startedRef.current = false;
    try { (window as any).__homecheffTourActive = false; } catch {}
  }, [pageId, setChainedTarget]);

  // All useEffect hooks
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 640);
      const handleResize = () => setIsMobile(window.innerWidth < 640);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    const tourSteps = getTourStepsForPage(pageId);
    setSteps(tourSteps);
  }, [pageId]);

  // Auto-start tour after mount and steps are loaded
  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !autoStart || steps.length === 0 || isActive) return;
    
    try {
      const prefs = loadOnboardingPreferences();
      const urlParams = new URLSearchParams(window.location.search);
      const tourParam = urlParams.get('tour');
      const forceStart = tourParam === '1' || tourParam === 'chain';
      const chained = getChainedTarget();
      const suppress = getChainSuppress();
      // Avoid showing again within same session
      const sessionKey = `homecheff_tour_shown_${pageId}`;
      const shownThisSession = window.sessionStorage.getItem(sessionKey) === '1';
      // Consider tour dismissed if globally skipped OR this page is completed
      const tourDismissed = prefs.tourCompleted || prefs.tourCompletedPages.includes(pageId) || suppress;
      
      if (!shownThisSession && !startedRef.current && (forceStart || chained === pageId || !tourDismissed)) {
        const delay = (chained === pageId || tourParam === 'chain') ? 0 : 300;
        const timer = setTimeout(() => {
          try {
            const g = (window as any);
            if (g.__homecheffTourActive) {
              return;
            }
            g.__homecheffTourActive = true;
          } catch {}
          startedRef.current = true;
          setIsActive(true);
          setCurrentStep(0);
          try {
            window.sessionStorage.setItem(sessionKey, '1');
            // Clean URL param to prevent accidental restarts on refresh
            if (tourParam) {
              const cleanUrl = new URL(window.location.href);
              cleanUrl.searchParams.delete('tour');
              window.history.replaceState({}, '', cleanUrl.toString());
            }
          } catch {}
        }, delay);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error('Error loading onboarding preferences:', error);
    }
  }, [mounted, autoStart, steps.length, pageId, isActive, getChainedTarget, getChainSuppress]);

  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;
    
    if (!isActive || steps.length === 0) {
      setTargetElement(null);
      return;
    }

    const step = steps[currentStep];
    if (step.targetSelector) {
      const timer = setTimeout(() => {
        if (mounted && typeof document !== 'undefined') {
          const element = document.querySelector(step.targetSelector!) as HTMLElement;
          setTargetElement(element);
          if (element) {
            try {
              element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            } catch (e) {
              console.error('Scroll error:', e);
            }
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setTargetElement(null);
    }
  }, [currentStep, steps, isActive, mounted]);

  // Early returns AFTER all hooks
  if (!mounted) {
    return null;
  }
  
  if (!isActive || steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];
  const placement = step.placement || 'bottom';

  const getHighlightStyle = () => {
    if (!targetElement || typeof window === 'undefined') {
      return { display: 'none' };
    }

    try {
      const rect = targetElement.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;

      return {
        position: 'absolute' as const,
        top: rect.top + scrollY - 8,
        left: rect.left + scrollX - 8,
        width: rect.width + 16,
        height: rect.height + 16,
        borderRadius: '12px',
      };
    } catch (e) {
      console.error('Error calculating highlight style:', e);
      return { display: 'none' };
    }
  };

  const getTooltipStyle = () => {
    // Force centered modal style for specific steps (prevents overflow and keeps text/buttons visible)
    if (step?.forceCenter) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: isMobile ? '90vw' : '26rem',
        width: isMobile ? '90vw' : '26rem',
      };
    }
    if (isMobile) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '90vw',
        width: '90vw',
      };
    }

    if (!targetElement || typeof window === 'undefined') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    try {
      const rect = targetElement.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const boxW = 360; // approximate tooltip width
      const boxH = 180; // approximate tooltip height

      const spacing = 20;
      let top = 0;
      let left = 0;

      switch (placement) {
        case 'top':
          top = rect.top + scrollY - spacing;
          left = rect.left + scrollX + rect.width / 2;
          // If overflow, center
          if (top - boxH < 0) {
            return {
              position: 'fixed' as const,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            };
          }
          return {
            position: 'absolute' as const,
            top: `${top}px`,
            left: `${left}px`,
            transform: 'translate(-50%, -100%)',
          };
        case 'bottom':
          top = rect.bottom + scrollY + spacing;
          left = rect.left + scrollX + rect.width / 2;
          if (top + boxH > scrollY + viewportH) {
            return {
              position: 'fixed' as const,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            };
          }
          return {
            position: 'absolute' as const,
            top: `${top}px`,
            left: `${left}px`,
            transform: 'translate(-50%, 0)',
          };
        case 'left':
          top = rect.top + scrollY + rect.height / 2;
          left = rect.left + scrollX - spacing;
          if (left - boxW < scrollX) {
            return {
              position: 'fixed' as const,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            };
          }
          return {
            position: 'absolute' as const,
            top: `${top}px`,
            left: `${left}px`,
            transform: 'translate(-100%, -50%)',
          };
        case 'right':
          top = rect.top + scrollY + rect.height / 2;
          left = rect.right + scrollX + spacing;
          if (left + boxW > scrollX + viewportW) {
            return {
              position: 'fixed' as const,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            };
          }
          return {
            position: 'absolute' as const,
            top: `${top}px`,
            left: `${left}px`,
            transform: 'translate(0, -50%)',
          };
        default:
          return {
            position: 'fixed' as const,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          };
      }
    } catch (e) {
      console.error('Error calculating tooltip style:', e);
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-[9998] transition-opacity"
        onClick={nextStep}
        style={{ backdropFilter: 'blur(2px)' }}
      />

      {/* Highlight */}
      {targetElement && (
        <div
          ref={highlightRef}
          className="fixed z-[9999] pointer-events-none border-4 border-blue-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-300"
          style={getHighlightStyle()}
        />
      )}

      {/* Tooltip */}
      <div
        className={`fixed z-[10000] ${
          isMobile 
            ? 'w-[90vw] max-w-md' 
            : 'w-80 md:w-96 max-w-md'
        }`}
        style={getTooltipStyle()}
      >
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 sm:p-6 relative">
          {/* Close button */}
          <button
            onClick={skipTour}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Tour overslaan"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs font-medium text-gray-500">
              Stap {currentStep + 1} van {steps.length}
            </div>
          </div>

          {/* Content */}
          <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">{step.title}</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">{step.description}</p>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Last-step options */}
          {currentStep === steps.length - 1 && (
            <label className="flex items-center gap-2 mb-3 text-xs sm:text-sm text-gray-600">
              <input
                type="checkbox"
                className="accent-emerald-600"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              Niet meer tonen
            </label>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              onClick={skipTour}
              className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors font-medium order-2 sm:order-1"
            >
              Niet meer tonen
            </button>

            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Vorige stap"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={nextStep}
                className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {currentStep === steps.length - 1
                  ? (pageId === 'home' ? 'Volgende' : 'Klaar!')
                  : 'Volgende'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
