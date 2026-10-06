/**
 * Range requests are forwarded and streamed.
 * Full-body buffering stays only for clients that omit Range.
 */
export function videoProxyRangePlan(
  rangeHeader: string | null,
  userAgent: string | null,
): { forwardRange: boolean; forceBuffer: boolean } {
  const forwardRange = Boolean(rangeHeader && rangeHeader.trim());
  return {
    forwardRange,
    forceBuffer: shouldForceBuffer(userAgent) && !forwardRange,
  };
}

function shouldForceBuffer(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  const safariOrMobile =
    ua.includes("iphone") ||
    ua.includes("ipad") ||
    ua.includes("ipod") ||
    (ua.includes("safari") && !ua.includes("chrome")) ||
    ua.includes("mobile");
  const isEdge = ua.includes("edg/") || ua.includes("edge/");
  const isSamsung = ua.includes("samsungbrowser");
  return safariOrMobile || isEdge || isSamsung;
}
