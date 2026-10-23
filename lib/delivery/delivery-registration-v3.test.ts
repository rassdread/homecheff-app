/**
 * Delivery registration V3: address, draft, funnel, routing, role.
 * Run: npx tsx --test lib/delivery/delivery-registration-v3.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deliveryGuestAuthHrefs, preserveAccountRoleOnDeliveryProfile } from '@/lib/auth/delivery-guest-auth';
import {
  composeDeliveryHomeAddress,
  prefillDeliveryAddress,
  validateDeliveryAddressParts,
} from '@/lib/delivery/delivery-registration-address';
import {
  readDeliverySignupDraft,
  sanitizeDeliverySignupDraft,
  writeDeliverySignupDraft,
} from '@/lib/delivery/delivery-signup-draft';
import { scrubDeliveryFunnelMetadata } from '@/lib/delivery/delivery-signup-funnel';
import { parseAndValidateDeliverySignupFields } from '@/lib/delivery/delivery-signup-validation';

const memory = new Map<string, string>();

function installMemoryStorage() {
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
  };
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage: storage },
    configurable: true,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
  });
}

describe('delivery registration address', () => {
  it('requires Dutch street, house number, postcode and city', () => {
    const errors = validateDeliveryAddressParts({
      address: 'Coolsingel',
      city: 'Rotterdam',
      country: 'NL',
      postalCode: '3011',
      houseNumber: '',
    });
    assert.deepEqual(errors.sort(), ['houseNumber', 'postalCode']);
  });

  it('accepts a manual Dutch address and composes one line', () => {
    const parts = {
      address: 'Coolsingel',
      houseNumber: '40',
      postalCode: '3011 ad',
      city: 'Rotterdam',
      country: 'NL',
    };
    assert.deepEqual(validateDeliveryAddressParts(parts), []);
    assert.equal(composeDeliveryHomeAddress(parts), 'Coolsingel 40, 3011AD Rotterdam');
  });

  it('keeps an existing house number when prefilling', () => {
    const prefilled = prefillDeliveryAddress({
      address: 'Coolsingel 40',
      postalCode: '3011AD',
      city: 'Rotterdam',
      country: 'NL',
      houseNumber: '40',
    });
    assert.equal(prefilled.houseNumber, '40');
    assert.equal(prefilled.address, 'Coolsingel');
  });
});

describe('delivery registration server address', () => {
  it('rejects a Dutch signup that is missing a house number', () => {
    const result = parseAndValidateDeliverySignupFields({
      name: 'Courier',
      email: 'courier@example.com',
      password: 'secret12',
      username: 'courier_rotterdam',
      age: 28,
      transportation: ['CAR'],
      acceptDeliveryAgreement: true,
      addressCountry: 'NL',
      street: 'Coolsingel',
      city: 'Rotterdam',
      postalCode: '3011AD',
      homeAddress: 'Coolsingel, Rotterdam',
    }, { requireAccountFields: true });
    assert.equal(result.ok, false);
    if (result.ok || result.result.ok) return;
    assert.equal(result.result.fieldErrors?.houseNumber, 'Vul je huisnummer in.');
  });

  it('accepts a company signup that only sends a home address line', () => {
    const result = parseAndValidateDeliverySignupFields({
      name: 'Owner',
      email: 'owner@example.com',
      password: 'secret12',
      username: 'owner_company',
      age: 32,
      transportation: ['CAR'],
      acceptDeliveryAgreement: true,
      providerType: 'DELIVERY_BUSINESS',
      companyName: 'Rotterdam Rides',
      kvkNumber: '12345678',
      preferredRadius: 10,
      maxDistance: 25,
      homeAddress: 'Coolsingel 40, Rotterdam',
    }, { requireAccountFields: true });
    assert.equal(result.ok, true);
  });
});

describe('delivery signup draft', () => {
  it('stores the wizard and drops a password field', () => {
    installMemoryStorage();
    memory.clear();
    writeDeliverySignupDraft({
      currentStep: 5,
      flowId: 'flow-test',
      name: 'Ada',
      email: 'ada@example.com',
      username: 'ada_courier',
      age: 29,
      transportation: ['BIKE'],
      availableDays: ['Monday', 'vrijdag'],
      availableTimeSlots: ['evening'],
      bio: 'call my phone later',
      deliveryMode: 'FIXED',
      preferredRadius: 4,
      maxDistance: 4,
      acceptDeliveryAgreement: false,
      address: { address: 'Hoofdstraat', houseNumber: '1', city: 'Vlaardingen', postalCode: '3131AA', country: 'NL' },
      password: 'secret12',
    } as never);
    const raw = memory.get('hc_delivery_signup_draft_v1') || '';
    assert.equal(raw.includes('secret12'), false);
    assert.equal(raw.includes('password'), false);
    const draft = readDeliverySignupDraft();
    assert.equal(draft?.availableDays.includes('maandag'), true);
    assert.equal(draft?.availableDays.includes('vrijdag'), true);
    assert.equal(draft?.bio, 'call my phone later');
  });

  it('expires a draft after seven days', () => {
    const now = Date.parse('2026-10-16T08:00:00.000Z');
    const expired = sanitizeDeliverySignupDraft(
      {
        version: 1,
        savedAt: '2026-10-01T08:00:00.000Z',
        expiresAt: '2026-10-08T08:00:00.000Z',
        currentStep: 4,
        flowId: 'old',
      },
      now
    );
    assert.equal(expired, null);
  });
});

describe('delivery signup funnel', () => {
  it('drops personal fields and keeps step, type, language and campaign', () => {
    const clean = scrubDeliveryFunnelMetadata({
      step: 7,
      registrationType: 'new_user',
      language: 'nl',
      flowId: 'flow-1',
      utm_source: 'indeed',
      utm_campaign: 'delivery_recruitment_2026',
      email: 'person@example.com',
      name: 'Hicham',
      address: 'Coolsingel 40',
      password: 'secret',
      dateOfBirth: '1990-01-01',
      phone: '0612345678',
    });
    assert.equal(clean.step, 7);
    assert.equal(clean.utm_source, 'indeed');
    assert.equal('email' in clean, false);
    assert.equal('name' in clean, false);
    assert.equal('address' in clean, false);
    assert.equal('password' in clean, false);
    assert.equal(JSON.stringify(clean).includes('@'), false);
  });
});

describe('delivery guest routing', () => {
  it('keeps an Indeed visitor on delivery signup with the campaign query', () => {
    const hrefs = deliveryGuestAuthHrefs(
      '/delivery/start',
      'utm_source=indeed&utm_medium=paid_job&utm_campaign=delivery_recruitment_2026&utm_content=rotterdam'
    );
    assert.equal(
      hrefs?.register,
      '/delivery/signup?utm_source=indeed&utm_medium=paid_job&utm_campaign=delivery_recruitment_2026&utm_content=rotterdam'
    );
    assert.match(hrefs?.login || '', /^\/login\?callbackUrl=/);
    assert.match(decodeURIComponent(hrefs?.login || ''), /utm_source=indeed/);
  });

  it('does not change an existing account role', () => {
    assert.equal(preserveAccountRoleOnDeliveryProfile('BUYER'), 'BUYER');
    assert.equal(preserveAccountRoleOnDeliveryProfile('SELLER'), 'SELLER');
    assert.equal(preserveAccountRoleOnDeliveryProfile('DELIVERY'), 'DELIVERY');
  });
});
