import type { EmailDeliveryDiagCategory } from '@/lib/email-delivery-diagnostics';

/**
 * Maps internal failure reason strings (from resend core) to stable public diagnostic keys.
 * Safe for JSON responses — no secrets.
 */
export function emailFailureReasonToDiagCategory(
  reason: string | undefined,
): EmailDeliveryDiagCategory {
  switch (reason) {
    case 'config_missing_api_key':
    case 'config_missing_from':
      return 'email_config_missing';
    case 'config_invalid_from':
      return 'email_invalid_sender';
    case 'provider_rate_limited':
      return 'email_provider_rate_limit';
    case 'provider_timeout':
      return 'email_provider_timeout';
    case 'provider_rejected_sender':
      return 'email_provider_rejected';
    case 'provider_unknown':
    default:
      return 'email_provider_unknown';
  }
}
