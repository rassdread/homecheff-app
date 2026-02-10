import { NextRequest, NextResponse } from 'next/server';
import { calculateShippingPrice, EctaroShipPriceRequest } from '@/lib/ectaroship';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Calculate shipping price using EctaroShip API
 * Used for real-time price display in checkout
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      items,            // Cart items with productId
      weight,           // in kg (optional, will calculate from products if not provided)
      dimensions,       // { length, width, height } in cm (optional)
      origin,           // { postalCode, country } (optional, will get from seller if not provided)
      destination,      // { postalCode, country }
      carrier           // optional: PostNL, DHL, etc.
    } = await req.json();

    // Validate required fields
    if (!destination) {
      return NextResponse.json(
        { error: 'Missing required field: destination' },
        { status: 400 }
      );
    }

    // Validate destination
    if (!destination.postalCode || !destination.country) {
      return NextResponse.json(
        { error: 'Destination must include postalCode and country' },
        { status: 400 }
      );
    }

    // Get origin from seller if not provided
    let originPostalCode = origin?.postalCode;
    let originCountry = origin?.country;
    
    if (!originPostalCode || !originCountry) {
      // Get seller info from first product in cart
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: 'Items required when origin is not provided' },
          { status: 400 }
        );
      }

      const productIds = items.map((item: any) => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          seller: {
            include: {
              User: {
                select: {
                  postalCode: true,
                  country: true,
                  address: true,
                  city: true,
                }
              }
            }
          }
        },
        take: 1 // Just need first seller
      });

      if (products.length === 0 || !products[0]?.seller?.User) {
        return NextResponse.json(
          { error: 'Product or seller not found' },
          { status: 404 }
        );
      }

      const seller = products[0].seller.User;
      originPostalCode = seller.postalCode || '1012AB'; // Default to Amsterdam if not set
      originCountry = seller.country || 'NL';
    }

    // Calculate weight and dimensions from products if not provided
    let calculatedWeight = weight;
    let calculatedDimensions = dimensions;

    if (!calculatedWeight || !calculatedDimensions) {
      if (items && Array.isArray(items) && items.length > 0) {
        // Default: 1kg per product, 30x20x10cm per product
        // TODO: Add weight/dimensions to Product model
        const totalItems = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
        calculatedWeight = totalItems * 1.0; // 1kg per item
        calculatedDimensions = {
          length: Math.max(30, Math.ceil(Math.sqrt(totalItems)) * 10), // Scale up for multiple items
          width: 20,
          height: Math.max(10, totalItems * 5), // Stack items
        };
      } else {
        // Fallback defaults
        calculatedWeight = 1.0;
        calculatedDimensions = { length: 30, width: 20, height: 10 };
      }
    }

    // Validate dimensions
    if (!calculatedDimensions.length || !calculatedDimensions.width || !calculatedDimensions.height) {
      return NextResponse.json(
        { error: 'Dimensions must include length, width, and height' },
        { status: 400 }
      );
    }

    // Calculate price using EctaroShip
    const priceRequest: EctaroShipPriceRequest = {
      weight: calculatedWeight,
      dimensions: {
        length: calculatedDimensions.length,
        width: calculatedDimensions.width,
        height: calculatedDimensions.height,
      },
      origin: {
        postalCode: originPostalCode,
        country: originCountry,
      },
      destination: {
        postalCode: destination.postalCode,
        country: destination.country,
      },
      carrier: carrier || undefined,
    };

    const result = await calculateShippingPrice(priceRequest);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Determine if international
    const isInternational = originCountry !== destination.country;

    return NextResponse.json({
      price: result.price,
      priceCents: Math.round(result.price * 100), // Convert to cents
      carrier: result.carrier,
      method: result.method,
      estimatedDays: result.estimatedDays,
      currency: result.currency,
      isInternational,
      origin: {
        postalCode: originPostalCode,
        country: originCountry,
      },
      destination: {
        postalCode: destination.postalCode,
        country: destination.country,
      },
    });

  } catch (error: any) {
    console.error('Error calculating shipping price:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping price', details: error.message },
      { status: 500 }
    );
  }
}
