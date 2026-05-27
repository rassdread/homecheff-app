import { sendVerificationEmail } from '@/lib/email';
import { logEmailSendFailure } from '@/lib/email-log';
import { EmailSendFailure } from '@/lib/email-send-failure';

export type SignupVerificationEmailResult = {
  sent: boolean;
  skippedReason: 'EMAIL_NOT_CONFIGURED' | 'EMAIL_UNAVAILABLE' | null;
};

/**
 * Sends the verification email after signup. Never throws — registration should succeed even if mail fails.
 */
export async function trySendSignupVerificationEmail(params: {
  email: string;
  name: string;
  verificationToken: string;
  verificationCode: string;
  locale?: 'nl' | 'en';
}): Promise<SignupVerificationEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false, skippedReason: 'EMAIL_NOT_CONFIGURED' };
  }

  const locale = params.locale === 'en' ? 'en' : 'nl';
  const displayName =
    params.name.trim() ||
    (locale === 'en' ? 'User' : 'Gebruiker');

  try {
    await sendVerificationEmail({
      email: params.email,
      name: displayName,
      verificationToken: params.verificationToken,
      verificationCode: params.verificationCode,
      locale,
    });
    return { sent: true, skippedReason: null };
  } catch (err) {
    logEmailSendFailure('signup_verification', err, { recipientEmail: params.email });
    if (err instanceof EmailSendFailure) {
      return {
        sent: false,
        skippedReason:
          err.apiCode === 'EMAIL_NOT_CONFIGURED'
            ? 'EMAIL_NOT_CONFIGURED'
            : 'EMAIL_UNAVAILABLE',
      };
    }
    return { sent: false, skippedReason: 'EMAIL_UNAVAILABLE' };
  }
}
