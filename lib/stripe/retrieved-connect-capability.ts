/** Fields actually present on a retrieved Connect account. Absent values stay absent. */
export type RetrievedConnectCapabilityFields = {
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
  stripeTransfersStatus?: string;
};

export function retrievedConnectCapabilityFields(account: {
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
  capabilities?: { transfers?: string | null } | null;
}): RetrievedConnectCapabilityFields {
  const data: RetrievedConnectCapabilityFields = {};
  if (typeof account.charges_enabled === 'boolean') data.stripeChargesEnabled = account.charges_enabled;
  if (typeof account.payouts_enabled === 'boolean') data.stripePayoutsEnabled = account.payouts_enabled;
  const transfers = account.capabilities?.transfers;
  if (typeof transfers === 'string' && transfers.trim()) data.stripeTransfersStatus = transfers.trim();
  return data;
}
