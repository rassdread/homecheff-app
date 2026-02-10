'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Preloader() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Preload critical routes - expanded list for faster navigation
    const criticalRoutes = [
      '/messages',
      '/profile',
      '/login',
      '/register',
      '/inspiratie',
      '/dorpsplein',
      '/orders',
      '/favorites',
      '/faq',
      // Dashboard routes - prefetch if user might have access
      '/admin',
      '/verkoper',
      '/verkoper/dashboard',
      '/verkoper/orders',
      '/verkoper/analytics',
      '/verkoper/revenue',
      '/delivery/dashboard',
      '/affiliate/dashboard',
    ];

    // Preload critical routes immediately (no delay for faster navigation)
    const preloadRoutes = () => {
      criticalRoutes.forEach(route => {
        // Only prefetch if not already on that route
        if (pathname !== route && !pathname?.startsWith(route)) {
          router.prefetch(route);
        }
      });
    };

    // Preload immediately after mount for faster navigation
    preloadRoutes();
    
    // Also preload after short delay to catch any missed routes
    const timer = setTimeout(preloadRoutes, 500);

    return () => clearTimeout(timer);
  }, [router, pathname]);

  useEffect(() => {
    // Preload critical API endpoints - faster timing for better UX
    const preloadAPIs = async () => {
      try {
        // Preload user data (if logged in)
        if (pathname !== '/login' && pathname !== '/register') {
          fetch('/api/profile/me', { method: 'HEAD' }).catch(() => {});
        }
        
        // Preload conversations (if logged in)
        if (pathname !== '/login' && pathname !== '/register') {
          fetch('/api/conversations', { method: 'HEAD' }).catch(() => {});
        }
        
        // Preload products (for dorpsplein/inspiratie)
        if (pathname === '/' || pathname === '/dorpsplein' || pathname === '/inspiratie') {
          fetch('/api/products?limit=10', { method: 'HEAD' }).catch(() => {});
        }
      } catch (error) {
        // Silently fail
      }
    };

    // Preload after 1 second (faster than before)
    const timer = setTimeout(preloadAPIs, 1000);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Preload images
  useEffect(() => {
    const preloadImages = () => {
      const criticalImages = [
        '/logo.png', // Logo is in /public/ root
        '/avatar-placeholder.png' // Avatar placeholder (if exists)
      ];

      criticalImages.forEach(src => {
        const img = new Image();
        img.onerror = () => {
          // Silently fail if image doesn't exist - not critical
        };
        img.src = src;
      });
    };

    preloadImages();
  }, []);

  return null;
}
