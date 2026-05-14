import type { MissingRequirement } from '@/lib/account-requirements';

export const ACCOUNT_REQUIREMENTS_OPEN_EVENT = 'hc-account-requirements-open';

export type OpenAccountRequirementsGateDetail = {
  missing: MissingRequirement[];
};

export function openAccountRequirementsGate(detail: OpenAccountRequirementsGateDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(ACCOUNT_REQUIREMENTS_OPEN_EVENT, { detail })
  );
}
