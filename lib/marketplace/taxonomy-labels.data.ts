/**
 * Marketplace taxonomy i18n label pairs — Slice 1 data source.
 * Synced with lib/marketplace/taxonomy.ts registry.
 * Runtime keys: marketplace.taxonomy.*, marketplace.blocklist.*, marketplace.badges.*, marketplace.regulation.*
 */

export type TaxonomyLabelPair = { nl: string; en: string };

export type BlocklistLabelPair = TaxonomyLabelPair & {
  reasonNl: string;
  reasonEn: string;
};

export const TAXONOMY_GROUP_LABELS: Record<string, TaxonomyLabelPair> = {
  'create.meals': { nl: 'Eten & homemade', en: 'Food & homemade' },
  'create.craft': { nl: 'Ambacht & handmade', en: 'Craft & handmade' },
  'create.international': { nl: 'Internationaal & ambachtelijk', en: 'International & artisan' },
  'grow.vegetables': { nl: 'Groente', en: 'Vegetables' },
  'grow.fruit': { nl: 'Fruit', en: 'Fruit' },
  'grow.herbs': { nl: 'Kruiden', en: 'Herbs' },
  'grow.other': { nl: 'Planten & overig', en: 'Plants & other' },
  'design.web': { nl: 'Websites & apps', en: 'Websites & apps' },
  'design.brand': { nl: 'Branding & marketing', en: 'Branding & marketing' },
  'design.media': { nl: 'Media & design', en: 'Media & design' },
  'artistic.all': { nl: 'Artistieke diensten', en: 'Artistic services' },
  'practical.all': { nl: 'Praktische diensten', en: 'Practical services' },
  'knowledge.all': { nl: 'Kennis & workshops', en: 'Knowledge & workshops' },
};

export const TAXONOMY_ITEM_LABELS: Record<string, TaxonomyLabelPair> = {
  // CREATE — meals
  'create.meal': { nl: 'Maaltijden', en: 'Meals' },
  'create.baking': { nl: 'Bakken', en: 'Baking' },
  'create.bread': { nl: 'Brood', en: 'Bread' },
  'create.cake': { nl: 'Taart', en: 'Cake' },
  'create.cupcakes': { nl: 'Cupcakes', en: 'Cupcakes' },
  'create.cookies': { nl: 'Koekjes', en: 'Cookies' },
  'create.soup': { nl: 'Soep', en: 'Soup' },
  'create.pasta': { nl: 'Pasta', en: 'Pasta' },
  'create.rice': { nl: 'Rijst', en: 'Rice' },
  'create.catering': { nl: 'Catering', en: 'Catering' },
  'create.bbq': { nl: 'BBQ', en: 'BBQ' },
  'create.cuisine_surinamese': { nl: 'Surinaams', en: 'Surinamese' },
  'create.cuisine_indonesian': { nl: 'Indonesisch', en: 'Indonesian' },
  'create.cuisine_caribbean': { nl: 'Antilliaans / Caribisch', en: 'Caribbean' },
  // CREATE — craft
  'create.clothing': { nl: 'Kleding', en: 'Clothing' },
  'create.jewelry': { nl: 'Sieraden', en: 'Jewelry' },
  'create.decoration': { nl: 'Decoratie', en: 'Decoration' },
  'create.art': { nl: 'Kunst', en: 'Art' },
  // CREATE — international
  'create.coffee': { nl: 'Koffie', en: 'Coffee' },
  'create.tea': { nl: 'Thee', en: 'Tea' },
  'create.cacao': { nl: 'Cacao', en: 'Cacao' },
  'create.olive_oil': { nl: 'Olijfolie', en: 'Olive oil' },
  'create.spices': { nl: 'Kruiden & specerijen', en: 'Spices' },
  'create.sauces': { nl: 'Sauzen', en: 'Sauces' },
  'create.preserves': { nl: 'Conserven & jam', en: 'Preserves & jam' },
  'create.wine_vineyard': { nl: 'Wijn & wijngaard', en: 'Wine & vineyard' },
  'create.craft_beer': { nl: 'Craftbier', en: 'Craft beer' },

  // GROW — vegetables
  'grow.vegetables': { nl: 'Groente', en: 'Vegetables' },
  'grow.tomato': { nl: 'Tomaat', en: 'Tomato' },
  'grow.carrot': { nl: 'Wortel', en: 'Carrot' },
  'grow.pepper': { nl: 'Paprika', en: 'Pepper' },
  'grow.cucumber': { nl: 'Komkommer', en: 'Cucumber' },
  'grow.potato': { nl: 'Aardappel', en: 'Potato' },
  'grow.onion': { nl: 'Ui', en: 'Onion' },
  'grow.garlic': { nl: 'Knoflook', en: 'Garlic' },
  // GROW — fruit
  'grow.fruit': { nl: 'Fruit', en: 'Fruit' },
  'grow.apple': { nl: 'Appel', en: 'Apple' },
  'grow.pear': { nl: 'Peer', en: 'Pear' },
  'grow.orange': { nl: 'Sinaasappel', en: 'Orange' },
  'grow.lemon': { nl: 'Citroen', en: 'Lemon' },
  'grow.banana': { nl: 'Banaan', en: 'Banana' },
  'grow.grapes': { nl: 'Druiven', en: 'Grapes' },
  'grow.strawberry': { nl: 'Aardbei', en: 'Strawberry' },
  'grow.blueberry': { nl: 'Bosbes', en: 'Blueberry' },
  'grow.mango': { nl: 'Mango', en: 'Mango' },
  'grow.pineapple': { nl: 'Ananas', en: 'Pineapple' },
  'grow.avocado': { nl: 'Avocado', en: 'Avocado' },
  'grow.olives': { nl: 'Olijven', en: 'Olives' },
  // GROW — herbs & other
  'grow.herbs': { nl: 'Kruiden', en: 'Herbs' },
  'grow.basil': { nl: 'Basilicum', en: 'Basil' },
  'grow.mint': { nl: 'Munt', en: 'Mint' },
  'grow.parsley': { nl: 'Peterselie', en: 'Parsley' },
  'grow.rosemary': { nl: 'Rozemarijn', en: 'Rosemary' },
  'grow.thyme': { nl: 'Tijm', en: 'Thyme' },
  'grow.oregano': { nl: 'Oregano', en: 'Oregano' },
  'grow.plants': { nl: 'Planten', en: 'Plants' },
  'grow.houseplants': { nl: 'Kamerplanten', en: 'Houseplants' },
  'grow.cuttings': { nl: 'Stekjes', en: 'Cuttings' },
  'grow.honey': { nl: 'Honing', en: 'Honey' },

  // DESIGN
  'design.logo': { nl: 'Logo', en: 'Logo' },
  'design.branding': { nl: 'Branding', en: 'Branding' },
  'design.website': { nl: 'Website', en: 'Website' },
  'design.webshop': { nl: 'Webshop', en: 'Webshop' },
  'design.app': { nl: 'App', en: 'App' },
  'design.uiux': { nl: 'UI/UX-design', en: 'UI/UX design' },
  'design.video': { nl: 'Video', en: 'Video' },
  'design.photo': { nl: 'Fotografie', en: 'Photography' },
  'design.illustration': { nl: 'Illustratie', en: 'Illustration' },
  'design.animation': { nl: 'Animatie', en: 'Animation' },
  'design.marketing': { nl: 'Marketing', en: 'Marketing' },
  'design.seo': { nl: 'SEO', en: 'SEO' },

  // ARTISTIC_SERVICE
  'artistic.tattoo': { nl: 'Tattoo', en: 'Tattoo' },
  'artistic.nails': { nl: 'Nagels', en: 'Nails' },
  'artistic.makeup': { nl: 'Make-up', en: 'Makeup' },
  'artistic.bodypaint': { nl: 'Bodypaint', en: 'Bodypaint' },
  'artistic.airbrush': { nl: 'Airbrush', en: 'Airbrush' },
  'artistic.mural': { nl: 'Muurschildering', en: 'Mural painting' },
  'artistic.painting': { nl: 'Schilderen', en: 'Painting' },
  'artistic.portrait': { nl: 'Portret', en: 'Portrait' },
  'artistic.music': { nl: 'Muziek', en: 'Music' },
  'artistic.voice': { nl: 'Zang', en: 'Voice' },

  // PRACTICAL_SERVICE
  'practical.gardenwork': { nl: 'Tuinwerk', en: 'Garden work' },
  'practical.cleaning': { nl: 'Schoonmaak', en: 'Cleaning' },
  'practical.movinghelp': { nl: 'Verhuishulp', en: 'Moving help' },
  'practical.computerhelp': { nl: 'Computerhulp', en: 'Computer help' },
  'practical.repair': { nl: 'Reparatie', en: 'Repair' },
  'practical.handyman': { nl: 'Klushulp', en: 'Handyman' },
  'practical.assembly': { nl: 'Montage', en: 'Assembly' },
  'practical.childcare': { nl: 'Oppas', en: 'Childcare' },
  'practical.bike_repair': { nl: 'Fietsreparatie', en: 'Bike repair' },

  // KNOWLEDGE
  'knowledge.workshop': { nl: 'Workshop', en: 'Workshop' },
  'knowledge.cookingclass': { nl: 'Kookles', en: 'Cooking class' },
  'knowledge.musicclass': { nl: 'Muziekles', en: 'Music lesson' },
  'knowledge.tutoring': { nl: 'Bijles', en: 'Tutoring' },
  'knowledge.language': { nl: 'Taalles', en: 'Language lessons' },
  'knowledge.coaching': { nl: 'Coaching', en: 'Coaching' },
  'knowledge.coaching_lifestyle': { nl: 'Lifestyle-coaching', en: 'Lifestyle coaching' },
  'knowledge.coaching_sport': { nl: 'Sportcoaching', en: 'Sport coaching' },
};

export const BLOCKLIST_LABELS: Record<string, BlocklistLabelPair> = {
  dropshipping: {
    nl: 'Dropshipping',
    en: 'Dropshipping',
    reasonNl:
      'HomeCheff is bedoeld voor zelfgemaakte en lokaal geoogste producten, niet voor doorverkoop van anonieme massaproducten.',
    reasonEn:
      'HomeCheff is for self-made and locally grown products, not resale of anonymous mass products.',
  },
  resale: {
    nl: 'Wederverkoop',
    en: 'Resale',
    reasonNl:
      'Alleen producten die je zelf maakt, oogst of aanbiedt zijn toegestaan — geen wederverkoop van bestaande goederen.',
    reasonEn:
      'Only products you make, grow or offer yourself are allowed — no resale of existing goods.',
  },
  rental: {
    nl: 'Verhuur',
    en: 'Rental',
    reasonNl: 'Verhuur van goederen valt buiten het aanbodmodel van HomeCheff.',
    reasonEn: "Renting goods is outside HomeCheff's offer model.",
  },
  medical_treatment: {
    nl: 'Medische behandeling',
    en: 'Medical treatment',
    reasonNl: 'Medische behandelingen en zorgdiensten zijn niet toegestaan op HomeCheff.',
    reasonEn: 'Medical treatments and care services are not allowed on HomeCheff.',
  },
  botox_fillers: {
    nl: 'Botox & fillers',
    en: 'Botox & fillers',
    reasonNl:
      'Injectables en cosmetische medische ingrepen zijn niet toegestaan op HomeCheff.',
    reasonEn: 'Injectables and cosmetic medical procedures are not allowed on HomeCheff.',
  },
  health_claims: {
    nl: 'Gezondheidsclaims',
    en: 'Health claims',
    reasonNl:
      'Aanbiedingen met medische of gezondheidsclaims zijn niet toegestaan op HomeCheff.',
    reasonEn: 'Offers with medical or health claims are not allowed on HomeCheff.',
  },
  financial_advice: {
    nl: 'Financieel advies',
    en: 'Financial advice',
    reasonNl:
      'Financieel advies en beleggingsdiensten zijn niet toegestaan op HomeCheff.',
    reasonEn: 'Financial advice and investment services are not allowed on HomeCheff.',
  },
  legal_representation: {
    nl: 'Juridische vertegenwoordiging',
    en: 'Legal representation',
    reasonNl: 'Juridische diensten en rechtsbijstand zijn niet toegestaan op HomeCheff.',
    reasonEn: 'Legal services and representation are not allowed on HomeCheff.',
  },
};

export const TAXONOMY_UI_LABELS = {
  badges: {
    offeredHeading: { nl: 'Aangeboden', en: 'Offered' },
    acceptsAlsoHeading: { nl: 'Accepteert ook:', en: 'Also accepts:' },
    acceptsOnlyHeading: { nl: 'Accepteert:', en: 'Accepts:' },
    overflow: { nl: '+{{count}}', en: '+{{count}}' },
  },
  acceptedValues: {
    heading: {
      nl: 'Wat accepteer je eventueel ook als waarde?',
      en: 'What would you also accept as value?',
    },
    description: {
      nl: 'Optioneel — geef aan welke andere producten of diensten je ook zou accepteren als ruil of alternatieve waarde.',
      en: 'Optional — indicate which other products or services you would also accept as trade or alternative value.',
    },
    searchPlaceholder: { nl: 'Zoek in taxonomy…', en: 'Search taxonomy…' },
    filterAll: { nl: 'Alles', en: 'All' },
    emptySearch: {
      nl: 'Geen resultaten voor deze zoekopdracht.',
      en: 'No results for this search.',
    },
  },
  stripeRecommendation: {
    message: {
      nl: 'Koppel Stripe om veilig via HomeCheff betalingen te ontvangen.',
      en: 'Connect Stripe to receive secure HomeCheff payments.',
    },
    connectCta: { nl: 'Stripe koppelen', en: 'Connect Stripe' },
  },
  priceDisplay: {
    alternativeValue: { nl: 'Andere waarde', en: 'Alternative value' },
  },
  regulation: {
    alcoholDisclaimer: {
      nl: 'Alcoholgerelateerde aanbiedingen zijn nog niet beschikbaar.',
      en: 'Alcohol-related offers are not available yet.',
    },
    tattooAgeDisclaimer: {
      nl: "Tattoo's kunnen leeftijds- en hygiëneregels vereisen.",
      en: 'Tattoos may require age and hygiene rules.',
    },
  },
} as const;
