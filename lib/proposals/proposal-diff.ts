/**
 * Diff proposal commercial terms (for counterproposal UX).
 * Pure — no I/O.
 */

import type { ProposalDTO } from './proposal-types';
import type { ProposalFormValues } from './proposal-form-types';
import { parseProposalAmountEurosToCents } from './proposal-homecheff-eligibility';

export type ProposalDiffField =
  | 'amount'
  | 'quantity'
  | 'date'
  | 'time'
  | 'fulfillment'
  | 'message'
  | 'settlement';

export type ProposalDiffEntry = {
  field: ProposalDiffField;
  fromLabel: string;
  toLabel: string;
};

function euros(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
}

function qty(n: number | null | undefined): string {
  if (n == null) return '—';
  return String(n);
}

function dateLabel(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function normDateInput(v: string | null | undefined): string {
  if (!v) return '';
  // HTML date or ISO → YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  try {
    return new Date(v).toISOString().slice(0, 10);
  } catch {
    return v;
  }
}

/** Diff two stored proposals (parent → child counter). */
export function diffProposalTerms(
  from: ProposalDTO,
  to: ProposalDTO,
): ProposalDiffEntry[] {
  const out: ProposalDiffEntry[] = [];
  if ((from.amountCents ?? null) !== (to.amountCents ?? null)) {
    out.push({
      field: 'amount',
      fromLabel: euros(from.amountCents),
      toLabel: euros(to.amountCents),
    });
  }
  if ((from.quantity ?? null) !== (to.quantity ?? null)) {
    out.push({
      field: 'quantity',
      fromLabel: qty(from.quantity),
      toLabel: qty(to.quantity),
    });
  }
  if (normDateInput(from.requestedDate) !== normDateInput(to.requestedDate)) {
    out.push({
      field: 'date',
      fromLabel: dateLabel(from.requestedDate),
      toLabel: dateLabel(to.requestedDate),
    });
  }
  if ((from.requestedTimeWindow ?? '') !== (to.requestedTimeWindow ?? '')) {
    out.push({
      field: 'time',
      fromLabel: from.requestedTimeWindow || '—',
      toLabel: to.requestedTimeWindow || '—',
    });
  }
  if ((from.fulfillmentType ?? null) !== (to.fulfillmentType ?? null)) {
    out.push({
      field: 'fulfillment',
      fromLabel: from.fulfillmentType || '—',
      toLabel: to.fulfillmentType || '—',
    });
  }
  if ((from.description ?? '') !== (to.description ?? '')) {
    out.push({
      field: 'message',
      fromLabel: from.description?.trim() ? '…' : '—',
      toLabel: to.description?.trim() ? '…' : '—',
    });
  }
  if (from.settlementMode !== to.settlementMode) {
    out.push({
      field: 'settlement',
      fromLabel: from.settlementMode,
      toLabel: to.settlementMode,
    });
  }
  return out;
}

/** Live diff while editing a counter form against the parent proposal. */
export function diffFormAgainstProposal(
  parent: ProposalDTO,
  form: ProposalFormValues,
): ProposalDiffEntry[] {
  const out: ProposalDiffEntry[] = [];
  const amountCents = parseProposalAmountEurosToCents(form.amountEuros);
  const showMoney =
    form.settlementMode === 'MONEY' || form.settlementMode === 'MONEY_AND_VALUE';
  const nextAmount = showMoney ? amountCents : null;
  const parentAmount =
    parent.settlementMode === 'MONEY' ||
    parent.settlementMode === 'MONEY_AND_VALUE'
      ? parent.amountCents
      : null;

  if ((parentAmount ?? null) !== (nextAmount ?? null)) {
    out.push({
      field: 'amount',
      fromLabel: euros(parentAmount),
      toLabel: euros(nextAmount),
    });
  }

  const nextQty = form.quantity.trim() ? Number(form.quantity) : null;
  const parentQty = parent.quantity;
  if ((parentQty ?? null) !== (Number.isFinite(nextQty) ? nextQty : null)) {
    out.push({
      field: 'quantity',
      fromLabel: qty(parentQty),
      toLabel: qty(Number.isFinite(nextQty as number) ? nextQty : null),
    });
  }

  if (normDateInput(parent.requestedDate) !== normDateInput(form.requestedDate)) {
    out.push({
      field: 'date',
      fromLabel: dateLabel(parent.requestedDate),
      toLabel: form.requestedDate
        ? dateLabel(`${form.requestedDate}T12:00:00`)
        : '—',
    });
  }

  if ((parent.requestedTimeWindow ?? '') !== (form.requestedTimeWindow ?? '')) {
    out.push({
      field: 'time',
      fromLabel: parent.requestedTimeWindow || '—',
      toLabel: form.requestedTimeWindow || '—',
    });
  }

  if ((parent.fulfillmentType ?? '') !== (form.fulfillmentType ?? '')) {
    out.push({
      field: 'fulfillment',
      fromLabel: parent.fulfillmentType || '—',
      toLabel: form.fulfillmentType || '—',
    });
  }

  if ((parent.description ?? '') !== (form.description ?? '')) {
    out.push({
      field: 'message',
      fromLabel: parent.description?.trim() ? '…' : '—',
      toLabel: form.description?.trim() ? '…' : '—',
    });
  }

  if (parent.settlementMode !== form.settlementMode) {
    out.push({
      field: 'settlement',
      fromLabel: parent.settlementMode,
      toLabel: form.settlementMode,
    });
  }

  return out;
}
