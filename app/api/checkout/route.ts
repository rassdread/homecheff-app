import type Stripe from 'stripe';
import { normalizeFulfillmentInput } from '@/lib/delivery/delivery-fulfillment-vocabulary';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { stripe } from '@/lib/stripe';
import { calculateStripeFeeForBuyer, DELIVERY_PLATFORM_FEE_PERCENT, DELIVERY_DELIVERER_PERCENT } from '@/lib/fees';
import { calculateDeliveryFee, calculateLongDistanceDeliveryFee } from '@/lib/deliveryPricing';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { assertAccountRequirementsOr403 } from '@/lib/account-requirements-server';
import { assertNotSuspended } from '@/lib/user-suspend';
import { getRouteDistance } from '@/lib/google-maps-distance';
import { calculateDistance } from '@/lib/geocoding';
import { validateCommunityOrderCheckoutItems } from '@/lib/marketplace/commerce/community-order-checkout';
import { resolveCheckoutBlockReason } from '@/lib/marketplace/settlement/settlement-router';
import { assertProductsAllergenConfirmationOr400 } from '@/lib/legal/assert-food-allergens-for-transaction';
import {
  isHomecheffCheckoutProduct,
  requiresStripeForHomecheffCheckout,
  sellerPaymentsReady,
} from '@/lib/product/order-method';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';
import { calculateProviderDeliveryPrice } from '@/lib/delivery/provider-pricing';
import { isCommerciallyMatchableDeliverer } from '@/lib/delivery/delivery-eligibility';
import { isProviderVisibleToBuyer } from '@/lib/delivery/delivery-cert-scope';
import {
  buildProviderQuoteSnapshot,
  providerQuoteToStripeMetadata,
  PRICING_SOURCE_PLATFORM_LEGACY,
  type ImmutableProviderQuoteSnapshot,
} from '@/lib/delivery/quote-snapshot';
import {
  expireStaleBookingRequests,
} from '@/lib/delivery/booking-request-service';
import { resolveDeliveryPickupCoords } from '@/lib/delivery/delivery-position';
import { normalizeCountryCode } from '@/lib/gamification/country-code';
import { requiresInventoryForCheckout } from '@/lib/proposals/proposal-stock-policy';
import { parseFulfillmentOptions } from '@/lib/marketplace/listing-taxonomy';
import {
  buildAuthoritativeLineItems,
  evaluateCheckoutFloor,
  sumProductsTotalCents,
  CHECKOUT_MINIMUM_NOT_MET,
} from '@/lib/marketplace/checkout-floor';
import { readMarketplaceUtmFromCookies } from '@/lib/acquisition/read-marketplace-utm-cookie';
import { marketplaceUtmToStripeMetadata } from '@/lib/acquisition/utm-persistence';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      items,
      deliveryMode, 
      address, 
      notes,
      pickupDate,
      deliveryDate,
      deliveryTime,
      coordinates, // { lat, lng } for delivery location
      country, // Buyer's country code
      enableSmsNotification, // SMS notification option for sellers
      communityOrderId,
      selectedDeliveryProfileId,
      deliveryProfileId,
      clientQuotedFeeCents,
      quotedFeeCents: clientQuotedFeeCentsAlias,
      bookingRequestId,
    } = body;

    const selectedProviderId =
      (typeof selectedDeliveryProfileId === 'string' && selectedDeliveryProfileId.trim()) ||
      (typeof deliveryProfileId === 'string' && deliveryProfileId.trim()) ||
      null;

    const clientQuoteCentsRaw =
      clientQuotedFeeCents ?? clientQuotedFeeCentsAlias;
    const clientQuoteCents =
      typeof clientQuoteCentsRaw === 'number' && Number.isFinite(clientQuoteCentsRaw)
        ? Math.round(clientQuoteCentsRaw)
        : typeof clientQuoteCentsRaw === 'string' && clientQuoteCentsRaw.trim() !== ''
          ? parseInt(clientQuoteCentsRaw, 10)
          : null;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Get session for buyer info
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get buyer with fields for account requirements (email verification, username, terms)
    const buyer = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        emailVerified: true,
        username: true,
        termsAccepted: true,
        passwordHash: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true,
        Account: { select: { provider: true } },
      },
    });

    if (!buyer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const suspendBlock = await assertNotSuspended(buyer.id, 'checkout');
    if (suspendBlock.blocked) {
      return NextResponse.json({ error: suspendBlock.message }, { status: 403 });
    }

    const checkoutBlock = assertAccountRequirementsOr403(buyer, 'postItem');
    if (checkoutBlock) return checkoutBlock;

    const buyerId = buyer.id;

    if (communityOrderId && typeof communityOrderId === 'string') {
      const dealValidation = await validateCommunityOrderCheckoutItems(
        communityOrderId,
        buyerId,
        items.map((item: { productId: string; quantity: number; priceCents: number }) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceCents: item.priceCents,
        })),
      );
      if (!dealValidation.ok) {
        return NextResponse.json(
          { errorKey: dealValidation.errorKey },
          { status: dealValidation.status },
        );
      }
    }

    // Get all products from cart with ATOMIC stock check to prevent race conditions
    const productIds = items.map((item: any) => item.productId);

    const allergenBlock = await assertProductsAllergenConfirmationOr400(productIds);
    if (allergenBlock) return allergenBlock;
    
    // Use transaction to atomically check stock for all products
    const stockCheckResult = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: { 
          seller: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  stripeConnectAccountId: true,
                  stripeConnectOnboardingCompleted: true,
                  lat: true,
                  lng: true,
                  place: true,
                  country: true,
                  postalCode: true,
                  address: true,
                  city: true
                }
              }
            }
          }
        }
      });

      if (products.length !== items.length) {
        return { error: 'Some products not found', products: null };
      }

      const contactOnlyProducts = products.filter(
        (p) =>
          resolveCheckoutBlockReason({
            acceptHomeCheffPayment: p.acceptHomeCheffPayment,
            acceptDirectContact: p.acceptDirectContact,
            orderMethod: p.orderMethod,
            barterOpenness: p.barterOpenness,
            acceptedSpecializations: p.acceptedSpecializations,
            // Negotiated proposal amounts may exceed listing.priceCents (ON_REQUEST €0).
            priceCents:
              items.find((i: { productId: string }) => i.productId === p.id)
                ?.priceCents ?? p.priceCents,
            priceModel: p.priceModel,
            listingIntent: p.listingIntent,
            sellerStripeReady: sellerPaymentsReady(p.seller?.User),
          }) === 'CONTACT_ONLY',
      );
      if (contactOnlyProducts.length > 0) {
        return {
          error: 'CONTACT_ONLY_NOT_CHECKOUT',
          errorKey: 'checkout.errors.contactOnly',
          products: null,
          contactOnlyProductIds: contactOnlyProducts.map((p) => p.id),
        };
      }

      const barterOnlyProducts = products.filter(
        (p) =>
          resolveCheckoutBlockReason({
            acceptHomeCheffPayment: p.acceptHomeCheffPayment,
            acceptDirectContact: p.acceptDirectContact,
            orderMethod: p.orderMethod,
            barterOpenness: p.barterOpenness,
            acceptedSpecializations: p.acceptedSpecializations,
            priceCents:
              items.find((i: { productId: string }) => i.productId === p.id)
                ?.priceCents ?? p.priceCents,
            priceModel: p.priceModel,
            listingIntent: p.listingIntent,
            sellerStripeReady: sellerPaymentsReady(p.seller?.User),
          }) === 'BARTER_ONLY',
      );
      if (barterOnlyProducts.length > 0) {
        return {
          error: 'BARTER_ONLY_NOT_CHECKOUT',
          errorKey: 'checkout.errors.barterOnly',
          products: null,
          barterOnlyProductIds: barterOnlyProducts.map((p) => p.id),
        };
      }

      const sellersWithoutPayments = products.filter((product) => {
        const dealPriceCents =
          items.find((i: { productId: string }) => i.productId === product.id)
            ?.priceCents ?? product.priceCents;
        return (
          resolveCheckoutBlockReason({
            acceptHomeCheffPayment: product.acceptHomeCheffPayment,
            acceptDirectContact: product.acceptDirectContact,
            orderMethod: product.orderMethod,
            barterOpenness: product.barterOpenness,
            acceptedSpecializations: product.acceptedSpecializations,
            priceCents: dealPriceCents,
            priceModel: product.priceModel,
            listingIntent: product.listingIntent,
            sellerStripeReady: sellerPaymentsReady(product.seller?.User),
          }) === 'PAYMENTS_NOT_READY'
        );
      });
      if (sellersWithoutPayments.length > 0) {
        return {
          error: 'PAYMENTS_NOT_READY',
          errorKey: 'checkout.errors.paymentsNotReady',
          products: null,
          sellerNames: sellersWithoutPayments.map(
            (p) => p.seller?.User?.name || 'Onbekend',
          ),
        };
      }

      // Validate delivery mode compatibility with products
      if (deliveryMode) {
        const deliveryModeUpper = deliveryMode.toUpperCase();
        const isPickup = deliveryModeUpper === 'PICKUP';
        const isDelivery =
          deliveryModeUpper === 'DELIVERY' ||
          deliveryModeUpper === 'LOCAL_DELIVERY' ||
          deliveryModeUpper === 'TEEN_DELIVERY' ||
          deliveryModeUpper === 'LOCAL_PROVIDER';
        const isShipping = deliveryModeUpper === 'SHIPPING';
        
        // Check if all products support the selected delivery mode
        const incompatibleProducts: string[] = [];
        for (const product of products) {
          const productDelivery = product.delivery;
          if (isPickup && productDelivery !== 'PICKUP' && productDelivery !== 'BOTH') {
            incompatibleProducts.push(product.title);
          } else if (isDelivery && productDelivery !== 'DELIVERY' && productDelivery !== 'BOTH') {
            incompatibleProducts.push(product.title);
          } else if (isShipping) {
            // TypeScript workaround: check if productDelivery is not SHIPPING or BOTH
            if (productDelivery !== 'BOTH' && productDelivery !== ('SHIPPING' as typeof productDelivery)) {
              incompatibleProducts.push(product.title);
            }
          }
        }
        
        if (incompatibleProducts.length > 0) {
          return { 
            error: `De geselecteerde bezorgoptie is niet beschikbaar voor: ${incompatibleProducts.join(', ')}`, 
            products: null 
          };
        }
      }

      // Check stock atomically for all items
      const insufficientStock: Array<{
        productId: string;
        requested: number;
        available: number;
        title: string;
      }> = [];

      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          insufficientStock.push({
            productId: item.productId,
            requested: item.quantity,
            available: 0,
            title: 'Onbekend product'
          });
          continue;
        }

        // Get current stock (atomically locked in transaction)
        const currentProduct = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            stock: true,
            maxStock: true,
            title: true,
            priceModel: true,
            marketplaceCategory: true,
            fulfillmentOptions: true,
          },
        });

        if (!currentProduct) {
          insufficientStock.push({
            productId: item.productId,
            requested: item.quantity,
            available: 0,
            title: product.title
          });
          continue;
        }

        const fulfillmentOptions = currentProduct.fulfillmentOptions
          ? parseFulfillmentOptions(currentProduct.fulfillmentOptions)
          : null;
        const inventoryRequired = requiresInventoryForCheckout({
          priceModel: currentProduct.priceModel,
          marketplaceCategory: currentProduct.marketplaceCategory,
          fulfillmentOptions,
        });

        // Negotiated ON_REQUEST / service / digital: accepted deal is entitlement.
        // Do not block (or reserve) on Product.stock.
        if (!inventoryRequired) {
          continue;
        }

        // Get reserved quantity (pending reservations that haven't expired)
        const reservedQuantity = await tx.stockReservation.aggregate({
          where: {
            productId: item.productId,
            status: 'PENDING',
            expiresAt: { gt: new Date() }
          },
          _sum: { quantity: true }
        });

        const reservedQty = reservedQuantity._sum.quantity || 0;

        const availableStock =
          typeof currentProduct.stock === 'number'
            ? currentProduct.stock
            : typeof currentProduct.maxStock === 'number'
              ? currentProduct.maxStock
              : null;

        if (availableStock !== null) {
          // Available stock = total stock - reserved stock
          const actuallyAvailable = availableStock - reservedQty;
          const isOutOfStock = actuallyAvailable <= 0;
          const exceedsAvailable = item.quantity > actuallyAvailable;
          if (isOutOfStock || exceedsAvailable) {
            insufficientStock.push({
              productId: item.productId,
              requested: item.quantity,
              available: Math.max(0, actuallyAvailable),
              title: currentProduct.title,
            });
          }
        }
      }

      return { error: null, products, insufficientStock };
    });

    if (stockCheckResult.error) {
      const payload: Record<string, unknown> = {
        error: stockCheckResult.error,
      };
      if ('errorKey' in stockCheckResult && stockCheckResult.errorKey) {
        payload.errorKey = stockCheckResult.errorKey;
      }
      const clientErrors = new Set([
        'CONTACT_ONLY_NOT_CHECKOUT',
        'BARTER_ONLY_NOT_CHECKOUT',
        'PAYMENTS_NOT_READY',
      ]);
      const status = clientErrors.has(stockCheckResult.error) ? 400 : 404;
      return NextResponse.json(payload, { status });
    }

    if (stockCheckResult.insufficientStock && stockCheckResult.insufficientStock.length > 0) {
      return NextResponse.json({
        error: 'Onvoldoende voorraad om deze bestelling te plaatsen.',
        insufficientStock: stockCheckResult.insufficientStock,
      }, { status: 409 });
    }

    const products = stockCheckResult.products!;
    
    // If delivery mode is TEEN_DELIVERY or DELIVERY, validate coordinates
    if (deliveryMode === 'DELIVERY' || deliveryMode === 'TEEN_DELIVERY' || deliveryMode === 'LOCAL_PROVIDER') {
      if (!coordinates || !coordinates.lat || !coordinates.lng) {
        return NextResponse.json(
          { error: 'Bezorgadres coördinaten zijn vereist voor bezorging' },
          { status: 400 }
        );
      }
    }

    const communityOrderValidated = Boolean(
      communityOrderId && typeof communityOrderId === 'string',
    );
    const authoritativeLineItems = buildAuthoritativeLineItems(
      items,
      products.map((p) => ({ id: p.id, priceCents: p.priceCents })),
      { communityOrderValidated },
    );
    const productsTotalCents = sumProductsTotalCents(authoritativeLineItems);

    // Calculate delivery fee if delivery is selected
    let deliveryFeeCents = 0;
    let deliveryFeeBreakdown: any = null;
    let providerQuoteSnapshot: ImmutableProviderQuoteSnapshot | null = null;
    let namedSelectionMeta: Record<string, string> | null = null;
    const fulfillmentNorm = normalizeFulfillmentInput(deliveryMode);
    const flags = getDeliveryAlignmentFlags();
    const isLocalProviderMode =
      fulfillmentNorm.canonical === 'LOCAL_PROVIDER' ||
      deliveryMode === 'DELIVERY' ||
      deliveryMode === 'TEEN_DELIVERY' ||
      deliveryMode === 'LOCAL_PROVIDER';
    const isSellerDeliveryMode =
      fulfillmentNorm.canonical === 'SELLER_DELIVERY' ||
      deliveryMode === 'LOCAL_DELIVERY';

    // Phase 3: named provider selection requires targeted provider + confirmed booking
    if (flags.namedProviderSelectionEnabled && isLocalProviderMode) {
      if (!selectedProviderId) {
        return NextResponse.json(
          {
            error: 'Kies een bezorgaanbieder (selectedDeliveryProfileId).',
            code: 'DELIVERY_PROVIDER_REQUIRED',
          },
          { status: 400 }
        );
      }
      if (!bookingRequestId || typeof bookingRequestId !== 'string') {
        return NextResponse.json(
          {
            error: 'Bevestigde boekingsaanvraag is vereist.',
            code: 'DELIVERY_BOOKING_REQUIRED',
          },
          { status: 400 }
        );
      }
      await expireStaleBookingRequests(prisma, [bookingRequestId]);
      const booking = await prisma.deliveryBookingRequest.findUnique({
        where: { id: bookingRequestId },
      });
      if (!booking || booking.buyerId !== buyerId) {
        return NextResponse.json(
          { error: 'Boekingsaanvraag niet gevonden.', code: 'DELIVERY_BOOKING_REQUIRED' },
          { status: 404 }
        );
      }
      if (booking.deliveryProfileId !== selectedProviderId) {
        return NextResponse.json(
          {
            error: 'Boekingsaanvraag hoort niet bij deze bezorger.',
            code: 'DELIVERY_PROVIDER_INELIGIBLE',
          },
          { status: 422 }
        );
      }
      if (
        booking.status !== 'ACCEPTED' &&
        booking.status !== 'AUTO_CONFIRMED'
      ) {
        return NextResponse.json(
          {
            error: 'Bezorger heeft nog niet bevestigd of aanvraag is verlopen.',
            code: 'DELIVERY_BOOKING_NOT_CONFIRMED',
            status: booking.status,
          },
          { status: 409 }
        );
      }
      namedSelectionMeta = {
        namedProviderSelection: 'true',
        bookingRequestId: booking.id,
        deliveryProfileId: selectedProviderId,
        deliveryAcceptanceMode: booking.acceptanceModeSnapshot,
        fulfillmentMethod: 'LOCAL_PROVIDER',
      };
    }
    
    if (isLocalProviderMode || isSellerDeliveryMode) {
      if (!coordinates || !coordinates.lat || !coordinates.lng) {
        if (isLocalProviderMode && flags.providerPricingEnabled) {
          return NextResponse.json(
            {
              error: 'Bezorgadres coördinaten zijn vereist voor bezorging',
              code: 'DELIVERY_ROUTE_UNAVAILABLE',
            },
            { status: 400 }
          );
        }
      }

      if (coordinates) {
        const buyerCountryCode = normalizeCountryCode(country) || 'NL';
        
        let totalDistance = 0;
        let isInternationalDelivery = false;
        let sellerCountry = 'NL';
        let routeOk = false;
        
        for (const item of items) {
          const product = products.find(p => p.id === item.productId);
          const pickup = resolveDeliveryPickupCoords(product);
          if (pickup) {
            sellerCountry =
              normalizeCountryCode(product?.seller?.User?.country) || 'NL';
            
            if (sellerCountry !== buyerCountryCode) {
              isInternationalDelivery = true;
            }
            
            const routeResult = await getRouteDistance(
              { lat: pickup.lat, lng: pickup.lng },
              { lat: coordinates.lat, lng: coordinates.lng },
              'driving'
            );
            
            if ('distance' in routeResult) {
              totalDistance = Math.max(totalDistance, routeResult.distance);
              routeOk = true;
            } else if (!(flags.providerPricingEnabled && isLocalProviderMode)) {
              console.warn('Route distance calculation failed, using fallback');
            }
          }
        }
        
        totalDistance = Math.round(totalDistance * 10) / 10;

        // --- Provider-owned pricing (flag on + LOCAL_PROVIDER) ---
        if (flags.providerPricingEnabled && isLocalProviderMode) {
          if (!routeOk) {
            return NextResponse.json(
              {
                error: 'Routeafstand ontbreekt; prijs kan niet worden berekend.',
                code: 'DELIVERY_ROUTE_UNAVAILABLE',
              },
              { status: 422 }
            );
          }

          if (!selectedProviderId) {
            return NextResponse.json(
              {
                error: 'Bezorgaanbieder is vereist (selectedDeliveryProfileId).',
                code: 'DELIVERY_PROVIDER_REQUIRED',
              },
              { status: 400 }
            );
          }

          const profile = await prisma.deliveryProfile.findUnique({
            where: { id: selectedProviderId },
            select: {
              id: true,
              isActive: true,
              isVerified: true,
              isBlocked: true,
              age: true,
              maxDistance: true,
              pricingEnabled: true,
              baseFeeCents: true,
              pricePerKmCents: true,
              minimumFeeCents: true,
              freeDeliveryRadiusKm: true,
              currency: true,
              nationalCoverage: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  dateOfBirth: true,
                },
              },
            },
          });

          if (!profile) {
            return NextResponse.json(
              {
                error: 'Bezorgaanbieder niet gevonden.',
                code: 'DELIVERY_PROVIDER_REQUIRED',
              },
              { status: 404 }
            );
          }

          const eligible = isCommerciallyMatchableDeliverer({
            isActive: profile.isActive,
            isVerified: profile.isVerified,
            isBlocked: profile.isBlocked,
            dateOfBirth: profile.user?.dateOfBirth,
            profileAge: profile.age,
          });

          if (!eligible) {
            return NextResponse.json(
              {
                error: 'Bezorgaanbieder is niet beschikbaar voor deze bestelling.',
                code: 'DELIVERY_PROVIDER_INELIGIBLE',
              },
              { status: 422 }
            );
          }

          if (
            !isProviderVisibleToBuyer({
              providerUserId: profile.user?.id ?? '',
              buyerUserId: session?.user?.id ?? null,
            })
          ) {
            return NextResponse.json(
              {
                error: 'Bezorgaanbieder is niet beschikbaar voor deze bestelling.',
                code: 'DELIVERY_PROVIDER_CERT_SCOPE',
              },
              { status: 422 }
            );
          }

          const quote = calculateProviderDeliveryPrice({
            pricing: {
              pricingEnabled: profile.pricingEnabled,
              baseFeeCents: profile.baseFeeCents,
              pricePerKmCents: profile.pricePerKmCents,
              minimumFeeCents: profile.minimumFeeCents,
              freeDeliveryRadiusKm: profile.freeDeliveryRadiusKm,
              maxDistanceKm: profile.maxDistance,
              currency: profile.currency,
              nationalCoverage: profile.nationalCoverage,
            },
            routeDistanceKm: totalDistance,
            pickupCountryCode: sellerCountry,
            dropoffCountryCode: buyerCountryCode,
            providerCountryCode: sellerCountry,
          });

          if (!quote.ok) {
            const status =
              quote.code === 'DELIVERY_OUT_OF_RADIUS' ||
              quote.code === 'DELIVERY_ROUTE_UNAVAILABLE'
                ? 422
                : 400;
            return NextResponse.json(
              { error: quote.error, code: quote.code },
              { status }
            );
          }

          if (
            clientQuoteCents != null &&
            Number.isInteger(clientQuoteCents) &&
            clientQuoteCents !== quote.deliveryFeeCents
          ) {
            return NextResponse.json(
              {
                error: 'Bezorgprijs is gewijzigd. Bevestig de nieuwe prijs.',
                code: 'DELIVERY_QUOTE_CHANGED',
                quotedFeeCents: quote.deliveryFeeCents,
                routeDistanceKm: quote.routeDistanceKm,
              },
              { status: 409 }
            );
          }

          const displayName =
            profile.user?.name?.trim() || 'Bezorgaanbieder';
          providerQuoteSnapshot = buildProviderQuoteSnapshot({
            deliveryProfileId: profile.id,
            providerDisplayName: displayName,
            quote,
          });

          deliveryFeeCents = providerQuoteSnapshot.quotedFeeCents;
          deliveryFeeBreakdown = {
            baseFee: quote.breakdown.baseFeeCents,
            distanceFee: quote.breakdown.distanceFeeCents,
            totalDeliveryFee: quote.deliveryFeeCents,
            deliveryPersonCut: providerQuoteSnapshot.providerNetPayoutCents,
            homecheffCut: providerQuoteSnapshot.platformCommissionCents,
            distance: quote.routeDistanceKm,
            isInternational: isInternationalDelivery,
            sellerCountry,
            buyerCountry: buyerCountryCode,
            pricingSource: 'PROVIDER',
            pricingFormulaVersion: providerQuoteSnapshot.pricingFormulaVersion,
            quotedFeeCents: providerQuoteSnapshot.quotedFeeCents,
            baseFeeCents: quote.breakdown.baseFeeCents,
            pricePerKmCents: quote.breakdown.pricePerKmCents,
            minimumFeeCents: quote.breakdown.minimumFeeCents,
            freeDeliveryRadiusKm: quote.breakdown.freeDeliveryRadiusKm,
            deliveryProfileId: profile.id,
            providerDisplayName: displayName,
          };
        } else {
          // --- Legacy platform / seller path (flag off or seller delivery) ---
          const deliveryType = isSellerDeliveryMode
            ? 'SELLER_DELIVERY'
            : 'PLATFORM_DELIVERERS';
          
          let pricing;
          if (isInternationalDelivery || totalDistance > 30) {
            pricing = calculateLongDistanceDeliveryFee(totalDistance);
            if (isInternationalDelivery) {
              const internationalSurcharge = 500;
              pricing.totalDeliveryFee += internationalSurcharge;
              pricing.distanceFee += internationalSurcharge;
              pricing.delivererCut = Math.round(pricing.totalDeliveryFee * DELIVERY_DELIVERER_PERCENT / 100);
              pricing.platformCut = Math.round(pricing.totalDeliveryFee * DELIVERY_PLATFORM_FEE_PERCENT / 100);
            }
          } else {
            pricing = calculateDeliveryFee(totalDistance, deliveryType);
          }
          
          deliveryFeeCents = pricing.totalDeliveryFee;
          deliveryFeeBreakdown = {
            baseFee: pricing.baseFee,
            distanceFee: pricing.distanceFee,
            totalDeliveryFee: pricing.totalDeliveryFee,
            deliveryPersonCut: pricing.delivererCut,
            homecheffCut: pricing.platformCut,
            distance: totalDistance,
            isInternational: isInternationalDelivery,
            sellerCountry: sellerCountry,
            buyerCountry: buyerCountryCode,
            pricingSource: PRICING_SOURCE_PLATFORM_LEGACY,
            breakdown: pricing.breakdown
          };
        }
      } else if (!(flags.providerPricingEnabled && isLocalProviderMode)) {
        // Legacy fallback if no coordinates (never for provider-priced path)
        deliveryFeeCents = 250;
        deliveryFeeBreakdown = {
          baseFee: 250,
          distanceFee: 0,
          totalDeliveryFee: 250,
          deliveryPersonCut: Math.round(250 * DELIVERY_DELIVERER_PERCENT / 100),
          homecheffCut: Math.round(250 * DELIVERY_PLATFORM_FEE_PERCENT / 100),
          isInternational: false,
          pricingSource: PRICING_SOURCE_PLATFORM_LEGACY,
        };
      }
    }

    // Calculate SMS notification cost
    const smsCostPerSellerCents = 6;
    const uniqueSellerIds = new Set(items.map((item: any) => item.sellerId).filter(Boolean));
    const smsNotificationCostCents = enableSmsNotification ? smsCostPerSellerCents * uniqueSellerIds.size : 0;
    
    const subtotalCents = productsTotalCents + deliveryFeeCents + smsNotificationCostCents;

    const checkoutFloor = evaluateCheckoutFloor({
      lineItems: authoritativeLineItems,
      deliveryFeeCents,
      smsNotificationCostCents,
    });
    if (!checkoutFloor.eligible) {
      return NextResponse.json(
        {
          code: CHECKOUT_MINIMUM_NOT_MET,
          errorKey: checkoutFloor.errorKey,
          minimumCents: checkoutFloor.minimumCents,
          eligibleBaseCents: checkoutFloor.eligibleBaseCents,
        },
        { status: 400 },
      );
    }

    const { buyerTotalCents, stripeFeeCents } = calculateStripeFeeForBuyer(subtotalCents);

    // Create Stripe checkout session
    if (!stripe) {
      // Return mock session for development
      return NextResponse.json({
        sessionId: `cs_test_${Date.now()}`,
        url: `/payment/success?session_id=cs_test_${Date.now()}`
      });
    }
    
    // Create line items for each product
    const lineItems = items.map((item: any) => {
      const authLine = authoritativeLineItems.find((l) => l.productId === item.productId);
      const unitAmount = authLine?.unitPriceCents ?? item.priceCents;
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.title,
            description: `Quantity: ${item.quantity} - Sold by ${item.sellerName}`,
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      };
    });

    // Add delivery fee as separate line item
    if (deliveryFeeCents > 0) {
      const deliveryLineName = providerQuoteSnapshot
        ? `Bezorgkosten — ${providerQuoteSnapshot.providerDisplayNameSnapshot}`
        : 'Bezorgkosten';
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: deliveryLineName,
            description: `Bezorging naar ${address || 'jouw adres'}${deliveryFeeBreakdown ? ` (Basis: €${(deliveryFeeBreakdown.baseFee/100).toFixed(2)}, Afstand: €${(deliveryFeeBreakdown.distanceFee/100).toFixed(2)})` : ''}`,
          },
          unit_amount: deliveryFeeCents,
        },
        quantity: 1,
      });
    }

    // Add SMS notification cost if enabled
    if (smsNotificationCostCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'SMS Notificatie voor verkopers',
            description: `SMS notificatie voor ${uniqueSellerIds.size} verkoper${uniqueSellerIds.size > 1 ? 's' : ''} bij nieuwe bestelling`,
          },
          unit_amount: smsNotificationCostCents,
        },
        quantity: 1,
      });
    }

    if (stripeFeeCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Transactiekosten',
            description: 'Kosten voor betaalprovider Stripe',
          },
          unit_amount: stripeFeeCents,
        },
        quantity: 1,
      });
    }

    // Check if all sellers have Stripe Connect accounts (only sellers need this, not buyers)
    // A buyer can be anyone (no Stripe Connect required)
    // Only the sellers need Stripe Connect to receive payouts
    const sellersWithoutConnect = products.filter(product => {
      const dealPriceCents =
        items.find((i: { productId: string }) => i.productId === product.id)
          ?.priceCents ?? product.priceCents;
      // Listing ON_REQUEST (€0) + negotiated deal price still needs Connect.
      const needsConnect =
        requiresStripeForHomecheffCheckout(product) ||
        (isHomecheffCheckoutProduct(product) &&
          typeof dealPriceCents === 'number' &&
          dealPriceCents > 0);
      if (!needsConnect) return false;
      const hasSellerProfile = product.seller && product.seller.User;
      if (!hasSellerProfile) return false;
      return !sellerPaymentsReady(product.seller?.User);
    });

    if (sellersWithoutConnect.length > 0) {
      return NextResponse.json({
        error: 'PAYMENTS_NOT_READY',
        errorKey: 'checkout.errors.paymentsNotReady',
        messageKey: 'checkout.errors.paymentsNotReady',
        sellersNeedConnect: true,
        sellers: sellersWithoutConnect.map(p => ({
          id: p.seller?.User?.id,
          name: p.seller?.User?.name,
        }))
      }, { status: 400 });
    }

    // For now, use regular checkout (not Connect) since we handle payouts in webhook
    // Note: Connect checkout with application_fee is handled via webhook for better control
    const compactItemStrings = items.map((item: any) => {
      const sellerId = item.sellerId || '';
      const authLine = authoritativeLineItems.find((l) => l.productId === item.productId);
      const unitAmount = authLine?.unitPriceCents ?? item.priceCents;
      return `${item.productId}|${item.quantity}|${unitAmount}|${sellerId}`;
    });

    const metadataItemChunks: Record<string, string> = {};
    if (compactItemStrings.length > 0) {
      let chunk = '';
      let chunkIndex = 1;

      const flushChunk = () => {
        if (chunk) {
          metadataItemChunks[`items_compact_${chunkIndex}`] = chunk;
          chunk = '';
          chunkIndex += 1;
        }
      };

      compactItemStrings.forEach((encoded) => {
        const candidate = chunk ? `${chunk};${encoded}` : encoded;
        if (candidate.length > 450) {
          flushChunk();
          chunk = encoded;
        } else {
          chunk = candidate;
        }
      });
      flushChunk();
    }

    const metadataBase: Record<string, string> = {
      buyerId,
      deliveryMode,
      address: address || '',
      notes: notes || '',
      pickupDate: pickupDate || '',
      deliveryDate: deliveryDate || '',
      deliveryTime: deliveryTime || '',
      productsTotalCents: productsTotalCents.toString(),
      deliveryFeeCents: deliveryFeeCents.toString(),
      stripeFeeCents: stripeFeeCents.toString(),
      amountPaidCents: buyerTotalCents.toString(),
      subtotalCents: subtotalCents.toString(),
      checkoutEligibleBaseCents: checkoutFloor.eligibleBaseCents.toString(),
      enableSmsNotification: enableSmsNotification ? 'true' : 'false',
      smsNotificationCostCents: smsNotificationCostCents.toString(),
    };

    if (communityOrderId && typeof communityOrderId === 'string') {
      metadataBase.communityOrderId = communityOrderId;
    }

    if (deliveryFeeBreakdown) {
      metadataBase.deliveryFeeBreakdown = JSON.stringify(deliveryFeeBreakdown);
    }
    if (coordinates) {
      metadataBase.coordinates = JSON.stringify(coordinates);
    }
    if (providerQuoteSnapshot) {
      Object.assign(metadataBase, providerQuoteToStripeMetadata(providerQuoteSnapshot));
    } else if (
      deliveryFeeCents > 0 &&
      (isLocalProviderMode || isSellerDeliveryMode)
    ) {
      metadataBase.deliveryPricingSource = PRICING_SOURCE_PLATFORM_LEGACY;
    }
    if (namedSelectionMeta) {
      Object.assign(metadataBase, namedSelectionMeta);
    }
    if (
      flags.namedProviderSelectionEnabled &&
      isLocalProviderMode &&
      selectedProviderId &&
      !metadataBase.deliveryProfileId
    ) {
      metadataBase.deliveryProfileId = selectedProviderId;
    }

    // First-party acquisition UTMs (hc_marketplace_utm_v1) — separate from affiliate hc_ref
    const acquisitionUtm = await readMarketplaceUtmFromCookies();
    Object.assign(metadataBase, marketplaceUtmToStripeMetadata(acquisitionUtm));

    // Default payment methods - only include methods that are commonly available
    // Note: Sofort was discontinued on March 31, 2025 and integrated into Klarna Pay Now
    // Users can override via STRIPE_PAYMENT_METHOD_TYPES env variable if needed
    const defaultPaymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = [
      'card',        // Most widely supported - works everywhere
      'ideal',       // Popular in Netherlands - Stripe will filter if not configured
      'bancontact',  // Popular in Belgium - Stripe will filter if not configured
      // Removed: 'sofort' - discontinued as of March 31, 2025 (now part of Klarna Pay Now)
      // Removed: 'giropay', 'eps', 'p24' - require specific account configuration
      // Removed: 'sepa_debit' - requires additional setup
    ];

    const configuredPaymentMethodTypes = process.env.STRIPE_PAYMENT_METHOD_TYPES
      ? process.env.STRIPE_PAYMENT_METHOD_TYPES.split(',')
          .map((type) => type.trim())
          .filter(Boolean)
      : null;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/checkout`,
      metadata: {
        ...metadataBase,
        ...metadataItemChunks,
      },
    };

    sessionParams.payment_method_types =
      configuredPaymentMethodTypes && configuredPaymentMethodTypes.length > 0
        ? (configuredPaymentMethodTypes as Stripe.Checkout.SessionCreateParams.PaymentMethodType[])
        : defaultPaymentMethodTypes;

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    // Create stock reservations for all items with stock management (15 minute expiry)
    const reservationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    try {
      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          // Only create reservation if product has inventory-managed stock
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: {
              stock: true,
              maxStock: true,
              priceModel: true,
              marketplaceCategory: true,
              fulfillmentOptions: true,
            },
          });

          if (!product) continue;

          const fulfillmentOptions = product.fulfillmentOptions
            ? parseFulfillmentOptions(product.fulfillmentOptions)
            : null;
          if (
            !requiresInventoryForCheckout({
              priceModel: product.priceModel,
              marketplaceCategory: product.marketplaceCategory,
              fulfillmentOptions,
            })
          ) {
            continue;
          }

          if (product.stock !== null || product.maxStock !== null) {
            await tx.stockReservation.create({
              data: {
                productId: item.productId,
                stripeSessionId: checkoutSession.id,
                quantity: item.quantity,
                expiresAt: reservationExpiry,
                status: 'PENDING'
              }
            });
          }
        }
      });
      console.log(`✅ Stock reservations created for session ${checkoutSession.id}`);
    } catch (reservationError: any) {
      console.error(`❌ Failed to create stock reservations:`, reservationError);
      // Don't fail checkout if reservation fails - webhook will handle stock check
    }

    // Check delivery availability if delivery is requested
    // Named-provider + confirmed booking already validated the selected provider;
    // do not require public pool availability (blocks private cert / single-provider flows).
    const skipPoolAvailabilityCheck = Boolean(
      selectedProviderId && bookingRequestId && providerQuoteSnapshot,
    );
    if (
      !skipPoolAvailabilityCheck &&
      (deliveryMode === 'DELIVERY' ||
        deliveryMode === 'TEEN_DELIVERY' ||
        deliveryMode === 'LOCAL_PROVIDER') &&
      coordinates
    ) {
      try {
        // Check if delivery is available in the area
        // Note: maxRadius parameter is not used - each deliverer has their own maxDistance
        const availabilityResponse = await fetch(`${req.nextUrl.origin}/api/delivery/check-availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: coordinates.lat,
            lng: coordinates.lng,
            deliveryDate,
            deliveryTime
          })
        });

        const availabilityData = await availabilityResponse.json();
        
        if (!availabilityData.isAvailable) {
          return NextResponse.json({
            error: 'Bezorging is momenteel niet beschikbaar in jouw regio. Probeer het later opnieuw of kies voor afhalen.',
            deliveryUnavailable: true
          }, { status: 400 });
        }

        // Store availability info in metadata for later use       
        if (checkoutSession.metadata) {
          checkoutSession.metadata.deliveryAvailable = 'true';       
          checkoutSession.metadata.availableDeliverers = availabilityData.availableCount?.toString() || '0';                                            
          checkoutSession.metadata.estimatedDeliveryTime = availabilityData.estimatedDeliveryTime?.toString() || '';
        }

      } catch (error) {
        console.error('Delivery availability check failed:', error);
        // Continue with checkout but mark delivery as potentially unavailable
        if (checkoutSession.metadata) {
          checkoutSession.metadata.deliveryCheckFailed = 'true';
        }
      }
    }

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    const message =
      typeof error?.message === 'string'
        ? error.message
        : 'Unexpected error while creating checkout session';
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: message,
      },
      { status: 500 }
    );
  }
}