/**
 * Orchestrate contact anti-spam gates (Prisma-free except logging side-effect).
 */

import type { NextRequest } from 'next/server';
import { getClientIp, hashForLog } from '@/lib/contact-security/client-ip';
import { checkHoneypot, CONTACT_HONEYPOT_FIELD } from '@/lib/contact-security/honeypot';
import { checkFormTiming } from '@/lib/contact-security/timing';
import { checkContactRateLimit } from '@/lib/contact-security/rate-limit';
import { validateContactEmail } from '@/lib/contact-security/email-validation';
import { scoreContactSpam } from '@/lib/contact-security/spam-score';
import { verifyTurnstileToken } from '@/lib/contact-security/turnstile';
import {
  logContactSecurityEvent,
  type ContactRejectReason,
} from '@/lib/contact-security/logging';

const ALLOWED_SUBJECTS = new Set([
  'general',
  'technical',
  'payment',
  'delivery',
  'account',
  'other',
  'feedback',
]);

const MAX_NAME = 120;
const MAX_MESSAGE = 5000;

export type ContactSecurityPass = {
  ok: true;
  name: string;
  email: string;
  subject: string;
  message: string;
  spamScore: number;
};

export type ContactSecurityFail = {
  ok: false;
  status: number;
  reason: ContactRejectReason;
  error: string;
  retryAfterSec?: number;
};

export async function evaluateContactSubmission(
  req: NextRequest,
  body: Record<string, unknown>,
): Promise<ContactSecurityPass | ContactSecurityFail> {
  const ip = getClientIp(req);
  const ipHash = hashForLog(ip);
  const ua = req.headers.get('user-agent') || '';
  const uaHash = hashForLog(ua);

  const reject = async (
    status: number,
    reason: ContactRejectReason,
    error: string,
    extra?: { retryAfterSec?: number; meta?: Record<string, unknown> },
  ): Promise<ContactSecurityFail> => {
    await logContactSecurityEvent({
      outcome: 'rejected',
      reason,
      ipHash,
      uaHash,
      meta: extra?.meta,
    });
    return {
      ok: false,
      status,
      reason,
      error,
      retryAfterSec: extra?.retryAfterSec,
    };
  };

  // 1) Honeypot
  const hp = checkHoneypot(body[CONTACT_HONEYPOT_FIELD] ?? body.website);
  if (!hp.ok) {
    return reject(400, 'HONEYPOT_TRIGGERED', 'Unable to send message');
  }

  // 2) Rate limit (before expensive Turnstile / email)
  const rl = checkContactRateLimit(req);
  if (!rl.allowed) {
    return reject(429, 'RATE_LIMIT', 'Too many requests. Please try again later.', {
      retryAfterSec: rl.retryAfterSec,
    });
  }

  // 3) Timing
  const timing = checkFormTiming({ formStartedAt: body.formStartedAt });
  if (!timing.ok) {
    return reject(400, 'TIMING_TOO_FAST', 'Unable to send message', {
      meta: { elapsedMs: timing.elapsedMs },
    });
  }

  // 4) Fields
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const subjectRaw = typeof body.subject === 'string' ? body.subject.trim() : '';
  if (!name || !message || !subjectRaw) {
    return reject(400, 'INVALID_FIELDS', 'All fields are required');
  }
  if (name.length > MAX_NAME || message.length > MAX_MESSAGE) {
    return reject(400, 'MESSAGE_TOO_LONG', 'Message is too long');
  }
  if (!ALLOWED_SUBJECTS.has(subjectRaw)) {
    return reject(400, 'INVALID_FIELDS', 'Invalid subject');
  }

  // 5) Email
  const emailResult = validateContactEmail(body.email);
  if (!emailResult.ok) {
    return reject(400, 'INVALID_EMAIL', emailResult.error);
  }

  // 6) Turnstile
  const turnstile = await verifyTurnstileToken({
    token: body.turnstileToken ?? body['cf-turnstile-response'],
    remoteip: ip,
  });
  if (!turnstile.ok) {
    return reject(400, turnstile.reason, 'Security check failed');
  }

  // 7) Content score
  const spam = scoreContactSpam({
    name,
    email: emailResult.email,
    message,
    subject: subjectRaw,
    softTimingPenalty: timing.softPenalty,
  });
  if (spam.reject) {
    return reject(400, 'HIGH_SPAM_SCORE', 'Unable to send message', {
      meta: { score: spam.score, signals: spam.signals },
    });
  }

  return {
    ok: true,
    name: name.slice(0, MAX_NAME),
    email: emailResult.email,
    subject: subjectRaw,
    message: message.slice(0, MAX_MESSAGE),
    spamScore: spam.score,
  };
}

export { CONTACT_HONEYPOT_FIELD };
