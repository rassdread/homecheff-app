/**
 * LEGAL-0 — Immutable Terms / Privacy document metadata.
 *
 * Change `version` / `effectiveDate` ONLY when the legal document itself is
 * deliberately revised. A normal deploy, translation, layout tweak, or
 * code refactor must not change these values.
 *
 * There was no historically defensible Terms/Privacy effective date: both
 * pages previously rendered `new Date()` on every request while showing
 * version 1.0. `2026-08-14` is the LEGAL-0 integrity correction date — not
 * a silent backdate of earlier copy.
 */

export const LEGAL_DOCUMENT_IDS = ['terms', 'privacy'] as const;
export type LegalDocumentId = (typeof LEGAL_DOCUMENT_IDS)[number];

export type LegalDocumentVersion = {
  readonly id: LegalDocumentId;
  readonly version: string;
  /** ISO calendar date (YYYY-MM-DD). Never derived from `new Date()`. */
  readonly effectiveDate: string;
};

export const TERMS_VERSION = '1.1';
export const TERMS_EFFECTIVE_DATE = '2026-08-15';

export const PRIVACY_VERSION = '1.0';
export const PRIVACY_EFFECTIVE_DATE = '2026-08-14';

export const LEGAL_DOCUMENTS = {
  terms: {
    id: 'terms',
    version: TERMS_VERSION,
    effectiveDate: TERMS_EFFECTIVE_DATE,
  },
  privacy: {
    id: 'privacy',
    version: PRIVACY_VERSION,
    effectiveDate: PRIVACY_EFFECTIVE_DATE,
  },
} as const satisfies Record<LegalDocumentId, LegalDocumentVersion>;

export function getLegalDocumentVersion(
  id: LegalDocumentId,
): LegalDocumentVersion {
  return LEGAL_DOCUMENTS[id];
}
