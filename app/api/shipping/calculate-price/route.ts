import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAuthoritativeCarrierShippingQuote } from '@/lib/shipping/quote-service';

export const dynamic = 'force-dynamic';

/**
 * Display quote for HomeCheff shipping (EctaroShip).
 * UI display only — checkout re-quotes server-authoritatively.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { items, destination, street, houseNumber, city, name } = body;

    if (!destination?.postalCode || !destination?.country) {
      return NextResponse.json(
        { error: 'Destination must include postalCode and country', code: 'SHIPPING_ADDRESS_INCOMPLETE' },
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
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status },
      );
    }

    return NextResponse.json({
      price: result.priceCents / 100,
      priceCents: result.priceCents,
      carrier: result.quote.carrier,
      method: result.quote.method,
      estimatedDays: result.quote.estimatedDays,
      currency: result.quote.currency,
      isInternational: false,
      lane: result.quote.lane,
      quotedAt: result.quote.quotedAt,
      origin: {
        postalCode: result.quote.originPostalCode,
        country: result.quote.originCountry,
      },
      destination: {
        postalCode: result.quote.destinationPostalCode,
        country: result.quote.destinationCountry,
      },
      // Never accept this as financial authority — checkout re-quotes.
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
