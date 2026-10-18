export const HC_CAMPAIGN_GRANT_RETRY_LIMIT = 25;
export const HC_CAMPAIGN_GRANT_RETRY_BACKOFF_MS = 2 * 60 * 1000;

export type GrantRetryCandidate = {
  id: string;
  hcCampaignGrantAttemptAt: Date | null;
};

/** Oldest untouched attempts first. A Stripe wait does not block the rest of the batch. */
export function dueCampaignGrantRetries<T extends GrantRetryCandidate>(
  rows: T[],
  now: Date,
  limit = HC_CAMPAIGN_GRANT_RETRY_LIMIT,
): T[] {
  const cutoff = now.getTime() - HC_CAMPAIGN_GRANT_RETRY_BACKOFF_MS;
  return rows
    .filter((row) => !row.hcCampaignGrantAttemptAt || row.hcCampaignGrantAttemptAt.getTime() <= cutoff)
    .sort((a, b) => {
      const aTime = a.hcCampaignGrantAttemptAt?.getTime() ?? 0;
      const bTime = b.hcCampaignGrantAttemptAt?.getTime() ?? 0;
      return aTime - bTime;
    })
    .slice(0, limit);
}
