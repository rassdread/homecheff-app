'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface PageSwipeHandlerProps {
  enabled?: boolean; // Allow parent to disable if needed
}

/**
 * Handles horizontal swipe gestures to navigate between Inspiratie and Dorpsplein
 * Swipe left (right to left) = Go to Inspiratie
 * Swipe right (left to right) = Go to Dorpsplein
 */
export default function PageSwipeHandler({ enabled = true }: PageSwipeHandlerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontalSwipe = useRef(false);
  const minSwipeDistance = 100; // Minimum distance in pixels to trigger navigation

  useEffect(() => {
    // Only enable on Inspiratie and Dorpsplein pages
    if (!enabled || pathname !== '/') {
      return;
    }

    // Only enable on mobile/touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth < 768;
    
    if (!isTouchDevice || !isSmallScreen) {
      return;
    }

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // Ignore touches on image sliders, modals, lightboxes, and videos
      if (
        target.closest('[data-image-slider]') ||
        target.closest('[data-modal]') ||
        target.closest('[data-lightbox]') ||
        target.tagName === 'VIDEO' ||
        target.closest('video') ||
        target.closest('.fixed.inset-0') // Modal overlays
      ) {
        return;
      }
      
      // Don't interfere with scrolling if user is scrolling vertically
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isHorizontalSwipe.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const target = e.target as HTMLElement;
      
      // Ignore touches on image sliders, modals, lightboxes, and videos
      if (
        target.closest('[data-image-slider]') ||
        target.closest('[data-modal]') ||
        target.closest('[data-lightbox]') ||
        target.tagName === 'VIDEO' ||
        target.closest('video') ||
        target.closest('.fixed.inset-0') // Modal overlays
      ) {
        isHorizontalSwipe.current = false;
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      const diffX = Math.abs(e.touches[0].clientX - touchStartX.current);
      const diffY = Math.abs(e.touches[0].clientY - touchStartY.current);

      // A vertical or mixed gesture is a scroll. Never keep it as a swipe.
      if (diffY > 12 && diffY >= diffX * 0.5) {
        isHorizontalSwipe.current = false;
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }
      if (diffX > diffY * 2 && diffX > 28) {
        isHorizontalSwipe.current = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // Ignore touches on image sliders, modals, lightboxes, and videos
      if (
        target.closest('[data-image-slider]') ||
        target.closest('[data-modal]') ||
        target.closest('[data-lightbox]') ||
        target.tagName === 'VIDEO' ||
        target.closest('video') ||
        target.closest('.fixed.inset-0') // Modal overlays
      ) {
        touchStartX.current = null;
        touchStartY.current = null;
        isHorizontalSwipe.current = false;
        return;
      }

      if (touchStartX.current === null || !isHorizontalSwipe.current) {
        touchStartX.current = null;
        touchStartY.current = null;
        isHorizontalSwipe.current = false;
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartX.current - touchEndX;
      const absDiff = Math.abs(diff);
      const absY = Math.abs((touchStartY.current ?? touchEndY) - touchEndY);

      // Only a clearly horizontal swipe navigates. No hash: a hash scrolls
      // the feed back to the top while the finger is still moving.
      if (absDiff > minSwipeDistance && absDiff > absY * 2) {
        const chip = searchParams.get('chip');
        const onHomeSaleOrAll =
          pathname === '/' &&
          (chip === 'sale' || chip === 'all' || chip == null || chip === '');
        const onHomeInspiration = pathname === '/' && chip === 'inspiration';

        if (diff > 0 && pathname === '/' && onHomeSaleOrAll) {
          e.preventDefault();
          router.replace('/?chip=inspiration', { scroll: false });
        } else if (diff < 0 && onHomeInspiration) {
          e.preventDefault();
          router.replace('/?chip=sale', { scroll: false });
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
      isHorizontalSwipe.current = false;
    };

    // Add event listeners to document for better coverage
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pathname, searchParams, router, enabled]);

  // This component doesn't render anything
  return null;
}




















