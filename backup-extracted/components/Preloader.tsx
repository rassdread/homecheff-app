'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Preloader() {
  const router = useRouter();

  useEffect(() => {
    // Preload critical routes
    const criticalRoutes = [
      '/messages',
      '/profile',
      '/login',
      '/register'
    ];

    // Preload critical routes after initial load
    const preloadRoutes = () => {
      criticalRoutes.forEach(route => {
        router.prefetch(route);
      });
    };

    // Preload after 2 seconds
    const timer = setTimeout(preloadRoutes, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    // Preload critical API endpoints
    const preloadAPIs = async () => {
      try {
        // Preload user data
        fetch('/api/profile/me', { method: 'HEAD' });
        
        // Preload conversations
        fetch('/api/conversations', { method: 'HEAD' });
        
        // Preload products
        fetch('/api/products?limit=10', { method: 'HEAD' });
      } catch (error) {
      }
    };

    // Preload after 3 seconds
    const timer = setTimeout(preloadAPIs, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Preload images
  useEffect(() => {
    const preloadImages = () => {
      const criticalImages = [
        '/images/logo.png',
        '/images/placeholder-avatar.png'
      ];

      criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    };

    preloadImages();
  }, []);

  return null;
}
