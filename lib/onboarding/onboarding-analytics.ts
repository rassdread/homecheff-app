/**
 * Lightweight onboarding / soft-gate analytics → AnalyticsEvent (best-effort, non-blocking).
 */
import { reportAppDiagnostic } from '@/lib/diagnostics/appDiagnostics';

export type OnboardingAnalyticsEvent =
  | 'ONBOARDING_STARTED'
  | 'ONBOARDING_COMPLETED'
  | 'SOCIAL_AUTH_SUCCESS'
  | 'SOCIAL_AUTH_FAILURE'
  | 'PENDING_INTENT_RESUMED'
  | 'CREATE_FLOW_RESUMED'
  | 'AFFILIATE_ONBOARDING_STARTED'
  | 'AFFILIATE_ONBOARDING_COMPLETED'
  | 'SELLER_ACTIVATION_STARTED'
  | 'SELLER_ACTIVATION_COMPLETED'
  | 'SOFT_GATE_SHOWN'
  | 'SOFT_GATE_CTA_LOGIN'
  | 'SOFT_GATE_CTA_REGISTER'
  | 'SOFT_GATE_DISMISSED'
  | 'GPS_PERMISSION_RESULT'
  | 'PUSH_PERMISSION_RESULT'
  | 'FEED_STATE_RESTORED'
  | 'ROUTE_TRANSITION_MS'
  | 'PERMISSION_EDUCATION_SHOWN'
  | 'PERMISSION_PROMPT_SKIPPED'
  | 'COMMUNITY_MOMENTUM_LOADED'
  | 'CREATOR_VISIBILITY_DIGEST_SHOWN'
  | 'CREATOR_AUDIENCE_INSIGHTS_VIEWED'
  | 'RETURN_BELONGING_STRIP_SHOWN'
  | 'ECOSYSTEM_PAGE_VIEWED'
  | 'ECOSYSTEM_NAV_CLICK';

export function trackOnboardingEvent(
  eventType: OnboardingAnalyticsEvent,
  metadata?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return;
  try {
    void fetch('/api/onboarding/analytics', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        eventType,
        metadata: {
          ...metadata,
          path: window.location?.pathname,
          ts: new Date().toISOString(),
        },
      }),
    })
      .then((res) => {
        if (!res.ok) {
          reportAppDiagnostic('onboarding_analytics_http', {
            status: res.status,
          });
        }
      })
      .catch(() => {
        reportAppDiagnostic('onboarding_analytics_network', {});
      });
  } catch {
    /* ignore */
  }
}
