/**
 * Hook to get the current user's affiliate referral code
 * Returns the referral code if the user is an affiliate, null otherwise
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useAffiliateLink() {
  const { data: session } = useSession();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    // Fetch referral code from API
    const fetchReferralCode = async () => {
      try {
        const response = await fetch('/api/affiliate/referral-link');
        if (response.ok) {
          const data = await response.json();
          if (data.code) {
            setReferralCode(data.code);
          }
        }
      } catch (error) {
        console.error('Error fetching referral code:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralCode();
  }, [session]);

  /**
   * Add affiliate referral code to a URL
   * @param url The original URL
   * @returns URL with affiliate referral code added
   */
  const addAffiliateToUrl = (url: string): string => {
    if (!referralCode) return url;

    try {
      const urlObj = new URL(url);
      // Add ref parameter if not already present
      if (!urlObj.searchParams.has('ref')) {
        urlObj.searchParams.set('ref', referralCode);
      }
      return urlObj.toString();
    } catch (error) {
      // If URL parsing fails, append manually
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}ref=${referralCode}`;
    }
  };

  return {
    referralCode,
    loading,
    addAffiliateToUrl,
    isAffiliate: !!referralCode,
  };
}







