/**
 * Hook to get the current user's affiliate referral code
 * Returns the referral code if the user is an affiliate, null otherwise
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const REFERRAL_CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { code: string | null; expiresAt: number };

const referralCacheByEmail = new Map<string, CacheEntry>();
const inflightByEmail = new Map<string, Promise<string | null>>();

function readReferralCache(email: string): string | null | undefined {
  const e = referralCacheByEmail.get(email);
  if (!e) return undefined;
  if (Date.now() > e.expiresAt) {
    referralCacheByEmail.delete(email);
    return undefined;
  }
  return e.code;
}

async function fetchReferralCodeShared(email: string): Promise<string | null> {
  const existing = inflightByEmail.get(email);
  if (existing) return existing;

  const p = (async () => {
    try {
      const response = await fetch('/api/affiliate/referral-link', {
        credentials: 'include',
      });
      if (response.status === 401) {
        return null;
      }
      if (!response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[useAffiliateLink] referral-link unexpected status',
            response.status
          );
        }
        return null;
      }
      let data: { code?: string | null };
      try {
        const text = await response.text();
        data = text ? (JSON.parse(text) as { code?: string | null }) : {};
      } catch {
        return null;
      }
      return data.code ?? null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[useAffiliateLink] referral-link fetch failed', error);
      }
      return null;
    } finally {
      inflightByEmail.delete(email);
    }
  })();

  inflightByEmail.set(email, p);
  return p;
}

export function useAffiliateLink() {
  const { data: session } = useSession();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) {
      setReferralCode(null);
      setLoading(false);
      return;
    }

    const email = session.user.email;
    const cached = readReferralCache(email);
    if (cached !== undefined) {
      setReferralCode(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetchReferralCodeShared(email).then((code) => {
      referralCacheByEmail.set(email, {
        code,
        expiresAt: Date.now() + REFERRAL_CACHE_TTL_MS,
      });
      if (!cancelled) {
        setReferralCode(code);
      }
    }).finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.email]);

  /**
   * Add affiliate referral code to a URL. Gebruik dit bij élke share (profiel, product, recept, design, tuin, inspiratie)
   * zodat de affiliate link altijd wordt meegestuurd.
   * @param url The original URL
   * @returns URL with affiliate referral code added (ref=)
   */
  const addAffiliateToUrl = (url: string): string => {
    if (!referralCode) return url;

    try {
      const base =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://homecheff.eu';
      const urlObj = new URL(url, base);
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
