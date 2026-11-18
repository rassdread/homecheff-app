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
  canPersistSignupDraft,
  companyStepComplete,
  firstIncompleteWizardStep,
  privateCredentialsReady,
  privateStepComplete,
  readDeliveryCompanySignupDraft,
  readDeliverySignupDraft,
  readSignupStep,
  resolveWizardStep,
  sanitizeDeliverySignupDraft,
  signupBackTarget,
  signupDraftOwnerAction,
  writeDeliveryCompanySignupDraft,
  writeDeliverySignupDraft,
  type CompanyWizardProgress,
  type PrivateWizardProgress,
  type SignupDraftOwner,
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
    value: { localStorage: storage, sessionStorage: storage },
    configurable: true,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: storage,
    configurable: true,
  });
}

const ada: SignupDraftOwner = { kind: 'user', userId: 'user-a' };
const bob: SignupDraftOwner = { kind: 'user', userId: 'user-b' };

function privateBase(overrides: Partial<PrivateWizardProgress> = {}): PrivateWizardProgress {
  return {
    firstStep: 1,
    name: '',
    email: '',
    password: '',
    username: '',
    accountStepCompleted: false,
    ageVerified: false,
    transportationCount: 0,
    availableDays: [],
    availableTimeSlots: [],
    preferredRadius: 5,
    maxDistance: 3,
    deliveryMode: 'FIXED',
    addressValid: false,
    acceptDeliveryAgreement: false,
    ...overrides,
  };
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
    writeDeliverySignupDraft(ada, {
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
      accountStepCompleted: true,
      address: { address: 'Hoofdstraat', houseNumber: '1', city: 'Vlaardingen', postalCode: '3131AA', country: 'NL' },
      password: 'secret12',
    } as never);
    const raw = [...memory.values()].join('\n');
    assert.equal(raw.includes('secret12'), false);
    assert.equal(raw.includes('password'), false);
    const draft = readDeliverySignupDraft(ada);
    assert.equal(draft?.availableDays.includes('maandag'), true);
    assert.equal(draft?.availableDays.includes('vrijdag'), true);
    assert.equal(draft?.bio, 'call my phone later');
    const windows = sanitizeDeliverySignupDraft({
      version: 1,
      savedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      currentStep: 6,
      availableDays: ['maandag'],
      availableTimeSlots: ['maandag@09:00-12:00', 'maandag@17:00-21:00', 'not-a-slot'],
      vehicles: [{ family: 'CAR', variant: 'HATCHBACK', features: [], carrying: [] }],
    });
    assert.deepEqual(windows?.availableTimeSlots, ['maandag@09:00-12:00', 'maandag@17:00-21:00']);
    assert.equal(windows?.vehicles[0]?.family, 'CAR');
    assert.equal(windows?.vehicles[0]?.variant, 'HATCHBACK');
  });

  it('keeps a company draft apart from a private draft and drops secrets', () => {
    installMemoryStorage();
    memory.clear();
    writeDeliverySignupDraft(ada, {
      currentStep: 4,
      flowId: 'private',
      name: 'Ada',
      email: 'ada@example.com',
      username: 'ada_courier',
      age: 29,
      transportation: ['BIKE'],
      vehicles: [],
      availableDays: ['maandag'],
      availableTimeSlots: ['morning'],
      bio: '',
      deliveryMode: 'FIXED',
      preferredRadius: 4,
      maxDistance: 4,
      acceptDeliveryAgreement: false,
      accountStepCompleted: true,
      address: { address: 'Hoofdstraat', houseNumber: '1', city: 'Vlaardingen', postalCode: '3131AA', country: 'NL' },
    });
    writeDeliveryCompanySignupDraft(ada, {
      currentStep: 2,
      flowId: 'company',
      name: 'Owner',
      email: 'owner@example.com',
      username: 'owner_co',
      companyName: 'Rotterdam Rides',
      kvkNumber: '12345678',
      vatNumber: '',
      age: 32,
      transportation: ['CAR'],
      vehicles: [],
      availableDays: ['vrijdag'],
      availableTimeSlots: ['afternoon'],
      preferredRadius: 8,
      maxDistance: 25,
      homeAddress: 'Coolsingel 40',
      acceptDeliveryAgreement: false,
      accountStepCompleted: true,
      password: 'secret12',
      contactPhone: '0612345678',
    } as never);
    const company = readDeliveryCompanySignupDraft(ada);
    const personal = readDeliverySignupDraft(ada);
    assert.equal(company?.companyName, 'Rotterdam Rides');
    assert.equal(company?.kvkNumber, '12345678');
    assert.equal(personal?.name, 'Ada');
    assert.equal(personal?.transportation.includes('CAR'), false);
    const raw = [...memory.values()].join('\n');
    assert.equal(raw.includes('secret12'), false);
    assert.equal(raw.includes('0612345678'), false);
    assert.equal(signupBackTarget(1, 1).kind, 'choice');
    assert.deepEqual(signupBackTarget(4, 3), { kind: 'step', step: 3 });
    assert.equal(readSignupStep('?step=2', 5), 2);
    assert.equal(readSignupStep('?step=9', 5), null);
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

describe('delivery signup draft owner', () => {
  it('does not show one account the draft of another, or an unowned legacy draft', () => {
    installMemoryStorage();
    memory.clear();
    writeDeliverySignupDraft(ada, {
      currentStep: 4,
      flowId: 'private',
      name: 'Ada',
      email: 'ada@example.com',
      username: 'ada_courier',
      age: 29,
      transportation: ['BIKE'],
      vehicles: [],
      availableDays: ['maandag'],
      availableTimeSlots: ['morning'],
      bio: '',
      deliveryMode: 'FIXED',
      preferredRadius: 4,
      maxDistance: 4,
      acceptDeliveryAgreement: false,
      accountStepCompleted: true,
      address: { address: 'Hoofdstraat', houseNumber: '1', city: 'Vlaardingen', postalCode: '3131AA', country: 'NL' },
    });
    memory.set(
      'hc_delivery_signup_draft_v1',
      JSON.stringify({ version: 1, name: 'Legacy', currentStep: 9, expiresAt: '2999-01-01T00:00:00.000Z' }),
    );
    assert.equal(readDeliverySignupDraft(bob), null);
    assert.equal(readDeliverySignupDraft(ada)?.name, 'Ada');
    assert.equal(readDeliveryCompanySignupDraft(ada), null);
    assert.equal([...memory.keys()].some((key) => key === 'hc_delivery_signup_draft_v1'), true);
    assert.equal(readDeliverySignupDraft(ada)?.name, 'Ada');
  });

  it('keeps a guest draft inside its own session', () => {
    installMemoryStorage();
    memory.clear();
    const guestA: SignupDraftOwner = { kind: 'guest', sessionId: 'sessionaaaa' };
    const guestB: SignupDraftOwner = { kind: 'guest', sessionId: 'sessionbbbb' };
    writeDeliverySignupDraft(guestA, {
      currentStep: 2,
      flowId: 'guest',
      name: 'Gast',
      email: 'gast@example.com',
      username: 'gast_user',
      age: 18,
      transportation: [],
      vehicles: [],
      availableDays: [],
      availableTimeSlots: [],
      bio: '',
      deliveryMode: 'FIXED',
      preferredRadius: 5,
      maxDistance: 3,
      acceptDeliveryAgreement: false,
      accountStepCompleted: false,
      address: { address: '', houseNumber: '', postalCode: '', city: '', country: 'NL', lat: null, lng: null },
    });
    assert.equal(readDeliverySignupDraft(guestB), null);
    assert.equal(readDeliverySignupDraft(guestA)?.name, 'Gast');
    assert.equal(readDeliverySignupDraft(ada), null);
  });

  it('waits during session loading and adopts a guest session only into the login that continues it', () => {
    const guest: SignupDraftOwner = { kind: 'guest', sessionId: 'sessionaaaa' };
    assert.equal(
      signupDraftOwnerAction({
        sessionStatus: 'loading',
        userId: null,
        bound: guest,
        guestSessionStartedHere: true,
      }),
      'wait',
    );
    assert.equal(
      canPersistSignupDraft({ sessionStatus: 'loading', bound: guest, active: guest }),
      false,
    );
    assert.equal(
      signupDraftOwnerAction({
        sessionStatus: 'authenticated',
        userId: 'user-a',
        bound: guest,
        guestSessionStartedHere: true,
      }),
      'adopt',
    );
    assert.equal(
      signupDraftOwnerAction({
        sessionStatus: 'authenticated',
        userId: 'user-b',
        bound: ada,
        guestSessionStartedHere: false,
      }),
      'switch',
    );
    assert.equal(
      signupDraftOwnerAction({
        sessionStatus: 'unauthenticated',
        userId: null,
        bound: ada,
        guestSessionStartedHere: false,
      }),
      'switch',
    );
  });
});

describe('delivery signup step gate', () => {
  it('sends an empty or partial draft back to the first missing step', () => {
    const empty = privateBase();
    assert.equal(resolveWizardStep(9, 1, 9, (step) => privateStepComplete(step, empty)), 1);
    const named = privateBase({ name: 'Ada', email: 'ada@example.com' });
    assert.equal(resolveWizardStep(9, 1, 9, (step) => privateStepComplete(step, named)), 2);
    const readyForVehicles = privateBase({
      name: 'Ada',
      email: 'ada@example.com',
      accountStepCompleted: true,
      ageVerified: true,
    });
    assert.equal(
      resolveWizardStep(9, 1, 9, (step) => privateStepComplete(step, readyForVehicles)),
      4,
    );
    assert.equal(privateCredentialsReady(readyForVehicles), false);
    assert.equal(
      firstIncompleteWizardStep(1, 9, (step) => privateStepComplete(step, { ...readyForVehicles, acceptDeliveryAgreement: true })),
      4,
    );
  });

  it('allows the saved step when every earlier requirement is present', () => {
    const progress = privateBase({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'secret12',
      username: 'ada_courier',
      accountStepCompleted: true,
      ageVerified: true,
      transportationCount: 1,
      availableDays: ['maandag'],
      availableTimeSlots: ['maandag@09:00-12:00'],
      addressValid: true,
      acceptDeliveryAgreement: true,
    });
    assert.equal(resolveWizardStep(9, 1, 9, (step) => privateStepComplete(step, progress)), 9);
    assert.equal(firstIncompleteWizardStep(1, 9, (step) => privateStepComplete(step, progress)), null);
    assert.equal(privateCredentialsReady(progress), true);
    const agreementOnly = privateBase({ acceptDeliveryAgreement: true, ageVerified: false });
    assert.notEqual(firstIncompleteWizardStep(1, 9, (step) => privateStepComplete(step, agreementOnly)), null);
  });

  it('keeps company requirements separate and blocks agreement-only submit', () => {
    const progress: CompanyWizardProgress = {
      firstStep: 1,
      name: '',
      email: '',
      password: '',
      username: '',
      accountStepCompleted: false,
      companyName: '',
      kvkNumber: '',
      ageVerified: false,
      transportationCount: 0,
      availableDays: [],
      availableTimeSlots: [],
      homeAddress: '',
      acceptDeliveryAgreement: true,
    };
    assert.equal(resolveWizardStep(5, 1, 5, (step) => companyStepComplete(step, progress)), 1);
    assert.notEqual(firstIncompleteWizardStep(1, 5, (step) => companyStepComplete(step, progress)), null);
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
