/**
 * Affiliate-owned referral list mapping.
 * Never include another affiliate's attributions. Never expose email.
 */

export type AffiliateAttributionRow = {
  id: string;
  userId: string;
  type: string;
  source: string;
  createdAt: Date;
  startsAt: Date;
  endsAt: Date;
  user: {
    name: string | null;
    username: string | null;
  };
};

export type AffiliateReferralListItem = {
  id: string;
  userId: string;
  displayName: string;
  username: string | null;
  type: string;
  source: string;
  createdAt: string;
  startsAt: string;
  endsAt: string;
  windowStatus: 'active' | 'ended';
};

/** The stored endsAt is audit history. It does not mark the portfolio ended. */
export function referralWindowStatus(
  _endsAt: Date,
  _now: Date = new Date(),
): 'active' | 'ended' {
  return 'active';
}

export function mapOwnedAttributionsToReferralList(
  ownerAffiliateId: string,
  rows: Array<AffiliateAttributionRow & { affiliateId: string }>,
  now: Date = new Date(),
): AffiliateReferralListItem[] {
  const owned = rows.filter((row) => row.affiliateId === ownerAffiliateId);
  return owned
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((row) => {
      const username = row.user.username?.trim() || null;
      const name = row.user.name?.trim() || null;
      const displayName = name || (username ? `@${username}` : 'HomeCheff');
      return {
        id: row.id,
        userId: row.userId,
        displayName,
        username,
        type: row.type,
        source: row.source,
        createdAt: row.createdAt.toISOString(),
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt.toISOString(),
        windowStatus: referralWindowStatus(row.endsAt, now),
      };
    });
}
