# EctaroShip Integratie - Volledige Setup Gids

## 📋 Inhoudsopgave
1. [Environment Variables Configuratie](#environment-variables)
2. [API Integratie Overzicht](#api-integratie)
3. [Automatische Label Creatie Flow](#automatische-label-creatie)
4. [Webhook Setup](#webhook-setup)
5. [Handmatige Label Creatie](#handmatige-label-creatie)
6. [Tracking & Status Updates](#tracking-status)
7. [Troubleshooting](#troubleshooting)

---

## 🔐 Environment Variables

### Locatie
De environment variables staan in je `.env` of `.env.local` bestand in de root van je project.

### Vereiste Variables

Voeg deze toe aan je `.env` of `.env.local` bestand:

```env
# EctaroShip API Configuratie
ECTAROSHIP_API_KEY=your_api_key_here
ECTAROSHIP_API_BASE_URL=https://api.ectaroship.nl  # Optioneel, default is deze URL
ECTAROSHIP_WEBHOOK_SECRET=your_webhook_secret_here  # Optioneel, voor webhook verificatie
```

### Waar haal je deze vandaan?

1. **ECTAROSHIP_API_KEY**
   - Log in op je EctaroShip account
   - Ga naar API Settings / Developer Settings
   - Genereer een nieuwe API key
   - Kopieer de key en plak deze in je `.env` bestand

2. **ECTAROSHIP_API_BASE_URL**
   - Meestal: `https://api.ectaroship.nl`
   - Check de EctaroShip documentatie voor de juiste URL
   - Als je deze niet invult, wordt de default gebruikt

3. **ECTAROSHIP_WEBHOOK_SECRET**
   - **Optioneel** - Niet zichtbaar in EctaroShip dashboard
   - Webhook werkt ook zonder secret (minder veilig, maar functioneel)
   - Als EctaroShip later webhook secrets introduceert, kun je deze hier toevoegen
   - Gebruikt voor webhook signature verificatie (indien beschikbaar)

### Bestandslocatie
```
homecheff-app/
├── .env              # Voor lokale development (niet in git)
├── .env.local        # Voor lokale development (niet in git)
└── .env.example      # Template (wel in git)
```

⚠️ **Belangrijk**: Zorg dat `.env` en `.env.local` in je `.gitignore` staan!

---

## 🔌 API Integratie Overzicht

### Core Library: `lib/ectaroship.ts`

Dit is de centrale library die alle EctaroShip API calls afhandelt.

#### Functies:

1. **`calculateShippingPrice(request)`**
   - Berekent verzendkosten op basis van gewicht, afmetingen en locatie
   - Gebruikt in checkout voor real-time prijsberekening
   - Endpoint: `POST /v1/shipping/calculate`

2. **`createShippingLabel(request)`**
   - Maakt een verzendlabel aan
   - Retourneert label ID, tracking nummer, PDF URL
   - Endpoint: `POST /v1/shipping/labels`

3. **`getTrackingStatus(labelId)`**
   - Haalt tracking status op voor een label
   - Retourneert status, events, deliveredAt
   - Endpoint: `GET /v1/shipping/labels/{labelId}/tracking`

4. **`verifyWebhookSignature(payload, signature, secret)`**
   - Verifieert webhook signatures voor beveiliging
   - Gebruikt HMAC SHA256

---

## 🚀 Automatische Label Creatie Flow

### Wanneer wordt een label automatisch aangemaakt?

Een shipping label wordt **automatisch** aangemaakt wanneer:
1. Een order wordt betaald via Stripe
2. De order heeft `deliveryMode: 'SHIPPING'`
3. Zowel seller als buyer hebben een compleet adres (postcode + land)

### Flow Diagram

```
1. Buyer betaalt order met SHIPPING mode
   ↓
2. Stripe webhook ontvangt payment success
   ↓
3. Order wordt aangemaakt in database
   ↓
4. Automatische label creatie wordt getriggerd
   ↓
5. EctaroShip API wordt aangeroepen
   ↓
6. Label wordt opgeslagen in database (ShippingLabel model)
   ↓
7. Seller krijgt notificatie: "Verzendlabel klaar!"
   ↓
8. Seller kan label printen/downloaden
```

### Code Locatie

**File**: `app/api/stripe/webhook/route.ts`
**Functie**: Automatische label creatie na betaling (regel ~970-1125)

```typescript
// Check if order is shipping and no label exists yet
if (deliveryMode === 'SHIPPING' || mappedDeliveryMode === 'SHIPPING') {
  // Create label via EctaroShip
  const labelResult = await createShippingLabel(labelRequest);
  
  // Save to database
  await prisma.shippingLabel.create({...});
  
  // Notify seller
  await NotificationService.sendShippingLabelReadyNotification(...);
}
```

### Vereisten voor Automatische Creatie

✅ **Seller moet hebben:**
- Volledig adres (straat, postcode, stad, land)
- Email adres (voor notificaties)

✅ **Buyer moet hebben:**
- Volledig adres (straat, postcode, stad, land)
- Email adres

✅ **Order moet hebben:**
- `deliveryMode: 'SHIPPING'`
- Status: `CONFIRMED` (betaald)
- Producten met gewicht/dimensies (of defaults worden gebruikt)

---

## 🔔 Webhook Setup

### Wat doet de webhook?

De EctaroShip webhook ontvangt updates over:
- Label creatie (`label.created`)
- Status updates (`shipment.status_changed`, `shipment.shipped`, `shipment.delivered`)
- Tracking updates

### Webhook Endpoint

**URL**: `https://jouw-domein.nl/api/webhooks/ectaroship`

### Configuratie in EctaroShip Dashboard

1. Log in op EctaroShip dashboard
2. Ga naar **Webhooks** of **Settings > Webhooks**
3. Voeg een nieuwe webhook toe:
   - **URL**: `https://jouw-domein.nl/api/webhooks/ectaroship`
   - **Events**: Selecteer alle events (of specifieke):
     - `label.created`
     - `shipment.status_changed`
     - `shipment.shipped`
     - `shipment.delivered`
   - **Secret**: Genereer een secret en voeg toe aan `ECTAROSHIP_WEBHOOK_SECRET`

### Webhook Handler

**File**: `app/api/webhooks/ectaroship/route.ts`

#### Events die worden afgehandeld:

1. **`label.created`**
   - Wordt aangeroepen wanneer EctaroShip een label heeft aangemaakt
   - Update order met label informatie
   - Stuur notificatie naar seller

2. **`shipment.status_changed`**
   - Wordt aangeroepen bij status updates (shipped, in_transit, etc.)
   - Update order status
   - Update shipping label status

3. **`shipment.delivered`**
   - Wordt aangeroepen wanneer pakket is bezorgd
   - Update order status naar `DELIVERED`
   - **Trigger payout** (als escrow bestaat en trigger is `DELIVERED`)

### Payout Flow na Levering

```
1. EctaroShip webhook: shipment.delivered
   ↓
2. Order status → DELIVERED
   ↓
3. Check escrow (paymentHeld = true, payoutTrigger = 'DELIVERED')
   ↓
4. Bereken seller payout (product price - platform fee)
   ↓
5. Stripe transfer naar seller Stripe Connect account
   ↓
6. Update escrow status → 'paid_out'
   ↓
7. Create payout record in database
```

---

## 🖨️ Handmatige Label Creatie

### Wanneer handmatig?

Handmatige label creatie is mogelijk via:
- Seller dashboard
- API endpoint: `/api/shipping/create-label`

### API Endpoint

**POST** `/api/shipping/create-label`

**Request Body:**
```json
{
  "orderId": "order_123",
  "recipient": {  // Optioneel - wordt van order gehaald
    "name": "Buyer Name",
    "address": "Street 123",
    "postalCode": "1234AB",
    "city": "Amsterdam",
    "country": "NL",
    "email": "buyer@example.com",
    "phone": "+31612345678"
  },
  "sender": {  // Optioneel - wordt van seller gehaald
    "name": "Seller Name",
    "address": "Seller Street 456",
    "postalCode": "5678CD",
    "city": "Rotterdam",
    "country": "NL"
  },
  "weight": 1.5,  // Optioneel - wordt berekend
  "dimensions": {  // Optioneel - wordt berekend
    "length": 30,
    "width": 20,
    "height": 10
  },
  "carrier": "PostNL",  // Optioneel
  "description": "Order #12345"  // Optioneel
}
```

**Response:**
```json
{
  "labelId": "label_db_id",
  "ectaroShipLabelId": "es_123456",
  "pdfUrl": "https://...",
  "trackingNumber": "3SABC123456",
  "carrier": "PostNL",
  "price": 8.50,
  "priceCents": 850
}
```

### Code Locatie

**File**: `app/api/shipping/create-label/route.ts`

---

## 📊 Tracking & Status Updates

### Status Flow

```
label_created → shipped → in_transit → out_for_delivery → delivered
                                                              ↓
                                                         (failed)
```

### Database Model: `ShippingLabel`

```prisma
model ShippingLabel {
  id                String   @id @default(uuid())
  orderId           String
  order             Order    @relation(fields: [orderId], references: [id])
  ectaroShipLabelId String   // EctaroShip label ID
  pdfUrl            String?  // URL naar PDF label
  trackingNumber    String?  // Tracking nummer
  carrier           String?  // PostNL, DHL, etc.
  status            String   // generated, printed, shipped
  priceCents        Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### Order Fields voor Shipping

```prisma
model Order {
  // ... andere fields
  deliveryMode           DeliveryMode?
  shippingStatus         String?  // label_created, shipped, delivered, etc.
  shippingTrackingNumber String?
  shippingCarrier        String?
  shippingLabelId        String?  // EctaroShip label ID
  shippingLabelCostCents Int?
  shippingLabels         ShippingLabel[]
  shippedAt              DateTime?
  deliveredAt            DateTime?
}
```

### Tracking Status Ophalen

**Functie**: `getTrackingStatus(labelId)` in `lib/ectaroship.ts`

```typescript
const tracking = await getTrackingStatus('es_123456');
// Returns:
// {
//   status: 'in_transit',
//   trackingNumber: '3SABC123456',
//   events: [...],
//   deliveredAt: '2024-01-15T10:30:00Z'
// }
```

---

## 🛠️ Troubleshooting

### Probleem: "EctaroShip API key not configured"

**Oplossing:**
1. Check of `ECTAROSHIP_API_KEY` in je `.env` staat
2. Herstart je development server na het toevoegen
3. Check of de variable naam exact klopt (geen typos)

### Probleem: Labels worden niet automatisch aangemaakt

**Checklist:**
- ✅ Order heeft `deliveryMode: 'SHIPPING'`
- ✅ Order is betaald (status: `CONFIRMED`)
- ✅ Seller heeft compleet adres (postcode + land)
- ✅ Buyer heeft compleet adres (postcode + land)
- ✅ `ECTAROSHIP_API_KEY` is geconfigureerd
- ✅ EctaroShip API is bereikbaar

**Debug:**
- Check server logs voor errors
- Check of `createShippingLabel` wordt aangeroepen
- Check EctaroShip API response

### Probleem: Webhook wordt niet ontvangen

**Checklist:**
- ✅ Webhook URL is correct geconfigureerd in EctaroShip dashboard
- ✅ Webhook URL is publiek bereikbaar (niet localhost)
- ✅ Webhook secret is correct (als gebruikt)
- ✅ Firewall blokkeert niet de requests

**Test:**
- Gebruik ngrok of vergelijkbaar voor lokale testing
- Check webhook logs in EctaroShip dashboard
- Check server logs voor inkomende requests

### Probleem: Payout wordt niet getriggerd na levering

**Checklist:**
- ✅ Order status is `DELIVERED`
- ✅ Escrow bestaat (`paymentEscrow` record)
- ✅ Escrow `currentStatus` is `'held'`
- ✅ Escrow `payoutTrigger` is `'DELIVERED'`
- ✅ Seller heeft `stripeConnectAccountId`
- ✅ Seller payout is > 0

**Debug:**
- Check `triggerPayoutAfterDelivery` functie logs
- Check Stripe transfer errors
- Check escrow status in database

---

## 📝 Checklist voor Productie

- [ ] `ECTAROSHIP_API_KEY` is geconfigureerd
- [ ] `ECTAROSHIP_WEBHOOK_SECRET` is geconfigureerd (aanbevolen)
- [ ] Webhook URL is geconfigureerd in EctaroShip dashboard
- [ ] Webhook events zijn geselecteerd (label.created, shipment.*)
- [ ] Test order met SHIPPING mode werkt
- [ ] Automatische label creatie werkt
- [ ] Seller krijgt notificatie wanneer label klaar is
- [ ] Tracking updates worden ontvangen via webhook
- [ ] Payout wordt getriggerd na levering
- [ ] Error handling werkt correct
- [ ] Logs worden bijgehouden voor debugging

---

## 🔗 Gerelateerde Bestanden

- **Core Library**: `lib/ectaroship.ts`
- **Webhook Handler**: `app/api/webhooks/ectaroship/route.ts`
- **Automatische Creatie**: `app/api/stripe/webhook/route.ts` (regel ~970)
- **Handmatige Creatie**: `app/api/shipping/create-label/route.ts`
- **Prijsberekening**: `app/api/shipping/calculate-price/route.ts`
- **Notificaties**: `lib/notifications/notification-service.ts` (sendShippingLabelReadyNotification)
- **Database Schema**: `prisma/schema.prisma` (ShippingLabel model)

---

## 📞 Support

Voor vragen over EctaroShip API:
- Check EctaroShip documentatie
- Contact EctaroShip support
- Check server logs voor API errors

Voor vragen over de integratie:
- Check deze documentatie
- Review code comments in `lib/ectaroship.ts`
- Check webhook logs

