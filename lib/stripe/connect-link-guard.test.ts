import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { isHomecheffPaymentReady } from './connect-account-status';
import {
  applyConnectLinkEvent,
  classifyConnectAccountRetrieve,
  type ConnectLinkState,
  identifyCanonicalRecoveryCandidate,
  nextAffiliateMirror,
  selectAutomaticReplacementAccount,
} from './connect-link-guard';

const LIVE_ACCOUNT = 'acct_1Sj52gRyMYBvOmov';

test('a live account without livemode keeps the canonical reference', () => {
  const classification = classifyConnectAccountRetrieve({
    secretMode: 'live',
    account: { id: LIVE_ACCOUNT },
  });
  assert.equal(classification.kind, 'CURRENT');
  assert.equal(classification.clearCanonical, false);
  const next = applyConnectLinkEvent(
    { accountId: LIVE_ACCOUNT },
    { type: 'STATUS_READ', observedAccountId: LIVE_ACCOUNT, classification },
  );
  assert.equal(next.accountId, LIVE_ACCOUNT);
});

test('a test account without livemode keeps the canonical reference', () => {
  const classification = classifyConnectAccountRetrieve({
    secretMode: 'test',
    account: { id: 'acct_test_ready' },
  });
  assert.equal(classification.kind, 'CURRENT');
  const next = applyConnectLinkEvent(
    { accountId: 'acct_test_ready' },
    { type: 'STATUS_READ', observedAccountId: 'acct_test_ready', classification },
  );
  assert.equal(next.accountId, 'acct_test_ready');
});

test('a temporary Stripe failure does not delete the reference', () => {
  const classification = classifyConnectAccountRetrieve({
    secretMode: 'live',
    errorStatus: 503,
    errorType: 'StripeConnectionError',
  });
  assert.equal(classification.kind, 'TEMPORARY_FAILURE');
  const next = applyConnectLinkEvent(
    { accountId: LIVE_ACCOUNT },
    { type: 'STATUS_READ', observedAccountId: LIVE_ACCOUNT, classification },
  );
  assert.equal(next.accountId, LIVE_ACCOUNT);
});

test('a Stripe permission error does not delete the reference', () => {
  const classification = classifyConnectAccountRetrieve({
    secretMode: 'live',
    errorStatus: 403,
    errorCode: 'permission_denied',
  });
  assert.equal(classification.kind, 'PERMISSION_DENIED');
  const next = applyConnectLinkEvent(
    { accountId: LIVE_ACCOUNT },
    { type: 'STATUS_READ', observedAccountId: LIVE_ACCOUNT, classification },
  );
  assert.equal(next.accountId, LIVE_ACCOUNT);
});

test('a confirmed missing account stays an explicit invalid state and is not cleared', () => {
  const classification = classifyConnectAccountRetrieve({
    secretMode: 'live',
    errorCode: 'resource_missing',
    errorStatus: 404,
  });
  assert.equal(classification.kind, 'NOT_FOUND');
  assert.equal(classification.clearCanonical, false);
  const next = applyConnectLinkEvent(
    { accountId: LIVE_ACCOUNT },
    { type: 'STATUS_READ', observedAccountId: LIVE_ACCOUNT, classification },
  );
  assert.equal(next.accountId, LIVE_ACCOUNT);
});

test('repeated status reads do not change a valid reference', () => {
  const classification = classifyConnectAccountRetrieve({
    secretMode: 'live',
    account: { id: LIVE_ACCOUNT },
  });
  let state: ConnectLinkState = { accountId: LIVE_ACCOUNT };
  for (let i = 0; i < 5; i += 1) {
    state = applyConnectLinkEvent(state, {
      type: 'STATUS_READ',
      observedAccountId: LIVE_ACCOUNT,
      classification,
    });
  }
  assert.equal(state.accountId, LIVE_ACCOUNT);
});

test('an agreeing affiliate mirror is not rewritten', () => {
  const mirror = nextAffiliateMirror({
    userAccountId: LIVE_ACCOUNT,
    userOnboarding: true,
    affiliateAccountId: LIVE_ACCOUNT,
    affiliateOnboarding: true,
    allowClear: false,
  });
  assert.equal(mirror.write, false);
  assert.equal(mirror.accountId, LIVE_ACCOUNT);
});

test('a missing canonical pointer with an affiliate mirror is a recovery candidate only', () => {
  const candidate = identifyCanonicalRecoveryCandidate({
    userId: '7647bf21-e9ab-4e3a-af83-eeec23e24dcb',
    canonicalAccountId: null,
    affiliateAccountId: LIVE_ACCOUNT,
  });
  assert.equal(candidate?.proposedAccountId, LIVE_ACCOUNT);
  assert.equal(candidate?.automaticMutation, false);
  const preserved = nextAffiliateMirror({
    userAccountId: null,
    userOnboarding: false,
    affiliateAccountId: LIVE_ACCOUNT,
    affiliateOnboarding: true,
    allowClear: false,
  });
  assert.equal(preserved.write, false);
  assert.equal(preserved.accountId, LIVE_ACCOUNT);
});

test('multiple historical accounts are not automatically replaced', () => {
  assert.equal(
    selectAutomaticReplacementAccount([
      'acct_1UAByR2MtOOZkjCa',
      'acct_1UEwPNRsYX6hZRHH',
      'acct_1UU2IoRsNH4cScb8',
    ]),
    null,
  );
  const candidate = identifyCanonicalRecoveryCandidate({
    userId: 'a26f0700-ade5-485d-862a-fdb303724385',
    canonicalAccountId: null,
    affiliateAccountId: 'acct_1UU2IoRsNH4cScb8',
    historicalAccountIds: ['acct_1UAByR2MtOOZkjCa', 'acct_1UEwPNRsYX6hZRHH'],
  });
  assert.deepEqual(candidate?.conflictingAccountIds, [
    'acct_1UAByR2MtOOZkjCa',
    'acct_1UEwPNRsYX6hZRHH',
  ]);
  assert.equal(candidate?.automaticMutation, false);
});

test('a status read and a deauthorization cannot erase a newer reference', () => {
  const classification = classifyConnectAccountRetrieve({
    secretMode: 'live',
    account: { id: LIVE_ACCOUNT },
  });
  const statusThenDeauth = applyConnectLinkEvent(
    applyConnectLinkEvent(
      { accountId: LIVE_ACCOUNT },
      { type: 'STATUS_READ', observedAccountId: LIVE_ACCOUNT, classification },
    ),
    { type: 'EXPLICIT_CLEAR', accountId: LIVE_ACCOUNT, reason: 'ACCOUNT_DEAUTHORIZED' },
  );
  assert.equal(statusThenDeauth.accountId, null);

  const deauthThenStaleStatus = applyConnectLinkEvent(
    { accountId: 'acct_newer' },
    { type: 'EXPLICIT_CLEAR', accountId: LIVE_ACCOUNT, reason: 'ACCOUNT_DEAUTHORIZED' },
  );
  const afterStaleRead = applyConnectLinkEvent(deauthThenStaleStatus, {
    type: 'STATUS_READ',
    observedAccountId: LIVE_ACCOUNT,
    classification,
  });
  assert.equal(afterStaleRead.accountId, 'acct_newer');
});

test('seller readiness follows verified capabilities when livemode is absent', () => {
  const classification = classifyConnectAccountRetrieve({
    secretMode: 'live',
    account: {
      id: LIVE_ACCOUNT,
      livemode: undefined,
    },
  });
  assert.equal(classification.kind, 'CURRENT');
  const ready = isHomecheffPaymentReady({
    chargesEnabled: true,
    payoutsEnabled: true,
    transfersCapability: 'active',
    disabledReason: null,
    accountType: 'express',
    dashboardType: 'express',
  });
  assert.equal(ready, true);
  const kept = applyConnectLinkEvent(
    { accountId: LIVE_ACCOUNT },
    { type: 'STATUS_READ', observedAccountId: LIVE_ACCOUNT, classification },
  );
  assert.equal(kept.accountId, LIVE_ACCOUNT);
});

test('an explicit livemode mismatch does not delete the canonical reference', () => {
  const classification = classifyConnectAccountRetrieve({
    secretMode: 'live',
    account: { id: LIVE_ACCOUNT, livemode: false },
  });
  assert.equal(classification.kind, 'WRONG_ENVIRONMENT');
  assert.equal(classification.clearCanonical, false);
  assert.equal(
    applyConnectLinkEvent(
      { accountId: LIVE_ACCOUNT },
      { type: 'STATUS_READ', observedAccountId: LIVE_ACCOUNT, classification },
    ).accountId,
    LIVE_ACCOUNT,
  );
});

test('account_invalid is a wrong-environment result and does not delete the reference', () => {
  const classification = classifyConnectAccountRetrieve({
    secretMode: 'test',
    errorCode: 'account_invalid',
    errorStatus: 403,
  });
  assert.equal(classification.kind, 'WRONG_ENVIRONMENT');
  assert.equal(
    applyConnectLinkEvent(
      { accountId: LIVE_ACCOUNT },
      { type: 'STATUS_READ', observedAccountId: LIVE_ACCOUNT, classification },
    ).accountId,
    LIVE_ACCOUNT,
  );
});

test('the status loader source does not clear the canonical account id', () => {
  const source = readFileSync(new URL('./sync-seller-payment-status.ts', import.meta.url), 'utf8');
  assert.equal(source.includes('livemode === isTestMode'), false);
  assert.equal(source.includes('stripeConnectAccountId: null,\n          stripeConnectOnboardingCompleted: false,\n          stripeConnectTrack: null'), false);
  assert.equal(source.includes('classifyConnectAccountRetrieve'), true);
  assert.equal(source.includes('stripeConnectAccountId: accountId'), true);
});

test('Gate F seller readiness is not rejected only because Account.livemode is absent', () => {
  const classification = classifyConnectAccountRetrieve({
    secretMode: 'live',
    account: { id: LIVE_ACCOUNT },
  });
  assert.equal(classification.clearCanonical, false);
  const ready = isHomecheffPaymentReady({
    chargesEnabled: true,
    payoutsEnabled: true,
    transfersCapability: 'active',
  });
  assert.equal(ready, true);
  assert.equal(
    applyConnectLinkEvent(
      { accountId: LIVE_ACCOUNT },
      { type: 'STATUS_READ', observedAccountId: LIVE_ACCOUNT, classification },
    ).accountId,
    LIVE_ACCOUNT,
  );
});
