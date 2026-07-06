# Marketplace Icon Legend — Single Source of Truth

**Phase:** 4A  
**Status:** Canonical reference  
**Last updated:** 2026-07-06  
**Code mirror:** `lib/marketplace/value-exchange/` + `lib/marketplace/taxonomy.ts`

This document is the **authoritative legend** for marketplace icons across tiles, previews, detail pages, entry flow, and future barter matching.

---

## Main categories

| Emoji | ID | Label key | Lucide | Prisma `MarketplaceCategory` | `ListingKind` |
|-------|-----|-----------|--------|------------------------------|---------------|
| 🍳 | `HOME_CHEFF` | `marketplace.valueExchange.categories.homeCheff` | `UtensilsCrossed` | `CREATE` | `PRODUCT` |
| 🌱 | `HOME_GARDEN` | `marketplace.valueExchange.categories.homeGarden` | `Sprout` | `GROW` | `PRODUCT` |
| 🎨 | `HOME_DESIGNER` | `marketplace.valueExchange.categories.homeDesigner` | `Palette` | `DESIGN`, `ARTISTIC_SERVICE` | `SERVICE` |
| 🔧 | `SERVICES` | `marketplace.valueExchange.categories.services` | `Wrench` | `PRACTICAL_SERVICE` | `SERVICE`, `TASK` |
| 📚 | `WORKSHOPS` | `marketplace.valueExchange.categories.workshops` | `GraduationCap` | `KNOWLEDGE` | `WORKSHOP` |
| 🎓 | `COACHING` | `marketplace.valueExchange.categories.coaching` | `HeartHandshake` | `KNOWLEDGE` | `COACHING` |
| 🚚 | `DELIVERY` | `marketplace.valueExchange.categories.delivery` | `Truck` | — (fulfillment) | — |
| 🙋 | `REQUESTS` | `marketplace.valueExchange.categories.requests` | `Hand` | — (intent) | `REQUEST` |

---

## Subcategories by main category

Subcategory ids and icons come from `MARKETPLACE_TAXONOMY`. Label keys: `marketplace.taxonomy.{id}.label`.

### 🍳 HomeCheff (`CREATE`)

| ID | Icon | Group |
|----|------|-------|
| `create.meal` | UtensilsCrossed | Meals |
| `create.baking` | Cake | Meals |
| `create.bread` | Wheat | Meals |
| `create.cake` | CakeSlice | Meals |
| `create.cupcakes` | Cookie | Meals |
| `create.cookies` | Cookie | Meals |
| `create.soup` | Soup | Meals |
| `create.pasta` | Utensils | Meals |
| `create.rice` | Wheat | Meals |
| `create.catering` | ChefHat | Meals |
| `create.clothing` | Shirt | Craft |
| `create.jewelry` | Gem | Craft |
| `create.decoration` | Lamp | Craft |
| `create.art` | Palette | Craft |
| `create.coffee` | Coffee | International |
| `create.tea` | Leaf | International |
| `create.cacao` | Bean | International |
| `create.olive_oil` | Droplet | International |
| `create.spices` | Flame | International |
| `create.sauces` | FlaskConical | International |
| `create.preserves` | Jar | International |
| `create.wine_vineyard` | Wine | International *(future)* |
| `create.craft_beer` | Beer | International *(future)* |

### 🌱 HomeGarden (`GROW`)

| ID | Icon | Group |
|----|------|-------|
| `grow.vegetables` | Carrot | Vegetables |
| `grow.tomato` | Cherry | Vegetables |
| `grow.carrot` | Carrot | Vegetables |
| `grow.pepper` | Pepper | Vegetables |
| `grow.cucumber` | Salad | Vegetables |
| `grow.potato` | Sprout | Vegetables |
| `grow.onion` | Circle | Vegetables |
| `grow.garlic` | Clover | Vegetables |
| `grow.fruit` | Apple | Fruit |
| `grow.apple` | Apple | Fruit |
| `grow.pear` | Apple | Fruit |
| `grow.orange` | Citrus | Fruit |
| `grow.lemon` | Citrus | Fruit |
| `grow.banana` | Banana | Fruit |
| `grow.grapes` | Grape | Fruit |
| `grow.strawberry` | Cherry | Fruit |
| `grow.blueberry` | Cherry | Fruit |
| `grow.mango` | Cherry | Fruit |
| `grow.pineapple` | Cherry | Fruit |
| `grow.avocado` | Cherry | Fruit |
| `grow.olives` | Cherry | Fruit |
| `grow.herbs` | Leaf | Herbs |
| `grow.basil` | Leaf | Herbs |
| `grow.mint` | Leaf | Herbs |
| `grow.parsley` | Leaf | Herbs |
| `grow.rosemary` | Leaf | Herbs |
| `grow.thyme` | Leaf | Herbs |
| `grow.oregano` | Leaf | Herbs |
| `grow.plants` | Flower2 | Other |
| `grow.honey` | Hexagon | Other |

### 🎨 HomeDesigner (`DESIGN` + `ARTISTIC_SERVICE`)

| ID | Icon | Group |
|----|------|-------|
| `design.logo` | PenTool | Brand |
| `design.branding` | Sparkles | Brand |
| `design.marketing` | Megaphone | Brand |
| `design.seo` | Search | Brand |
| `design.website` | Globe | Web |
| `design.webshop` | ShoppingBag | Web |
| `design.app` | Smartphone | Web |
| `design.uiux` | Layout | Web |
| `design.video` | Video | Media |
| `design.photo` | Camera | Media |
| `design.illustration` | Pen | Media |
| `design.animation` | Film | Media |
| `artistic.tattoo` | Pen | Artistic |
| `artistic.nails` | Sparkles | Artistic |
| `artistic.makeup` | Brush | Artistic |
| `artistic.bodypaint` | Paintbrush | Artistic |
| `artistic.airbrush` | SprayCan | Artistic |
| `artistic.mural` | Building2 | Artistic |
| `artistic.painting` | Palette | Artistic |
| `artistic.portrait` | User | Artistic |
| `artistic.music` | Music | Artistic |
| `artistic.voice` | Mic | Artistic |

### 🔧 Services (`PRACTICAL_SERVICE`)

| ID | Icon |
|----|------|
| `practical.gardenwork` | Shovel |
| `practical.cleaning` | Sparkles |
| `practical.movinghelp` | Truck |
| `practical.computerhelp` | Monitor |
| `practical.repair` | Wrench |
| `practical.handyman` | Hammer |
| `practical.assembly` | Package |

### 📚 Workshops (`KNOWLEDGE` — workshop kinds)

| ID | Icon |
|----|------|
| `knowledge.workshop` | Users |
| `knowledge.cookingclass` | ChefHat |
| `knowledge.musicclass` | Music |
| `knowledge.tutoring` | BookOpen |
| `knowledge.language` | Languages |

### 🎓 Coaching (`KNOWLEDGE` — coaching)

| ID | Icon |
|----|------|
| `knowledge.coaching` | HeartHandshake |

---

## Payment methods

| Emoji | ID | Label key | Tile price key |
|-------|-----|-----------|----------------|
| 💶 | `MONEY` | `marketplace.valueExchange.payment.money` | `marketplace.tile.price.fixed` |
| 🔄 | `BARTER` | `marketplace.valueExchange.payment.barter` | `marketplace.tile.price.barterOnly` |
| 💶🔄 | `MONEY_AND_BARTER` | `marketplace.valueExchange.payment.moneyAndBarter` | `marketplace.tile.price.moneyAndBarter` |
| 🤝 | `VOLUNTARY_CONTRIBUTION` | `marketplace.valueExchange.payment.voluntary` | `marketplace.tile.price.voluntary` |
| 💬 | `ON_REQUEST` | `marketplace.valueExchange.payment.onRequest` | `marketplace.tile.price.onRequest` |

---

## Fulfillment icons

| Key | Emoji | Label key | Lucide |
|-----|-------|-----------|--------|
| `pickup` | 📍 | `marketplace.valueExchange.fulfillment.pickup` | `MapPin` |
| `delivery` | 🚚 | `marketplace.valueExchange.fulfillment.delivery` | `Truck` |
| `shipping` | 📦 | `marketplace.valueExchange.fulfillment.shipping` | `Package` |
| `digital` | 💻 | `marketplace.valueExchange.fulfillment.digital` | `Monitor` |
| `onSiteClient` | 🏠 | `marketplace.valueExchange.fulfillment.onSiteClient` | `Home` |
| `onSiteProvider` | 🏢 | `marketplace.valueExchange.fulfillment.onSiteProvider` | `Building2` |

Source: `lib/marketplace/listing-taxonomy.ts` · `FULFILLMENT_KEYS`.

---

## Trust icons (tile-safe)

| Signal | Display | Source |
|--------|---------|--------|
| Product reviews | ⭐ + count | `trust.productReviewCount` |
| Deal reviews | 🤝 + count | `trust.dealReviewCount` |
| Deliveries | 🚚 + count | `trust.completedDeliveries` |
| Established maker | ✓ | `sellerTier ≥ 4` |
| Trust badge | Shield | `trust.trustBadges` |

**Forbidden on tiles:** blended rating, views, fans, HCP, ranking boosts.

Label keys: `marketplace.valueExchange.trust.*` + `marketplace.tile.trust.*`.

---

## Exchange value display

| Surface | Show |
|---------|------|
| Tile | Payment line only; **one** offer category icon |
| Preview | Payment + accepted main-category icons (barter) |
| Detail | Full accepted taxonomy list + desired exchange block |

Barter labels:

- Accepts: `marketplace.valueExchange.barter.accepts`
- Desired: `marketplace.valueExchange.barter.desired`

---

## Legacy mapping

| Legacy | Main category |
|--------|---------------|
| `CHEFF` / `CREATE` | 🍳 HomeCheff |
| `GROWN` / `GROW` | 🌱 HomeGarden |
| `DESIGNER` / `DESIGN` | 🎨 HomeDesigner |

---

## Maintenance rules

1. **Add subcategory** → update `lib/marketplace/taxonomy.ts` only; mapping auto-regenerates.
2. **Add main category** → update contract + legend + i18n together.
3. **Never** add ranking/trust/discovery effects to icon legend entries.
4. Run `npx tsx scripts/validate-value-exchange-system.ts` after taxonomy changes.
