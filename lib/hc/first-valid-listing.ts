import { LISTING_QUALITY_THRESHOLD } from "@/lib/acquisition/listing-quality";

export type FirstValidListingInput = {
  isActive: boolean;
  integrityPublic: boolean;
  qualityScore: number;
  canPostItem: boolean;
  sellerSuspended: boolean;
  sellerDeleted: boolean;
  existingFirstProductId: string | null;
  productId: string;
  qualityThreshold?: number;
};

export type FirstValidListingDecision = {
  eligible: boolean;
  reason:
    | "FIRST"
    | "SAME_LISTING_RETRY"
    | "NOT_ACTIVE"
    | "NOT_PUBLIC"
    | "BELOW_QUALITY"
    | "ACCOUNT_NOT_READY"
    | "SELLER_BLOCKED"
    | "NOT_FIRST";
};

export function evaluateFirstValidListing(input: FirstValidListingInput): FirstValidListingDecision {
  const threshold = input.qualityThreshold ?? LISTING_QUALITY_THRESHOLD;
  if (!input.canPostItem) return { eligible: false, reason: "ACCOUNT_NOT_READY" };
  if (input.sellerSuspended || input.sellerDeleted) return { eligible: false, reason: "SELLER_BLOCKED" };
  if (!input.isActive) return { eligible: false, reason: "NOT_ACTIVE" };
  if (!input.integrityPublic) return { eligible: false, reason: "NOT_PUBLIC" };
  if (input.qualityScore < threshold) return { eligible: false, reason: "BELOW_QUALITY" };
  if (!input.existingFirstProductId) return { eligible: true, reason: "FIRST" };
  if (input.existingFirstProductId === input.productId) {
    return { eligible: true, reason: "SAME_LISTING_RETRY" };
  }
  return { eligible: false, reason: "NOT_FIRST" };
}
