/**
 * Central place for analytics events. Koppel hier gtag/GA4 of andere analytics.
 * Roep trackEvent() aan bij belangrijke acties (view_product, add_to_cart, checkout_start, etc.).
 */

export type AnalyticsEventName =
  | 'view_product'
  | 'view_seller'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_start'
  | 'purchase'
  | 'share'
  | 'feedback_click';

export type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Stuur een event naar analytics (gtag/GA4 indien beschikbaar). In development alleen console.
 */
export function trackEvent(
  eventName: AnalyticsEventName,
  params?: AnalyticsEventParams
): void {
  if (typeof window === 'undefined') return;

  const payload = { event: eventName, ...params };

  if (window.gtag) {
    try {
      window.gtag('event', eventName, params);
    } catch {
      // no-op
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug('[Analytics]', payload);
  }
}
