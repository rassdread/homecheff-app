# 📦 Order Status Flow Documentatie

## Status Transitions

### Order Statuses
- `PENDING` - Bestelling geplaatst, wachtend op betaling
- `CONFIRMED` - Betaling ontvangen, bestelling bevestigd
- `PROCESSING` - Bestelling wordt voorbereid door verkoper
- `SHIPPED` - Bestelling is verzonden/opgehaald
- `DELIVERED` - Bestelling is afgeleverd
- `CANCELLED` - Bestelling is geannuleerd

### Delivery Order Statuses
- `PENDING` - Bezorgopdracht beschikbaar, wachtend op bezorger
- `ACCEPTED` - Bezorger heeft opdracht geaccepteerd
- `PICKED_UP` - Bezorger heeft pakket opgehaald bij verkoper
- `DELIVERED` - Pakket is afgeleverd bij koper
- `CANCELLED` - Bezorgopdracht is geannuleerd

## Flow Diagram

```
CHECKOUT → STRIPE PAYMENT → WEBHOOK
                                    ↓
                            Order Created (CONFIRMED)
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            PICKUP Mode                      DELIVERY Mode
                    ↓                               ↓
        Seller prepares order          DeliveryOrder (PENDING)
                    ↓                               ↓
        Seller updates to PROCESSING   Deliverer accepts (ACCEPTED)
                    ↓                               ↓
        Buyer picks up                 Deliverer picks up (PICKED_UP)
                    ↓                               ↓
        Order → SHIPPED                Deliverer delivers (DELIVERED)
                    ↓                               ↓
        Order → DELIVERED              Order → DELIVERED
```

## Status Update Endpoints

### Main Order Status
- **API**: `PATCH /api/orders/[orderId]/update`
- **Allowed transitions**:
  - `CONFIRMED` → `PROCESSING` (seller)
  - `PROCESSING` → `SHIPPED` (seller)
  - `SHIPPED` → `DELIVERED` (buyer/seller)
  - Any → `CANCELLED` (with proper authorization)

### Delivery Order Status
- **API**: `POST /api/delivery/orders/[orderId]/accept` (ACCEPTED)
- **API**: `POST /api/delivery/orders/[orderId]/update-status` (PICKED_UP, DELIVERED, CANCELLED)

## Automatic Status Updates

### On Payment (Webhook)
- Order created with status: `CONFIRMED`
- Delivery orders created with status: `PENDING` (if delivery mode)

### On Delivery Completion
- Delivery order: `DELIVERED`
- Main order: `DELIVERED` (if all delivery orders completed)

## Notifications per Status

- `CONFIRMED`: Buyer + Seller notified
- `PROCESSING`: Buyer notified
- `SHIPPED`: Buyer notified
- `DELIVERED`: Buyer + Seller notified, Review request sent
- `CANCELLED`: All parties notified

## Best Practices

1. **Always check authorization** before status updates
2. **Validate status transition** is allowed
3. **Send notifications** on status changes
4. **Update timestamps** (pickedUpAt, deliveredAt, etc.)
5. **Handle delivery earnings** when status → DELIVERED


