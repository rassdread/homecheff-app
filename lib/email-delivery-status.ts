import { getRawFromEnv, validateFromHeader } from '@/lib/email-from';

/** Mask "Display <user@domain.com>" → "Display <us***@domain.com>" for safe logs/UI. */
export function maskSenderPreview(raw: string): string {
  const s = raw.trim();
  if (!s) return '(empty)';
  const angle = s.match(/^(.+)<([^>]+)>\s*$/);
  const addr = angle ? angle[2].trim() : s;
  const display = angle ? angle[1].trim() : '';
  const at = addr.indexOf('@');
  if (at <= 0) return display ? `${display} <(invalid)>` : '(invalid)';
  const local = addr.slice(0, at);
  const domain = addr.slice(at + 1);
  const maskedLocal =
    local.length <= 2 ? `${local.slice(0, 1)}*` : `${local.slice(0, 2)}***`;
  const inner = `${maskedLocal}@${domain}`;
  return display ? `${display} <${inner}>` : inner;
}

export type EmailDeliveryConfigSnapshot = {
  configured: boolean;
  resendApiKeyPresent: boolean;
  fromEmailPresent: boolean;
  fromEmailValid: boolean;
  environment: 'production' | 'development' | 'test' | 'unknown';
  senderPreview: string;
  canAttemptSend: boolean;
};

export function getEmailDeliveryConfigSnapshot(): EmailDeliveryConfigSnapshot {
  const key = Boolean(process.env.RESEND_API_KEY?.trim());
  const raw = getRawFromEnv();
  const fromPresent = Boolean(
    process.env.FROM_EMAIL?.trim() || process.env.RESEND_FROM?.trim(),
  );
  const valid = validateFromHeader(raw);
  const env = process.env.NODE_ENV;
  const environment =
    env === 'production'
      ? 'production'
      : env === 'development'
        ? 'development'
        : env === 'test'
          ? 'test'
          : 'unknown';
  return {
    configured: key && valid,
    resendApiKeyPresent: key,
    fromEmailPresent: fromPresent,
    fromEmailValid: valid,
    environment,
    senderPreview: maskSenderPreview(raw),
    canAttemptSend: key && valid,
  };
}
