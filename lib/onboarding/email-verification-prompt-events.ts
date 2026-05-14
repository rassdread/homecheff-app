export const HC_EMAIL_VERIFICATION_REQUIRED_EVENT = 'hc-email-verification-required-open';

export type EmailVerificationRequiredReason = 'message' | 'create' | 'checkout' | 'generic';

export type EmailVerificationRequiredDetail = {
  email: string;
  reason: EmailVerificationRequiredReason;
  /** false wanneer registratie geen mail kon sturen */
  initialSendOk?: boolean;
  /** true wanneer provider/config faalde bij signup */
  providerUnavailable?: boolean;
};
