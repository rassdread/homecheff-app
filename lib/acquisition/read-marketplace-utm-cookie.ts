import { cookies } from "next/headers";
import {
  MARKETPLACE_UTM_COOKIE,
  parseMarketplaceUtmCookieValue,
  type MarketplaceUtmCapture,
} from "@/lib/acquisition/utm-persistence";

/** Read first-touch Marketplace UTM cookie from the request (server). Never touches hc_ref. */
export async function readMarketplaceUtmFromCookies(): Promise<MarketplaceUtmCapture | null> {
  try {
    const jar = await cookies();
    const raw = jar.get(MARKETPLACE_UTM_COOKIE)?.value;
    return parseMarketplaceUtmCookieValue(raw);
  } catch {
    return null;
  }
}
