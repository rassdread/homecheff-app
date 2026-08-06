/**
 * Validate Promo Code API
 *
 * POST /api/affiliate/validate-promo-code
 * Returns server-authoritative pricing quotes for BASIC/PRO/PREMIUM.
 * UI must display quotes — never invent discounts client-side.
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveSubscriptionPromo } from "@/lib/promo-codes/resolve-subscription-promo";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const resolved = await resolveSubscriptionPromo(body?.code ?? body?.promoCode);

    if (!resolved.valid) {
      const status = resolved.reason === 'not_found' ? 404 : 200;
      return NextResponse.json(
        { valid: false, error: resolved.error, reason: resolved.reason },
        { status },
      );
    }

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: resolved.promo.id,
        code: resolved.promo.code,
        discountSharePct: resolved.promo.discountSharePct,
        hasL2: resolved.promo.hasL2,
        isPlatform: resolved.promo.isPlatform,
        discountMode: resolved.promo.discountMode,
        fixedDiscountCents: resolved.promo.fixedDiscountCents,
        isSubAffiliate: resolved.promo.isSubAffiliate,
      },
      quotes: resolved.quotes,
      // Explicit: clients must not send discount amounts — only the code.
      authority: 'server',
    });
  } catch (error) {
    console.error("Error validating promo code:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate promo code", reason: 'server_error' },
      { status: 500 }
    );
  }
}
