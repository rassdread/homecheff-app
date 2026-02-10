'use client';

import { useState, useEffect } from 'react';

/**
 * Hook for mobile-specific optimizations
 * Detects mobile devices and applies performance optimizations
 */
export function useMobileOptimization() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(isMobileDevice);

      // Detect low-end device based on hardware concurrency
      const cores = navigator.hardwareConcurrency || 4;
      const isLowEnd = cores <= 2 || isMobileDevice;
      setIsLowEndDevice(isLowEnd);
    };

    checkMobile();

    // Listen for resize events to update mobile detection
    const handleResize = () => {
      checkMobile();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile,
    isLowEndDevice,
    // Mobile-optimized settings
    imageQuality: isMobile ? 60 : 80,
    lazyLoading: isMobile ? 'lazy' : 'eager' as 'lazy' | 'eager',
    animationReduced: isLowEndDevice,
    reducedMotion: isLowEndDevice
  };
}

/**
 * Hook for intersection observer-based lazy loading
 * More efficient than default browser lazy loading
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px', // Start loading 50px before element is visible
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isIntersecting;
}
