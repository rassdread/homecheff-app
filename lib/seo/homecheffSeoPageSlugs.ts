/**
 * SP.2D-C7 — SEO slug lists only (no page copy).
 * Used by Edge middleware LEGAL-0 so it does not load ~82KB of SEO content.
 * Keep in sync with HOMECHEFF_SEO_PAGE_DEFS (validated by validate-legal-0-integrity).
 */

export const NL_SEO_PAGE_SLUGS = [
  "thuisgekookt-eten-kopen",
  "eten-bestellen-bij-particulieren",
  "maaltijden-aan-huis",
  "wat-eten-we-vandaag",
  "gezonde-maaltijden-ideeen",
  "geld-verdienen-met-koken",
  "verkopen-vanuit-huis",
  "hoe-begin-je-als-thuiskok",
  "koken-voor-anderen-vanuit-huis",
  "verdienen-met-hobby-koken",
  "platform-voor-thuiskoks",
  "wat-is-thuisgekookt-eten",
  "eten-verkopen-vanuit-huis-regels",
  "lokale-producten-kopen",
  "alternatief-voor-thuisbezorgd",
  "maaltijden-in-rotterdam",
  "maaltijden-in-amsterdam",
  "maaltijden-in-den-haag",
  "maaltijden-in-utrecht",
  "maaltijden-in-eindhoven"
] as const;

export const EN_SEO_PAGE_SLUGS = [
  "buy-home-cooked-food",
  "order-food-from-local-cooks",
  "meals-at-home",
  "what-should-we-eat-today",
  "healthy-meal-ideas",
  "earn-money-cooking-from-home",
  "sell-from-home",
  "how-to-start-as-a-home-cook",
  "cook-for-others-from-home",
  "earn-money-with-home-cooking",
  "platform-for-home-cooks",
  "what-is-home-cooked-food",
  "rules-for-selling-food-from-home",
  "buy-local-products",
  "alternative-to-takeaway-platforms",
  "meals-in-rotterdam",
  "meals-in-amsterdam",
  "meals-in-the-hague",
  "meals-in-utrecht",
  "meals-in-eindhoven"
] as const;
