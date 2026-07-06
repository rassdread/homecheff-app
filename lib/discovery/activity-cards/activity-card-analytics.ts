/**
 * Activity card analytics — no ranking impact.
 */

export type ActivityCardAnalyticsEvent =
  | 'ACTIVITY_CARD_SHOWN'
  | 'ACTIVITY_CARD_DISMISSED'
  | 'ACTIVITY_CARD_CLICKED'
  | 'ACTIVITY_CARD_COMPLETED';

export function trackActivityCardEvent(
  eventType: ActivityCardAnalyticsEvent,
  metadata: {
    cardId: string;
    cardType: string;
    surface: string;
  },
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
          entity: 'ACTIVITY_CARD',
          path: window.location?.pathname,
          ts: new Date().toISOString(),
        },
      }),
    });
  } catch {
    /* non-blocking */
  }
}
