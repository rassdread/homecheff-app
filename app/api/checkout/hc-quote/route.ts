import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { fetchGrowthMarketplaceHcQuote } from '@/lib/hc/growth-marketplace-quote-client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0' };

function mapCategoryKey(category: string, marketplaceCategory?: string | null): string {
  const mc = (marketplaceCategory ?? '').toUpperCase();
  if (mc.includes('FOOD') || mc === 'GROW') return 'FOOD';
  if (category === 'CHEFF' || category === 'GROWN') return 'FOOD';
  return 'SERVICE';
}

function geographyKey(input: {
  city?: string | null;
  postalCode?: string | null;
  placeName?: string | null;
  country?: string | null;
}): string {
  const city = (input.city ?? input.placeName ?? '').trim().toUpperCase();
  if (city) return city.replace(/\s+/g, '_');
  const postal = (input.postalCode ?? '').trim().toUpperCase();
  if (postal) return postal.slice(0, 4);
  return (input.country ?? 'NL').toUpperCase();
}

async function resolveCentralUserId(localUserId: string): Promise<string | null> {
  const link = await prisma.authIdentityLink.findFirst({
    where: { sourceSystem: 'homecheff', sourceUserId: localUserId, status: 'linked' },
    select: { centralUserId: true },
  });
  return link?.centralUserId ?? localUserId;
}

/**
 * Read-only marketplace HC quote for checkout UI.
 * Server resolves listing/price — client cannot override economics.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED' }, { status: 401, headers: NO_STORE });
    }

    const buyer = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!buyer) {
      return NextResponse.json({ ok: false, code: 'USER_NOT_FOUND' }, { status: 404, headers: NO_STORE });
    }

    const body = await req.json();
    const items = body?.items as Array<{ productId: string; quantity: number }> | undefined;
    const deliveryFeeCents = Math.max(0, Math.round(Number(body?.deliveryFeeCents ?? 0)));
    const smsNotificationCostCents = Math.max(0, Math.round(Number(body?.smsNotificationCostCents ?? 0)));

    if (!items?.length) {
      return NextResponse.json({ ok: false, code: 'NO_ITEMS' }, { status: 400, headers: NO_STORE });
    }

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        priceCents: true,
        category: true,
        marketplaceCategory: true,
        placeName: true,
        seller: {
          select: {
            userId: true,
            User: { select: { id: true, city: true, postalCode: true, country: true } },
          },
        },
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ ok: false, code: 'PRODUCTS_NOT_FOUND' }, { status: 404, headers: NO_STORE });
    }

    let productsTotalCents = 0;
    for (const item of items) {
      const p = products.find((x) => x.id === item.productId);
      if (!p) continue;
      const qty = Math.max(1, Math.floor(item.quantity));
      productsTotalCents += p.priceCents * qty;
    }

    const orderTotalCents = productsTotalCents + deliveryFeeCents + smsNotificationCostCents;
    const primary = products[0]!;
    const sellerUser = primary.seller?.User;
    const sellerCentralUserId = primary.seller?.userId ?? sellerUser?.id ?? 'unknown';
    const centralUserId = await resolveCentralUserId(buyer.id);

    if (!centralUserId) {
      return NextResponse.json(
        {
          ok: true,
          readOnly: true,
          identityResolved: false,
          walletResolved: false,
          totalAvailableHc: 0,
          eligibleHc: 0,
          ineligibleHc: 0,
          orderAmountCents: orderTotalCents,
          maxHcApplicable: 0,
          remainingEurCents: orderTotalCents,
          marketplaceHcEnabled: false,
          hcPaymentActionable: false,
          reasonCode: 'IDENTITY_UNLINKED',
          userMessageNl: 'Koppel je account om HC-tegoed te zien.',
          userMessageEn: 'Link your account to view HC balance.',
        },
        { status: 200, headers: NO_STORE },
      );
    }

    const trustedOrder = {
      listingId: primary.id,
      sellerCentralUserId,
      merchantId: `MERCH_${sellerCentralUserId.replace(/-/g, '').slice(0, 16).toUpperCase()}`,
      categoryKey: mapCategoryKey(primary.category, primary.marketplaceCategory),
      geographyKey: geographyKey({
        city: sellerUser?.city,
        postalCode: sellerUser?.postalCode,
        placeName: primary.placeName,
        country: sellerUser?.country,
      }),
      orderTotalCents,
    };

    const quote = await fetchGrowthMarketplaceHcQuote({ centralUserId, trustedOrder });

    if (!quote) {
      return NextResponse.json(
        {
          ok: true,
          readOnly: true,
          identityResolved: true,
          walletResolved: false,
          totalAvailableHc: 0,
          eligibleHc: 0,
          ineligibleHc: 0,
          orderAmountCents: orderTotalCents,
          maxHcApplicable: 0,
          remainingEurCents: orderTotalCents,
          marketplaceHcEnabled: false,
          mixedPaymentEnabled: false,
          restrictedCreditEnabled: false,
          hcPaymentActionable: false,
          reasonCode: 'MARKETPLACE_HC_DISABLED',
          userMessageNl: 'HC betalen op HomeCheff is nog niet beschikbaar.',
          userMessageEn: 'Paying with HC on HomeCheff is not available yet.',
          paymentOptions: { eurOnly: true, hcOnly: false, mixed: false },
        },
        { status: 200, headers: NO_STORE },
      );
    }

    return NextResponse.json(quote, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error('[checkout/hc-quote]', error);
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR' }, { status: 500, headers: NO_STORE });
  }
}
