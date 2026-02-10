# Google Analytics 4 Setup

Deze applicatie gebruikt Google Analytics 4 (GA4) voor het tracken van gebruikerstypen, promotionele activiteiten en persoonsdata voor marketingdoeleinden.

## Environment Variabelen

Voeg de volgende variabelen toe aan je `.env.local` bestand:

```env
# Google Analytics 4 Measurement ID (format: G-XXXXXXXXXX)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optioneel: Forceer Google Analytics in development (standaard alleen in production)
# NEXT_PUBLIC_GA_ENABLED=true
```

## Setup Instructies

1. **Maak een Google Analytics 4 property aan:**
   - Ga naar [Google Analytics](https://analytics.google.com/)
   - Maak een nieuwe GA4 property aan
   - Kopieer de Measurement ID (begint met `G-`)

2. **Voeg de Measurement ID toe:**
   - Voeg `NEXT_PUBLIC_GA_MEASUREMENT_ID` toe aan je `.env.local` bestand
   - Herstart de development server

3. **Verify de implementatie:**
   - Open de browser console
   - Controleer of er geen errors zijn
   - Ga naar Google Analytics Realtime dashboard om te zien of events binnenkomen

## Functionaliteit

### Automatisch Tracking

- **Page Views**: Automatisch getrackt bij route changes
- **User Types**: Automatisch getrackt na login/registratie
  - User roles (BUYER, SELLER, DELIVERY, ADMIN)
  - Buyer types (interests, voorkeuren)
  - Seller types (product types, specialisaties)
  - Business vs Personal accounts
  - Delivery capabilities

### Custom Events

De applicatie trackt de volgende custom events:

#### Gebruikerstypen
- `identify_user_type` - Gebruikerstype identificatie
  - user_role, buyer_types, seller_types, interests, gender, etc.

#### Registratie & Login
- `sign_up` - Nieuwe gebruiker registratie
  - method, user_role, buyer_types, seller_types, etc.
- `login` - Gebruiker login
  - method (email, google, facebook, phone)

#### E-commerce
- `view_item` - Product weergave
  - productId, productName, category, price
- `add_to_cart` - Toevoegen aan winkelwagen
  - productId, productName, category, price, quantity
- `purchase` - Aankoop voltooid
  - transactionId, value, currency, items[]

#### Content Engagement
- `content_engagement` - Interactie met content
  - contentType (product, dish, design, recipe, garden)
  - contentId, action (view, favorite, share, message, order)

#### Promoties
- `promo_engagement` - Promotie interactie
  - promoId, promoName, action (view, click, dismiss, accept), location

### User Properties

De volgende user properties worden automatisch geset:

- `user_role` - Primaire rol van gebruiker
- `buyer_types` - Comma-separated lijst van buyer types
- `seller_types` - Comma-separated lijst van seller types
- `interests` - Comma-separated lijst van interesses
- `gender` - Geslacht
- `has_delivery_role` - Boolean voor delivery capabilities
- `is_business` - Boolean voor business accounts
- `user_segments` - Comma-separated lijst van user segments (buyer, seller, deliverer, business)
- `user_segment_count` - Aantal segments

## Privacy & GDPR Compliance

- **IP Anonymization**: Aan (anonymize_ip: true)
- **Google Signals**: Uit (allow_google_signals: false)
- **Ad Personalization**: Uit (allow_ad_personalization_signals: false)
- **Consent Management**: Moet worden geïmplementeerd via PrivacyNotice component

## Gebruik in Code

### Basis Tracking

```typescript
import { trackEvent, trackUserType, trackRegistration, trackLogin } from '@/components/GoogleAnalytics';

// Track custom event
trackEvent('custom_event_name', {
  custom_parameter: 'value'
});

// Track user type
trackUserType({
  role: 'SELLER',
  buyerRoles: ['cheff', 'grower'],
  sellerRoles: ['cheff'],
  interests: ['koken', 'tuinieren'],
  gender: 'female',
  isBusiness: true
});

// Track registration
trackRegistration({
  method: 'email',
  userRole: 'SELLER',
  buyerRoles: ['cheff'],
  sellerRoles: ['cheff'],
  isBusiness: false
});

// Track login
trackLogin('google');
```

### E-commerce Tracking

```typescript
import { trackProductView, trackAddToCart, trackPurchase } from '@/components/GoogleAnalytics';

// Track product view
trackProductView({
  productId: '123',
  productName: 'Product Name',
  category: 'CHEFF',
  price: 29.99,
  userId: 'user-id'
});

// Track add to cart
trackAddToCart({
  productId: '123',
  productName: 'Product Name',
  category: 'CHEFF',
  price: 29.99,
  quantity: 2
});

// Track purchase
trackPurchase({
  transactionId: 'order-123',
  value: 59.98,
  currency: 'EUR',
  items: [{
    itemId: '123',
    itemName: 'Product Name',
    category: 'CHEFF',
    price: 29.99,
    quantity: 2
  }]
});
```

## Data voor Promotionele Activiteiten

Google Analytics verzamelt de volgende data voor promotionele activiteiten:

1. **Gebruikerstypen Segments:**
   - Actieve buyers per interesse
   - Actieve sellers per categorie
   - Bezorgers per locatie
   - Business accounts

2. **Gedragspatronen:**
   - Meest bekeken content types
   - Meest populaire categorieën
   - Conversie rates per user type
   - Engagement patterns

3. **Geografische Data:**
   - User distribution per stad/regio
   - Populariteit per locatie

4. **E-commerce Metrics:**
   - AOV per user type
   - Top producten per segment
   - Purchase frequency

Deze data kan worden gebruikt voor:
- Gerichte promotionele campagnes
- Personalisatie van content
- A/B testing van features
- Optimisatie van user experience per segment

## Troubleshooting

### Events worden niet getrackt

1. Controleer of `NEXT_PUBLIC_GA_MEASUREMENT_ID` correct is ingesteld
2. Controleer of je in production mode bent of `NEXT_PUBLIC_GA_ENABLED=true` is gezet
3. Open browser console en controleer op errors
4. Gebruik Google Analytics DebugView om events in real-time te zien

### User properties worden niet geset

1. Controleer of `GoogleAnalyticsUserTracker` component is toegevoegd aan layout
2. Controleer of user data beschikbaar is in session
3. Gebruik `trackUserType()` expliciet als alternatief

## Aanvullende Resources

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [GA4 E-commerce Events](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- [GA4 User Properties](https://developers.google.com/analytics/devguides/collection/ga4/user-properties)




