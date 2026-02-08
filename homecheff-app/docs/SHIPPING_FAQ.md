# 📦 Shipping FAQ - Verzending via Pakketpost

## Overzicht

HomeCheff biedt nu verzending via pakketpost voor Designer en Garden producten. Dit systeem werkt volledig automatisch met real-time prijsberekening, escrow betalingen en tracking.

## Voor Kopers

### Hoe werkt verzending?

1. **Product selecteren**: Kies een product met "Verzenden" optie
2. **Adres invoeren**: Gebruik Google Places Autocomplete voor automatische adresvalidatie
3. **Prijs zien**: Verzendkosten worden real-time berekend in checkout
4. **Betalen**: Betaal product + verzendkosten via Stripe
5. **Tracking**: Ontvang tracking nummer na verzending
6. **Levering**: Pakket wordt afgeleverd op je adres

### Wat zijn de verzendkosten?

Verzendkosten worden automatisch berekend op basis van:
- **Gewicht** van het product
- **Afmetingen** (lengte, breedte, hoogte)
- **Afstand** tussen verkoper en koper
- **Land** van bestemming (nationaal of internationaal)

De prijs wordt real-time getoond in checkout voordat je betaalt.

### Welke landen worden ondersteund?

Alle landen worden ondersteund via Google Maps geocoding en EctaroShip multi-carrier shipping. Populaire landen:
- **Europa**: Nederland, België, Duitsland, Frankrijk, Verenigd Koninkrijk, Spanje, Italië, etc.
- **Caribisch gebied**: Curaçao, Aruba, Sint Maarten, Suriname
- **Azië**: Thailand, Indonesië, Singapore, Japan, Zuid-Korea, Dubai, etc.
- **Amerika**: Verenigde Staten, Canada
- **En meer**: Zie volledige lijst in CountrySelector

### Hoe lang duurt verzending?

- **Nationaal** (Nederland): 1-3 werkdagen
- **Internationaal**: 3-7 werkdagen (afhankelijk van bestemming)
- **Express opties**: Beschikbaar via EctaroShip (extra kosten)

### Kan ik mijn pakket volgen?

Ja! Na verzending ontvang je:
- **Tracking nummer** in je orderbevestiging
- **Status updates** via email
- **Webhook updates** voor real-time tracking

### Wat als mijn pakket niet aankomt?

1. **Check tracking**: Gebruik het tracking nummer om de status te zien
2. **Contact verkoper**: Neem eerst contact op met de verkoper
3. **Support**: Als dat niet helpt, neem contact op met support@homecheff.nl
4. **Escrow bescherming**: Je betaling staat in escrow tot levering - bij problemen kunnen we bemiddelen

## Voor Verkopers

### Hoe activeer ik verzending voor mijn product?

Bij het aanmaken van een product:
1. Selecteer **"Verzenden"** in de delivery dropdown
2. Informatieve sectie verschijnt met uitleg
3. **Geen extra velden nodig** - je adres wordt automatisch gebruikt

### Welke producten kunnen verzonden worden?

✅ **DESIGNER PRODUCTEN**:
- Handgemaakte items (keramiek, houtwerk, textiel)
- Kunstwerken en decoratie
- Accessoires en kleding
- Alle items die veilig verpakt kunnen worden

✅ **GARDEN PRODUCTEN**:
- Gedroogde kruiden en specerijen
- Zaden en stekjes (indien toegestaan)
- Bewerkte producten (jam, honing, etc.)
- Niet-bederfelijke items

❌ **NIET VERZENDBAAR**:
- Verse maaltijden (CHEFF categorie)
- Bederfelijke producten
- Items die koeling nodig hebben
- Zeer grote of zware items (afhankelijk van carrier)

### Wanneer krijg ik mijn geld?

Bij verzending wordt je betaling in **escrow** gehouden tot levering:

1. **Order bevestigd** → Betaling vastgezet in escrow
2. **Pakket verzonden** → Status update (geen payout nog)
3. **Pakket afgeleverd** → Automatische uitbetaling via Stripe Connect
4. **Uitbetaling** → Binnen 2-3 werkdagen op je rekening

### Hoe genereer ik een verzendlabel?

Na orderbevestiging:
1. Ga naar je **seller dashboard**
2. Open de **order details**
3. Klik op **"Genereer verzendlabel"**
4. Label wordt automatisch gegenereerd via EctaroShip
5. **Download PDF** en print het label
6. Plak label op pakket en post het

**Automatisch proces**:
- Sender adres: Je profiel adres (automatisch)
- Recipient adres: Buyer adres (automatisch)
- Gewicht/dimensies: Standaard waarden (kan aangepast worden)

### Wat zijn de kosten voor mij als verkoper?

**Geen kosten voor jou!**
- Klant betaalt verzendkosten direct in checkout
- HomeCheff betaalt EctaroShip voor het label
- Jij ontvangt alleen de productprijs (minus platform fee)
- **Geen tussenstation** - HomeCheff incasseert geen verzendkosten

### Moet ik mijn adres compleet hebben?

**Ja!** Zorg dat je profiel adres compleet is:
- ✅ Straat en huisnummer
- ✅ Postcode
- ✅ Stad
- ✅ **Land** (belangrijk voor internationale verzending)

Dit wordt automatisch gebruikt als verzendadres (sender).

### Werkt dit internationaal?

**Ja!** Het systeem werkt voor alle landen:
- Google Maps geocoding voor alle adressen
- EctaroShip multi-carrier voor alle landen
- Automatische carrier selectie (PostNL, DHL, etc.)
- Real-time prijsberekening voor elk land

### Hoe werkt tracking?

1. **Automatisch**: EctaroShip stuurt tracking updates naar HomeCheff
2. **Webhook**: Updates worden automatisch verwerkt
3. **Status updates**: Order status wordt automatisch bijgewerkt
4. **Payout trigger**: Bij "delivered" status → automatische uitbetaling

## Technische Details

### Escrow Systeem

**Waarom escrow?**
- Bescherming voor koper: Geld terug bij problemen
- Bescherming voor verkoper: Betaling gegarandeerd
- Automatisch proces: Geen handmatige actie nodig

**Hoe werkt het?**
1. Klant betaalt → Geld gaat naar HomeCheff Stripe account
2. Order bevestigd → Betaling vastgezet in escrow database
3. Pakket verzonden → Status update (nog geen payout)
4. Pakket afgeleverd → Webhook trigger → Automatische payout
5. Uitbetaling → Stripe Connect transfer naar seller account

### EctaroShip Integratie

**Wat is EctaroShip?**
- Multi-carrier shipping platform
- Ondersteunt PostNL, DHL, DPD, en meer
- Real-time prijsberekening
- Automatische label generatie
- Tracking webhooks

**Hoe werkt de integratie?**
1. **Prijsberekening**: `/api/shipping/calculate-price` → EctaroShip API
2. **Label generatie**: `/api/shipping/create-label` → EctaroShip API
3. **Tracking updates**: `/api/webhooks/ectaroship` → EctaroShip webhooks

### Google Maps Integratie

**Adresvalidatie**:
- Google Places Autocomplete voor alle landen
- Automatische geocoding (adres → coördinaten)
- Postcode en country extractie
- Werkt voor alle internationale adressen

**Distance berekening**:
- Google Maps Distance Matrix API
- Route distance (niet alleen luchtlijn)
- Werkt internationaal (ook over grenzen)
- Gebruikt voor delivery fee berekening

## Veelgestelde Vragen

### Kan ik verzending combineren met afhalen?

Ja! Selecteer **"Beide"** in de delivery dropdown. Dan kunnen kopers kiezen tussen:
- Afhalen (gratis)
- Verzending (betaald)

### Wat als ik geen verzendlabel kan genereren?

1. Check of je adres compleet is in je profiel
2. Check of buyer adres compleet is
3. Neem contact op met support@homecheff.nl
4. We kunnen handmatig een label genereren

### Kan ik een andere carrier kiezen?

Ja, bij label generatie kun je een carrier opgeven (PostNL, DHL, etc.). Als je niets opgeeft, kiest EctaroShip automatisch de beste optie.

### Wat als het pakket beschadigd aankomt?

1. **Koper**: Neem foto's en contacteer verkoper
2. **Verkoper**: Check verzekering via EctaroShip
3. **Support**: We kunnen bemiddelen bij geschillen
4. **Escrow**: Betaling kan worden teruggedraaid bij problemen

### Werkt dit ook voor bulk orders?

Ja, het systeem berekent automatisch gewicht en afmetingen voor meerdere items. Standaard:
- 1kg per product
- Afmetingen schalen mee met aantal items

**Tip**: Voeg in de toekomst weight/dimensions toe aan Product model voor nauwkeurigere berekening.

## Support

Voor vragen of problemen:
- **Email**: support@homecheff.nl
- **Helpdesk**: In de app via Help sectie
- **FAQ**: Zie deze documentatie

---

**Laatste update**: 8 januari 2025
**Versie**: 1.0











