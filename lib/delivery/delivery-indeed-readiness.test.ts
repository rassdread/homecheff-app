/**
 * Indeed delivery-registration readiness. No database and no accounts.
 * Run: npx tsx --test lib/delivery/delivery-indeed-readiness.test.ts lib/auth/delivery-registration-return.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { resolvePostAuthIntentRedirect } from '@/lib/onboarding/pending-intent';
import { DELIVERY_DELIVERER_PERCENT, DELIVERY_PLATFORM_FEE_PERCENT } from '@/lib/fees';
import { COMMERCIAL_DELIVERY_MIN_AGE } from '@/lib/delivery/delivery-age';
import { parseAndValidateDeliverySignupFields } from '@/lib/delivery/delivery-signup-validation';
import {
  buildDeliveryRegistrationSource,
  scrubDeliveryRegion,
} from '@/lib/delivery/delivery-registration-source-record';
import { deliveryRegistrationReturnPath } from '@/lib/auth/delivery-registration-return';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('delivery registration copy', () => {
  it('removes minor-courier wording from the live dictionaries', () => {
    for (const file of ['public/i18n/nl.json', 'public/i18n/en.json']) {
      const signup = JSON.parse(read(file)).deliverySignup as Record<string, unknown>;
      const blob = JSON.stringify(signup);
      assert.equal(blob.includes('15 tot 23'), false, file);
      assert.equal(blob.includes('15 to 23'), false, file);
      assert.equal(blob.includes('16-jarige'), false, file);
      assert.equal(blob.includes('16-year-old'), false, file);
      assert.equal(blob.includes('ouders kunnen'), false, file);
      assert.equal(blob.includes('parents can track'), false, file);
      assert.match(String(signup.freeSignup), /gratis|free/i);
      assert.match(String(signup.commissionDisclosure), /\{deliverer\}/);
      assert.match(String(signup.commissionDisclosure), /\{platform\}/);
    }
  });

  it('keeps the existing 88/12 split as the disclosed numbers', () => {
    assert.equal(DELIVERY_DELIVERER_PERCENT, 88);
    assert.equal(DELIVERY_PLATFORM_FEE_PERCENT, 12);
    const notice = read('components/delivery/DeliveryRegistrationNotice.tsx');
    assert.match(notice, /DELIVERY_DELIVERER_PERCENT/);
    assert.match(notice, /DELIVERY_PLATFORM_FEE_PERCENT/);
    assert.doesNotMatch(notice, /stripe/i);
  });
});

describe('delivery registration source', () => {
  it('keeps Indeed UTM, partner type, region and date, and drops personal data', () => {
    const record = buildDeliveryRegistrationSource({
      capture: {
        utm_source: 'indeed',
        utm_medium: 'paid_job',
        utm_campaign: 'delivery_recruitment_2026',
        utm_content: 'rotterdam',
        landing_path: '/delivery/start',
        captured_at: '2026-10-13T10:00:00.000Z',
      },
      providerType: 'INDEPENDENT',
      deliveryRegion: scrubDeliveryRegion('Rotterdam'),
      registeredAt: '2026-10-13T10:05:00.000Z',
    });
    assert.equal(record.utm_source, 'indeed');
    assert.equal(record.utm_medium, 'paid_job');
    assert.equal(record.utm_campaign, 'delivery_recruitment_2026');
    assert.equal(record.utm_content, 'rotterdam');
    assert.equal(record.provider_type, 'INDEPENDENT');
    assert.equal(record.delivery_region, 'Rotterdam');
    assert.equal(record.registered_at, '2026-10-13T10:05:00.000Z');
    assert.equal(JSON.stringify(record).includes('@'), false);
  });

  it('stores a business signup without inventing a source or a street address', () => {
    const record = buildDeliveryRegistrationSource({
      capture: null,
      providerType: 'DELIVERY_BUSINESS',
      deliveryRegion: scrubDeliveryRegion('Coolsingel 12, Rotterdam'),
      registeredAt: '2026-10-13T10:05:00.000Z',
    });
    assert.equal(record.provider_type, 'DELIVERY_BUSINESS');
    assert.equal(record.utm_source, undefined);
    assert.equal(record.delivery_region, undefined);
    assert.equal(scrubDeliveryRegion('jan@example.com'), null);
    assert.equal(scrubDeliveryRegion('Almere'), 'Almere');
  });

  it('does not touch affiliate attribution', () => {
    const source = read('lib/delivery/delivery-registration-source.ts');
    assert.doesNotMatch(source, /processAttributionOnSignup/);
    assert.doesNotMatch(source, /getAffiliateIdFromCookie/);
    assert.match(source, /upsertMarketplaceAcquisitionFirstTouch/);
    assert.match(source, /findFirst/);
    const route = read('app/api/delivery/signup/route.ts');
    assert.match(route, /processAttributionOnSignup/);
    assert.match(route, /persistDeliveryRegistrationSource/);
    assert.doesNotMatch(source, /indeed\.com/);
  });
});

describe('existing user return and age gate', () => {
  it('returns to the delivery signup after profile completion', () => {
    const returnPath = deliveryRegistrationReturnPath(
      '/delivery/start',
      'utm_source=indeed&utm_medium=paid_job&utm_campaign=delivery_recruitment_2026&email=a@b.nl',
    );
    assert.equal(
      returnPath,
      '/delivery/start?utm_source=indeed&utm_medium=paid_job&utm_campaign=delivery_recruitment_2026',
    );
    const intent = {
      type: 'complete_profile' as const,
      returnPath: returnPath!,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
    assert.equal(
      resolvePostAuthIntentRedirect(
        { username: 'temp_user', socialOnboardingCompleted: false },
        intent,
      ),
      null,
    );
    assert.equal(
      resolvePostAuthIntentRedirect(
        { username: 'courier_ada', socialOnboardingCompleted: true },
        intent,
      ),
      returnPath,
    );
  });

  it('still blocks under-18 commercial signup', () => {
    assert.equal(COMMERCIAL_DELIVERY_MIN_AGE, 18);
    const result = parseAndValidateDeliverySignupFields(
      {
        name: 'Teen',
        email: 'teen@example.com',
        password: 'secret12',
        username: 'teen_user',
        age: 16,
        transportation: ['BIKE'],
        acceptDeliveryAgreement: true,
      },
      { requireAccountFields: true },
    );
    assert.equal(result.ok, false);
    if (result.ok || result.result.ok) return;
    assert.equal(result.result.code, 'UNDERAGE');
  });
});

describe('mobile registration layout', () => {
  it('fits all 9 steps and clears the cookie bar on the signup pages', () => {
    const signup = read('app/delivery/signup/page.tsx');
    assert.match(signup, /w-screen max-w-\[100vw\]/);
    assert.match(signup, /grid-cols-9/);
    assert.doesNotMatch(signup, /sticky bottom-/);
    assert.doesNotMatch(signup, /w-12 h-1/);
    assert.match(signup, /pb-\[calc\(8rem\+env\(safe-area-inset-bottom,0px\)\)\]/);
    assert.match(signup, /DeliveryRegistrationNotice/);
    assert.doesNotMatch(signup, /sticky /);
    const company = read('app/delivery/company/signup/page.tsx');
    assert.doesNotMatch(company, /sticky /);
    const start = read('app/delivery/start/page.tsx');
    assert.match(company, /w-screen max-w-\[100vw\]/);
    assert.match(company, /pb-\[calc\(8rem\+env\(safe-area-inset-bottom,0px\)\)\]/);
    assert.match(start, /w-screen max-w-\[100vw\]/);
    assert.match(start, /pb-\[calc\(8rem\+env\(safe-area-inset-bottom,0px\)\)\]/);
    const banner = read('components/PrivacyNotice.tsx');
    assert.match(banner, /isBottomNavigationHidden/);
    assert.match(banner, /bottom-0/);
    const gate = read('components/auth/AuthCompletionGate.tsx');
    assert.match(gate, /savePendingIntent/);
    assert.match(gate, /deliveryRegistrationReturnPath/);
    assert.match(gate, /replaceOnce\('\/onboarding\/complete-profile'\)/);
  });
});
