'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { trackUserType } from '@/components/GoogleAnalytics';

/**
 * Hook to automatically track user type and properties in Google Analytics
 * Call this hook in components that have access to user data
 */
export function useGoogleAnalyticsTracking() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    const user = session.user as any;

    // Track user type when user data is available
    trackUserType({
      role: user.role,
      buyerRoles: user.buyerRoles,
      sellerRoles: user.sellerRoles,
      interests: user.interests,
      gender: user.gender,
      hasDelivery: user.role === 'DELIVERY' || user.isDelivery,
      isBusiness: user.isBusiness,
    });
  }, [session]);
}

/**
 * Hook to track user data from API response
 * Use this when you fetch user data directly from API
 */
export function useTrackUserData(userData: {
  role?: string;
  buyerRoles?: string[];
  sellerRoles?: string[];
  interests?: string[];
  gender?: string;
  hasDelivery?: boolean;
  isBusiness?: boolean;
} | null | undefined) {
  useEffect(() => {
    if (!userData) {
      return;
    }

    trackUserType({
      role: userData.role,
      buyerRoles: userData.buyerRoles,
      sellerRoles: userData.sellerRoles,
      interests: userData.interests,
      gender: userData.gender,
      hasDelivery: userData.hasDelivery || userData.role === 'DELIVERY',
      isBusiness: userData.isBusiness,
    });
  }, [userData]);
}




