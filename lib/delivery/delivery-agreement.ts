/**
 * The courier checkbox opens the signup modal titled
 * deliverySignup.legalModalTitle, with sections generalTerms through
 * importantNoteText in the same i18n block. This id is that presented
 * document. It is not a privacy-policy acceptance and not a new legal text.
 */
export const DELIVERY_AGREEMENT_DOCUMENT_ID = 'i18n:deliverySignup.legalModalTitle';

export function deliveryAgreementAcceptanceData(acceptedAt: Date = new Date()) {
  return {
    deliveryAgreementAcceptedAt: acceptedAt,
    deliveryAgreementDocumentId: DELIVERY_AGREEMENT_DOCUMENT_ID,
  };
}
