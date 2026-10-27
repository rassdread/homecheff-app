import type Stripe from 'stripe';
import { normalizeFulfillmentInput } from '@/lib/delivery/delivery-fulfillment-vocabulary';
import { deliveryDisabledBody } from '@/lib/delivery/delivery-deployment-gate';
import { deliveryAccessDeniedBody, evaluateDeliveryAccess, publicDeliveryIsClosed } from '@/lib/delivery/delivery-pilot-access';
import { ensureCourierPayable } from '@/lib/delivery/courier-payable';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { stripe } from '@/lib/stripe';
import { calculateStripeFeeForBuyer, DELIVERY_PLATFORM_FEE_PERCENT, DELIVERY_DELIVERER_PERCENT } from '@/lib/fees';
import { calculateDeliveryFee, calculateLongDistanceDeliveryFee } from '@/lib/deliveryPricing';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { assertAccountRequirementsOr403 } from '@/lib/account-requirements-server';
import { assertNotSuspended } from '@/lib/user-suspend';
import { getRouteDistance, isVerifiedRoadDistance, COMMERCIAL_DISTANCE_UNAVAILABLE } from '@/lib/google-maps-distance';
import { lockedBookingCheckoutPrice } from '@/lib/delivery/locked-booking-price';
import { calculateDistance } from '@/lib/geocoding';
import { validateCommunityOrderCheckoutItems } from '@/lib/marketplace/commerce/community-order-checkout';
import {
  ACTIVE_COMMUNITY_DELIVERY_STATUSES,
  assertOneSellerIds,
  courierBookingBlockedByCommunityDelivery,
  isCourierCheckoutMode,
} from '@/lib/checkout/fulfillment-phase1';
import {
  allRequestedProductsFound,
  cardCheckoutGateErrorKey,
  evaluateCardCheckoutGate,
  productSupportsRequestedDelivery,
} from '@/lib/checkout/card-checkout-guard';
import { lockCheckoutListings } from '@/lib/checkout/checkout-transaction';
import { resolveCentralUserId } from '@/lib/hc/marketplace-hc-order-service';
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
import { randomUUID } from 'crypto';
import { revalidateTag } from 'next/cache';
import { expireHoldReservations } from '@/lib/products/stock-reservation';
import {
  claimCheckoutSession,
  clearCheckoutSessionBinding,
  holdCheckoutStock,
} from '@/lib/products/courier-stock-hold';
import { planCheckoutSessionExpiration } from '@/lib/products/checkout-reservation-policy';
import { listingProductCacheTag } from '@/lib/marketplace/detail/listing-product-core';
import {
  buildAuthoritativeLineItems,
  evaluateCheckoutFloor,
  sumProductsTotalCents,
  CHECKOUT_MINIMUM_NOT_MET,
} from '@/lib/marketplace/checkout-floor';
import { readMarketplaceUtmFromCookies } from '@/lib/acquisition/read-marketplace-utm-cookie';
import { marketplaceUtmToStripeMetadata } from '@/lib/acquisition/utm-persistence';
import {
  assertClientShippingQuoteMatches,
  getAuthoritativeCarrierShippingQuote,
} from '@/lib/shipping/quote-service';
import { validateShippingAddressSnapshot } from '@/lib/shipping/address-snapshot';
import { evaluateMarketplaceEligibility } from '@/lib/age/marketplace-eligibility';
import { hasActiveParentalConsent } from '@/lib/age/parental-consent';


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
      street,
      houseNumber,
      postalCode,
      city,
      shippingMethodId,
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
        dateOfBirth: true,
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

    const buyerAge = evaluateMarketplaceEligibility({
      subject: { dateOfBirth: buyer.dateOfBirth },
      activity: 'BUY',
    });
    if (!buyerAge.allowed) {
      return NextResponse.json(
        { error: buyerAge.messageNl, code: buyerAge.code },
        { status: 403 },
      );
    }

    const buyerId = buyer.id;

    const agreementCheckout = typeof communityOrderId === 'string' && communityOrderId.length > 0;
    const requestedDeliveryMode = typeof deliveryMode === 'string' ? deliveryMode : '';

    if (agreementCheckout && isCourierCheckoutMode(requestedDeliveryMode)) {
      const activeCommunityDelivery = await prisma.deliveryRequest.findFirst({
        where: {
          communityOrderId,
          status: { in: [...ACTIVE_COMMUNITY_DELIVERY_STATUSES] },
        },
        select: { id: true },
      });
      if (
        courierBookingBlockedByCommunityDelivery({
          agreementCheckout: true,
          deliveryMode: requestedDeliveryMode,
          activeCommunityDelivery: Boolean(activeCommunityDelivery),
        })
      ) {
        return NextResponse.json(
          { errorKey: 'checkout.errors.activeCommunityDelivery' },
          { status: 409 },
        );
      }
    }

    if (agreementCheckout) {
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
    
    // Use transaction to atomically check stock and hold units for all products.
    // A courier hold created before acceptance is reused; it is not extended.
    let stockHoldId: string = randomUUID();
    let adoptedExistingHold = false;
    const stockCheckResult = await prisma.$transaction(async (tx) => {
      await lockCheckoutListings(tx, productIds);
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
                  city: true,
                  dateOfBirth: true,
                  createdAt: true,
                  sellerActivatedAt: true,
                  sellerRoles: true,
                }
              }
            }
          }
        }
      });

      if (!allRequestedProductsFound(items.length, products.length)) {
        return { error: 'Some products not found', products: null };
      }

      const buyerCentralUserId = await resolveCentralUserId(buyerId, tx);
      const cardGate = evaluateCardCheckoutGate({
        buyerUserId: buyerId,
        buyerCentralUserId,
        buyerStripeConnectAccountId: buyer.stripeConnectAccountId,
        products: products.map((product) => ({
          id: product.id,
          isActive: product.isActive,
          integrityStatus: product.integrityStatus,
          sellerUserId: product.seller?.userId ?? product.seller?.User?.id ?? null,
          sellerStripeConnectAccountId: product.seller?.User?.stripeConnectAccountId ?? null,
        })),
      });
      if (!cardGate.proceed) {
        return {
          error: cardGate.code,
          code: cardGate.code,
          errorKey: cardCheckoutGateErrorKey(cardGate.code),
          products: null,
        };
      }

      for (const productRow of products) {
        const sellerUser = productRow.seller?.User;
        if (!sellerUser) continue;
        const sellerSubject = {
          dateOfBirth: sellerUser.dateOfBirth,
          stripeConnectAccountId: sellerUser.stripeConnectAccountId,
          sellerActivatedAt: sellerUser.sellerActivatedAt,
          sellerRoles: sellerUser.sellerRoles,
          createdAt: sellerUser.createdAt,
          country: sellerUser.country,
          hasSellerProfile: true,
        };
        const category = productRow.marketplaceCategory || productRow.category;
        const stripePayoutReady = sellerPaymentsReady(sellerUser);
        const preview = evaluateMarketplaceEligibility({
          subject: sellerSubject,
          activity: 'RECEIVE_ORDERS',
          category,
          parentalConsentActive: true,
          stripePayoutReady,
        });
        if (preview.mode !== 'MINOR') {
          if (!preview.allowed) {
            return { error: preview.messageNl, products: null };
          }
          continue;
        }
        const consent = await hasActiveParentalConsent(tx, sellerUser.id);
        const decision = evaluateMarketplaceEligibility({
          subject: sellerSubject,
          activity: 'RECEIVE_ORDERS',
          category,
          parentalConsentActive: consent,
          stripePayoutReady,
        });
        if (!decision.allowed) {
          return { error: decision.messageNl, products: null };
        }
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
        const incompatibleProducts = products
          .filter((product) => !productSupportsRequestedDelivery(product.delivery, deliveryMode))
          .map((product) => product.title);
        
        if (incompatibleProducts.length > 0) {
          return { 
            error: `De geselecteerde bezorgoptie is niet beschikbaar voor: ${incompatibleProducts.join(', ')}`, 
            products: null 
          };
        }
      }

      const sellerGuard = assertOneSellerIds(
        products.map((product) => product.seller?.User?.id),
      );
      if (!sellerGuard.ok) {
        return {
          error: 'MULTIPLE_SELLERS',
          errorKey: 'checkout.errors.multipleSellers',
          products: null,
        };
      }

      const held = await holdCheckoutStock(tx, {
        items,
        buyerId,
        preliminaryHoldId: stockHoldId,
        bookingRequestId: typeof bookingRequestId === 'string' ? bookingRequestId : null,
        deliveryMode,
      });
      if (held.error) {
        return {
          error: held.error,
          errorKey: held.code,
          products: null,
          insufficientStock: held.insufficientStock,
        };
      }

      return {
        error: null,
        products,
        insufficientStock: held.insufficientStock,
        effectiveHoldId: held.effectiveHoldId,
        adoptedExistingHold: held.adoptedExistingHold,
        activeCheckoutSessionId: held.activeCheckoutSessionId,
      };
    });
    if (stockCheckResult.effectiveHoldId) {
      stockHoldId = stockCheckResult.effectiveHoldId;
    }
    adoptedExistingHold = Boolean(stockCheckResult.adoptedExistingHold);
    const activeCheckoutSessionId =
      'activeCheckoutSessionId' in stockCheckResult
        ? stockCheckResult.activeCheckoutSessionId
        : null;

    if (stockCheckResult.error) {
      const reservationCodes = new Set([
        'RESERVATION_EXPIRED',
        'PAYMENT_DEADLINE',
        'QTY_MISMATCH',
        'RESERVATION_ALREADY_CONFIRMED',
      ]);
      const reservationCode =
        'errorKey' in stockCheckResult ? stockCheckResult.errorKey : undefined;
      if (reservationCode && reservationCodes.has(reservationCode)) {
        return NextResponse.json(
          { error: stockCheckResult.error, code: reservationCode },
          { status: 409 },
        );
      }
      if (stockCheckResult.error === 'MULTIPLE_SELLERS') {
        return NextResponse.json(
          {
            error: stockCheckResult.error,
            errorKey: 'checkout.errors.multipleSellers',
          },
          { status: 409 },
        );
      }
      const payload: Record<string, unknown> = {
        error: stockCheckResult.error,
      };
      if ('errorKey' in stockCheckResult && stockCheckResult.errorKey) {
        payload.errorKey = stockCheckResult.errorKey;
      }
      if ('code' in stockCheckResult && stockCheckResult.code) {
        payload.code = stockCheckResult.code;
      }
      const clientErrors = new Set([
        'CONTACT_ONLY_NOT_CHECKOUT',
        'BARTER_ONLY_NOT_CHECKOUT',
        'PAYMENTS_NOT_READY',
        'LISTING_INACTIVE',
        'LISTING_INTEGRITY',
        'SELF_PURCHASE',
        'SHARED_CONNECT_DESTINATION',
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
    let carrierShippingQuoteMeta: Record<string, string> | null = null;
    const fulfillmentNorm = normalizeFulfillmentInput(deliveryMode);
    const isParcelShippingMode =
      fulfillmentNorm.canonical === 'PARCEL_SHIPPING' ||
      deliveryMode === 'SHIPPING' ||
      deliveryMode === 'PARCEL_SHIPPING';
    const flags = getDeliveryAlignmentFlags();
    const isLocalProviderMode =
      fulfillmentNorm.canonical === 'LOCAL_PROVIDER' ||
      deliveryMode === 'DELIVERY' ||
      deliveryMode === 'TEEN_DELIVERY' ||
      deliveryMode === 'LOCAL_PROVIDER';
    const isSellerDeliveryMode =
      fulfillmentNorm.canonical === 'SELLER_DELIVERY' ||
      deliveryMode === 'LOCAL_DELIVERY';

    if (isLocalProviderMode && publicDeliveryIsClosed()) {
      return NextResponse.json(deliveryDisabledBody(), { status: 403 });
    }
    if (isLocalProviderMode) {
      const access = evaluateDeliveryAccess({
        requesterUserId: buyerId,
        courierProfileId: typeof selectedProviderId === 'string' ? selectedProviderId : null,
      });
      if (!access.allowed) {
        return NextResponse.json(deliveryAccessDeniedBody(access.code), { status: 403 });
      }
    }

    let lockedBookingPrice: {
      quotedFeeCents: number;
      routeDistanceKm: number;
      lat: number;
      lng: number;
    } | null = null;

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
      const payable = await ensureCourierPayable(prisma, selectedProviderId);
      if (!payable.ok) {
        return NextResponse.json({ error: payable.error, code: payable.code }, { status: payable.status });
      }
      const lockedPrice = lockedBookingCheckoutPrice({
        quotedFeeCents: booking.quotedFeeCents,
        routeDistanceKm: booking.routeDistanceKm,
        buyerLat: booking.buyerLat,
        buyerLng: booking.buyerLng,
        bodyLat: coordinates?.lat,
        bodyLng: coordinates?.lng,
        clientQuoteCents,
      });
      if (!lockedPrice.ok) {
        return NextResponse.json(
          { error: lockedPrice.error, code: lockedPrice.code },
          { status: lockedPrice.status },
        );
      }
      lockedBookingPrice = lockedPrice;
      namedSelectionMeta = {
        namedProviderSelection: 'true',
        bookingRequestId: booking.id,
        deliveryProfileId: selectedProviderId,
        deliveryAcceptanceMode: booking.acceptanceModeSnapshot,
        fulfillmentMethod: 'LOCAL_PROVIDER',
      };
    }
    
    if (isLocalProviderMode || isSellerDeliveryMode) {
      const dropoff = lockedBookingPrice
        ? { lat: lockedBookingPrice.lat, lng: lockedBookingPrice.lng }
        : coordinates;
      if (!dropoff || !dropoff.lat || !dropoff.lng) {
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

      if (dropoff?.lat && dropoff?.lng) {
        const buyerCountryCode = normalizeCountryCode(country) || 'NL';
        
        let totalDistance = 0;
        let isInternationalDelivery = false;
        let sellerCountry = 'NL';
        let routeOk = false;
        
        let sawPickup = false;
        
        for (const item of items) {
          const product = products.find(p => p.id === item.productId);
          const pickup = resolveDeliveryPickupCoords(product);
          if (pickup) {
            sawPickup = true;
            sellerCountry =
              normalizeCountryCode(product?.seller?.User?.country) || 'NL';
            
            if (sellerCountry !== buyerCountryCode) {
              isInternationalDelivery = true;
            }
            
            const routeResult = await getRouteDistance(
              { lat: pickup.lat, lng: pickup.lng },
              { lat: dropoff.lat, lng: dropoff.lng },
              'driving'
            );
            
            if (isVerifiedRoadDistance(routeResult)) {
              totalDistance = Math.max(totalDistance, routeResult.distance);
              routeOk = true;
            }
          }
        }
        
        totalDistance = Math.round(totalDistance * 10) / 10;

        if (sawPickup && !routeOk) {
          return NextResponse.json(COMMERCIAL_DISTANCE_UNAVAILABLE, { status: 422 });
        }

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

          if (quote.ok && lockedBookingPrice) {
            quote.deliveryFeeCents = lockedBookingPrice.quotedFeeCents;
            quote.routeDistanceKm = lockedBookingPrice.routeDistanceKm;
          }

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
        return NextResponse.json(
          {
            error: 'Bezorgadres is vereist voordat een bezorgprijs kan worden berekend.',
            code: 'DELIVERY_ROUTE_UNAVAILABLE',
          },
          { status: 400 },
        );
      }
    }

    // ── HomeCheff parcel shipping (EctaroShip) — server-authoritative quote ──
    if (isParcelShippingMode) {
      const destValidation = validateShippingAddressSnapshot({
        name: session?.user?.name || 'Ontvanger',
        addressLine: address || [street, houseNumber].filter(Boolean).join(' '),
        street: typeof street === 'string' ? street : undefined,
        houseNumber: typeof houseNumber === 'string' ? houseNumber : undefined,
        postalCode:
          typeof postalCode === 'string'
            ? postalCode
            : typeof body.postalCode === 'string'
              ? body.postalCode
              : '',
        city: typeof city === 'string' ? city : '',
        country: typeof country === 'string' ? country : 'NL',
        email: session?.user?.email || undefined,
      });
      if (!destValidation.ok) {
        return NextResponse.json(
          { error: destValidation.error, code: destValidation.code },
          { status: 400 },
        );
      }

      const shippingQuote = await getAuthoritativeCarrierShippingQuote({
        items: items.map((item: { productId: string; quantity?: number }) => ({
          productId: item.productId,
          quantity: item.quantity || 1,
        })),
        destination: destValidation.address,
        buyerName: session?.user?.name || undefined,
        buyerEmail: session?.user?.email || undefined,
        shippingMethodId:
          typeof shippingMethodId === 'string' && shippingMethodId.trim()
            ? shippingMethodId.trim()
            : null,
      });

      if (!shippingQuote.ok) {
        return NextResponse.json(
          {
            error: shippingQuote.error,
            code: shippingQuote.code,
            products: shippingQuote.products?.map((p) => ({
              shippingMethodId: p.shippingMethodId,
              carrier: p.carrier,
              name: p.name,
              priceCents: p.priceCents,
              currency: p.currency,
              productId: p.productId,
            })),
          },
          { status: shippingQuote.status },
        );
      }

      const tamper = assertClientShippingQuoteMatches(
        clientQuoteCents,
        shippingQuote.priceCents,
      );
      if (!tamper.ok) {
        return NextResponse.json(
          {
            error: tamper.error,
            code: tamper.code,
            quotedFeeCents: tamper.quotedFeeCents,
          },
          { status: 409 },
        );
      }

      deliveryFeeCents = shippingQuote.priceCents;
      deliveryFeeBreakdown = {
        baseFee: shippingQuote.priceCents,
        distanceFee: 0,
        totalDeliveryFee: shippingQuote.priceCents,
        deliveryPersonCut: 0,
        homecheffCut: shippingQuote.priceCents,
        isInternational: false,
        pricingSource: 'ECTAROSHIP',
        carrier: shippingQuote.quote.carrier,
        method: shippingQuote.quote.method,
        shippingMethodId: shippingQuote.quote.shippingMethodId,
        quotedFeeCents: shippingQuote.priceCents,
        markupPercent: shippingQuote.quote.markupPercent,
      };
      carrierShippingQuoteMeta = {
        shippingProvider: 'ECTAROSHIP',
        shippingCostCents: String(shippingQuote.priceCents),
        shippingQuotedCents: String(shippingQuote.priceCents),
        shippingBuyerChargedCents: String(shippingQuote.priceCents),
        shippingCurrency: shippingQuote.quote.currency,
        shippingCarrier: shippingQuote.quote.carrier,
        shippingMethod: shippingQuote.quote.method,
        shippingMethodId: shippingQuote.quote.shippingMethodId,
        shippingProductId: shippingQuote.quote.productId || '',
        shippingQuotedAt: shippingQuote.quote.quotedAt,
        shippingQuoteSnapshot: JSON.stringify(shippingQuote.quote),
        shippingAddressSnapshot: JSON.stringify(shippingQuote.destination),
        shippingOriginSnapshot: JSON.stringify(shippingQuote.origin),
        fulfillmentMethod: 'PARCEL_SHIPPING',
      };
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

    // Add delivery / shipping fee as separate line item
    if (deliveryFeeCents > 0) {
      const deliveryLineName = providerQuoteSnapshot
        ? `Bezorgkosten — ${providerQuoteSnapshot.providerDisplayNameSnapshot}`
        : isParcelShippingMode
          ? 'Verzendkosten'
          : 'Bezorgkosten';
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: deliveryLineName,
            description: isParcelShippingMode
              ? `Verzending naar ${address || 'jouw adres'}`
              : `Bezorging naar ${address || 'jouw adres'}${deliveryFeeBreakdown ? ` (Basis: €${(deliveryFeeBreakdown.baseFee/100).toFixed(2)}, Afstand: €${(deliveryFeeBreakdown.distanceFee/100).toFixed(2)})` : ''}`,
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
      stockHoldId,
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
    if (carrierShippingQuoteMeta) {
      Object.assign(metadataBase, carrierShippingQuoteMeta);
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

    if (activeCheckoutSessionId && stripe) {
      const existing = await stripe.checkout.sessions.retrieve(activeCheckoutSessionId);
      const reuse = planCheckoutSessionExpiration(existing);
      if (reuse === 'EXPIRE') {
        return NextResponse.json({
          sessionId: existing.id,
          url: existing.url,
        });
      }
      if (reuse === 'SKIP_PAID' || reuse === 'SKIP_COMPLETE') {
        return NextResponse.json(
          {
            error: 'PAYMENT_ALREADY_SUBMITTED',
            code: 'PAYMENT_ALREADY_SUBMITTED',
            sessionId: existing.id,
          },
          { status: 409 },
        );
      }
      await clearCheckoutSessionBinding(prisma, {
        holdId: stockHoldId,
        sessionId: existing.id,
      });
    }

    let checkoutSession: Stripe.Checkout.Session;
    try {
      checkoutSession = await stripe.checkout.sessions.create(sessionParams);
    } catch (stripeError) {
      await prisma.$transaction(async (tx) => {
        if (!adoptedExistingHold) {
          await expireHoldReservations(
            tx as never,
            stockHoldId,
            items.map((item: { productId: string }) => item.productId),
          );
        }
      });
      throw stripeError;
    }

    for (const item of items as Array<{ productId: string }>) {
      revalidateTag(listingProductCacheTag(item.productId));
    }
    try {
      const claim = await claimCheckoutSession(prisma, {
        holdId: stockHoldId,
        sessionId: checkoutSession.id,
      });
      if (!claim.claimed && stripe) {
        if (checkoutSession.status === 'open') {
          await stripe.checkout.sessions.expire(checkoutSession.id).catch(() => undefined);
        }
        if (claim.activeSessionId && claim.activeSessionId !== checkoutSession.id) {
          const winner = await stripe.checkout.sessions.retrieve(claim.activeSessionId);
          if (planCheckoutSessionExpiration(winner) === 'EXPIRE') {
            return NextResponse.json({ sessionId: winner.id, url: winner.url });
          }
        }
        return NextResponse.json(
          { error: 'CHECKOUT_SESSION_SUPERSEDED', code: 'CHECKOUT_SESSION_SUPERSEDED' },
          { status: 409 },
        );
      }
    } catch (bindError) {
      console.error('[checkout] could not bind session to stock hold', bindError);
    }
    console.log(`✅ Stock holds ${stockHoldId} bound to session ${checkoutSession.id}`);

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