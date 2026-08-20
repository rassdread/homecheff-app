function envBool(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return defaultValue;
  const v = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return defaultValue;
}

export function getHcSellerPayoutFlags() {
  return {
    HC_SELLER_PAYOUT_ENABLED: envBool('HC_SELLER_PAYOUT_ENABLED', false),
    HC_SELLER_PAYOUT_PRODUCTION_MUTATION: envBool('HC_SELLER_PAYOUT_PRODUCTION_MUTATION', false),
  } as const;
}

export function assertHcSellerPayoutEnabled(): void {
  if (!getHcSellerPayoutFlags().HC_SELLER_PAYOUT_ENABLED) {
    throw new Error('HC_SELLER_PAYOUT_DISABLED');
  }
}
