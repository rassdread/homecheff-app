import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getAccountRequirements,
  missingRequirementsForAction,
} from '../account-requirements';
import {
  isInternalApiErrorCode,
  resolveListingSaveErrorMessage,
  sanitizeApiErrorForDisplay,
  userCopyKeysForMissingRequirements,
} from './map-api-error-for-user';
import {
  parseAccountRequirementsFromApiBody,
  tryShowAccountRequirementsFromApiBody,
} from './consume-account-requirements-response';

describe('account requirements — postItem vs Stripe', () => {
  it('does not require Stripe Connect to postItem', () => {
    const snap = getAccountRequirements({
      emailVerified: new Date(),
      username: 'chef_schiedam',
      termsAccepted: true,
      stripeConnectAccountId: 'acct_incomplete',
      stripeConnectOnboardingCompleted: false,
    });
    assert.equal(snap.canPostItem, true);
    assert.equal(snap.canSell, false);
    const missing = missingRequirementsForAction('postItem', snap.missing);
    assert.equal(missing.some((m) => m.key === 'stripeOnboarding'), false);
  });

  it('blocks postItem when termsAccepted is missing', () => {
    const snap = getAccountRequirements({
      emailVerified: new Date(),
      username: 'chef_schiedam',
      termsAccepted: false,
    });
    assert.equal(snap.canPostItem, false);
    const missing = missingRequirementsForAction('postItem', snap.missing);
    assert.deepEqual(
      missing.map((m) => m.key),
      ['termsAccepted'],
    );
  });
});

describe('sanitizeApiErrorForDisplay', () => {
  it('hides ACCOUNT_REQUIREMENTS_MISSING', () => {
    assert.equal(
      sanitizeApiErrorForDisplay('ACCOUNT_REQUIREMENTS_MISSING', 'Vriendelijke fout'),
      'Vriendelijke fout',
    );
    assert.equal(isInternalApiErrorCode('ACCOUNT_REQUIREMENTS_MISSING'), true);
  });

  it('keeps human Dutch messages', () => {
    assert.equal(
      sanitizeApiErrorForDisplay('Prijs is verplicht', 'fallback'),
      'Prijs is verplicht',
    );
  });

  it('resolveListingSaveErrorMessage never returns the raw code', () => {
    const msg = resolveListingSaveErrorMessage({
      error: 'ACCOUNT_REQUIREMENTS_MISSING',
      translate: (k) => (k === 'marketplace.errors.saveFailed' ? 'Opslaan mislukt' : k),
      fallbackKey: 'marketplace.errors.saveFailed',
    });
    assert.equal(msg, 'Opslaan mislukt');
    assert.equal(msg.includes('ACCOUNT_REQUIREMENTS'), false);
  });
});

describe('userCopyKeysForMissingRequirements', () => {
  it('maps terms to actionable copy keys', () => {
    const copy = userCopyKeysForMissingRequirements([
      {
        key: 'termsAccepted',
        label: 'Accepteer de algemene voorwaarden',
        actionHref: '/profile',
      },
    ]);
    assert.ok(copy);
    assert.equal(copy!.ctaKey, 'accountRequirementsUx.termsAccepted.cta');
    assert.equal(copy!.actionHref, '/profile');
  });

  it('maps stripe to onboard action kind', () => {
    const copy = userCopyKeysForMissingRequirements([
      {
        key: 'stripeOnboarding',
        label: 'Rond je betaalaccount af',
        actionHref: '/seller/stripe/refresh',
      },
    ]);
    assert.ok(copy);
    assert.equal(copy!.actionKind, 'stripeOnboard');
    assert.equal(copy!.ctaKey, 'accountRequirementsUx.stripeOnboarding.cta');
  });
});

describe('consume-account-requirements-response', () => {
  it('parses 403 payload', () => {
    const parsed = parseAccountRequirementsFromApiBody(403, {
      error: 'ACCOUNT_REQUIREMENTS_MISSING',
      action: 'postItem',
      missing: [
        {
          key: 'termsAccepted',
          label: 'Accepteer de algemene voorwaarden',
          actionHref: '/profile',
        },
      ],
      hintKey: 'postItem_profile',
    });
    assert.ok(parsed);
    assert.equal(parsed!.missing[0].key, 'termsAccepted');
  });

  it('opens gate when called with body only (legacy MarketplaceOfferForm bug)', () => {
    let opened = false;
    const prev = globalThis.window;
    // @ts-expect-error test stub
    globalThis.window = {
      dispatchEvent: () => {
        opened = true;
        return true;
      },
    };
    try {
      const ok = tryShowAccountRequirementsFromApiBody({
        error: 'ACCOUNT_REQUIREMENTS_MISSING',
        missing: [
          {
            key: 'termsAccepted',
            label: 'Accepteer de algemene voorwaarden',
            actionHref: '/profile',
          },
        ],
      });
      assert.equal(ok, true);
      assert.equal(opened, true);
    } finally {
      // @ts-expect-error restore
      globalThis.window = prev;
    }
  });
});
