/**
 * Browser draft for the individual delivery wizard.
 * Password and other secrets are never written.
 */
import { normalizeDeliveryWeekday } from '@/lib/delivery/delivery-time-availability';
import type { DeliveryAddressParts } from '@/lib/delivery/delivery-registration-address';

export const DELIVERY_SIGNUP_DRAFT_KEY = 'hc_delivery_signup_draft_v1';
export const DELIVERY_SIGNUP_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
  availableDays: string[];
  availableTimeSlots: string[];
  bio: string;
  deliveryMode: 'FIXED' | 'DYNAMIC';
  preferredRadius: number;
  maxDistance: number;
  address: DeliveryAddressParts;
  acceptDeliveryAgreement: boolean;
};

const SLOT_IDS = new Set(['morning', 'afternoon', 'evening']);

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
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
    ? value.availableTimeSlots.filter((slot): slot is string => typeof slot === 'string' && SLOT_IDS.has(slot))
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
      ? value.transportation.filter((item): item is string => typeof item === 'string').slice(0, 4)
      : [],
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
  };
}

export function readDeliverySignupDraft(now = Date.now()): DeliverySignupDraft | null {
  const box = storage();
  if (!box) return null;
  try {
    const parsed = JSON.parse(box.getItem(DELIVERY_SIGNUP_DRAFT_KEY) || 'null');
    const draft = sanitizeDeliverySignupDraft(parsed, now);
    if (!draft) {
      box.removeItem(DELIVERY_SIGNUP_DRAFT_KEY);
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
  draft: Omit<DeliverySignupDraft, 'version' | 'savedAt' | 'expiresAt'> & { savedAt?: string },
  now = Date.now(),
): void {
  const box = storage();
  if (!box) return;
  const saved: DeliverySignupDraft = sanitizeDeliverySignupDraft(
    {
      ...draft,
      version: 1,
      savedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + DELIVERY_SIGNUP_DRAFT_TTL_MS).toISOString(),
    },
    now - 1,
  ) as DeliverySignupDraft;
  if (draftContainsSecret(saved)) return;
  box.setItem(DELIVERY_SIGNUP_DRAFT_KEY, JSON.stringify(saved));
}

export function clearDeliverySignupDraft(): void {
  storage()?.removeItem(DELIVERY_SIGNUP_DRAFT_KEY);
}
