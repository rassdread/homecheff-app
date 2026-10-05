/**
 * Forward-looking sellerRoles consistency.
 * Capabilities: chef, garden, designer, service, and delivery.
 * Service subtypes stay in marketplace taxonomy. They are not separate roles.
 * The server derives a role from a validated commercial offer. Callers cannot
 * invent a role name.
 */

import { commercialCapabilityForOffer } from '@/lib/marketplace/commercial-capability';

export const CANONICAL_SELLER_ROLES = [
  'chef',
  'garden',
  'designer',
  'service',
  'delivery',
] as const;

export type CanonicalSellerRole = (typeof CANONICAL_SELLER_ROLES)[number];

const ALIASES: Record<string, CanonicalSellerRole> = {
  chef: 'chef',
  cheff: 'chef',
  garden: 'garden',
  grower: 'garden',
  grown: 'garden',
  designer: 'designer',
  design: 'designer',
  service: 'service',
  services: 'service',
  delivery: 'delivery',
};

export function normalizeSellerRole(value: unknown): CanonicalSellerRole | null {
  if (typeof value !== 'string') return null;
  return ALIASES[value.trim().toLowerCase()] ?? null;
}

export type ParsedSellerRoles =
  | { ok: true; roles: CanonicalSellerRole[] }
  | { ok: false; error: string };

/** Explicit profile update. Empty array is an intentional clear. Unknown values are rejected. */
export function parseSuppliedSellerRoles(input: unknown): ParsedSellerRoles {
  if (!Array.isArray(input)) {
    return { ok: false, error: 'sellerRoles moet een lijst zijn' };
  }
  const roles: CanonicalSellerRole[] = [];
  for (const value of input) {
    const role = normalizeSellerRole(value);
    if (!role) {
      return { ok: false, error: 'Onbekende verkopersrol' };
    }
    if (!roles.includes(role)) roles.push(role);
  }
  return { ok: true, roles };
}

/**
 * Role granted by a commercial OFFER. Requests and inspiration do not qualify.
 * Marketplace category is the semantic source. Product.category is only the
 * fallback when that field was not stored.
 */
export function sellerRoleForCommercialOffer(
  listingIntent: string | null | undefined,
  productCategory: string | null | undefined,
  marketplaceCategory?: string | null,
  specializations?: string[] | null,
): CanonicalSellerRole | null {
  const capability = commercialCapabilityForOffer({
    listingIntent,
    marketplaceCategory,
    productCategory,
    specializations,
  });
  if (capability === 'chef' || capability === 'garden' || capability === 'designer' || capability === 'service') {
    return capability;
  }
  return null;
}

export function unionSellerRoles(
  existing: readonly string[] | null | undefined,
  role: CanonicalSellerRole,
): { roles: string[]; added: boolean } {
  const current = Array.isArray(existing) ? [...existing] : [];
  const already = current.some((value) => normalizeSellerRole(value) === role);
  if (already) return { roles: current, added: false };
  return { roles: [...current, role], added: true };
}
