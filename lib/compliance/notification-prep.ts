/**
 * LEGAL-4A — future notification type constants (NOT wired to NotificationType enum yet).
 * Do not send these to users until a legal trigger is established.
 */

export const PREPARED_COMPLIANCE_NOTIFICATION_TYPES = [
  'COMPLIANCE_INFORMATION_REQUIRED',
  'DAC7_INFORMATION_REQUIRED',
  'DAC7_REPORT_PREVIEW_AVAILABLE',
] as const;

export type PreparedComplianceNotificationType =
  (typeof PREPARED_COMPLIANCE_NOTIFICATION_TYPES)[number];

/** LEGAL-4A: deliberately no-op — notifications must not spam sellers. */
export function complianceNotificationsEnabledForSend(): boolean {
  return false;
}
