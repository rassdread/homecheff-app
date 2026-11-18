/**
 * Browser draft for the individual delivery wizard.
 * Password and other secrets are never written.
 */
import { normalizeDeliveryWeekday } from '@/lib/delivery/delivery-time-availability';
import { parseCourierVehicles, type CourierVehicle } from '@/lib/delivery/courier-vehicles';
import type { DeliveryAddressParts } from '@/lib/delivery/delivery-registration-address';
import { scheduleReady } from '@/lib/delivery/day-schedule';

export const DELIVERY_SIGNUP_DRAFT_KEY = 'hc_delivery_signup_draft_v1';
export const DELIVERY_COMPANY_SIGNUP_DRAFT_KEY = 'hc_delivery_company_signup_draft_v1';
const GUEST_SESSION_KEY = 'hc_delivery_signup_guest_session';

/** Logged-in drafts are keyed by user id. Guest drafts stay in the tab session. */
export type SignupDraftOwner =
  | { kind: 'guest'; sessionId: string }
  | { kind: 'user'; userId: string };
export const DELIVERY_SIGNUP_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const DELIVERY_TYPE_CHOICE_HREF = '/delivery/start';
export const DELIVERY_SIGNUP_LEAVE_HREF = '/';

export type DeliverySignupDraft = {
  version: 1;
  savedAt: string;
  expiresAt: string;
  currentStep: number;
  flowId: string;
  name: string;
  email: string;
  username: string;
  age: number;
  transportation: string[];
  vehicles: CourierVehicle[];
  availableDays: string[];
  availableTimeSlots: string[];
  bio: string;
  deliveryMode: 'FIXED' | 'DYNAMIC';
  preferredRadius: number;
  maxDistance: number;
  address: DeliveryAddressParts;
  acceptDeliveryAgreement: boolean;
  /** Step 2 was completed in this draft. The password itself is never stored. */
  accountStepCompleted: boolean;
};

const SLOT_IDS = new Set(['morning', 'afternoon', 'evening']);
const DAY_WINDOW_SLOT =
  /^(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)@\d{2}:\d{2}-\d{2}:\d{2}$/;

function storageOf(kind: 'local' | 'session'): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

function ownerToken(owner: SignupDraftOwner): string {
  return owner.kind === 'guest' ? owner.sessionId : owner.userId;
}

function sameOwner(left: SignupDraftOwner, right: SignupDraftOwner): boolean {
  return left.kind === right.kind && ownerToken(left) === ownerToken(right);
}

export function signupDraftStorageKey(base: string, owner: SignupDraftOwner): string {
  return `${base}:v2:${owner.kind}:${encodeURIComponent(ownerToken(owner))}`;
}

function boxFor(owner: SignupDraftOwner): Storage | null {
  return storageOf(owner.kind === 'guest' ? 'session' : 'local');
}

export function readGuestSignupSessionId(): string | null {
  const box = storageOf('session');
  if (!box) return null;
  const existing = box.getItem(GUEST_SESSION_KEY);
  if (existing && /^[A-Za-z0-9_-]{8,80}$/.test(existing)) return existing;
  return null;
}

export function ensureGuestSignupSessionId(): string | null {
  const box = storageOf('session');
  if (!box) return null;
  const existing = readGuestSignupSessionId();
  if (existing) return existing;
  const created = newDeliveryFlowId().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);
  if (created.length < 8) return null;
  box.setItem(GUEST_SESSION_KEY, created);
  return created;
}

export function signupDraftOwnerAction(input: {
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
  userId: string | null;
  bound: SignupDraftOwner | null;
  guestSessionStartedHere: boolean;
}): 'wait' | 'keep' | 'adopt' | 'switch' {
  if (input.sessionStatus === 'loading') return 'wait';
  if (input.sessionStatus === 'authenticated' && !input.userId) return 'wait';
  const next: SignupDraftOwner | null =
    input.sessionStatus === 'authenticated'
      ? { kind: 'user', userId: input.userId || '' }
      : input.bound?.kind === 'guest'
        ? input.bound
        : null;
  if (!input.bound) return 'switch';
  if (next && sameOwner(input.bound, next)) return 'keep';
  if (
    input.guestSessionStartedHere &&
    input.bound.kind === 'guest' &&
    input.sessionStatus === 'authenticated' &&
    input.userId
  ) {
    return 'adopt';
  }
  return 'switch';
}

export function canPersistSignupDraft(input: {
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
  bound: SignupDraftOwner | null;
  active: SignupDraftOwner | null;
}): boolean {
  if (input.sessionStatus === 'loading') return false;
  if (!input.bound || !input.active) return false;
  if (input.sessionStatus === 'authenticated') {
    return input.active.kind === 'user' && sameOwner(input.bound, input.active);
  }
  return input.active.kind === 'guest' && sameOwner(input.bound, input.active);
}

export function newDeliveryFlowId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `flow_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function asString(value: unknown, max = 200): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export function sanitizeDeliverySignupDraft(raw: unknown, now = Date.now()): DeliverySignupDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<DeliverySignupDraft>;
  const expiresAt = Date.parse(typeof value.expiresAt === 'string' ? value.expiresAt : '');
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return null;
  const step = Number(value.currentStep);
  const address = value.address && typeof value.address === 'object' ? value.address : {};
  const days = Array.isArray(value.availableDays)
    ? value.availableDays
        .map((day) => (typeof day === 'string' ? normalizeDeliveryWeekday(day) : null))
        .filter((day): day is string => Boolean(day))
    : [];
  const slots = Array.isArray(value.availableTimeSlots)
    ? value.availableTimeSlots.filter(
        (slot): slot is string =>
          typeof slot === 'string' &&
          (SLOT_IDS.has(slot) || DAY_WINDOW_SLOT.test(slot.trim().toLowerCase())),
      )
    : [];
  const mode = value.deliveryMode === 'DYNAMIC' ? 'DYNAMIC' : 'FIXED';
  return {
    version: 1,
    savedAt: asString(value.savedAt, 40) || new Date(now).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    currentStep: Number.isFinite(step) ? Math.min(9, Math.max(1, Math.round(step))) : 1,
    flowId: asString(value.flowId, 80) || newDeliveryFlowId(),
    name: asString(value.name, 120),
    email: asString(value.email, 180),
    username: asString(value.username, 40),
    age: Number.isFinite(Number(value.age)) ? Number(value.age) : 18,
    transportation: Array.isArray(value.transportation)
      ? value.transportation.filter((item): item is string => typeof item === 'string').slice(0, 8)
      : [],
    vehicles: parseCourierVehicles((value as { vehicles?: unknown }).vehicles) || [],
    availableDays: days,
    availableTimeSlots: slots,
    bio: asString(value.bio, 2000),
    deliveryMode: mode,
    preferredRadius: Number.isFinite(Number(value.preferredRadius)) ? Number(value.preferredRadius) : 5,
    maxDistance: Number.isFinite(Number(value.maxDistance)) ? Number(value.maxDistance) : 3,
    address: {
      address: asString(address.address, 200),
      houseNumber: asString(address.houseNumber, 20),
      postalCode: asString(address.postalCode, 20),
      city: asString(address.city, 80),
      country: asString(address.country, 8) || 'NL',
      lat: typeof address.lat === 'number' ? address.lat : null,
      lng: typeof address.lng === 'number' ? address.lng : null,
    },
    acceptDeliveryAgreement: value.acceptDeliveryAgreement === true,
    accountStepCompleted: value.accountStepCompleted === true,
  };
}

function draftMatchesOwner(raw: unknown, owner: SignupDraftOwner): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const value = raw as { ownerKind?: unknown; ownerId?: unknown };
  return value.ownerKind === owner.kind && value.ownerId === ownerToken(owner);
}

export function readDeliverySignupDraft(
  owner: SignupDraftOwner,
  now = Date.now(),
): DeliverySignupDraft | null {
  const box = boxFor(owner);
  if (!box) return null;
  const key = signupDraftStorageKey(DELIVERY_SIGNUP_DRAFT_KEY, owner);
  try {
    const parsed = JSON.parse(box.getItem(key) || 'null');
    if (!draftMatchesOwner(parsed, owner)) return null;
    const draft = sanitizeDeliverySignupDraft(parsed, now);
    if (!draft) {
      box.removeItem(key);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function draftContainsSecret(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (/^(password|dateofbirth|phonenumber|contactphone)$/i.test(key)) return true;
    if (draftContainsSecret(child)) return true;
  }
  return false;
}

export function writeDeliverySignupDraft(
  owner: SignupDraftOwner,
  draft: Omit<DeliverySignupDraft, 'version' | 'savedAt' | 'expiresAt'> & { savedAt?: string },
  now = Date.now(),
): void {
  const box = boxFor(owner);
  if (!box) return;
  const saved = sanitizeDeliverySignupDraft(
    {
      ...draft,
      version: 1,
      savedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + DELIVERY_SIGNUP_DRAFT_TTL_MS).toISOString(),
    },
    now - 1,
  );
  if (!saved || draftContainsSecret(saved)) return;
  box.setItem(
    signupDraftStorageKey(DELIVERY_SIGNUP_DRAFT_KEY, owner),
    JSON.stringify({ ...saved, ownerKind: owner.kind, ownerId: ownerToken(owner) }),
  );
}

export function clearDeliverySignupDraft(owner: SignupDraftOwner): void {
  boxFor(owner)?.removeItem(signupDraftStorageKey(DELIVERY_SIGNUP_DRAFT_KEY, owner));
}

export type DeliveryCompanySignupDraft = {
  version: 1;
  savedAt: string;
  expiresAt: string;
  currentStep: number;
  flowId: string;
  name: string;
  email: string;
  username: string;
  companyName: string;
  kvkNumber: string;
  vatNumber: string;
  age: number;
  transportation: string[];
  vehicles: CourierVehicle[];
  availableDays: string[];
  availableTimeSlots: string[];
  preferredRadius: number;
  maxDistance: number;
  homeAddress: string;
  acceptDeliveryAgreement: boolean;
  /** Step 1 was completed in this draft. The password itself is never stored. */
  accountStepCompleted: boolean;
};

export function sanitizeDeliveryCompanySignupDraft(
  raw: unknown,
  now = Date.now(),
): DeliveryCompanySignupDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<DeliveryCompanySignupDraft>;
  const expiresAt = Date.parse(typeof value.expiresAt === 'string' ? value.expiresAt : '');
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return null;
  const step = Number(value.currentStep);
  const days = Array.isArray(value.availableDays)
    ? value.availableDays
        .map((day) => (typeof day === 'string' ? normalizeDeliveryWeekday(day) : null))
        .filter((day): day is string => Boolean(day))
    : [];
  const slots = Array.isArray(value.availableTimeSlots)
    ? value.availableTimeSlots.filter((slot): slot is string => typeof slot === 'string' && SLOT_IDS.has(slot))
    : [];
  return {
    version: 1,
    savedAt: asString(value.savedAt, 40) || new Date(now).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    currentStep: Number.isFinite(step) ? Math.min(5, Math.max(1, Math.round(step))) : 1,
    flowId: asString(value.flowId, 80) || newDeliveryFlowId(),
    name: asString(value.name, 120),
    email: asString(value.email, 180),
    username: asString(value.username, 40),
    companyName: asString(value.companyName, 160),
    kvkNumber: asString(value.kvkNumber, 16),
    vatNumber: asString(value.vatNumber, 24),
    age: Number.isFinite(Number(value.age)) ? Number(value.age) : 18,
    transportation: Array.isArray(value.transportation)
      ? value.transportation.filter((item): item is string => typeof item === 'string').slice(0, 8)
      : [],
    vehicles: parseCourierVehicles((value as { vehicles?: unknown }).vehicles) || [],
    availableDays: days,
    availableTimeSlots: slots,
    preferredRadius: Number.isFinite(Number(value.preferredRadius)) ? Number(value.preferredRadius) : 10,
    maxDistance: Number.isFinite(Number(value.maxDistance)) ? Number(value.maxDistance) : 0,
    homeAddress: asString(value.homeAddress, 240),
    acceptDeliveryAgreement: value.acceptDeliveryAgreement === true,
    accountStepCompleted: value.accountStepCompleted === true,
  };
}

export function readDeliveryCompanySignupDraft(
  owner: SignupDraftOwner,
  now = Date.now(),
): DeliveryCompanySignupDraft | null {
  const box = boxFor(owner);
  if (!box) return null;
  const key = signupDraftStorageKey(DELIVERY_COMPANY_SIGNUP_DRAFT_KEY, owner);
  try {
    const parsed = JSON.parse(box.getItem(key) || 'null');
    if (!draftMatchesOwner(parsed, owner)) return null;
    const draft = sanitizeDeliveryCompanySignupDraft(parsed, now);
    if (!draft) {
      box.removeItem(key);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function writeDeliveryCompanySignupDraft(
  owner: SignupDraftOwner,
  draft: Omit<DeliveryCompanySignupDraft, 'version' | 'savedAt' | 'expiresAt'> & {
    savedAt?: string;
  },
  now = Date.now(),
): void {
  const box = boxFor(owner);
  if (!box) return;
  const saved = sanitizeDeliveryCompanySignupDraft(
    {
      ...draft,
      version: 1,
      savedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + DELIVERY_SIGNUP_DRAFT_TTL_MS).toISOString(),
    },
    now - 1,
  );
  if (!saved || draftContainsSecret(saved)) return;
  box.setItem(
    signupDraftStorageKey(DELIVERY_COMPANY_SIGNUP_DRAFT_KEY, owner),
    JSON.stringify({ ...saved, ownerKind: owner.kind, ownerId: ownerToken(owner) }),
  );
}

export function clearDeliveryCompanySignupDraft(owner: SignupDraftOwner): void {
  boxFor(owner)?.removeItem(signupDraftStorageKey(DELIVERY_COMPANY_SIGNUP_DRAFT_KEY, owner));
}

/** Back stays inside the wizard until the first step, which returns to the type choice. */
export function signupBackTarget(
  current: number,
  first: number,
): { kind: 'step'; step: number } | { kind: 'choice' } {
  if (current > first) return { kind: 'step', step: current - 1 };
  return { kind: 'choice' };
}

export function readSignupStep(search: string, maxStep: number): number | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const raw = params.get('step');
  if (raw == null || raw === '') return null;
  const step = Number(raw);
  if (!Number.isInteger(step) || step < 1 || step > maxStep) return null;
  return step;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export type PrivateWizardProgress = {
  firstStep: number;
  name: string;
  email: string;
  password: string;
  username: string;
  accountStepCompleted: boolean;
  ageVerified: boolean;
  transportationCount: number;
  availableDays: string[];
  availableTimeSlots: string[];
  preferredRadius: number;
  maxDistance: number;
  deliveryMode: string;
  addressValid: boolean;
  acceptDeliveryAgreement: boolean;
};

export type CompanyWizardProgress = {
  firstStep: number;
  name: string;
  email: string;
  password: string;
  username: string;
  accountStepCompleted: boolean;
  companyName: string;
  kvkNumber: string;
  ageVerified: boolean;
  transportationCount: number;
  availableDays: string[];
  availableTimeSlots: string[];
  homeAddress: string;
  acceptDeliveryAgreement: boolean;
};

export function privateStepComplete(step: number, progress: PrivateWizardProgress): boolean {
  switch (step) {
    case 1:
      return progress.name.trim().length > 0 && progress.email.includes('@');
    case 2:
      if (progress.firstStep > 2) return true;
      if (progress.accountStepCompleted) return true;
      return progress.password.length >= 6 && USERNAME_PATTERN.test(progress.username.trim());
    case 3:
      return progress.ageVerified;
    case 4:
      return progress.transportationCount > 0;
    case 5:
      return progress.availableDays.length > 0;
    case 6:
      return scheduleReady(progress.availableDays, progress.availableTimeSlots);
    case 7:
      return (
        progress.preferredRadius > 0 &&
        progress.maxDistance > 0 &&
        Boolean(progress.deliveryMode) &&
        progress.addressValid
      );
    case 8:
      return true;
    case 9:
      return progress.acceptDeliveryAgreement && progress.ageVerified;
    default:
      return false;
  }
}

export function companyStepComplete(step: number, progress: CompanyWizardProgress): boolean {
  switch (step) {
    case 1:
      if (progress.firstStep > 1) return true;
      if (progress.accountStepCompleted) return true;
      return (
        progress.name.trim().length > 1 &&
        progress.email.includes('@') &&
        progress.password.length >= 6 &&
        USERNAME_PATTERN.test(progress.username.trim())
      );
    case 2:
      return progress.companyName.trim().length > 1 && /^\d{8}$/.test(progress.kvkNumber.replace(/\s+/g, ''));
    case 3:
      return progress.ageVerified && progress.transportationCount > 0;
    case 4:
      return scheduleReady(progress.availableDays, progress.availableTimeSlots) && progress.homeAddress.trim().length > 3;
    case 5:
      return progress.acceptDeliveryAgreement && progress.ageVerified;
    default:
      return false;
  }
}

/** A requested step is only a navigation target. Earlier gaps stay blocking. */
export function resolveWizardStep(
  requested: number,
  firstStep: number,
  maxStep: number,
  isComplete: (step: number) => boolean,
): number {
  const target = Math.min(maxStep, Math.max(firstStep, Math.round(requested) || firstStep));
  for (let step = firstStep; step < target; step += 1) {
    if (!isComplete(step)) return step;
  }
  return target;
}

export function firstIncompleteWizardStep(
  firstStep: number,
  maxStep: number,
  isComplete: (step: number) => boolean,
): number | null {
  for (let step = firstStep; step <= maxStep; step += 1) {
    if (!isComplete(step)) return step;
  }
  return null;
}

export function privateCredentialsReady(progress: PrivateWizardProgress): boolean {
  if (progress.firstStep > 1) return true;
  return progress.password.length >= 6 && USERNAME_PATTERN.test(progress.username.trim());
}

export function companyCredentialsReady(progress: CompanyWizardProgress): boolean {
  if (progress.firstStep > 1) return true;
  return (
    progress.name.trim().length > 1 &&
    progress.email.includes('@') &&
    progress.password.length >= 6 &&
    USERNAME_PATTERN.test(progress.username.trim())
  );
}
