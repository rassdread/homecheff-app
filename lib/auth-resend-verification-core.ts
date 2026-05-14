import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { logEmailSendFailure } from '@/lib/email-log';
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
  | { status: 'email_service_unavailable' }
  | { status: 'invalid_email' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isMissingResendKey(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('RESEND_API_KEY_NOT_CONFIGURED');
}

/**
 * Regenerates verification token + code, emails user. No code is returned to callers.
 * Unknown email → generic_ok (avoid enumeration). Rate limit applies only for known unverified users.
 */
export async function runResendVerificationCore(
  rawEmail: unknown,
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
    await sendVerificationEmail({
      email: user.email,
      name: user.name || user.username || 'Gebruiker',
      verificationToken,
      verificationCode,
    });
    markResendVerificationSent(user.email);
    return { status: 'sent' };
  } catch (err) {
    logEmailSendFailure('resend_verification', err, {
      recipientEmail: user.email,
    });
    if (isMissingResendKey(err)) {
      console.error('[resend_verification] email provider not configured');
    }
    return { status: 'email_service_unavailable' };
  }
}
