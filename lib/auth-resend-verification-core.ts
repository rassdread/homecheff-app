import { logEmailSendFailure, summarizeEmailError } from '@/lib/email-log';
import { logEmailVerificationDiag } from '@/lib/email-verification-diagnostics';
import { EmailSendFailure } from '@/lib/email-send-failure';
import {
  generateVerificationToken,
  generateVerificationCode,
  getVerificationExpires,
} from '@/lib/verification';
import {
  endVerificationResend,
  markResendVerificationSent,
  tryBeginVerificationResend,
} from '@/lib/verification-resend-rate-limit';

export type ResendVerificationCoreResult =
  | { status: 'sent' }
  | { status: 'generic_ok' }
  | { status: 'already_verified' }
  | { status: 'rate_limited'; retryAfterSec: number }
  | { status: 'email_service_unavailable'; reason: string; previousCodeRestored: boolean }
  | { status: 'email_not_configured'; reason: string; previousCodeRestored: boolean }
  | { status: 'invalid_email' };

type ResendCredentialFields = {
  emailVerificationToken: string | null;
  emailVerificationCode: string | null;
  emailVerificationExpires: Date | null;
};

type ResendUser = ResendCredentialFields & {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  emailVerified: Date | null;
};

export type ResendVerificationDeps = {
  findUser: (email: string) => Promise<ResendUser | null>;
  updateCredentials: (
    id: string,
    data: {
      emailVerificationToken: string;
      emailVerificationCode: string;
      emailVerificationExpires: Date;
    },
  ) => Promise<void>;
  restoreCredentials: (
    id: string,
    data: ResendCredentialFields,
    issued?: ResendCredentialFields,
  ) => Promise<boolean>;
  begin?: (email: string) => Promise<{ ok: true } | { ok: false; retryAfterSec: number }>;
  end?: (email: string) => Promise<void>;
  markSent?: (email: string) => Promise<void>;
  send: (input: {
    email: string;
    name: string;
    verificationToken: string;
    verificationCode: string;
    locale: 'nl' | 'en';
  }) => Promise<void>;
};

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
async function defaultResendDeps(): Promise<ResendVerificationDeps> {
  const { prisma } = await import('@/lib/prisma');
  const { sendVerificationEmail } = await import('@/lib/email');
  return {
    async findUser(email) {
      return prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          emailVerified: true,
          emailVerificationToken: true,
          emailVerificationCode: true,
          emailVerificationExpires: true,
        },
      });
    },
    async updateCredentials(id, data) {
      await prisma.user.update({ where: { id }, data });
    },
    async restoreCredentials(id, data, issued) {
      const restored = await prisma.user.updateMany({
        where: {
          id,
          emailVerified: null,
          ...(issued
            ? {
                emailVerificationToken: issued.emailVerificationToken,
                emailVerificationCode: issued.emailVerificationCode,
              }
            : {}),
        },
        data,
      });
      return restored.count > 0;
    },
    async begin(email) {
      try {
        const { beginDurableResend } = await import('@/lib/verification-central-limit');
        return await beginDurableResend(email);
      } catch {
        console.error('[resend_verification] central limit unavailable');
        return tryBeginVerificationResend(email);
      }
    },
    async end(email) {
      try {
        const { endDurableResend } = await import('@/lib/verification-central-limit');
        await endDurableResend(email);
      } catch {
        console.error('[resend_verification] central limit release unavailable');
        endVerificationResend(email);
      }
    },
    async markSent(email) {
      try {
        const { markDurableResendSent } = await import('@/lib/verification-central-limit');
        await markDurableResendSent(email);
      } catch {
        console.error('[resend_verification] central cooldown unavailable');
        markResendVerificationSent(email);
      }
    },
    async send(input) {
      await sendVerificationEmail(input);
    },
  };
}

export async function runResendVerificationCore(
  rawEmail: unknown,
  options?: { locale?: 'nl' | 'en'; deps?: ResendVerificationDeps },
): Promise<ResendVerificationCoreResult> {
  const email =
    typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

  if (!email) {
    return { status: 'invalid_email' };
  }

  if (!EMAIL_RE.test(email)) {
    return { status: 'invalid_email' };
  }

  const deps = options?.deps ?? (await defaultResendDeps());
  const user = await deps.findUser(email);

  if (!user) {
    return { status: 'generic_ok' };
  }

  if (user.emailVerified) {
    return { status: 'already_verified' };
  }

  const rl = deps.begin
    ? await deps.begin(user.email)
    : tryBeginVerificationResend(user.email);
  if (!rl.ok) {
    return { status: 'rate_limited', retryAfterSec: rl.retryAfterSec };
  }

  const previous: ResendCredentialFields = {
    emailVerificationToken: user.emailVerificationToken,
    emailVerificationCode: user.emailVerificationCode,
    emailVerificationExpires: user.emailVerificationExpires,
  };
  const verificationToken = generateVerificationToken();
  const verificationCode = generateVerificationCode();
  const verificationExpires = getVerificationExpires();

  try {
    await deps.updateCredentials(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpires,
    });

    const locale = options?.locale === 'en' ? 'en' : 'nl';
    const displayName =
      locale === 'en'
        ? user.name || user.username || 'User'
        : user.name || user.username || 'Gebruiker';
    await deps.send({
      email: user.email,
      name: displayName,
      verificationToken,
      verificationCode,
      locale,
    });
    if (deps.markSent) await deps.markSent(user.email);
    else markResendVerificationSent(user.email);
    logEmailVerificationDiag('email_verification_resend_success', {});
    return { status: 'sent' };
  } catch (err) {
    let previousCodeRestored = false;
    try {
      previousCodeRestored = await deps.restoreCredentials(user.id, previous, {
        emailVerificationToken: verificationToken,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
      });
    } catch (restoreErr) {
      logEmailSendFailure('resend_verification_restore', restoreErr, {
        recipientEmail: user.email,
      });
    }
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
        return { status: 'email_not_configured', reason: err.category, previousCodeRestored };
      }
      return { status: 'email_service_unavailable', reason: err.category, previousCodeRestored };
    }
    logEmailVerificationDiag('email_verification_resend_failed', {
      reason: summarizeEmailError(err, 120),
    });
    if (isMissingResendKey(err)) {
      console.error('[resend_verification] email provider not configured');
    }
    return {
      status: 'email_service_unavailable',
      reason: 'provider_unknown',
      previousCodeRestored,
    };
  } finally {
    if (deps.end) await deps.end(user.email);
    else endVerificationResend(user.email);
  }
}
