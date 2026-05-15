import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { logEmailSendFailure, summarizeEmailError } from '@/lib/email-log';
import { logEmailVerificationDiag } from '@/lib/email-verification-diagnostics';
import { EmailSendFailure } from '@/lib/email-send-failure';
import {
  generateVerificationToken,
  generateVerificationCode,
  getVerificationExpires,
} from '@/lib/verification';
import {
  assertCanResendVerification,
  markResendVerificationSent,
} from '@/lib/verification-resend-rate-limit';

export type ResendVerificationCoreResult =
  | { status: 'sent' }
  | { status: 'generic_ok' }
  | { status: 'already_verified' }
  | { status: 'rate_limited'; retryAfterSec: number }
  | { status: 'email_service_unavailable'; reason: string }
  | { status: 'email_not_configured'; reason: string }
  | { status: 'invalid_email' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isMissingResendKey(err: unknown): boolean {
  if (err instanceof EmailSendFailure) {
    return err.category === 'config_missing_api_key';
  }
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('RESEND_API_KEY_NOT_CONFIGURED');
}

/**
 * Regenerates verification token + code, emails user. No code is returned to callers.
 * Unknown email → generic_ok (avoid enumeration). Rate limit applies only for known unverified users.
 */
export async function runResendVerificationCore(
  rawEmail: unknown,
  options?: { locale?: 'nl' | 'en' },
): Promise<ResendVerificationCoreResult> {
  const email =
    typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

  if (!email) {
    return { status: 'invalid_email' };
  }

  if (!EMAIL_RE.test(email)) {
    return { status: 'invalid_email' };
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      emailVerified: true,
    },
  });

  if (!user) {
    return { status: 'generic_ok' };
  }

  if (user.emailVerified) {
    return { status: 'already_verified' };
  }

  const rl = assertCanResendVerification(user.email);
  if (!rl.ok) {
    return { status: 'rate_limited', retryAfterSec: rl.retryAfterSec };
  }

  const verificationToken = generateVerificationToken();
  const verificationCode = generateVerificationCode();
  const verificationExpires = getVerificationExpires();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: verificationToken,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpires,
    },
  });

  try {
    const locale = options?.locale === 'en' ? 'en' : 'nl';
    const displayName =
      locale === 'en'
        ? user.name || user.username || 'User'
        : user.name || user.username || 'Gebruiker';
    await sendVerificationEmail({
      email: user.email,
      name: displayName,
      verificationToken,
      verificationCode,
      locale,
    });
    markResendVerificationSent(user.email);
    logEmailVerificationDiag('email_verification_resend_success', {});
    return { status: 'sent' };
  } catch (err) {
    if (!(err instanceof EmailSendFailure)) {
      logEmailSendFailure('resend_verification', err, {
        recipientEmail: user.email,
      });
    }
    if (err instanceof EmailSendFailure) {
      logEmailVerificationDiag('email_verification_resend_failed', {
        category: err.category,
        reason: summarizeEmailError(err, 120),
      });
      if (err.apiCode === 'EMAIL_NOT_CONFIGURED') {
        if (err.category === 'config_missing_api_key') {
          console.error('[resend_verification] email provider not configured');
        }
        return { status: 'email_not_configured', reason: err.category };
      }
      return { status: 'email_service_unavailable', reason: err.category };
    }
    logEmailVerificationDiag('email_verification_resend_failed', {
      reason: summarizeEmailError(err, 120),
    });
    if (isMissingResendKey(err)) {
      console.error('[resend_verification] email provider not configured');
    }
    return { status: 'email_service_unavailable', reason: 'provider_unknown' };
  }
}
