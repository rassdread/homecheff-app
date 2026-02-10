'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { trackUserType } from '@/components/GoogleAnalytics';

/**
 * Component that automatically tracks user type and properties in Google Analytics
 * This should be included in the app layout or auth-protected pages
 */
export default function GoogleAnalyticsUserTracker() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only track when session is loaded and user is authenticated
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    const user = session.user as any;

    // Track user type and properties
    trackUserType({
      role: user.role,
      buyerRoles: user.buyerRoles || [],
      sellerRoles: user.sellerRoles || [],
      interests: user.interests || [],
      gender: user.gender,
      hasDelivery: user.role === 'DELIVERY' || user.isDelivery === true,
      isBusiness: user.isBusiness === true,
    });
  }, [session, status]);

  return null;
}




