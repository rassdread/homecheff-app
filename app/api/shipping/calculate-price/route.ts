import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAuthoritativeCarrierShippingQuote } from '@/lib/shipping/quote-service';

export const dynamic = 'force-dynamic';

/**
 * Display quote options for HomeCheff shipping (Partner API products).
 * UI display only — checkout re-quotes server-authoritatively.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      items,
      destination,
      street,
      houseNumber,
      city,
      name,
      shippingMethodId,
    } = body;

    if (!destination?.postalCode || !destination?.country) {
      return NextResponse.json(
        {
          error: 'Destination must include postalCode and country',
          code: 'SHIPPING_ADDRESS_INCOMPLETE',
        },
        { status: 400 },
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items required', code: 'SHIPPING_ITEMS_REQUIRED' },
        { status: 400 },
      );
    }

    const result = await getAuthoritativeCarrierShippingQuote({
      items: items.map((item: { productId: string; quantity?: number }) => ({
        productId: item.productId,
        quantity: item.quantity || 1,
      })),
      destination: {
        name: name || session.user.name || 'Ontvanger',
        addressLine:
          destination.address ||
          [street, houseNumber].filter(Boolean).join(' ') ||
          destination.addressLine ||
          'Adres volgt bij checkout',
        street,
        houseNumber,
        postalCode: destination.postalCode,
        city: city || destination.city || '',
        country: destination.country,
        email: session.user.email || undefined,
      },
      buyerName: session.user.name || undefined,
      buyerEmail: session.user.email || undefined,
      shippingMethodId: shippingMethodId || null,
    });

    if (!result.ok) {
      if (
        result.code === 'SHIPPING_METHOD_REQUIRED' &&
        Array.isArray(result.products) &&
        result.products.length > 0
      ) {
        return NextResponse.json({
          price: null,
          priceCents: null,
          shippingMethodId: null,
          productId: null,
          selectionRequired: true,
          currency: result.products[0]?.currency || 'EUR',
          isInternational: false,
          products: result.products.map((p) => ({
            shippingMethodId: p.shippingMethodId,
            carrier: p.carrier,
            name: p.name,
            priceCents: p.priceCents,
            currency: p.currency,
            productId: p.productId,
            hasReturn: p.hasReturn,
            labelType: p.labelType,
          })),
          message: result.error,
          code: result.code,
          authoritative: false,
          displayOnly: true,
        });
      }
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          products: result.products?.map((p) => ({
            shippingMethodId: p.shippingMethodId,
            carrier: p.carrier,
            name: p.name,
            priceCents: p.priceCents,
            currency: p.currency,
            productId: p.productId,
            hasReturn: p.hasReturn,
            labelType: p.labelType,
          })),
        },
        { status: result.status },
      );
    }

    return NextResponse.json({
      price: result.priceCents / 100,
      priceCents: result.priceCents,
      carrier: result.quote.carrier,
      method: result.quote.method,
      shippingMethodId: result.quote.shippingMethodId,
      productId: result.quote.productId,
      currency: result.quote.currency,
      isInternational: false,
      lane: result.quote.lane,
      quotedAt: result.quote.quotedAt,
      markupPercent: result.quote.markupPercent,
      selectionRequired: false,
      products: result.products.map((p) => ({
        shippingMethodId: p.shippingMethodId,
        carrier: p.carrier,
        name: p.name,
        priceCents: p.priceCents,
        currency: p.currency,
        productId: p.productId,
        hasReturn: p.hasReturn,
        labelType: p.labelType,
      })),
      origin: {
        postalCode: result.quote.originPostalCode,
        country: result.quote.originCountry,
      },
      destination: {
        postalCode: result.quote.destinationPostalCode,
        country: result.quote.destinationCountry,
      },
      message: 'Verzendkosten worden berekend voor jouw adres.',
      authoritative: false,
      displayOnly: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown';
    console.error('Error calculating shipping price:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping price', details: message },
      { status: 500 },
    );
  }
}
