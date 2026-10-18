'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  HC_CAMPAIGN_COOKIE,
  HC_CAMPAIGN_TTL_DAYS,
  readHcCampaignCodeFromSearch,
} from '@/lib/acquisition/hc-campaign-code';

/** Stores ?campaign= in its own cookie. Does not touch hc_ref or the Meta pixel. */
export default function HcCampaignCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = readHcCampaignCodeFromSearch(searchParams);
    if (!code) return;
    const existing = document.cookie
      .split(';')
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${HC_CAMPAIGN_COOKIE}=`));
    if (existing) return;
    const maxAge = HC_CAMPAIGN_TTL_DAYS * 24 * 60 * 60;
    document.cookie = `${HC_CAMPAIGN_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  }, [pathname, searchParams]);

  return null;
}
