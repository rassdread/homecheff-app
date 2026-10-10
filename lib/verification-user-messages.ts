export type VerificationMessageCode =
  | 'MISSING'
  | 'INVALID'
  | 'EXPIRED'
  | 'VERIFIED'
  | 'ALREADY_VERIFIED'
  | 'RATE_LIMITED'
  | 'RESEND_SENT'
  | 'RESEND_FAILED_KEPT'
  | 'RESEND_COOLDOWN'
  | 'EMAIL_REQUIRED';

const COPY: Record<'nl' | 'en', Record<VerificationMessageCode, string>> = {
  nl: {
    MISSING: 'Vul de verificatiecode in.',
    INVALID: 'De code is niet correct. Controleer de cijfers en probeer het opnieuw.',
    EXPIRED: 'Deze code is verlopen. Vraag een nieuwe code aan.',
    VERIFIED: 'Je e-mailadres is bevestigd. Je kunt nu verder.',
    ALREADY_VERIFIED: 'Je e-mailadres is al bevestigd. Je kunt nu verder.',
    RATE_LIMITED: 'Te veel pogingen. Wacht {seconds} seconden en probeer het opnieuw.',
    RESEND_SENT: 'Er is een nieuwe code verstuurd. Alleen deze code is geldig.',
    RESEND_FAILED_KEPT: 'De e-mail is niet verstuurd. Je vorige code blijft geldig.',
    RESEND_COOLDOWN: 'Je kunt over {seconds} seconden een nieuwe code aanvragen.',
    EMAIL_REQUIRED: 'Vul je e-mailadres in bij de code.',
  },
  en: {
    MISSING: 'Enter the verification code.',
    INVALID: 'The code is not correct. Check the digits and try again.',
    EXPIRED: 'This code has expired. Request a new code.',
    VERIFIED: 'Your email address is confirmed. You can continue.',
    ALREADY_VERIFIED: 'Your email address is already confirmed. You can continue.',
    RATE_LIMITED: 'Too many attempts. Wait {seconds} seconds and try again.',
    RESEND_SENT: 'A new code has been sent. Only this code is valid.',
    RESEND_FAILED_KEPT: 'The email was not sent. Your previous code is still valid.',
    RESEND_COOLDOWN: 'You can request a new code in {seconds} seconds.',
    EMAIL_REQUIRED: 'Enter your email address with the code.',
  },
};

export function verificationUserMessage(
  code: VerificationMessageCode,
  locale: 'nl' | 'en',
  params?: { seconds?: number },
): string {
  const template = COPY[locale][code];
  const seconds = params?.seconds ?? 60;
  return template.split('{seconds}').join(String(seconds));
}
