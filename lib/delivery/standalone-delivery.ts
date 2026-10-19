import { randomUUID } from 'crypto';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { financialStripeSecret, stripe } from '@/lib/stripe';
import { recordCheckoutPaymentIncident } from '@/lib/payments/checkout-payment-incident';
import { calculateStripeFeeForBuyer } from '@/lib/fees';
import { getRouteDistance } from '@/lib/google-maps-distance';
import { calculateProviderDeliveryPrice } from '@/lib/delivery/provider-pricing';
import { isCommerciallyMatchableDeliverer } from '@/lib/delivery/delivery-eligibility';
import { splitDeliveryCommission } from '@/lib/delivery/quote-snapshot';
import { NotificationService } from '@/lib/notifications/notification-service';
import { ensureCourierPayable } from '@/lib/delivery/courier-payable';
import { courierListedInPilot, servicePilotDenial } from '@/lib/delivery/delivery-pilot-access';
import { createDeliveryBookingRequest } from '@/lib/delivery/booking-request-service';
import { assertCourierBookableAt } from '@/lib/delivery/standalone-availability';
import { standaloneBookingNotes } from '@/lib/delivery/standalone-booking-meta';
import type { ProviderAcceptanceProfile } from '@/lib/delivery/provider-acceptance';

const PAYMENT_WINDOW_MS = 20 * 60 * 1000;
const FULFILLABLE_STATUSES = new Set(['AWAITING_PAYMENT', 'CHECKOUT', 'PAID']);

/** Live fulfillment is allowed when the session mode matches the configured key. */
export function standalonePaymentModeMatches(
  livemode: boolean | null | undefined,
  secret: string | null,
) {
  if (typeof livemode !== 'boolean') return false;
  const testKey = !secret || secret.startsWith('sk_test_');
  return testKey ? livemode === false : livemode === true;
}

export type StandaloneQuoteInput = {
  requesterUserId: string;
  pickupAddress: string;
  deliveryAddress: string;
  itemDescription: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  /** Null means as soon as possible. */
  requestedPickupAt?: Date | null;
};

type CourierCard = {
  id: string;
  userId: string;
  name: string;
  place: string;
  vehicleType: string;
  deliveryRadius: number;
  distanceToSeller: number;
  distanceToBuyer: number;
  totalDeliveryDistance: number;
  rating: number;
  completedDeliveries: number;
  quotedFeeCents: number;
  calculatedDeliveryPrice: number;
  acceptanceMode: string;
  confirmationMode: string;
  availabilityBadge: { code: string; labelNl: string; labelEn: string };
  verification: boolean;
};

function asAcceptanceProfile(profile: {
  id: string;
  isActive: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  isOnline: boolean;
  onlineUntil: Date | null;
  pricingEnabled: boolean;
  baseFeeCents: number | null;
  pricePerKmCents: number | null;
  minimumFeeCents: number | null;
  age: number;
  maxDistance: number;
  nationalCoverage: boolean;
  temporaryOffline: boolean;
  vacationStart: Date | null;
  vacationEnd: Date | null;
  workStartTime: string | null;
  workEndTime: string | null;
  breakWindows: unknown;
  availableDays: string[];
  availableTimeSlots: string[];
  transportation: string[];
  acceptanceMode: string;
  dateOfBirth?: Date | null;
}): ProviderAcceptanceProfile {
  return {
    ...profile,
    dateOfBirth: profile.dateOfBirth,
  };
}

export async function createStandaloneQuote(input: StandaloneQuoteInput) {
  const pickupAddress = input.pickupAddress.trim();
  const deliveryAddress = input.deliveryAddress.trim();
  const itemDescription = input.itemDescription.trim();
  if (!pickupAddress || !deliveryAddress || !itemDescription) {
    return { ok: false as const, status: 400, code: 'MISSING_ADDRESS', error: 'Ophaaladres, afleveradres en omschrijving zijn verplicht.' };
  }
  const coords = [input.pickupLat, input.pickupLng, input.dropoffLat, input.dropoffLng];
  if (coords.some((value) => !Number.isFinite(value))) {
    return { ok: false as const, status: 400, code: 'MISSING_ADDRESS', error: 'Coördinaten zijn verplicht voor een lokale route.' };
  }
  const pilot = servicePilotDenial({ requesterUserId: input.requesterUserId, requireCourier: false });
  if (pilot) {
    return { ok: false as const, status: 403, code: pilot.code, error: 'HomeCheff-bezorging is beperkt tot de goedgekeurde pilot.' };
  }

  const route = await getRouteDistance(
    { lat: input.pickupLat, lng: input.pickupLng },
    { lat: input.dropoffLat, lng: input.dropoffLng },
    'driving',
  );
  if (!('distance' in route)) {
    return { ok: false as const, status: 422, code: 'DELIVERY_ROUTE_UNAVAILABLE', error: 'Routeafstand ontbreekt; prijs kan niet worden berekend.' };
  }

  const profiles = await prisma.deliveryProfile.findMany({
    where: {
      isActive: true,
      isVerified: true,
      isBlocked: false,
    },
    include: {
      user: { select: { id: true, name: true, dateOfBirth: true } },
    },
  });
  if (profiles.length === 0) {
    return { ok: false as const, status: 422, code: 'NO_COURIER', error: 'Geen bezorger beschikbaar.' };
  }

  const requestedAt = input.requestedPickupAt ?? new Date();
  if (Number.isNaN(requestedAt.getTime()) || requestedAt.getTime() < Date.now() - 5 * 60 * 1000) {
    return { ok: false as const, status: 400, code: 'INVALID_PICKUP_TIME', error: 'Kies een ophaalmoment in de toekomst, of laat het leeg voor zo snel mogelijk.' };
  }

  const couriers: CourierCard[] = [];
  const unavailable: Array<{ id: string; name: string; code: string }> = [];

  for (const profile of profiles) {
    const eligible = isCommerciallyMatchableDeliverer({
      isActive: profile.isActive,
      isVerified: profile.isVerified,
      isBlocked: profile.isBlocked,
      dateOfBirth: profile.user?.dateOfBirth,
      profileAge: profile.age,
    });
    if (!eligible) continue;
    if (!courierListedInPilot(profile.id, profile.user?.id)) continue;
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
      routeDistanceKm: route.distance,
      pickupCountryCode: 'NL',
      dropoffCountryCode: 'NL',
      providerCountryCode: 'NL',
    });
    if (!quote.ok) continue;
    const bookable = assertCourierBookableAt(
      asAcceptanceProfile({ ...profile, dateOfBirth: profile.user?.dateOfBirth }),
      requestedAt,
      quote.routeDistanceKm,
    );
    const name = profile.user.name?.trim() || 'Bezorgaanbieder';
    if (!bookable.ok) {
      unavailable.push({ id: profile.id, name, code: bookable.code });
      continue;
    }
    const vehicle = profile.transportation[0] || 'BIKE';
    couriers.push({
      id: profile.id,
      userId: profile.user.id,
      name,
      place: '',
      vehicleType: vehicle,
      deliveryRadius: profile.maxDistance,
      distanceToSeller: 0,
      distanceToBuyer: quote.routeDistanceKm,
      totalDeliveryDistance: quote.routeDistanceKm,
      rating: profile.averageRating ?? 0,
      completedDeliveries: profile.totalDeliveries,
      quotedFeeCents: quote.deliveryFeeCents,
      calculatedDeliveryPrice: quote.deliveryFeeCents,
      acceptanceMode: profile.acceptanceMode,
      confirmationMode: profile.acceptanceMode,
      availabilityBadge: {
        code: input.requestedPickupAt ? 'SCHEDULED' : 'NOW',
        labelNl: input.requestedPickupAt ? 'Beschikbaar op het gekozen moment' : 'Nu beschikbaar',
        labelEn: input.requestedPickupAt ? 'Available at the requested time' : 'Available now',
      },
      verification: profile.isVerified,
    });
  }

  couriers.sort((a, b) => a.name.localeCompare(b.name, 'nl'));
  return {
    ok: true as const,
    routeDistanceKm: route.distance,
    requestedPickupAt: input.requestedPickupAt?.toISOString() ?? null,
    couriers,
    unavailable,
  };
}

export async function bookStandaloneCourier(input: StandaloneQuoteInput & { deliveryProfileId: string }) {
  const listed = await createStandaloneQuote(input);
  if (!listed.ok) return listed;
  const selected = listed.couriers.find((courier) => courier.id === input.deliveryProfileId);
  if (!selected) {
    return {
      ok: false as const,
      status: 422,
      code: 'DELIVERY_PROVIDER_INELIGIBLE',
      error: 'Deze bezorger is niet beschikbaar voor het gekozen moment.',
    };
  }

  const profile = await prisma.deliveryProfile.findUnique({
    where: { id: selected.id },
    include: { user: { select: { name: true, dateOfBirth: true } } },
  });
  if (!profile) {
    return { ok: false as const, status: 422, code: 'NO_COURIER', error: 'Bezorger is niet meer beschikbaar.' };
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
    routeDistanceKm: listed.routeDistanceKm,
    pickupCountryCode: 'NL',
    dropoffCountryCode: 'NL',
    providerCountryCode: 'NL',
  });
  if (!quote.ok || quote.deliveryFeeCents !== selected.quotedFeeCents) {
    return { ok: false as const, status: 409, code: 'DELIVERY_QUOTE_CHANGED', error: 'De bezorgprijs is gewijzigd. Kies opnieuw.' };
  }
  const split = splitDeliveryCommission(quote.deliveryFeeCents);
  const buyerFee = calculateStripeFeeForBuyer(quote.deliveryFeeCents);
  const now = new Date();
  const requestId = randomUUID();
  const booking = await createDeliveryBookingRequest(prisma, {
    buyerId: input.requesterUserId,
    deliveryProfileId: profile.id,
    buyerLat: input.dropoffLat,
    buyerLng: input.dropoffLng,
    routeDistanceKm: quote.routeDistanceKm,
    quotedFeeCents: quote.deliveryFeeCents,
    notes: standaloneBookingNotes({
      standaloneRequestId: requestId,
      requestedPickupAt: input.requestedPickupAt ?? null,
      itemDescription: input.itemDescription.trim(),
    }),
    evaluateAt: input.requestedPickupAt ?? now,
    itemSummary: input.itemDescription.trim(),
  });
  if (!booking.ok) return booking;

  const row = await prisma.standaloneDeliveryRequest.create({
    data: {
      id: requestId,
      requesterUserId: input.requesterUserId,
      pickupAddress: input.pickupAddress.trim(),
      deliveryAddress: input.deliveryAddress.trim(),
      pickupLat: input.pickupLat,
      pickupLng: input.pickupLng,
      dropoffLat: input.dropoffLat,
      dropoffLng: input.dropoffLng,
      itemDescription: input.itemDescription.trim(),
      deliveryProfileId: profile.id,
      providerDisplayName: profile.user.name?.trim() || 'Bezorgaanbieder',
      quotedFeeCents: quote.deliveryFeeCents,
      stripeFeeCents: buyerFee.stripeFeeCents,
      buyerTotalCents: buyerFee.buyerTotalCents,
      routeDistanceKm: quote.routeDistanceKm,
      baseFeeCents: quote.breakdown.baseFeeCents,
      pricePerKmCents: quote.breakdown.pricePerKmCents,
      minimumFeeCents: quote.breakdown.minimumFeeCents,
      platformCommissionCents: split.platformCommissionCents,
      providerNetPayoutCents: split.providerNetPayoutCents,
      quoteExpiresAt: new Date(now.getTime() + PAYMENT_WINDOW_MS),
      requestedPickupAt: input.requestedPickupAt ?? null,
      bookingRequestId: booking.request.id,
      paymentStatus: 'UNPAID',
      status: booking.confirmed ? 'AWAITING_PAYMENT' : 'BOOKING_REQUESTED',
      updatedAt: now,
    },
  });

  return {
    ok: true as const,
    request: {
      id: row.id,
      status: row.status,
      bookingRequestId: booking.request.id,
      bookingStatus: booking.request.status,
      paymentAvailable: booking.confirmed === true,
      quotedFeeCents: row.quotedFeeCents,
      stripeFeeCents: row.stripeFeeCents,
      buyerTotalCents: row.buyerTotalCents,
      providerDisplayName: row.providerDisplayName,
      routeDistanceKm: row.routeDistanceKm,
    },
  };
}

async function revalidateStoredQuote(requestId: string) {
  const row = await prisma.standaloneDeliveryRequest.findUnique({ where: { id: requestId } });
  if (!row) return { ok: false as const, status: 404, code: 'NOT_FOUND', error: 'Offerte niet gevonden.' };
  const route = await getRouteDistance(
    { lat: row.pickupLat, lng: row.pickupLng },
    { lat: row.dropoffLat, lng: row.dropoffLng },
    'driving',
  );
  if (!('distance' in route)) {
    return { ok: false as const, status: 422, code: 'DELIVERY_ROUTE_UNAVAILABLE', error: 'Route is niet meer beschikbaar.' };
  }
  const profile = await prisma.deliveryProfile.findUnique({ where: { id: row.deliveryProfileId } });
  if (!profile) {
    return { ok: false as const, status: 422, code: 'NO_COURIER', error: 'Bezorger is niet meer beschikbaar.' };
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
    routeDistanceKm: route.distance,
    pickupCountryCode: 'NL',
    dropoffCountryCode: 'NL',
    providerCountryCode: 'NL',
  });
  if (!quote.ok || quote.deliveryFeeCents !== row.quotedFeeCents) {
    return {
      ok: false as const,
      status: 409,
      code: 'DELIVERY_QUOTE_CHANGED',
      error: 'De bezorgprijs is gewijzigd. Vraag een nieuwe offerte aan.',
      quotedFeeCents: quote.ok ? quote.deliveryFeeCents : null,
    };
  }
  return { ok: true as const, row };
}

export async function createStandaloneCheckout(input: {
  requesterUserId: string;
  requestId: string;
  origin: string;
  clientQuotedFeeCents?: number | null;
}) {
  const loaded = await revalidateStoredQuote(input.requestId);
  if (!loaded.ok) return loaded;
  const row = loaded.row;
  if (row.requesterUserId !== input.requesterUserId) {
    return { ok: false as const, status: 403, code: 'FORBIDDEN', error: 'Deze offerte hoort bij een andere gebruiker.' };
  }
  const courierUser = await prisma.deliveryProfile.findUnique({
    where: { id: row.deliveryProfileId },
    select: { userId: true },
  });
  const pilot = servicePilotDenial({
    requesterUserId: row.requesterUserId,
    courierProfileId: row.deliveryProfileId,
    courierUserId: courierUser?.userId,
  });
  if (pilot) {
    return { ok: false as const, status: 403, code: pilot.code, error: 'HomeCheff-bezorging is beperkt tot de goedgekeurde pilot.' };
  }
  if (!row.bookingRequestId) {
    return { ok: false as const, status: 409, code: 'DELIVERY_BOOKING_REQUIRED', error: 'Kies eerst een bezorger en wacht op bevestiging.' };
  }
  const booking = await prisma.deliveryBookingRequest.findUnique({ where: { id: row.bookingRequestId } });
  if (!booking || booking.buyerId !== row.requesterUserId || booking.deliveryProfileId !== row.deliveryProfileId) {
    return { ok: false as const, status: 403, code: 'FORBIDDEN', error: 'Deze boeking hoort niet bij deze aanvraag.' };
  }
  if (booking.status === 'PENDING' && booking.expiresAt.getTime() <= Date.now()) {
    await prisma.deliveryBookingRequest.update({
      where: { id: booking.id },
      data: { status: 'EXPIRED', updatedAt: new Date() },
    });
    await prisma.standaloneDeliveryRequest.update({
      where: { id: row.id },
      data: { status: 'EXPIRED', updatedAt: new Date() },
    });
    return { ok: false as const, status: 410, code: 'DELIVERY_BOOKING_EXPIRED', error: 'De bezorger heeft niet op tijd gereageerd. Kies een andere bezorger.' };
  }
  if (booking.status !== 'ACCEPTED' && booking.status !== 'AUTO_CONFIRMED') {
    return { ok: false as const, status: 409, code: 'DELIVERY_BOOKING_REQUIRED', error: 'Betalen kan pas nadat de gekozen bezorger heeft bevestigd.' };
  }
  const payable = await ensureCourierPayable(prisma, row.deliveryProfileId);
  if (!payable.ok) return payable;
  if (row.paymentStatus === 'PAID' || row.deliveryOrderId) {
    return { ok: false as const, status: 409, code: 'ALREADY_PAID', error: 'Deze bezorging is al betaald.' };
  }
  if (row.quoteExpiresAt.getTime() <= Date.now()) {
    return { ok: false as const, status: 409, code: 'QUOTE_EXPIRED', error: 'De offerte is verlopen. Vraag een nieuwe prijs aan.' };
  }
  if (
    input.clientQuotedFeeCents != null &&
    Number.isInteger(input.clientQuotedFeeCents) &&
    input.clientQuotedFeeCents !== row.quotedFeeCents
  ) {
    return {
      ok: false as const,
      status: 409,
      code: 'DELIVERY_QUOTE_CHANGED',
      error: 'Bezorgprijs is gewijzigd. Bevestig de nieuwe prijs.',
      quotedFeeCents: row.quotedFeeCents,
    };
  }

  const payableProfile = await prisma.deliveryProfile.findUnique({
    where: { id: row.deliveryProfileId },
    include: { user: { select: { dateOfBirth: true } } },
  });
  if (!payableProfile) {
    return { ok: false as const, status: 422, code: 'NO_COURIER', error: 'Bezorger is niet meer beschikbaar.' };
  }
  const stillBookable = assertCourierBookableAt(
    asAcceptanceProfile({ ...payableProfile, dateOfBirth: payableProfile.user?.dateOfBirth }),
    row.requestedPickupAt ?? new Date(),
    row.routeDistanceKm,
  );
  if (!stillBookable.ok) {
    return { ok: false as const, status: 422, code: stillBookable.code, error: 'De bezorger is niet meer beschikbaar op het gekozen moment.' };
  }
  if (!stripe) {
    return { ok: false as const, status: 503, code: 'STRIPE_UNAVAILABLE', error: 'Betalen is niet beschikbaar.' };
  }
  if (row.stripeSessionId) {
    const existing = await stripe.checkout.sessions.retrieve(row.stripeSessionId);
    if (existing.status === 'open' && existing.url) {
      return { ok: true as const, url: existing.url, sessionId: existing.id, buyerTotalCents: row.buyerTotalCents };
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    currency: 'eur',
    success_url: `${input.origin}/bezorging/aanvragen?betaald=1&request=${row.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/bezorging/aanvragen?geannuleerd=1&request=${row.id}`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: row.quotedFeeCents,
          product_data: {
            name: `Bezorgkosten — ${row.providerDisplayName}`,
            description: row.itemDescription.slice(0, 200),
          },
        },
      },
      ...(row.stripeFeeCents > 0
        ? [{
            quantity: 1,
            price_data: {
              currency: 'eur',
              unit_amount: row.stripeFeeCents,
              product_data: {
                name: 'Transactiekosten',
                description: 'Kosten voor betaalprovider Stripe',
              },
            },
          }]
        : []),
    ],
    metadata: {
      checkoutKind: 'STANDALONE_DELIVERY',
      standaloneRequestId: row.id,
      requesterUserId: row.requesterUserId,
      quotedFeeCents: String(row.quotedFeeCents),
      buyerTotalCents: String(row.buyerTotalCents),
      deliveryProfileId: row.deliveryProfileId,
    },
    payment_intent_data: {
      metadata: {
        checkoutKind: 'STANDALONE_DELIVERY',
        standaloneRequestId: row.id,
        requesterUserId: row.requesterUserId,
        deliveryProfileId: row.deliveryProfileId,
      },
    },
  });

  await prisma.standaloneDeliveryRequest.update({
    where: { id: row.id },
    data: { stripeSessionId: session.id, status: 'CHECKOUT', updatedAt: new Date() },
  });

  return { ok: true as const, url: session.url, sessionId: session.id, buyerTotalCents: row.buyerTotalCents };
}

type FulfillDeps = {
  db?: typeof prisma;
  stripeSecret?: string | null;
  notify?: (userId: string, deliveryOrderId: string, feeCents: number, distanceKm: number) => Promise<void>;
};

async function rememberUnfulfilledPayment(
  db: typeof prisma,
  session: Stripe.Checkout.Session,
  code: string,
  reason: string,
  buyerId?: string | null,
) {
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || null;
  await recordCheckoutPaymentIncident(db, {
    stripeSessionId: session.id,
    paymentIntentId,
    reason,
    code,
    buyerId: buyerId || null,
  });
  return { handled: true as const, ok: true as const, recovery: true as const };
}

export async function fulfillStandaloneDeliveryPayment(
  session: Stripe.Checkout.Session,
  deps: FulfillDeps = {},
) {
  const db = deps.db ?? prisma;
  if (session.metadata?.checkoutKind !== 'STANDALONE_DELIVERY') {
    return { handled: false as const };
  }
  if (session.payment_status !== 'paid') {
    return { handled: true as const, ok: true as const };
  }
  const secret = deps.stripeSecret === undefined ? financialStripeSecret() : deps.stripeSecret;
  if (!standalonePaymentModeMatches(session.livemode, secret)) {
    return rememberUnfulfilledPayment(
      db,
      session,
      'STRIPE_MODE_MISMATCH',
      'Betaalde Checkout-sessie hoort bij een andere Stripe-omgeving dan deze server.',
      session.metadata?.requesterUserId,
    );
  }
  const requestId = session.metadata.standaloneRequestId;
  if (!requestId) {
    return rememberUnfulfilledPayment(db, session, 'MISSING_REQUEST', 'Betaalde Checkout-sessie mist de bezorgaanvraag.');
  }
  const row = await db.standaloneDeliveryRequest.findUnique({ where: { id: requestId } });
  if (!row) {
    return rememberUnfulfilledPayment(
      db,
      session,
      'REQUEST_MISSING',
      'Betaalde Checkout-sessie verwijst naar een onbekende bezorgaanvraag.',
      session.metadata.requesterUserId,
    );
  }
  if (row.deliveryOrderId) {
    return { handled: true as const, ok: true as const, duplicate: true, deliveryOrderId: row.deliveryOrderId };
  }
  if (row.stripeSessionId && row.stripeSessionId !== session.id) {
    return rememberUnfulfilledPayment(db, session, 'SESSION_MISMATCH', 'Deze betaling hoort niet bij de opgeslagen Checkout-sessie.', row.requesterUserId);
  }
  if (session.metadata.requesterUserId !== row.requesterUserId) {
    return rememberUnfulfilledPayment(db, session, 'CUSTOMER_MISMATCH', 'De betaler hoort niet bij deze bezorgaanvraag.', row.requesterUserId);
  }
  if (session.metadata.deliveryProfileId && session.metadata.deliveryProfileId !== row.deliveryProfileId) {
    return rememberUnfulfilledPayment(db, session, 'COURIER_MISMATCH', 'De bezorger in de betaling hoort niet bij deze aanvraag.', row.requesterUserId);
  }
  if ((session.currency || '').toLowerCase() !== 'eur') {
    return rememberUnfulfilledPayment(db, session, 'CURRENCY_MISMATCH', 'De betaalvaluta is niet euro.', row.requesterUserId);
  }
  if (session.amount_total !== row.buyerTotalCents) {
    return rememberUnfulfilledPayment(db, session, 'AMOUNT_MISMATCH', 'Het betaalde bedrag wijkt af van de vastgelegde prijs.', row.requesterUserId);
  }
  if (!FULFILLABLE_STATUSES.has(row.status)) {
    return rememberUnfulfilledPayment(db, session, 'BOOKING_NOT_FULFILLABLE', 'De bezorgaanvraag staat niet meer open voor deze betaling.', row.requesterUserId);
  }

  const profile = await db.deliveryProfile.findUnique({
    where: { id: row.deliveryProfileId },
    select: { userId: true },
  });
  if (!profile) {
    return rememberUnfulfilledPayment(db, session, 'COURIER_MISSING', 'De bezorger van deze betaalde aanvraag bestaat niet meer.', row.requesterUserId);
  }

  const fulfilled = await db.$transaction(async (tx) => {
    const claimed = await tx.standaloneDeliveryRequest.updateMany({
      where: { id: row.id, deliveryOrderId: null },
      data: { paymentStatus: 'PAID', status: 'PAID', stripeSessionId: session.id, updatedAt: new Date() },
    });
    if (claimed.count !== 1) {
      const fresh = await tx.standaloneDeliveryRequest.findUnique({
        where: { id: row.id },
        select: { deliveryOrderId: true },
      });
      if (fresh?.deliveryOrderId) {
        return { duplicate: true as const, deliveryOrderId: fresh.deliveryOrderId };
      }
      throw new Error('standalone fulfillment claim lost before the delivery record was stored');
    }
    const deliveryOrder = await tx.deliveryOrder.create({
      data: {
        origin: 'STANDALONE',
        requesterUserId: row.requesterUserId,
        deliveryProfileId: row.deliveryProfileId,
        status: 'PENDING',
        deliveryFee: row.quotedFeeCents,
        quotedFeeCents: row.quotedFeeCents,
        deliveryAddress: row.deliveryAddress,
        pickupAddress: row.pickupAddress,
        itemDescription: row.itemDescription,
        providerDisplayNameSnapshot: row.providerDisplayName,
        pricingSource: 'PROVIDER',
        pricingFormulaVersion: 'provider-v1',
        pricingCurrency: 'EUR',
        routeDistanceKmSnapshot: row.routeDistanceKm,
        baseFeeCentsSnapshot: row.baseFeeCents,
        pricePerKmCentsSnapshot: row.pricePerKmCents,
        minimumFeeCentsSnapshot: row.minimumFeeCents,
        freeDeliveryRadiusKmSnapshot: 0,
        quoteLockedAt: row.createdAt,
      },
    });
    const txnId = `txn_delivery_${deliveryOrder.id}`;
    await tx.transaction.create({
      data: {
        id: txnId,
        buyerId: row.requesterUserId,
        sellerId: profile.userId,
        amountCents: row.quotedFeeCents,
        platformFeeBps: 1200,
        status: 'CAPTURED',
        provider: 'STRIPE',
        providerRef: session.id,
        updatedAt: new Date(),
      },
    });
    await tx.payout.create({
      data: {
        id: `payout_delivery_${deliveryOrder.id}`,
        transactionId: txnId,
        toUserId: profile.userId,
        amountCents: row.providerNetPayoutCents,
        providerRef: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      },
    });
    await tx.deliveryProfile.update({
      where: { id: row.deliveryProfileId },
      data: { totalEarnings: { increment: row.providerNetPayoutCents } },
    });
    await tx.standaloneDeliveryRequest.update({
      where: { id: row.id },
      data: { deliveryOrderId: deliveryOrder.id, updatedAt: new Date() },
    });
    return { duplicate: false as const, deliveryOrderId: deliveryOrder.id };
  });
  if (fulfilled.duplicate) {
    return { handled: true as const, ok: true as const, duplicate: true, deliveryOrderId: fulfilled.deliveryOrderId };
  }
  const deliveryOrder = { id: fulfilled.deliveryOrderId };

  try {
    if (deps.notify) {
      await deps.notify(profile.userId, deliveryOrder.id, row.quotedFeeCents, row.routeDistanceKm);
    } else {
      await NotificationService.sendDeliveryOrderAvailableNotification(
        profile.userId,
        deliveryOrder.id,
        deliveryOrder.id,
        'Zelfstandige bezorging',
        row.quotedFeeCents,
        row.routeDistanceKm,
        0,
      );
    }
  } catch (error) {
    console.warn('standalone courier notify failed', error);
  }

  return { handled: true as const, ok: true as const, deliveryOrderId: deliveryOrder.id };
}
