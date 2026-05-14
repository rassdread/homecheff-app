/** SessionStorage payload: soft prompt after e-mail/password registration (survives redirect). */
export const HC_PENDING_EMAIL_VERIFICATION_STORAGE_KEY = 'hc_pending_email_verification_v1';

export type PendingEmailVerificationPayload = {
  v: 1;
  email: string;
  initialSendOk: boolean;
  providerUnavailable: boolean;
};
