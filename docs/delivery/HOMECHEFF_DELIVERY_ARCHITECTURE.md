# HomeCheff Delivery Architecture

**Updated:** 2026-09-04  
**Canonical commercial provider:** `DeliveryProfile` (`providerType`: `INDEPENDENT` | `DELIVERY_BUSINESS`)

## Dual stacks (do not merge)

| Stack | Models | Settlement |
| --- | --- | --- |
| Checkout marketplace | `DeliveryOrder` + `DeliveryProfile` + company membership | Yes — 12/88 on locked quote |
| Community V1 | `DeliveryRequest` + `CourierAssignment` | No fee settlement |

## Provider types

- **INDIVIDUAL (`INDEPENDENT`)** — person performs deliveries; owns price/area/availability/payout.
- **COMPANY (`DELIVERY_BUSINESS`)** — company is commercial party; drivers via `DeliveryCompanyMember`.

Customer selects the **provider** (person or company). Company later assigns a **driver** without changing price.

## Membership roles

`OWNER` | `DISPATCHER` | `DRIVER` on `DeliveryCompanyMember`.

## Entry routes

| Path | Purpose |
| --- | --- |
| `/delivery` | Smart redirect (company / driver / individual / start) |
| `/delivery/start` | Choose: zelf / bedrijf / chauffeur |
| `/delivery/signup` | Individual onboarding |
| `/delivery/company/signup` | Company onboarding |
| `/delivery/invite/[token]` | Driver invite accept |
| `/delivery/dashboard` | Individual ops |
| `/delivery/company/dashboard` | Company dispatch + drivers |
| `/delivery/driver` | Assigned driver mobile ops |
| `/delivery/settings` | Pricing / area / availability |

## Status machine (checkout)

`PENDING → ACCEPTED → PICKED_UP → DELIVERED` (+ `CANCELLED` reopen rules).

Assigned drivers and company dispatchers may update status; settlement always goes to commercial profile owner.

## Flags (defaults 2026-09-04)

- `DELIVERY_PROVIDER_PRICING_ENABLED` = true  
- `DELIVERY_NAMED_PROVIDER_SELECTION_ENABLED` = true  
- `DELIVERY_BUSINESS_PROFILES_ENABLED` = true  
- `DELIVERY_FIRST_ACCEPT_POOL_ENABLED` unset → false  

## Economics

Customer delivery gross → HomeCheff **12%** platform fee → provider net **88%**.  
Affiliate only on platform fee. Company principal settles to owner; drivers are not separately settled by HomeCheff.
