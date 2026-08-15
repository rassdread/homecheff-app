/**
 * LEGAL-4A — seller identity readiness (existing fields only).
 * Missing legally-required identifiers → COUNSEL_REQUIRED_FIELD until counsel confirms.
 */

export const IDENTITY_FIELD_KEYS = [
  'name',
  'email',
  'address',
  'country',
  'phone',
  'dateOfBirth',
  'kvk',
  'vat',
  'companyName',
  'stripeConnectAccountId',
] as const;

export type IdentityFieldKey = (typeof IDENTITY_FIELD_KEYS)[number];

/** Not collected in LEGAL-4A — never treat as available locally. */
export const COUNSEL_REQUIRED_IDENTITY_FIELDS = [
  'BSN',
  'TIN',
  'PASSPORT_OR_ID_COPY',
  'LOCAL_IBAN',
] as const;

export type IdentityReadinessInput = {
  name?: string | null;
  email?: string | null;
  address?: string | null;
  country?: string | null;
  phone?: string | null;
  dateOfBirth?: string | Date | null;
  kvk?: string | null;
  vat?: string | null;
  companyName?: string | null;
  stripeConnectAccountId?: string | null;
};

export type IdentityReadinessResult = {
  present: IdentityFieldKey[];
  missingOptional: IdentityFieldKey[];
  counselRequiredFields: readonly string[];
  completenessScore: number; // 0–1 over IDENTITY_FIELD_KEYS that we can collect
};

function present(v: unknown): boolean {
  if (v == null) return false;
  if (v instanceof Date) return !Number.isNaN(v.getTime());
  if (typeof v === 'string') return v.trim().length > 0;
  return Boolean(v);
}

export function assessIdentityReadiness(
  input: IdentityReadinessInput,
): IdentityReadinessResult {
  const checks: Record<IdentityFieldKey, boolean> = {
    name: present(input.name),
    email: present(input.email),
    address: present(input.address),
    country: present(input.country),
    phone: present(input.phone),
    dateOfBirth: present(input.dateOfBirth),
    kvk: present(input.kvk),
    vat: present(input.vat),
    companyName: present(input.companyName),
    stripeConnectAccountId: present(input.stripeConnectAccountId),
  };

  const presentKeys = IDENTITY_FIELD_KEYS.filter((k) => checks[k]);
  const missingOptional = IDENTITY_FIELD_KEYS.filter((k) => !checks[k]);
  return {
    present: presentKeys,
    missingOptional,
    counselRequiredFields: COUNSEL_REQUIRED_IDENTITY_FIELDS,
    completenessScore: presentKeys.length / IDENTITY_FIELD_KEYS.length,
  };
}
