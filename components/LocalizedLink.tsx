'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { ReactNode, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LocalizedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  prefetch?: boolean;
  [key: string]: any; // Allow other Link props
}

/**
 * A Link component that automatically adds the locale prefix (/en/) when needed
 * Optimized with prefetching for faster navigation
 */
export default function LocalizedLink({ href, children, prefetch = true, ...props }: LocalizedLinkProps) {
  const { getLocalizedPath } = useTranslation();
  const router = useRouter();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const localizedHref = getLocalizedPath(href);
  
  // Prefetch on hover for faster navigation
  useEffect(() => {
    if (!prefetch || !linkRef.current) return;
    
    const link = linkRef.current;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const handleMouseEnter = () => {
      // Prefetch after very short delay for faster response
      timeoutId = setTimeout(() => {
        router.prefetch(localizedHref);
      }, 50);
    };
    
    const handleMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    
    const handleTouchStart = () => {
      // On mobile, prefetch immediately on touch start
      router.prefetch(localizedHref);
    };
    
    link.addEventListener('mouseenter', handleMouseEnter);
    link.addEventListener('mouseleave', handleMouseLeave);
    link.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    return () => {
      link.removeEventListener('mouseenter', handleMouseEnter);
      link.removeEventListener('mouseleave', handleMouseLeave);
      link.removeEventListener('touchstart', handleTouchStart);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [localizedHref, router, prefetch]);
  
  return (
    <Link 
      ref={linkRef}
      href={localizedHref} 
      prefetch={prefetch}
      {...props}
    >
      {children}
    </Link>
  );
}





















