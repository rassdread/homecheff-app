/**
 * MAIN → partner rules for the existing Affiliate.parentAffiliateId tree.
 * Partner invites are not customer referrals (hc_ref).
 */

export const PARTNER_INVITE_COOKIE = 'hc_partner_invite';

const INVITE_TOKEN_RE = /^[a-f0-9]{32,128}$/i;

export type HierarchyRejectCode =
  | 'PARENT_IS_PARTNER'
  | 'PARENT_INACTIVE'
  | 'SELF_PARENT'
  | 'ALREADY_AFFILIATE'
  | 'INVITE_NOT_FOUND'
  | 'INVITE_EXPIRED'
  | 'INVITE_ALREADY_USED'
  | 'EMAIL_MISMATCH'
  | 'FORGED_PARENT';

export function parseCookieValue(
  cookieHeader: string | null | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq);
    if (key !== name) continue;
    const raw = trimmed.slice(eq + 1);
    try {
      const value = decodeURIComponent(raw).trim();
      return value || null;
    } catch {
      return raw.trim() || null;
    }
  }
  return null;
}

/** Explicit partner-invite token. Ignores customer referral cookies. */
export function resolvePartnerInviteToken(input: {
  bodyToken?: unknown;
  cookieHeader?: string | null;
}): string | null {
  const fromBody =
    typeof input.bodyToken === 'string' ? input.bodyToken.trim() : '';
  if (fromBody && INVITE_TOKEN_RE.test(fromBody)) return fromBody;
  const fromCookie = parseCookieValue(input.cookieHeader, PARTNER_INVITE_COOKIE);
  if (fromCookie && INVITE_TOKEN_RE.test(fromCookie)) return fromCookie;
  return null;
}

export function canManagePartners(input: {
  parentAffiliateId: string | null;
  status: string;
}): boolean {
  return !input.parentAffiliateId && input.status === 'ACTIVE';
}

/** Parentless active affiliates may invite one partner layer. Partners may not. */
export function decideMainCanInvite(input: {
  parentAffiliateId: string | null;
  status: string;
  email: string;
  targetEmail: string;
  /** Explicit program or admin grant. A missing parent is not this grant. */
  canInviteSubs?: boolean;
}): { ok: true } | { ok: false; code: HierarchyRejectCode | 'INVITE_DISABLED' } {
  if (input.canInviteSubs === false) return { ok: false, code: 'INVITE_DISABLED' };
  if (input.parentAffiliateId) return { ok: false, code: 'PARENT_IS_PARTNER' };
  if (input.status !== 'ACTIVE') return { ok: false, code: 'PARENT_INACTIVE' };
  if (
    input.email.trim().toLowerCase() &&
    input.email.trim().toLowerCase() === input.targetEmail.trim().toLowerCase()
  ) {
    return { ok: false, code: 'SELF_PARENT' };
  }
  return { ok: true };
}

export function canManagePartner(
  actorAffiliateId: string,
  partnerParentAffiliateId: string | null,
): boolean {
  return Boolean(actorAffiliateId) && partnerParentAffiliateId === actorAffiliateId;
}

export function forgedParentRejected(
  claimedParentAffiliateId: unknown,
  sessionAffiliateId: string,
): boolean {
  if (typeof claimedParentAffiliateId !== 'string') return false;
  const claimed = claimedParentAffiliateId.trim();
  if (!claimed) return false;
  return claimed !== sessionAffiliateId;
}

export type AcceptDecision =
  | { action: 'LINK'; parentAffiliateId: string }
  | { action: 'ALREADY_LINKED'; affiliateId: string }
  | { action: 'REJECT'; code: HierarchyRejectCode };

export function decideAcceptPartnerInvite(input: {
  inviteStatus: string;
  inviteExpiresAt: Date;
  inviteEmail: string;
  inviteParentAffiliateId: string;
  parentAffiliateIdOfInviter: string | null;
  inviterStatus: string;
  inviterUserId: string;
  userId: string;
  userEmail: string;
  existingAffiliate: { id: string; parentAffiliateId: string | null } | null;
  now?: Date;
}): AcceptDecision {
  const now = input.now ?? new Date();
  if (input.inviteExpiresAt.getTime() <= now.getTime() && input.inviteStatus !== 'ACCEPTED') {
    return { action: 'REJECT', code: 'INVITE_EXPIRED' };
  }
  if (input.userEmail.trim().toLowerCase() !== input.inviteEmail.trim().toLowerCase()) {
    return { action: 'REJECT', code: 'EMAIL_MISMATCH' };
  }
  if (input.inviterUserId === input.userId) {
    return { action: 'REJECT', code: 'SELF_PARENT' };
  }
  if (input.parentAffiliateIdOfInviter) {
    return { action: 'REJECT', code: 'PARENT_IS_PARTNER' };
  }
  if (input.inviterStatus !== 'ACTIVE' && input.inviteStatus !== 'ACCEPTED') {
    return { action: 'REJECT', code: 'PARENT_INACTIVE' };
  }

  if (input.existingAffiliate) {
    if (input.existingAffiliate.parentAffiliateId === input.inviteParentAffiliateId) {
      return { action: 'ALREADY_LINKED', affiliateId: input.existingAffiliate.id };
    }
    return { action: 'REJECT', code: 'ALREADY_AFFILIATE' };
  }

  if (input.inviteStatus === 'ACCEPTED') {
    return { action: 'LINK', parentAffiliateId: input.inviteParentAffiliateId };
  }
  if (input.inviteStatus !== 'PENDING') {
    return { action: 'REJECT', code: 'INVITE_ALREADY_USED' };
  }
  return { action: 'LINK', parentAffiliateId: input.inviteParentAffiliateId };
}
