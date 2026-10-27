/**
 * Canonical Stripe Connect link policy.
 *
 * A Stripe Account retrieved with the platform secret already belongs to that
 * secret's environment. Account objects do not expose livemode. A missing
 * livemode, a failed request, or an uncertain classification must never be
 * treated as permission to delete User.stripeConnectAccountId.
 *
 * Status reads are not account-replacement operations.
 */

export type ConnectSecretMode = 'test' | 'live' | 'unknown';

export type ConnectRetrieveKind =
  | 'CURRENT'
  | 'WRONG_ENVIRONMENT'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'TEMPORARY_FAILURE'
  | 'UNKNOWN';

export type ConnectRetrieveClassification = {
  kind: ConnectRetrieveKind;
  /** Status classification never authorizes deletion of the canonical link. */
  clearCanonical: false;
};

export type ConnectLinkState = {
  accountId: string | null;
};

export type ConnectLinkEvent =
  | {
      type: 'STATUS_READ';
      observedAccountId: string | null;
      classification: ConnectRetrieveClassification;
    }
  | {
      type: 'EXPLICIT_CLEAR';
      accountId: string;
      reason: 'ACCOUNT_DEAUTHORIZED' | 'ADMIN_RESET' | 'FAKE_LOCAL_PREFIX';
    };

const TEMPORARY_STATUS = new Set([408, 409, 429, 500, 502, 503, 504]);

export function classifyConnectAccountRetrieve(input: {
  secretMode: ConnectSecretMode;
  account?: { id?: string | null; livemode?: boolean | null } | null;
  errorCode?: string | null;
  errorType?: string | null;
  errorStatus?: number | null;
}): ConnectRetrieveClassification {
  const code = (input.errorCode || '').toLowerCase();
  const errorType = (input.errorType || '').toLowerCase();
  const status = input.errorStatus ?? null;

  if (code === 'resource_missing' || code === 'account_closed') {
    return { kind: 'NOT_FOUND', clearCanonical: false };
  }
  if (code === 'account_invalid') {
    return { kind: 'WRONG_ENVIRONMENT', clearCanonical: false };
  }
  if (status === 401 || status === 403 || code === 'permission_denied' || code === 'secret_key_required') {
    return { kind: 'PERMISSION_DENIED', clearCanonical: false };
  }
  if (
    (status != null && TEMPORARY_STATUS.has(status)) ||
    errorType.includes('connection') ||
    errorType.includes('timeout') ||
    code === 'rate_limit' ||
    code === 'api_error' ||
    code === 'lock_timeout'
  ) {
    return { kind: 'TEMPORARY_FAILURE', clearCanonical: false };
  }
  if (code || errorType || status != null) {
    return { kind: 'UNKNOWN', clearCanonical: false };
  }

  if (!input.account?.id) {
    return { kind: 'UNKNOWN', clearCanonical: false };
  }

  const livemode = input.account.livemode;
  if (typeof livemode === 'boolean') {
    if (input.secretMode === 'live' && livemode === false) {
      return { kind: 'WRONG_ENVIRONMENT', clearCanonical: false };
    }
    if (input.secretMode === 'test' && livemode === true) {
      return { kind: 'WRONG_ENVIRONMENT', clearCanonical: false };
    }
    if (input.secretMode === 'unknown') {
      return { kind: 'UNKNOWN', clearCanonical: false };
    }
  }

  return { kind: 'CURRENT', clearCanonical: false };
}

/** A status read keeps the stored account id. It cannot replace or erase it. */
export function applyConnectLinkEvent(
  state: ConnectLinkState,
  event: ConnectLinkEvent,
): ConnectLinkState {
  if (event.type === 'STATUS_READ') {
    return { accountId: state.accountId };
  }
  if (state.accountId && state.accountId === event.accountId) {
    return { accountId: null };
  }
  return { accountId: state.accountId };
}

export function nextAffiliateMirror(input: {
  userAccountId: string | null;
  userOnboarding: boolean;
  affiliateAccountId: string | null;
  affiliateOnboarding: boolean;
  allowClear: boolean;
}): { accountId: string | null; onboarding: boolean; write: boolean } {
  if (!input.userAccountId && !input.allowClear) {
    return {
      accountId: input.affiliateAccountId,
      onboarding: input.affiliateOnboarding,
      write: false,
    };
  }
  const accountId = input.userAccountId;
  const onboarding = input.userAccountId ? input.userOnboarding : false;
  const write =
    accountId !== input.affiliateAccountId || onboarding !== input.affiliateOnboarding;
  return { accountId, onboarding, write };
}

export type CanonicalRecoveryCandidate = {
  userId: string;
  proposedAccountId: string;
  source: 'affiliate_mirror';
  automaticMutation: false;
  conflictingAccountIds: string[];
};

/**
 * The affiliate mirror is evidence for a missing canonical pointer.
 * It is not applied automatically, and a list of older accounts is not a vote.
 */
export function identifyCanonicalRecoveryCandidate(input: {
  userId: string;
  canonicalAccountId: string | null;
  affiliateAccountId: string | null;
  historicalAccountIds?: string[];
}): CanonicalRecoveryCandidate | null {
  if (input.canonicalAccountId || !input.affiliateAccountId) return null;
  const conflicting = (input.historicalAccountIds ?? []).filter(
    (id) => id && id !== input.affiliateAccountId,
  );
  return {
    userId: input.userId,
    proposedAccountId: input.affiliateAccountId,
    source: 'affiliate_mirror',
    automaticMutation: false,
    conflictingAccountIds: [...new Set(conflicting)],
  };
}

export function selectAutomaticReplacementAccount(
  _historicalAccountIds: string[],
): null {
  return null;
}
