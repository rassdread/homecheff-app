/**
 * Personal ?ref= handoff. Removes only the affiliate code from the landing URL.
 * Campaign parameters on the same URL stay on the redirect target.
 */
export function personalReferralHandoff(requestUrl: string): {
  code: string;
  landingPath: string;
  apiUrl: string;
} | null {
  const cleanUrl = new URL(requestUrl);
  const code = cleanUrl.searchParams.get('ref');
  if (!code) return null;
  cleanUrl.searchParams.delete('ref');
  const landingPath = cleanUrl.pathname + cleanUrl.search;
  const apiUrl = new URL(
    `/api/affiliate/referral?code=${encodeURIComponent(code)}&redirect=${encodeURIComponent(landingPath)}`,
    requestUrl,
  ).toString();
  return { code, landingPath, apiUrl };
}
