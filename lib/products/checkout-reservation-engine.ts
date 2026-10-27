/**
 * In-memory model of the checkout reservation rules.
 * Route handlers persist the same transitions. Tests drive this engine
 * so the races can be proven without a database or Stripe.
 */

import {
  IMMEDIATE_COURIER_RESPONSE_MS,
  PAYMENT_WINDOW_MS,
  RESERVATION_COPY,
  courierProductHoldApplies,
  courierResponseDeadline,
  evaluateStockConfirm,
  immediateHardHoldUntil,
  paymentDeadlineAfterAccept,
  scheduledBookingExposed,
  sellerStockLabel,
} from '@/lib/products/checkout-reservation-policy';

export type EngineReservation = {
  id: string;
  productId: string;
  buyerId: string;
  quantity: number;
  status: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
  phase: 'AWAITING_COURIER' | 'AWAITING_PAYMENT' | 'CHECKOUT';
  holdUntil: Date;
  expiresAt: Date;
  paymentDeadline: Date | null;
  bookingRequestId: string | null;
  checkoutSessionId: string | null;
  purchaseKey: string;
  usesInventory: boolean;
};

export type EngineBooking = {
  id: string;
  buyerId: string;
  courierId: string;
  productId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'AUTO_CONFIRMED' | 'CANCELLED' | 'CONSUMED';
  expiresAt: Date;
  quotedFeeCents: number;
  calendarHold: boolean;
};

export type EngineOrder = {
  id: string;
  buyerId: string;
  stripeSessionId: string;
  items: Array<{ productId: string; quantity: number }>;
};

export type EngineIncident = {
  stripeSessionId: string;
  code: string;
  status: 'REFUND_REQUIRED';
};

export type EngineNotice = {
  userId: string;
  kind: 'ACCEPTED' | 'REJECTED' | 'PAYMENT_REQUIRED' | 'EXPIRED';
};

type Product = {
  id: string;
  stock: number;
  usesInventory: boolean;
  sellerId: string;
};

export class CheckoutReservationEngine {
  now = new Date('2026-10-16T12:00:00.000Z');
  products = new Map<string, Product>();
  reservations: EngineReservation[] = [];
  bookings: EngineBooking[] = [];
  orders: EngineOrder[] = [];
  incidents: EngineIncident[] = [];
  notices: EngineNotice[] = [];
  sellerSoldNotices = 0;
  openPoolNotices = 0;
  settlementCalls = 0;
  courierSettlementCalls = 0;
  refundCalls = 0;
  sessions = new Map<string, { open: boolean; buyerId: string; holdPurchaseKey: string }>();
  private seq = 0;
  private chain: Promise<void> = Promise.resolve();

  addProduct(input: {
    id: string;
    stock: number;
    usesInventory?: boolean;
    sellerId?: string;
  }) {
    this.products.set(input.id, {
      id: input.id,
      stock: input.stock,
      usesInventory: input.usesInventory !== false,
      sellerId: input.sellerId || 'seller',
    });
  }

  private nextId(prefix: string) {
    this.seq += 1;
    return `${prefix}-${this.seq}`;
  }

  /** Serialize mutations so two buyers cannot both take the last unit. */
  lock<T>(fn: () => T): Promise<T> {
    const run = this.chain.then(() => fn());
    this.chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  available(productId: string): number {
    const product = this.products.get(productId);
    if (!product) return 0;
    if (!product.usesInventory) return Number.POSITIVE_INFINITY;
    const reserved = this.reservations
      .filter(
        (r) =>
          r.productId === productId &&
          r.status === 'PENDING' &&
          r.expiresAt.getTime() > this.now.getTime(),
      )
      .reduce((sum, r) => sum + r.quantity, 0);
    return product.stock - reserved;
  }

  sellerView(productId: string) {
    const product = this.products.get(productId)!;
    const reserved = this.reservations
      .filter(
        (r) =>
          r.productId === productId &&
          r.status === 'PENDING' &&
          r.expiresAt.getTime() > this.now.getTime(),
      )
      .reduce((sum, r) => sum + r.quantity, 0);
    return {
      label: product.usesInventory
        ? sellerStockLabel(product.stock, reserved)
        : null,
      remaining: product.usesInventory ? Math.max(0, product.stock - reserved) : null,
      buyerIds: [] as string[],
    };
  }

  requestCourier(input: {
    buyerId: string;
    productId: string;
    quantity: number;
    courierId: string;
    quotedFeeCents?: number;
    auto?: boolean;
    replacesBookingId?: string | null;
  }):
    | { ok: true; booking: EngineBooking; reservation: EngineReservation | null; createdReservation: boolean }
    | { ok: false; code: string } {
    const product = this.products.get(input.productId);
    if (!product) return { ok: false, code: 'NOT_FOUND' };

    if (input.replacesBookingId) {
      const switched = this.cancelPendingBooking(input.replacesBookingId, input.buyerId);
      if (!switched.ok) return switched;
    }

    const inventory = courierProductHoldApplies({
      usesPhysicalInventory: product.usesInventory,
      deliveryMode: 'LOCAL_PROVIDER',
    });

    let createdReservation = false;
    let reservation: EngineReservation | null = null;
    if (inventory) {
      reservation =
        this.reservations.find(
          (r) =>
            r.buyerId === input.buyerId &&
            r.productId === input.productId &&
            r.status === 'PENDING' &&
            r.holdUntil.getTime() > this.now.getTime(),
        ) || null;
      if (!reservation) {
        if (input.quantity > this.available(input.productId)) {
          return { ok: false, code: 'INSUFFICIENT_STOCK' };
        }
        const holdUntil = immediateHardHoldUntil(this.now);
        reservation = {
          id: this.nextId('res'),
          productId: input.productId,
          buyerId: input.buyerId,
          quantity: input.quantity,
          status: 'PENDING',
          phase: 'AWAITING_COURIER',
          holdUntil,
          expiresAt: holdUntil,
          paymentDeadline: null,
          bookingRequestId: null,
          checkoutSessionId: null,
          purchaseKey: this.nextId('key'),
          usesInventory: true,
        };
        this.reservations.push(reservation);
        createdReservation = true;
      }
    }

    const holdUntil = reservation?.holdUntil ?? immediateHardHoldUntil(this.now);
    const booking = this.createBooking({
      buyerId: input.buyerId,
      courierId: input.courierId,
      productId: input.productId,
      quotedFeeCents: input.quotedFeeCents ?? 500,
      holdUntil,
      auto: Boolean(input.auto),
    });

    if (reservation) {
      reservation.bookingRequestId = booking.id;
      if (input.replacesBookingId) {
        const previous = this.bookings.find((b) => b.id === input.replacesBookingId);
        if (previous) previous.status = previous.status;
        const prev = this.bookings.find((b) => b.id === input.replacesBookingId);
        if (prev && prev.status === 'CANCELLED') {
          /* superseded link is the new booking id; holdUntil stays */
        }
      }
      if (booking.status === 'AUTO_CONFIRMED' || booking.status === 'ACCEPTED') {
        this.openPaymentWindow(reservation);
      }
    }

    if (input.replacesBookingId) {
      const previous = this.bookings.find((b) => b.id === input.replacesBookingId);
      if (previous) {
        (previous as EngineBooking & { supersededByRequestId?: string }).supersededByRequestId =
          booking.id;
      }
    }

    return { ok: true, booking, reservation, createdReservation };
  }

  /** Booking create failed after a new hold. Release only that new hold. */
  compensateFailedBooking(reservationId: string | null, created: boolean) {
    if (!created || !reservationId) return;
    const reservation = this.reservations.find((r) => r.id === reservationId);
    if (!reservation || reservation.status !== 'PENDING') return;
    if (reservation.bookingRequestId) return;
    reservation.status = 'CANCELLED';
  }

  private createBooking(input: {
    buyerId: string;
    courierId: string;
    productId: string;
    quotedFeeCents: number;
    holdUntil: Date;
    auto: boolean;
  }): EngineBooking {
    const booking: EngineBooking = {
      id: this.nextId('book'),
      buyerId: input.buyerId,
      courierId: input.courierId,
      productId: input.productId,
      status: input.auto ? 'AUTO_CONFIRMED' : 'PENDING',
      expiresAt: courierResponseDeadline(this.now, input.holdUntil),
      quotedFeeCents: input.quotedFeeCents,
      calendarHold: input.auto,
    };
    this.bookings.push(booking);
    return booking;
  }

  private openPaymentWindow(reservation: EngineReservation) {
    const deadline = paymentDeadlineAfterAccept(this.now, reservation.holdUntil);
    reservation.phase = 'AWAITING_PAYMENT';
    reservation.paymentDeadline = deadline;
    if (deadline.getTime() < reservation.expiresAt.getTime()) {
      reservation.expiresAt = deadline;
    }
  }

  cancelPendingBooking(
    bookingId: string,
    buyerId: string,
  ): { ok: true } | { ok: false; code: string } {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return { ok: false, code: 'NOT_FOUND' };
    if (booking.buyerId !== buyerId) return { ok: false, code: 'NOT_OWNED' };
    if (booking.status !== 'PENDING') {
      return { ok: false, code: 'COURIER_ALREADY_ACCEPTED' };
    }
    booking.status = 'CANCELLED';
    booking.calendarHold = false;
    return { ok: true };
  }

  accept(bookingId: string, courierId: string): { ok: boolean; code?: string } {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return { ok: false, code: 'NOT_FOUND' };
    if (booking.courierId !== courierId) return { ok: false, code: 'NOT_OWNED' };
    if (booking.status !== 'PENDING') return { ok: false, code: 'NOT_PENDING' };
    if (booking.expiresAt.getTime() <= this.now.getTime()) {
      booking.status = 'EXPIRED';
      return { ok: false, code: 'EXPIRED' };
    }
    booking.status = 'ACCEPTED';
    booking.calendarHold = true;
    const reservation = this.reservations.find((r) => r.bookingRequestId === booking.id);
    if (reservation && reservation.status === 'PENDING') {
      this.openPaymentWindow(reservation);
    }
    this.notices.push({ userId: booking.buyerId, kind: 'ACCEPTED' });
    return { ok: true };
  }

  reject(bookingId: string, courierId: string): { ok: boolean; code?: string } {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return { ok: false, code: 'NOT_FOUND' };
    if (booking.courierId !== courierId) return { ok: false, code: 'NOT_OWNED' };
    if (booking.status !== 'PENDING') return { ok: false, code: 'NOT_PENDING' };
    booking.status = 'REJECTED';
    booking.calendarHold = false;
    this.notices.push({ userId: booking.buyerId, kind: 'REJECTED' });
    return { ok: true };
  }

  switchToPickup(bookingId: string, buyerId: string): { ok: boolean; code?: string; deliveryFeeCents?: number } {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return { ok: false, code: 'NOT_FOUND' };
    if (booking.buyerId !== buyerId) return { ok: false, code: 'NOT_OWNED' };
    if (booking.status === 'CONSUMED') return { ok: false, code: 'FUTURE_REFUND_REQUIRED' };
    if (!['PENDING', 'ACCEPTED', 'AUTO_CONFIRMED', 'REJECTED'].includes(booking.status)) {
      return { ok: false, code: 'NOT_ACTIVE' };
    }
    if (booking.status !== 'REJECTED') booking.status = 'CANCELLED';
    booking.calendarHold = false;
    const reservation = this.reservations.find(
      (r) => r.buyerId === buyerId && r.productId === booking.productId && r.status === 'PENDING',
    );
    if (reservation) {
      this.openPaymentWindow(reservation);
    }
    return { ok: true, deliveryFeeCents: 0 };
  }

  cancelPurchase(bookingId: string, buyerId: string): { ok: boolean; code?: string } {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking || booking.buyerId !== buyerId) return { ok: false, code: 'NOT_OWNED' };
    if (booking.status === 'CONSUMED') return { ok: false, code: 'ALREADY_PAID' };
    if (['PENDING', 'ACCEPTED', 'AUTO_CONFIRMED', 'REJECTED'].includes(booking.status)) {
      booking.status = 'CANCELLED';
      booking.calendarHold = false;
    }
    const reservation = this.reservations.find(
      (r) => r.buyerId === buyerId && r.productId === booking.productId && r.status === 'PENDING',
    );
    if (reservation) reservation.status = 'CANCELLED';
    return { ok: true };
  }

  startCheckout(input: {
    buyerId: string;
    items: Array<{ productId: string; quantity: number; sellerId?: string }>;
    bookingId?: string | null;
    deliveryMode: string;
    sessionId: string;
  }): { ok: true; purchaseKey: string } | { ok: false; code: string } {
    if (input.bookingId) {
      const booking = this.bookings.find((b) => b.id === input.bookingId);
      if (!booking || booking.buyerId !== input.buyerId) return { ok: false, code: 'BOOKING_REQUIRED' };
      if (booking.status !== 'ACCEPTED' && booking.status !== 'AUTO_CONFIRMED') {
        return { ok: false, code: 'BOOKING_NOT_CONFIRMED' };
      }
    }

    const purchaseKeys = new Set<string>();
    for (const item of input.items) {
      const product = this.products.get(item.productId);
      if (!product) return { ok: false, code: 'NOT_FOUND' };
      if (!product.usesInventory) continue;
      const own = this.reservations.find(
        (r) =>
          r.buyerId === input.buyerId &&
          r.productId === item.productId &&
          r.status === 'PENDING' &&
          (input.bookingId ? r.bookingRequestId === input.bookingId : true),
      );
      if (own) {
        const decision = evaluateStockConfirm({
          inventoryRequired: true,
          now: this.now,
          reservation: own,
          requestedQuantity: item.quantity,
          buyerId: input.buyerId,
          stock: product.stock,
          otherPendingQuantity: this.otherPending(item.productId, own.id),
        });
        if (decision.action === 'conflict') return { ok: false, code: decision.code };
        own.phase = 'CHECKOUT';
        own.checkoutSessionId = input.sessionId;
        purchaseKeys.add(own.purchaseKey);
        continue;
      }
      if (item.quantity > this.available(item.productId)) {
        return { ok: false, code: 'INSUFFICIENT_STOCK' };
      }
      const expiresAt = new Date(this.now.getTime() + 15 * 60 * 1000);
      const created: EngineReservation = {
        id: this.nextId('res'),
        productId: item.productId,
        buyerId: input.buyerId,
        quantity: item.quantity,
        status: 'PENDING',
        phase: 'CHECKOUT',
        holdUntil: expiresAt,
        expiresAt,
        paymentDeadline: expiresAt,
        bookingRequestId: input.bookingId || null,
        checkoutSessionId: input.sessionId,
        purchaseKey: this.nextId('key'),
        usesInventory: true,
      };
      this.reservations.push(created);
      purchaseKeys.add(created.purchaseKey);
    }
    const purchaseKey = [...purchaseKeys][0] || this.nextId('key');
    this.sessions.set(input.sessionId, {
      open: true,
      buyerId: input.buyerId,
      holdPurchaseKey: purchaseKey,
    });
    return { ok: true, purchaseKey };
  }

  private otherPending(productId: string, exceptId: string) {
    return this.reservations
      .filter(
        (r) =>
          r.id !== exceptId &&
          r.productId === productId &&
          r.status === 'PENDING' &&
          r.expiresAt.getTime() > this.now.getTime(),
      )
      .reduce((sum, r) => sum + r.quantity, 0);
  }

  pay(input: {
    sessionId: string;
    buyerId: string;
    items: Array<{ productId: string; quantity: number }>;
    failOrderCreate?: boolean;
  }): { ok: true; orderId: string } | { ok: false; code: string; incident: boolean } {
    const existing = this.orders.find((o) => o.stripeSessionId === input.sessionId);
    if (existing) return { ok: true, orderId: existing.id };

    if (input.failOrderCreate) {
      this.recordIncident(input.sessionId, 'ORDER_CREATE_FAILED');
      return { ok: false, code: 'ORDER_CREATE_FAILED', incident: true };
    }

    for (const item of input.items) {
      const product = this.products.get(item.productId);
      if (!product || !product.usesInventory) continue;
      const reservation =
        this.reservations.find(
          (r) => r.checkoutSessionId === input.sessionId && r.productId === item.productId,
        ) ||
        this.reservations.find(
          (r) =>
            r.buyerId === input.buyerId &&
            r.productId === item.productId &&
            (r.status === 'PENDING' || r.status === 'CONFIRMED'),
        ) ||
        null;
      const decision = evaluateStockConfirm({
        inventoryRequired: true,
        now: this.now,
        reservation,
        requestedQuantity: item.quantity,
        buyerId: input.buyerId,
        stock: product.stock,
        otherPendingQuantity: reservation
          ? this.otherPending(item.productId, reservation.id)
          : this.otherPending(item.productId, ''),
        payingSessionId: input.sessionId,
      });
      if (decision.action === 'conflict') {
        this.recordIncident(input.sessionId, decision.code);
        return { ok: false, code: decision.code, incident: true };
      }
      if (decision.action === 'confirm') {
        const won = reservation!.status === 'PENDING';
        if (!won) {
          this.recordIncident(input.sessionId, 'HOLD_EXPIRED');
          return { ok: false, code: 'HOLD_EXPIRED', incident: true };
        }
        reservation!.status = 'CONFIRMED';
        reservation!.checkoutSessionId = input.sessionId;
        product.stock -= decision.quantity;
        if (product.stock < 0) {
          product.stock += decision.quantity;
          reservation!.status = 'PENDING';
          this.recordIncident(input.sessionId, 'HELD_BY_OTHER');
          return { ok: false, code: 'HELD_BY_OTHER', incident: true };
        }
      }
    }

    const order: EngineOrder = {
      id: this.nextId('order'),
      buyerId: input.buyerId,
      stripeSessionId: input.sessionId,
      items: input.items,
    };
    this.orders.push(order);
    this.settlementCalls += 1;
    this.courierSettlementCalls += 1;
    const booking = this.bookings.find((b) =>
      this.reservations.some(
        (r) => r.checkoutSessionId === input.sessionId && r.bookingRequestId === b.id,
      ),
    );
    if (booking && (booking.status === 'ACCEPTED' || booking.status === 'AUTO_CONFIRMED')) {
      booking.status = 'CONSUMED';
    }
    const session = this.sessions.get(input.sessionId);
    if (session) session.open = false;
    return { ok: true, orderId: order.id };
  }

  recordIncident(sessionId: string, code: string) {
    if (this.incidents.some((i) => i.stripeSessionId === sessionId)) return;
    this.incidents.push({ stripeSessionId: sessionId, code, status: 'REFUND_REQUIRED' });
    this.refundCalls += 0;
  }

  expireSession(sessionId: string) {
    const order = this.orders.find((o) => o.stripeSessionId === sessionId);
    if (order) return { released: false, reason: 'PAID' };
    const session = this.sessions.get(sessionId);
    if (session) session.open = false;
    let released = false;
    for (const reservation of this.reservations) {
      if (reservation.checkoutSessionId !== sessionId) continue;
      if (reservation.status === 'CONFIRMED') return { released: false, reason: 'CONFIRMED' };
      if (reservation.status === 'PENDING') {
        reservation.status = 'EXPIRED';
        released = true;
        const booking = this.bookings.find((b) => b.id === reservation.bookingRequestId);
        if (booking && ['PENDING', 'ACCEPTED', 'AUTO_CONFIRMED'].includes(booking.status)) {
          booking.status = 'EXPIRED';
          booking.calendarHold = false;
        }
      }
    }
    return { released, reason: released ? 'RELEASED' : 'NONE' };
  }

  cleanup() {
    let cleaned = 0;
    for (const reservation of this.reservations) {
      if (reservation.status !== 'PENDING') continue;
      if (reservation.expiresAt.getTime() > this.now.getTime()) continue;
      reservation.status = 'EXPIRED';
      cleaned += 1;
      this.notices.push({ userId: reservation.buyerId, kind: 'EXPIRED' });
      const booking = this.bookings.find((b) => b.id === reservation.bookingRequestId);
      if (booking && ['PENDING', 'ACCEPTED', 'AUTO_CONFIRMED'].includes(booking.status)) {
        booking.status = 'EXPIRED';
        booking.calendarHold = false;
      }
    }
    return cleaned;
  }

  advance(ms: number) {
    this.now = new Date(this.now.getTime() + ms);
  }

  copy(lang: 'nl' | 'en') {
    return RESERVATION_COPY[lang];
  }

  static constants() {
    return {
      courierMs: IMMEDIATE_COURIER_RESPONSE_MS,
      paymentMs: PAYMENT_WINDOW_MS,
      scheduledExposed: scheduledBookingExposed(),
    };
  }
}
