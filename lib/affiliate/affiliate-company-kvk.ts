/**
 * Marketplace-side KvK rules for the business affiliate profile.
 * Does not create Business, SellerProfile, or a subscription.
 */

export function personalAffiliateRequiresKvk(): false {
  return false;
}

export function companyRegistrationRequiresMarketplaceSubscription(): false {
  return false;
}

export function kvkImpliesMarketplaceSeller(): false {
  return false;
}

/** Same 8-digit rule as Marketplace business registration. Does not pad shorter numbers. */
export function normalizeAffiliateCompanyKvk(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\s+/g, "");
  if (!/^\d{8}$/.test(digits)) return null;
  return digits;
}

export type OwnedAffiliateOrganizationRef = {
  id: string;
  companyName: string;
  kvkNumber: string | null;
  status: string;
};

export function selectExistingOrganizationByExactKvk<T extends OwnedAffiliateOrganizationRef>(
  organizations: T[],
  kvkNumber: string,
): T | null {
  const kvk = normalizeAffiliateCompanyKvk(kvkNumber);
  if (!kvk) return null;
  return (
    organizations.find((org) => {
      if (org.status === "ARCHIVED") return false;
      return normalizeAffiliateCompanyKvk(org.kvkNumber) === kvk;
    }) ?? null
  );
}

/**
 * Prefill only when this user has one unambiguous KvK on their own
 * Marketplace Business and/or SellerProfile. Different numbers are not merged.
 * A missing company name still returns the KvK so the field is not retyped.
 */
export function suggestOwnedCompanyIdentity(input: {
  businessName?: string | null;
  businessKvk?: string | null;
  sellerCompanyName?: string | null;
  sellerKvk?: string | null;
}): { companyName: string; kvkNumber: string } | null {
  const businessKvk = normalizeAffiliateCompanyKvk(input.businessKvk ?? null);
  const sellerKvk = normalizeAffiliateCompanyKvk(input.sellerKvk ?? null);
  const unique = [...new Set([businessKvk, sellerKvk].filter((value): value is string => Boolean(value)))];
  if (unique.length !== 1) return null;
  const kvkNumber = unique[0];
  const companyName =
    (businessKvk === kvkNumber ? input.businessName?.trim() : "") ||
    (sellerKvk === kvkNumber ? input.sellerCompanyName?.trim() : "") ||
    "";
  return { companyName, kvkNumber };
}
