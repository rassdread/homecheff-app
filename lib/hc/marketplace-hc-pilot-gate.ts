/**
 * HomeCheff-side marketplace HC pilot gates — mirrors Growth fail-closed defaults.
 */

export class MarketplaceHcPilotDeniedError extends Error {
  readonly code = 'MARKETPLACE_HC_PILOT_DENIED';
  constructor(detail: string) {
    super(detail);
    this.name = 'MarketplaceHcPilotDeniedError';
  }
}

function envBool(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return defaultValue;
  const v = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return defaultValue;
}

export function isMarketplaceCheckoutEnabled(): boolean {
  return envBool('HC_MARKETPLACE_CHECKOUT_ENABLED', false);
}

export function isMarketplaceHcOnlyEnabled(): boolean {
  if (!isMarketplaceCheckoutEnabled()) return false;
  return envBool('HC_MARKETPLACE_HC_ONLY_ENABLED', false);
}

export function parseMarketplacePilotBuyerAllowlist(): string[] {
  const source = process.env.HC_MARKETPLACE_PILOT_CENTRAL_USER_IDS ?? '';
  return [...new Set(source.split(/[\s,]+/).map((s) => s.trim().toLowerCase()).filter(Boolean))];
}

export function parseMarketplacePilotListingAllowlist(): string[] {
  const source = process.env.HC_MARKETPLACE_PILOT_LISTING_IDS ?? '';
  return [...new Set(source.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean))];
}

export function assertMarketplaceHcOnlyCheckoutAllowed(input: {
  centralUserId: string;
  listingId: string;
}): void {
  if (!envBool('HC_CREDITS_ENABLED', false)) {
    throw new MarketplaceHcPilotDeniedError('HC_CREDITS_ENABLED is OFF.');
  }
  if (!envBool('HC_MARKETPLACE_REDEMPTION_ENABLED', false)) {
    throw new MarketplaceHcPilotDeniedError('HC_MARKETPLACE_REDEMPTION_ENABLED is OFF.');
  }
  if (!isMarketplaceCheckoutEnabled()) {
    throw new MarketplaceHcPilotDeniedError('HC_MARKETPLACE_CHECKOUT_ENABLED is OFF.');
  }
  if (!isMarketplaceHcOnlyEnabled()) {
    throw new MarketplaceHcPilotDeniedError('HC_MARKETPLACE_HC_ONLY_ENABLED is OFF.');
  }
  const buyers = parseMarketplacePilotBuyerAllowlist();
  const listings = parseMarketplacePilotListingAllowlist();
  if (!buyers.includes(input.centralUserId.trim().toLowerCase())) {
    throw new MarketplaceHcPilotDeniedError('Buyer not on marketplace HC pilot allowlist.');
  }
  if (!listings.includes(input.listingId.trim())) {
    throw new MarketplaceHcPilotDeniedError('Listing not on marketplace HC pilot allowlist.');
  }
}
