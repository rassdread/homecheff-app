"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureCompanyTrackFromSearchClient } from "@/lib/affiliates/company-tracking-cookie";

/**
 * Persist Growth ?aff_track= onto Marketplace-domain cookies (first-touch).
 * Mount once in root layout. Economic lock happens at signup via processCompanyTrackingOnSignup.
 */
export function CompanyAffiliateTrackBinder() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    try {
      captureCompanyTrackFromSearchClient(searchParams.toString());
    } catch {
      /* ignore */
    }
  }, [searchParams, pathname]);

  return null;
}
