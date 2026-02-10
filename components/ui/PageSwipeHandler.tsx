'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

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
  const router = useRouter();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontalSwipe = useRef(false);
  const minSwipeDistance = 100; // Minimum distance in pixels to trigger navigation

  useEffect(() => {
    // Only enable on Inspiratie and Dorpsplein pages
    if (!enabled || (pathname !== '/inspiratie' && pathname !== '/dorpsplein' && pathname !== '/')) {
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

      // Determine if this is a horizontal swipe (more horizontal than vertical)
      if (diffX > diffY && diffX > 10) {
        isHorizontalSwipe.current = true;
      } else if (diffY > diffX && diffY > 10) {
        // User is scrolling vertically, cancel swipe
        isHorizontalSwipe.current = false;
        touchStartX.current = null;
        touchStartY.current = null;
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
      const diff = touchStartX.current - touchEndX;
      const absDiff = Math.abs(diff);

      // Only navigate if swipe is significant enough
      if (absDiff > minSwipeDistance) {
        // Swipe left (right to left) - go to Inspiratie
        if (diff > 0 && (pathname === '/dorpsplein' || pathname === '/')) {
          e.preventDefault();
          router.push('/inspiratie');
        }
        // Swipe right (left to right) - go to Dorpsplein
        else if (diff < 0 && pathname === '/inspiratie') {
          e.preventDefault();
          router.push('/dorpsplein');
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
  }, [pathname, router, enabled]);

  // This component doesn't render anything
  return null;
}




















