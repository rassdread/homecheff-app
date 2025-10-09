'use client';

import { useEffect } from 'react';

export default function VercelAnalytics() {
  useEffect(() => {
    // Load Vercel Analytics script
    const script = document.createElement('script');
    script.src = 'https://va.vercel-scripts.com/v1/script.debug.js';
    script.setAttribute('data-api', '/api/analytics');
    script.async = true;
    
    // Only load in production
    if (process.env.NODE_ENV === 'production') {
      document.head.appendChild(script);
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
}
