# HOMECHEFF_BUSINESS_MULTI_LOCATION_V1

Architectuur vóór implementatie. Geen productie-deploy en geen productiedatabasewijziging.

## Uitgangspunt

Een ondernemer houdt één User, één SellerProfile, één abonnement en één productcatalogus. Een product blijft één `Product`-rij. Extra verkooppunten zijn geen gekopieerde producten en geen tweede account.

Bestaande adresbronnen blijven hun huidige rol houden:

| Bron | Rol | Wijziging in V1 |
| --- | --- | --- |
| `User.address` / `lat` / `lng` | Profiel- en woonadres | Niet gebruiken als verkooppuntenlijst |
| `Business.address` | Juridisch bedrijfsadres (KvK) | Niet dupliceren als kraam |
| `SellerProfile.lat` / `lng` | Bestaande marketplace-fallback | Blijft fallback |
| `Product.pickupAddress` / `pickupLat` / `pickupLng` | Bestaande afhaalanker, ook voor bezorgmatching | Niet herschrijven bij locatiebeheer |
| `Order.pickupAddress` | Snapshot op de bestelling | Blijft de enige orderkopie; geen nieuwe orderkolom |

Nieuwe bron, alleen voor door de verkoper benoemde verkooppunten:

- `SellerSalesLocation` — hoort bij `User` (particulier én bedrijf, één limiet per account).
- `ProductSalesLocation` — koppelt één product aan meerdere actieve locaties.

## Abonnement

Limieten komen uit `getBusinessVisibilityProfile().maxLocations`. Prijzen, fee-bps en Stripe-plannen veranderen niet.

| Plan | Locaties (actief) |
| --- | --- |
| individual (particulier) | 1 |
| basic | 1 |
| pro | 3 |
| premium | 25 |

Inactieve locaties tellen niet mee. Opnieuw activeren mag alleen onder de limiet. VIP26 en Demy's Premium-abonnement worden niet aangeraakt.

## Marketplace

Een product zonder koppelingen gebruikt de bestaande anker (`pickup` → seller → user). Daardoor verdwijnt geen bestaande listing, ook niet als `User.bio` null is. De NULL-bio eligibility-where blijft onaangeroerd.

Een product mét actieve locaties:

- telt één keer in de feed;
- gebruikt voor afstand en radius de dichtstbijzijnde actieve locatie met coördinaten;
- toont die plaatsnaam op de kaart.

Voorraad blijft `Product.stock`. Er is geen voorraad per locatie. Een verkoop op de ene kraam verlaagt dezelfde voorraad.

## Bestelling

De gekozen afhaallocatie gaat als tekstsnapshot mee in het bestaande checkout-veld `address` wanneer de koper afhalen kiest. Stripe-sessiecode, fees en webhooks veranderen niet. Een latere wijziging van de locatie herschrijft geen bestaande orderrijen.

Bezorgmatching blijft `Product.pickupLat` / `pickupLng` gebruiken. Die velden worden niet overschreven door de nieuwe koppelingen.

## Migratie

De migratie maakt alleen de twee nieuwe tabellen. Er is geen backfill van productiedata. Bestaande producten blijven geldig zonder rij in `ProductSalesLocation`.
