/**
 * Read-only Growth central-HC marketplace quote client.
 * NO reserve/capture/grant — informational only.
 */

export type GrowthMarketplaceHcQuote = {
  ok: true;
  readOnly: true;
  walletResolved: boolean;
  identityResolved: boolean;
  walletStatus: string | null;
  totalAvailableHc: number;
  eligibleHc: number;
  ineligibleHc: number;
  orderAmountCents: number;
  maxHcApplicable: number;
  maxHcFaceValueCents: number;
  remainingEurCents: number;
  mixedPreview: {
    eligibleHc: number;
    hcFaceValueCents: number;
    remainingEurCents: number;
  } | null;
  paymentOptions: {
    eurOnly: boolean;
    hcOnly: boolean;
    mixed: boolean;
  };
  marketplaceHcEnabled: boolean;
  mixedPaymentEnabled: boolean;
  restrictedCreditEnabled: boolean;
  hcPaymentActionable: false;
  reason: string;
  reasonCode: string;
  userMessageNl: string;
  userMessageEn: string;
  restrictionSummary: string[];
};

export type TrustedOrderPayload = {
  orderId?: string;
  listingId: string;
  sellerCentralUserId: string;
  merchantId: string;
  categoryKey: string;
  geographyKey: string;
  orderTotalCents: number;
};

export async function fetchGrowthMarketplaceHcQuote(input: {
  centralUserId: string;
  trustedOrder: TrustedOrderPayload;
}): Promise<GrowthMarketplaceHcQuote | null> {
  const base = (process.env.GROWTH_HC_QUOTE_BASE_URL ?? process.env.GROWTH_API_BASE_URL ?? "https://growth.homecheff.eu").replace(/\/$/, "");
  const secret = (process.env.HC_MARKETPLACE_QUOTE_INTERNAL_SECRET ?? "").trim();
  if (!secret) return null;

  const res = await fetch(`${base}/api/internal/marketplace/checkout/hc-quote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      centralUserId: input.centralUserId,
      trustedOrder: input.trustedOrder,
    }),
    cache: "no-store",
  });

  if (!res.ok) return null;
  return (await res.json()) as GrowthMarketplaceHcQuote;
}
