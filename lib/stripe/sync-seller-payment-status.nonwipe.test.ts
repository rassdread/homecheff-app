import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  applyConnectLinkEvent,
  classifyConnectAccountRetrieve,
} from './connect-link-guard';

const LIVE_ACCOUNT = 'acct_1Sj52gRyMYBvOmov';
const SOURCE = readFileSync(new URL('./sync-seller-payment-status.ts', import.meta.url), 'utf8');

function assertStatusReadKeepsLink(input: {
  label: string;
  secretMode: 'live' | 'test';
  account?: { id: string; livemode?: boolean | null };
  errorCode?: string;
  errorType?: string;
  errorStatus?: number;
}) {
  const classification = classifyConnectAccountRetrieve({
    secretMode: input.secretMode,
    account: input.account,
    errorCode: input.errorCode,
    errorType: input.errorType,
    errorStatus: input.errorStatus,
  });
  assert.equal(
    classification.clearCanonical,
    false,
    `${input.label}: clearCanonical must stay false`,
  );
  const next = applyConnectLinkEvent(
    { accountId: LIVE_ACCOUNT },
    {
      type: 'STATUS_READ',
      observedAccountId: LIVE_ACCOUNT,
      classification,
    },
  );
  assert.equal(next.accountId, LIVE_ACCOUNT, `${input.label}: link must be kept`);
}

test('sync-seller status module never assigns stripeConnectAccountId to null', () => {
  // Only the empty-input derive path may *read* a null id; it must not write one.
  assert.equal(
    /prisma\.user\.(update|updateMany)\([\s\S]*stripeConnectAccountId\s*:\s*null/.test(SOURCE),
    false,
  );
  assert.equal(SOURCE.includes('stripeConnectAccountId: null'), true); // deriveConnectAccountStatusFromDb input only
  assert.match(
    SOURCE,
    /A status read never removes User\.stripeConnectAccountId/,
  );
  // The only DB write in this module refreshes onboardingCompleted, scoped to the same account id.
  assert.match(
    SOURCE,
    /prisma\.user\.updateMany\(\{\s*where:\s*\{\s*id:\s*params\.userId,\s*stripeConnectAccountId:\s*accountId,\s*\},\s*data:\s*\{\s*stripeConnectOnboardingCompleted:/,
  );
});

test('successful status read keeps the Connect link', () => {
  assertStatusReadKeepsLink({
    label: 'success',
    secretMode: 'live',
    account: { id: LIVE_ACCOUNT, livemode: true },
  });
});

test('temporary Stripe error keeps the Connect link', () => {
  assertStatusReadKeepsLink({
    label: 'temporary',
    secretMode: 'live',
    errorStatus: 503,
    errorType: 'StripeConnectionError',
  });
});

test('permission error keeps the Connect link', () => {
  assertStatusReadKeepsLink({
    label: 'permission',
    secretMode: 'live',
    errorStatus: 403,
    errorCode: 'permission_denied',
  });
});

test('account_invalid keeps the Connect link', () => {
  assertStatusReadKeepsLink({
    label: 'account_invalid',
    secretMode: 'live',
    errorCode: 'account_invalid',
  });
});

test('missing livemode field keeps the Connect link', () => {
  assertStatusReadKeepsLink({
    label: 'missing livemode',
    secretMode: 'live',
    account: { id: LIVE_ACCOUNT },
  });
});

test('unfindable account keeps the Connect link', () => {
  assertStatusReadKeepsLink({
    label: 'not found',
    secretMode: 'live',
    errorCode: 'resource_missing',
    errorStatus: 404,
  });
});
