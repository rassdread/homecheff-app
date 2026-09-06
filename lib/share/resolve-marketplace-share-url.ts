/**
 * Marketplace listing share URL policy — personal ?ref= vs company /a/[slug].
 * Never emit both personal ref and company tracking in the same share URL.
 */

export type MarketplaceShareKind = "plain" | "personal" | "company";

export type ResolvedShareMode =
  | { kind: "plain" }
  | { kind: "personal" }
  | { kind: "company"; organizationId: string }
  | { kind: "choose" };

export type OrgMembershipSummary = {
  organizationId: string;
  companyName: string;
  displayName?: string | null;
  role: string;
  status?: string;
};

export function appendPersonalRef(
  listingUrl: string,
  referralCode: string | null | undefined,
  origin = "https://homecheff.eu",
): string {
  if (!referralCode?.trim()) return listingUrl;
  try {
    const urlObj = new URL(listingUrl, origin);
    if (!urlObj.searchParams.has("ref")) {
      urlObj.searchParams.set("ref", referralCode.trim());
    }
    return urlObj.toString();
  } catch {
    const sep = listingUrl.includes("?") ? "&" : "?";
    return `${listingUrl}${sep}ref=${encodeURIComponent(referralCode.trim())}`;
  }
}

/**
 * Precedence:
 * ACTIVE_COMPANY_CONTEXT → company
 * else ACTIVE_PERSONAL_AFFILIATE → personal
 * else plain
 *
 * Dual-role without explicit preference → choose (UI).
 */
export function resolveShareMode(input: {
  memberships: OrgMembershipSummary[];
  preferenceMode: "personal" | "company" | null;
  preferenceOrganizationId: string | null;
  hasPersonalAffiliate: boolean;
}): ResolvedShareMode {
  const activeMemberships = input.memberships.filter(
    (m) => !m.status || m.status === "ACTIVE",
  );
  const hasCompany = activeMemberships.length > 0;

  if (input.preferenceMode === "company" && hasCompany) {
    const orgId =
      (input.preferenceOrganizationId &&
        activeMemberships.find((m) => m.organizationId === input.preferenceOrganizationId)
          ?.organizationId) ||
      activeMemberships[0]!.organizationId;
    return { kind: "company", organizationId: orgId };
  }

  if (input.preferenceMode === "personal") {
    if (input.hasPersonalAffiliate) return { kind: "personal" };
    return { kind: "plain" };
  }

  // No explicit preference
  if (hasCompany && input.hasPersonalAffiliate) {
    return { kind: "choose" };
  }
  if (hasCompany) {
    return {
      kind: "company",
      organizationId: activeMemberships[0]!.organizationId,
    };
  }
  if (input.hasPersonalAffiliate) return { kind: "personal" };
  return { kind: "plain" };
}

export function shareUrlHasPersonalRef(url: string): boolean {
  try {
    const u = new URL(url, "https://homecheff.eu");
    const ref = u.searchParams.get("ref");
    if (!ref) return false;
    // Company redirect companion uses org slug; personal codes are REFxxxx.
    return /^REF/i.test(ref);
  } catch {
    return false;
  }
}

export function shareUrlIsCompanyTracking(url: string): boolean {
  try {
    const u = new URL(url);
    return /\/a\/[a-z0-9-]+$/i.test(u.pathname) && /homecheff\.eu$/i.test(u.hostname);
  } catch {
    return false;
  }
}

export function listingPathFromAbsolute(url: string): string | null {
  try {
    const u = new URL(url, "https://homecheff.eu");
    const host = u.hostname.toLowerCase();
    if (host === "studio.homecheff.eu" || host === "growth.homecheff.eu") {
      u.search = "";
      u.hash = "";
      return u.toString().replace(/\/$/, "") || u.origin;
    }
    const path = u.pathname.replace(/\/+$/, "") || "/";
    if (/^\/(product|request)\//i.test(path)) return path;
    const exact = new Set([
      "/werken-bij",
      "/verdien",
      "/delivery",
      "/delivery/start",
      "/delivery/signup",
      "/delivery/company/signup",
      "/affiliate",
      "/affiliate/company",
      "/onboarding/seller",
      "/sell",
      "/sell/new",
      "/growth",
      "/studio",
      "/werken-bij/vacatures",
    ]);
    if (exact.has(path)) return path;
    return null;
  } catch {
    return null;
  }
}
