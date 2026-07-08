/**
 * Phase 10E — backfill safety verification (pure, no DB).
 *
 * Validates proposals from proposeProductNormalization before write.
 */

import type {
  ProductNormalizationProposal,
  ProductNormalizationRecord,
} from './propose-product-normalization';

export type BackfillSafetyResult = {
  safe: boolean;
  violations: string[];
};

function violation(msg: string, violations: string[]): void {
  violations.push(msg);
}

/** Simulate record after applying proposal updates (for derived-field checks). */
export function applyProposalUpdates(
  record: ProductNormalizationRecord,
  proposal: ProductNormalizationProposal,
): ProductNormalizationRecord {
  const u = proposal.updates;
  return {
    ...record,
    marketplaceCategory: u.marketplaceCategory ?? record.marketplaceCategory,
    category: u.category ?? record.category,
    listingIntent: u.listingIntent ?? record.listingIntent,
    specializations: u.specializations ?? record.specializations,
    subcategory: u.subcategory !== undefined ? u.subcategory : record.subcategory,
    acceptedSpecializations:
      u.acceptedSpecializations ?? record.acceptedSpecializations,
    acceptHomeCheffPayment:
      u.acceptHomeCheffPayment ?? record.acceptHomeCheffPayment,
    acceptDirectContact: u.acceptDirectContact ?? record.acceptDirectContact,
  };
}

export function verifyBackfillProposalSafety(
  before: ProductNormalizationRecord,
  proposal: ProductNormalizationProposal,
): BackfillSafetyResult {
  const violations: string[] = [];
  const { updates } = proposal;

  if (updates.listingIntent === 'OFFER' && before.listingIntent === 'REQUEST') {
    violation('REQUEST must not become OFFER', violations);
  }

  if (updates.acceptedSpecializations) {
    const beforePending = before.acceptedSpecializations.filter((id) =>
      id.startsWith('pending:'),
    );
    const afterPending = updates.acceptedSpecializations.filter((id) =>
      id.startsWith('pending:'),
    );
    for (const id of beforePending) {
      if (!afterPending.includes(id)) {
        violation(`pending accepted value removed: ${id}`, violations);
      }
    }
    if (
      before.acceptedSpecializations.length > 0 &&
      updates.acceptedSpecializations.length === 0
    ) {
      violation('accepted values must not be cleared', violations);
    }
  }

  if (updates.specializations && updates.specializations.length === 0) {
    const hadSpecs =
      before.specializations.length > 0 || Boolean(before.subcategory?.trim());
    if (hadSpecs) {
      violation('specializations must not be cleared when source existed', violations);
    }
  }

  if (
    updates.acceptHomeCheffPayment === false &&
    updates.acceptDirectContact !== true &&
    before.acceptDirectContact === false &&
    before.acceptHomeCheffPayment === true &&
    String(before.orderMethod).toUpperCase() !== 'CONTACT'
  ) {
    violation(
      'settlement booleans must not become less permissive without CONTACT legacy fix',
      violations,
    );
  }

  if (proposal.unmappedSpecializations.length > 0 && updates.specializations) {
    for (const raw of proposal.unmappedSpecializations) {
      if (!updates.specializations.includes(raw)) {
        // unmapped raw strings are reported, not silently dropped from DB
        continue;
      }
    }
  }

  return { safe: violations.length === 0, violations };
}

export function verifyAllProposalsSafe(
  pairs: Array<{
    before: ProductNormalizationRecord;
    proposal: ProductNormalizationProposal;
  }>,
): BackfillSafetyResult {
  const violations: string[] = [];
  for (const { before, proposal } of pairs) {
    if (Object.keys(proposal.updates).length === 0) continue;
    const result = verifyBackfillProposalSafety(before, proposal);
    if (!result.safe) {
      for (const v of result.violations) {
        violations.push(`${proposal.productId}: ${v}`);
      }
    }
  }
  return { safe: violations.length === 0, violations };
}
