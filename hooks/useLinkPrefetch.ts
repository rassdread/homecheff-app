'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook to automatically prefetch links on hover for faster navigation
 * Usage: const { linkRef } = useLinkPrefetch(href);
 * Then add ref={linkRef} to your Link or anchor element
 */
export function useLinkPrefetch(href: string, enabled: boolean = true) {
  const router = useRouter();
  const linkRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !linkRef.current) return;

    const link = linkRef.current;
    
    const handleMouseEnter = () => {
      // Prefetch after short delay to avoid prefetching on accidental hovers
      timeoutRef.current = setTimeout(() => {
        router.prefetch(href);
      }, 50); // Very short delay for faster response
    };
    
    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    
    const handleTouchStart = () => {
      // On mobile, prefetch immediately on touch start
      router.prefetch(href);
    };
    
    link.addEventListener('mouseenter', handleMouseEnter);
    link.addEventListener('mouseleave', handleMouseLeave);
    link.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    return () => {
      link.removeEventListener('mouseenter', handleMouseEnter);
      link.removeEventListener('mouseleave', handleMouseLeave);
      link.removeEventListener('touchstart', handleTouchStart);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [href, router, enabled]);

  return { linkRef };
}


