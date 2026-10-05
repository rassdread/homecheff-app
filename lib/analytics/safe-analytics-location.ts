/**
 * Location sent to GA4 after analytics consent.
 * Campaign UTMs stay. Search text, contact details, payment secrets,
 * and affiliate codes do not.
 */

const KEEP = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
]);

const DROP_EXACT = new Set([
  'q',
  'query',
  'search',
  'email',
  'phone',
  'name',
  'firstname',
  'first_name',
  'lastname',
  'last_name',
  'address',
  'postal',
  'postalcode',
  'postcode',
  'zip',
  'dob',
  'birthdate',
  'session_id',
  'sessionid',
  'payment_intent',
  'payment_intent_client_secret',
  'hc_ref',
  'ref',
  'token',
  'code',
  'password',
  'user_id',
  'userid',
  'uid',
  'fbclid',
]);

export type SafeAnalyticsLocation = {
  page_path: string;
  page_location: string;
};

export function analyticsPageViewParams(
  href: string,
  origin = 'https://homecheff.eu',
): SafeAnalyticsLocation {
  let url: URL;
  try {
    url = new URL(href, origin);
  } catch {
    return { page_path: '/', page_location: `${origin}/` };
  }
  const kept = new URLSearchParams();
  for (const [key, value] of url.searchParams.entries()) {
    const lower = key.toLowerCase();
    if (!KEEP.has(lower)) continue;
    if (DROP_EXACT.has(lower)) continue;
    if (value.includes('@') || value.length > 120) continue;
    kept.set(lower, value.slice(0, 120));
  }
  const search = kept.toString();
  const path = url.pathname || '/';
  const page_path = search ? `${path}?${search}` : path;
  const page_location = `${url.origin}${page_path}`;
  return { page_path, page_location };
}
