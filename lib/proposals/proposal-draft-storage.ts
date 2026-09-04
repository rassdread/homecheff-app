import type { ProposalFormValues } from './proposal-form-types';
import { EMPTY_PROPOSAL_FORM } from './proposal-form-types';

const STORAGE_PREFIX = 'homecheff_proposal_draft_v1:';

export type ProposalBuyerDraft = {
  version: 1;
  conversationId: string;
  form: ProposalFormValues;
  productId: string | null;
  updatedAt: string;
};

function storageKey(conversationId: string): string {
  return `${STORAGE_PREFIX}${conversationId}`;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/** True when the buyer has entered something worth keeping as a private concept. */
export function isMeaningfulProposalDraft(
  form: ProposalFormValues,
  baseline?: ProposalFormValues | null,
): boolean {
  if (baseline && JSON.stringify(form) === JSON.stringify(baseline)) {
    return false;
  }
  if (form.amountEuros.trim()) return true;
  if (form.description.trim()) return true;
  if (form.requestedDate.trim() || form.requestedTimeWindow.trim()) return true;
  if (form.fulfillmentType) return true;
  if (form.paymentPath !== 'NONE') return true;
  if (form.acceptedValueTaxonomyIds.length > 0) return true;
  if (form.requestedValueTaxonomyIds.length > 0) return true;
  if (form.barterOfferImageUrls.length > 0) return true;
  if (form.settlementMode !== 'MONEY') return true;
  if (form.quantity.trim() && form.quantity.trim() !== '1') return true;
  if (
    form.title.trim() &&
    baseline &&
    form.title.trim() !== baseline.title.trim()
  ) {
    return true;
  }
  return false;
}

export function loadProposalDraft(
  conversationId: string,
): ProposalBuyerDraft | null {
  if (!isBrowser() || !conversationId) return null;
  try {
    const raw = localStorage.getItem(storageKey(conversationId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProposalBuyerDraft;
    if (
      !parsed ||
      parsed.version !== 1 ||
      parsed.conversationId !== conversationId ||
      !parsed.form
    ) {
      return null;
    }
    return {
      version: 1,
      conversationId,
      form: { ...EMPTY_PROPOSAL_FORM, ...parsed.form },
      productId: parsed.productId ?? null,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveProposalDraft(input: {
  conversationId: string;
  form: ProposalFormValues;
  productId?: string | null;
}): ProposalBuyerDraft | null {
  if (!isBrowser() || !input.conversationId) return null;
  const draft: ProposalBuyerDraft = {
    version: 1,
    conversationId: input.conversationId,
    form: input.form,
    productId: input.productId ?? null,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(storageKey(input.conversationId), JSON.stringify(draft));
    return draft;
  } catch {
    return null;
  }
}

export function clearProposalDraft(conversationId: string): void {
  if (!isBrowser() || !conversationId) return;
  try {
    localStorage.removeItem(storageKey(conversationId));
  } catch {
    // ignore
  }
}
