import type { ProposalPrefillInput } from './proposal-prefill';

const STORAGE_KEY = 'homecheff_proposal_prefill_v1';

export function storeProposalPrefill(input: ProposalPrefillInput): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  } catch {
    // ignore quota / private mode
  }
}

export function consumeProposalPrefill(): ProposalPrefillInput | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProposalPrefillInput;
  } catch {
    return null;
  }
}

export function peekProposalPrefill(): ProposalPrefillInput | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProposalPrefillInput;
  } catch {
    return null;
  }
}
