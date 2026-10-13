/** Whether Marketplace may stop retrying a listing reward. Pause and outages stay pending. */

export function campaignGrantAttemptSettled(result: {
  ok: boolean;
  pending?: boolean;
  code?: string;
}): boolean {
  if (result.ok && result.pending) return false;
  if (result.ok) return true;
  return (
    result.code === "INVALID_CODE" ||
    result.code === "CAMPAIGN_NOT_FOUND" ||
    result.code === "CAMPAIGN_ENDED" ||
    result.code === "CAMPAIGN_BUDGET_EXCEEDED" ||
    result.code === "CUMULATIVE_PROMO_CAP" ||
    result.code === "CAMPAIGN_ALREADY_CLAIMED" ||
    result.code === "CAMPAIGN_REQUIRES_LISTING"
  );
}
