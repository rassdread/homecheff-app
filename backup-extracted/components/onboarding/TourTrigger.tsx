'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import OnboardingTour from './OnboardingTour';
import { isTourCompletedForPage, loadOnboardingPreferences } from '@/lib/onboarding/storage';

interface TourTriggerProps {
  pageId: string;
  variant?: 'button' | 'badge'; // Button to show tour, or badge to indicate new
}

/**
 * Component die een knop toont om de tour te starten, of automatisch start bij eerste bezoek
 */
export default function TourTrigger({ pageId, variant = 'button' }: TourTriggerProps) {
  const [showButton, setShowButton] = useState(true); // Start met true, wordt alleen false als weggeklikt
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Tour is altijd beschikbaar, alleen verbergen als expliciet weggeklikt
    // Check of tour expliciet is weggeklikt via "niet meer tonen" in tour zelf
    try {
      const prefs = loadOnboardingPreferences();
      const tourDismissed = prefs.tourCompleted && prefs.tourCompletedPages.includes(pageId);
      setShowButton(!tourDismissed);
    } catch (error) {
      // Bij fout: toon altijd de knop
      console.error('Error loading onboarding preferences:', error);
      setShowButton(true);
    }
  }, [pageId]);

  const startTour = () => {
    setShowTour(true);
  };

  if (!showButton) {
    return null;
  }

  if (variant === 'badge') {
    return (
      <>
        <button
          onClick={startTour}
          className="fixed bottom-20 right-4 sm:right-6 z-[60] bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full px-3 py-2 sm:px-4 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 animate-pulse max-w-[90vw] sm:max-w-none"
          title="Start rondleiding"
          aria-label="Start rondleiding"
        >
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold hidden sm:inline whitespace-nowrap">Rondleiding</span>
        </button>
        {showTour && (
          <OnboardingTour pageId={pageId} autoStart={true} onComplete={() => setShowTour(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={startTour}
        className="relative z-[60] inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 rounded-lg font-medium hover:from-emerald-200 hover:to-green-200 transition-all shadow-sm hover:shadow-md text-xs sm:text-sm whitespace-nowrap w-full sm:w-auto min-w-[80px] sm:min-w-0"
        aria-label="Start rondleiding"
      >
        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="hidden sm:inline">Start rondleiding</span>
        <span className="sm:hidden font-semibold">✨ Tour</span>
      </button>
      {showTour && (
        <OnboardingTour pageId={pageId} autoStart={true} onComplete={() => setShowTour(false)} />
      )}
    </>
  );
}

