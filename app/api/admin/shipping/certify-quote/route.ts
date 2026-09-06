import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-guard';
import {
  getShippingProducts,
  pingPartnerApi,
  ECTAROSHIP_PARTNER_BASE_URL,
} from '@/lib/ectaroship/partner-client';

export const dynamic = 'force-dynamic';

/**
 * Safe Production certification probe — NO label purchase.
 * Admin only. Never returns API key.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdminPermission('canViewPaymentInfo');
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const originCountry = String(body.originCountry || 'NL').toUpperCase();
  const destinationCountry = String(body.destinationCountry || 'NL').toUpperCase();
  const weightGrams = Number(body.weightGrams || 850);
  const lengthCm = Number(body.lengthCm || 30);
  const widthCm = Number(body.widthCm || 20);
  const heightCm = Number(body.heightCm || 10);

  const keyPresent = Boolean(process.env.ECTAROSHIP_API_KEY?.trim());
  const key = process.env.ECTAROSHIP_API_KEY?.trim() || '';
  const masked =
    key.length >= 10 ? `${key.slice(0, 6)}…${key.slice(-4)}` : keyPresent ? '***' : null;
  const historicalLeak =
    key.toLowerCase().startsWith('fb7a71') ? true : false;

  if (!keyPresent) {
    return NextResponse.json({
      keyPresent: false,
      baseUrl: ECTAROSHIP_PARTNER_BASE_URL,
      historicalLeak: false,
    });
  }

  if (historicalLeak) {
    return NextResponse.json(
      {
        keyPresent: true,
        maskedFp: masked,
        historicalLeak: true,
        stop: 'ECTAROSHIP_CREDENTIAL_ROTATION_REQUIRED',
      },
      { status: 409 },
    );
  }

  const ping = await pingPartnerApi();
  const products = await getShippingProducts({
    originCountry,
    destinationCountry,
    weightGrams,
    lengthCm,
    widthCm,
    heightCm,
  });

  return NextResponse.json({
    baseUrl: ECTAROSHIP_PARTNER_BASE_URL,
    keyPresent: true,
    maskedFp: masked,
    historicalLeak: false,
    browserExposed: false,
    pingOk: ping.ok,
    pingStatus: ping.ok ? ping.status : ping.status,
    productsOk: products.ok,
    productsCount: products.ok ? products.products.length : 0,
    sample: products.ok
      ? products.products.slice(0, 5).map((p) => ({
          carrier: p.carrier,
          name: p.name,
          shippingMethodId: p.shippingMethodId,
          productId: p.productId,
          priceCents: p.priceCents,
          currency: p.currency,
        }))
      : null,
    error: !products.ok ? products.error : !ping.ok ? ping.error : null,
    route: `${originCountry}→${destinationCountry}`,
    parcel: { weightGrams, lengthCm, widthCm, heightCm },
  });
}
