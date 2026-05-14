export const HC_EMAIL_VERIFICATION_REQUIRED_EVENT = 'hc-email-verification-required-open';

export type EmailVerificationRequiredReason = 'message' | 'create' | 'checkout' | 'generic';

export type EmailVerificationRequiredDetail = {
  email: string;
  reason: EmailVerificationRequiredReason;
};
