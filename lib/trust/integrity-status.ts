/**
 * TRUST-1 — Product integrity moderation status (separate from isActive).
 */

export const PRODUCT_INTEGRITY_STATUSES = [
  'ACTIVE',
  'REVIEW_REQUIRED',
  'TEMPORARILY_HIDDEN',
  'UNDER_REVIEW',
  'REMOVED',
] as const;

export type ProductIntegrityStatus =
  (typeof PRODUCT_INTEGRITY_STATUSES)[number];

/** Public marketplace discovery (feed/search/profile public lists). */
export const PUBLIC_DISCOVERABLE_INTEGRITY_STATUSES: readonly ProductIntegrityStatus[] =
  ['ACTIVE', 'REVIEW_REQUIRED'];

export function isProductIntegrityStatus(
  v: unknown,
): v is ProductIntegrityStatus {
  return (
    typeof v === 'string' &&
    (PRODUCT_INTEGRITY_STATUSES as readonly string[]).includes(v)
  );
}

export function parseProductIntegrityStatus(
  v: unknown,
): ProductIntegrityStatus {
  return isProductIntegrityStatus(v) ? v : 'ACTIVE';
}

export function isIntegrityPubliclyDiscoverable(
  status: unknown,
): boolean {
  const s = parseProductIntegrityStatus(status);
  return (PUBLIC_DISCOVERABLE_INTEGRITY_STATUSES as readonly string[]).includes(
    s,
  );
}

/** Prisma where fragment — AND with existing isActive visibility. */
export function productIntegrityPublicWhere(): {
  integrityStatus: { in: ProductIntegrityStatus[] };
} {
  return {
    integrityStatus: {
      in: [...PUBLIC_DISCOVERABLE_INTEGRITY_STATUSES],
    },
  };
}

/**
 * Admin restore → ACTIVE. Does NOT set isActive=true.
 * Seller-deactivated products stay isActive=false.
 */
export function statusAfterAdminRestore(): ProductIntegrityStatus {
  return 'ACTIVE';
}
