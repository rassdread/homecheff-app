/**
 * Marketplace Taxonomy & Badge System V1 — central registry.
 *
 * Single source of truth for entry flow, badges, filters, detail, profile,
 * proposals, barter, matching, and AI recommendations.
 *
 * Slice 1: registry only — no UI wiring yet.
 */

import type {
  MarketplaceTaxonomyCategory,
  MarketplaceTaxonomyItem,
  RegulationFlag,
  TaxonomyTone,
} from './taxonomy-types';
import {
  taxonomyBlockReasonKey,
  taxonomyGroupLabelKey,
  taxonomyLabelKey,
} from './taxonomy-i18n';

type ItemOpts = {
  icon: string;
  tone: TaxonomyTone;
  parentId?: string;
  searchTerms?: string[];
  allowedAsOffer?: boolean;
  allowedAsRequest?: boolean;
  allowedAsAcceptedValue?: boolean;
  futureOnly?: boolean;
  regulated?: RegulationFlag[];
  shortLabelKey?: string;
};

function group(
  id: string,
  category: MarketplaceTaxonomyCategory,
  icon: string,
  tone: TaxonomyTone,
): MarketplaceTaxonomyItem {
  return {
    id,
    category,
    level: 'group',
    labelKey: taxonomyGroupLabelKey(id),
    icon,
    tone,
    allowedAsOffer: false,
    allowedAsRequest: false,
    allowedAsAcceptedValue: false,
  };
}

function item(
  id: string,
  category: MarketplaceTaxonomyCategory,
  opts: ItemOpts,
): MarketplaceTaxonomyItem {
  return {
    id,
    category,
    level: 'item',
    parentId: opts.parentId,
    labelKey: taxonomyLabelKey(id),
    shortLabelKey: opts.shortLabelKey,
    icon: opts.icon,
    tone: opts.tone,
    searchTerms: opts.searchTerms,
    allowedAsOffer: opts.allowedAsOffer ?? true,
    allowedAsRequest: opts.allowedAsRequest ?? true,
    allowedAsAcceptedValue: opts.allowedAsAcceptedValue ?? true,
    futureOnly: opts.futureOnly,
    regulated: opts.regulated,
  };
}

function blockedItem(slug: string, icon = 'Ban'): MarketplaceTaxonomyItem {
  const id = `blocked.${slug}`;
  return {
    id,
    category: 'CREATE',
    level: 'item',
    labelKey: taxonomyLabelKey(id),
    blockReasonKey: taxonomyBlockReasonKey(slug),
    icon,
    tone: 'blocked',
    allowedAsOffer: false,
    allowedAsRequest: false,
    allowedAsAcceptedValue: false,
    blocked: true,
  };
}

const G_MEALS = 'grp.create.meals';
const G_CRAFT = 'grp.create.craft';
const G_INTL = 'grp.create.international';
const G_VEG = 'grp.grow.vegetables';
const G_FRUIT = 'grp.grow.fruit';
const G_HERBS = 'grp.grow.herbs';
const G_GROW_OTHER = 'grp.grow.other';
const G_DESIGN_WEB = 'grp.design.web';
const G_DESIGN_BRAND = 'grp.design.brand';
const G_DESIGN_MEDIA = 'grp.design.media';
const G_ARTISTIC = 'grp.artistic.all';
const G_PRACTICAL = 'grp.practical.all';
const G_KNOWLEDGE = 'grp.knowledge.all';

export const MARKETPLACE_TAXONOMY_GROUP_IDS = [
  G_MEALS,
  G_CRAFT,
  G_INTL,
  G_VEG,
  G_FRUIT,
  G_HERBS,
  G_GROW_OTHER,
  G_DESIGN_WEB,
  G_DESIGN_BRAND,
  G_DESIGN_MEDIA,
  G_ARTISTIC,
  G_PRACTICAL,
  G_KNOWLEDGE,
] as const;

export const MARKETPLACE_BLOCKLIST_SLUGS = [
  'dropshipping',
  'resale',
  'rental',
  'medical_treatment',
  'botox_fillers',
  'health_claims',
  'financial_advice',
  'legal_representation',
] as const;

export type MarketplaceBlocklistSlug = (typeof MARKETPLACE_BLOCKLIST_SLUGS)[number];

export const MARKETPLACE_TAXONOMY: readonly MarketplaceTaxonomyItem[] = [
  group(G_MEALS, 'CREATE', 'UtensilsCrossed', 'food'),
  group(G_CRAFT, 'CREATE', 'Palette', 'food'),
  group(G_INTL, 'CREATE', 'Globe', 'international'),
  group(G_VEG, 'GROW', 'Carrot', 'garden'),
  group(G_FRUIT, 'GROW', 'Apple', 'garden'),
  group(G_HERBS, 'GROW', 'Leaf', 'garden'),
  group(G_GROW_OTHER, 'GROW', 'Flower2', 'garden'),
  group(G_DESIGN_WEB, 'DESIGN', 'Globe', 'creative'),
  group(G_DESIGN_BRAND, 'DESIGN', 'Sparkles', 'creative'),
  group(G_DESIGN_MEDIA, 'DESIGN', 'Video', 'creative'),
  group(G_ARTISTIC, 'ARTISTIC_SERVICE', 'Palette', 'artistic'),
  group(G_PRACTICAL, 'PRACTICAL_SERVICE', 'Wrench', 'service'),
  group(G_KNOWLEDGE, 'KNOWLEDGE', 'BookOpen', 'knowledge'),

  item('create.meal', 'CREATE', { icon: 'UtensilsCrossed', tone: 'food', parentId: G_MEALS, searchTerms: ['meals', 'maaltijden', 'food', 'eten'] }),
  item('create.baking', 'CREATE', { icon: 'Cake', tone: 'food', parentId: G_MEALS, searchTerms: ['bakken', 'baking', 'gebak'] }),
  item('create.bread', 'CREATE', { icon: 'Wheat', tone: 'food', parentId: G_MEALS, searchTerms: ['brood', 'bread'] }),
  item('create.cake', 'CREATE', { icon: 'CakeSlice', tone: 'food', parentId: G_MEALS, searchTerms: ['taart', 'cake'] }),
  item('create.cupcakes', 'CREATE', { icon: 'Cookie', tone: 'food', parentId: G_MEALS, searchTerms: ['cupcakes', 'cupcake'] }),
  item('create.cookies', 'CREATE', { icon: 'Cookie', tone: 'food', parentId: G_MEALS, searchTerms: ['koekjes', 'cookies'] }),
  item('create.soup', 'CREATE', { icon: 'Soup', tone: 'food', parentId: G_MEALS, searchTerms: ['soep', 'soup'] }),
  item('create.pasta', 'CREATE', { icon: 'Utensils', tone: 'food', parentId: G_MEALS, searchTerms: ['pasta'] }),
  item('create.rice', 'CREATE', { icon: 'Wheat', tone: 'food', parentId: G_MEALS, searchTerms: ['rijst', 'rice'] }),
  item('create.catering', 'CREATE', { icon: 'ChefHat', tone: 'food', parentId: G_MEALS, searchTerms: ['catering'] }),
  item('create.bbq', 'CREATE', { icon: 'Flame', tone: 'food', parentId: G_MEALS, searchTerms: ['bbq', 'barbecue', 'barbecueën'] }),
  item('create.cuisine_surinamese', 'CREATE', { icon: 'Globe', tone: 'international', parentId: G_INTL, searchTerms: ['surinaams', 'surinamese', 'suriname'] }),
  item('create.cuisine_indonesian', 'CREATE', { icon: 'Globe', tone: 'international', parentId: G_INTL, searchTerms: ['indonesisch', 'indonesian', 'indonesië', 'indonesia'] }),
  item('create.cuisine_caribbean', 'CREATE', { icon: 'Sun', tone: 'international', parentId: G_INTL, searchTerms: ['antilliaans', 'caribbean', 'caribisch', 'antillian'] }),
  item('create.clothing', 'CREATE', { icon: 'Shirt', tone: 'food', parentId: G_CRAFT, searchTerms: ['kleding', 'clothing'] }),
  item('create.jewelry', 'CREATE', { icon: 'Gem', tone: 'food', parentId: G_CRAFT, searchTerms: ['sieraden', 'jewelry'] }),
  item('create.decoration', 'CREATE', { icon: 'Lamp', tone: 'food', parentId: G_CRAFT, searchTerms: ['decoratie', 'decoration'] }),
  item('create.art', 'CREATE', { icon: 'Palette', tone: 'creative', parentId: G_CRAFT, searchTerms: ['kunst', 'art'] }),
  item('create.coffee', 'CREATE', { icon: 'Coffee', tone: 'international', parentId: G_INTL, searchTerms: ['koffie', 'coffee'] }),
  item('create.tea', 'CREATE', { icon: 'Leaf', tone: 'international', parentId: G_INTL, searchTerms: ['thee', 'tea'] }),
  item('create.cacao', 'CREATE', { icon: 'Bean', tone: 'international', parentId: G_INTL, searchTerms: ['cacao', 'cocoa', 'chocolate'] }),
  item('create.olive_oil', 'CREATE', { icon: 'Droplet', tone: 'international', parentId: G_INTL, searchTerms: ['olijfolie', 'olive oil'] }),
  item('create.spices', 'CREATE', { icon: 'Flame', tone: 'international', parentId: G_INTL, searchTerms: ['kruiden', 'specerijen', 'spices'] }),
  item('create.sauces', 'CREATE', { icon: 'FlaskConical', tone: 'international', parentId: G_INTL, searchTerms: ['sauzen', 'sauces'] }),
  item('create.preserves', 'CREATE', { icon: 'Package', tone: 'international', parentId: G_INTL, searchTerms: ['conserven', 'preserves', 'jam'] }),
  item('create.wine_vineyard', 'CREATE', { icon: 'Wine', tone: 'international', parentId: G_INTL, searchTerms: ['wijn', 'wine', 'vineyard', 'wijngaard'], futureOnly: true, regulated: ['alcohol'] }),
  item('create.craft_beer', 'CREATE', { icon: 'Beer', tone: 'international', parentId: G_INTL, searchTerms: ['bier', 'beer', 'craft beer', 'craftbier'], futureOnly: true, regulated: ['alcohol'] }),

  item('grow.vegetables', 'GROW', { icon: 'Carrot', tone: 'garden', parentId: G_VEG, searchTerms: ['groente', 'vegetables', 'groenten'] }),
  item('grow.tomato', 'GROW', { icon: 'Cherry', tone: 'garden', parentId: G_VEG, searchTerms: ['tomaat', 'tomato', 'tomaten'] }),
  item('grow.carrot', 'GROW', { icon: 'Carrot', tone: 'garden', parentId: G_VEG, searchTerms: ['wortel', 'carrot', 'wortelen'] }),
  item('grow.pepper', 'GROW', { icon: 'Salad', tone: 'garden', parentId: G_VEG, searchTerms: ['paprika', 'pepper', 'peppers'] }),
  item('grow.cucumber', 'GROW', { icon: 'Salad', tone: 'garden', parentId: G_VEG, searchTerms: ['komkommer', 'cucumber'] }),
  item('grow.potato', 'GROW', { icon: 'Sprout', tone: 'garden', parentId: G_VEG, searchTerms: ['aardappel', 'potato', 'aardappelen'] }),
  item('grow.onion', 'GROW', { icon: 'Circle', tone: 'garden', parentId: G_VEG, searchTerms: ['ui', 'onion', 'uien'] }),
  item('grow.garlic', 'GROW', { icon: 'Clover', tone: 'garden', parentId: G_VEG, searchTerms: ['knoflook', 'garlic'] }),
  item('grow.fruit', 'GROW', { icon: 'Apple', tone: 'garden', parentId: G_FRUIT, searchTerms: ['fruit'] }),
  item('grow.apple', 'GROW', { icon: 'Apple', tone: 'garden', parentId: G_FRUIT, searchTerms: ['appel', 'apple', 'appels'] }),
  item('grow.pear', 'GROW', { icon: 'Apple', tone: 'garden', parentId: G_FRUIT, searchTerms: ['peer', 'pear', 'peren'] }),
  item('grow.orange', 'GROW', { icon: 'Citrus', tone: 'garden', parentId: G_FRUIT, searchTerms: ['sinaasappel', 'orange', 'oranges'] }),
  item('grow.lemon', 'GROW', { icon: 'Citrus', tone: 'garden', parentId: G_FRUIT, searchTerms: ['citroen', 'lemon', 'citroenen'] }),
  item('grow.banana', 'GROW', { icon: 'Banana', tone: 'garden', parentId: G_FRUIT, searchTerms: ['banaan', 'banana', 'bananen'] }),
  item('grow.grapes', 'GROW', { icon: 'Grape', tone: 'garden', parentId: G_FRUIT, searchTerms: ['druiven', 'grapes', 'grape'] }),
  item('grow.strawberry', 'GROW', { icon: 'Cherry', tone: 'garden', parentId: G_FRUIT, searchTerms: ['aardbei', 'strawberry', 'aardbeien'] }),
  item('grow.blueberry', 'GROW', { icon: 'Cherry', tone: 'garden', parentId: G_FRUIT, searchTerms: ['bosbes', 'blueberry', 'bosbessen'] }),
  item('grow.mango', 'GROW', { icon: 'Cherry', tone: 'garden', parentId: G_FRUIT, searchTerms: ['mango'] }),
  item('grow.pineapple', 'GROW', { icon: 'Cherry', tone: 'garden', parentId: G_FRUIT, searchTerms: ['ananas', 'pineapple'] }),
  item('grow.avocado', 'GROW', { icon: 'Cherry', tone: 'garden', parentId: G_FRUIT, searchTerms: ['avocado'] }),
  item('grow.olives', 'GROW', { icon: 'Cherry', tone: 'garden', parentId: G_FRUIT, searchTerms: ['olijven', 'olives', 'olive'] }),
  item('grow.herbs', 'GROW', { icon: 'Leaf', tone: 'garden', parentId: G_HERBS, searchTerms: ['kruiden', 'herbs'] }),
  item('grow.basil', 'GROW', { icon: 'Leaf', tone: 'garden', parentId: G_HERBS, searchTerms: ['basilicum', 'basil'] }),
  item('grow.mint', 'GROW', { icon: 'Leaf', tone: 'garden', parentId: G_HERBS, searchTerms: ['munt', 'mint'] }),
  item('grow.parsley', 'GROW', { icon: 'Leaf', tone: 'garden', parentId: G_HERBS, searchTerms: ['peterselie', 'parsley'] }),
  item('grow.rosemary', 'GROW', { icon: 'Leaf', tone: 'garden', parentId: G_HERBS, searchTerms: ['rozemarijn', 'rosemary'] }),
  item('grow.thyme', 'GROW', { icon: 'Leaf', tone: 'garden', parentId: G_HERBS, searchTerms: ['tijm', 'thyme'] }),
  item('grow.oregano', 'GROW', { icon: 'Leaf', tone: 'garden', parentId: G_HERBS, searchTerms: ['oregano'] }),
  item('grow.plants', 'GROW', { icon: 'Flower2', tone: 'garden', parentId: G_GROW_OTHER, searchTerms: ['planten', 'plants'] }),
  item('grow.houseplants', 'GROW', { icon: 'Flower2', tone: 'garden', parentId: G_GROW_OTHER, searchTerms: ['kamerplanten', 'houseplants', 'kamerplant'] }),
  item('grow.cuttings', 'GROW', { icon: 'Sprout', tone: 'garden', parentId: G_GROW_OTHER, searchTerms: ['stekjes', 'cuttings', 'stek'] }),
  item('grow.honey', 'GROW', { icon: 'Hexagon', tone: 'garden', parentId: G_GROW_OTHER, searchTerms: ['honing', 'honey'] }),

  item('design.logo', 'DESIGN', { icon: 'PenTool', tone: 'creative', parentId: G_DESIGN_BRAND, searchTerms: ['logo'] }),
  item('design.branding', 'DESIGN', { icon: 'Sparkles', tone: 'creative', parentId: G_DESIGN_BRAND, searchTerms: ['branding', 'huisstijl'] }),
  item('design.website', 'DESIGN', { icon: 'Globe', tone: 'creative', parentId: G_DESIGN_WEB, searchTerms: ['website', 'web'] }),
  item('design.webshop', 'DESIGN', { icon: 'ShoppingBag', tone: 'creative', parentId: G_DESIGN_WEB, searchTerms: ['webshop', 'webwinkel'] }),
  item('design.app', 'DESIGN', { icon: 'Smartphone', tone: 'creative', parentId: G_DESIGN_WEB, searchTerms: ['app', 'applicatie'] }),
  item('design.uiux', 'DESIGN', { icon: 'Layout', tone: 'creative', parentId: G_DESIGN_WEB, searchTerms: ['ui', 'ux', 'uiux', 'design'] }),
  item('design.video', 'DESIGN', { icon: 'Video', tone: 'creative', parentId: G_DESIGN_MEDIA, searchTerms: ['video'] }),
  item('design.photo', 'DESIGN', { icon: 'Camera', tone: 'creative', parentId: G_DESIGN_MEDIA, searchTerms: ['foto', 'photo', 'photography'] }),
  item('design.illustration', 'DESIGN', { icon: 'Pen', tone: 'creative', parentId: G_DESIGN_MEDIA, searchTerms: ['illustratie', 'illustration'] }),
  item('design.animation', 'DESIGN', { icon: 'Film', tone: 'creative', parentId: G_DESIGN_MEDIA, searchTerms: ['animatie', 'animation'] }),
  item('design.marketing', 'DESIGN', { icon: 'Megaphone', tone: 'creative', parentId: G_DESIGN_BRAND, searchTerms: ['marketing'] }),
  item('design.seo', 'DESIGN', { icon: 'Search', tone: 'creative', parentId: G_DESIGN_BRAND, searchTerms: ['seo'] }),

  item('artistic.tattoo', 'ARTISTIC_SERVICE', { icon: 'Pen', tone: 'artistic', parentId: G_ARTISTIC, searchTerms: ['tattoo'], regulated: ['age_restricted'] }),
  item('artistic.nails', 'ARTISTIC_SERVICE', { icon: 'Sparkles', tone: 'artistic', parentId: G_ARTISTIC, searchTerms: ['nagels', 'nails', 'manicure'] }),
  item('artistic.makeup', 'ARTISTIC_SERVICE', { icon: 'Brush', tone: 'artistic', parentId: G_ARTISTIC, searchTerms: ['make-up', 'makeup'] }),
  item('artistic.bodypaint', 'ARTISTIC_SERVICE', { icon: 'Paintbrush', tone: 'artistic', parentId: G_ARTISTIC, searchTerms: ['bodypaint', 'body paint'] }),
  item('artistic.airbrush', 'ARTISTIC_SERVICE', { icon: 'SprayCan', tone: 'artistic', parentId: G_ARTISTIC, searchTerms: ['airbrush'] }),
  item('artistic.mural', 'ARTISTIC_SERVICE', { icon: 'Building2', tone: 'artistic', parentId: G_ARTISTIC, searchTerms: ['muurschildering', 'mural'] }),
  item('artistic.painting', 'ARTISTIC_SERVICE', { icon: 'Palette', tone: 'artistic', parentId: G_ARTISTIC, searchTerms: ['schilderen', 'painting'] }),
  item('artistic.portrait', 'ARTISTIC_SERVICE', { icon: 'User', tone: 'artistic', parentId: G_ARTISTIC, searchTerms: ['portret', 'portrait'] }),
  item('artistic.music', 'ARTISTIC_SERVICE', { icon: 'Music', tone: 'artistic', parentId: G_ARTISTIC, searchTerms: ['muziek', 'music'] }),
  item('artistic.voice', 'ARTISTIC_SERVICE', { icon: 'Mic', tone: 'artistic', parentId: G_ARTISTIC, searchTerms: ['zang', 'voice', 'vocals'] }),

  item('practical.gardenwork', 'PRACTICAL_SERVICE', { icon: 'Shovel', tone: 'service', parentId: G_PRACTICAL, searchTerms: ['tuinwerk', 'garden work'] }),
  item('practical.cleaning', 'PRACTICAL_SERVICE', { icon: 'Sparkles', tone: 'service', parentId: G_PRACTICAL, searchTerms: ['schoonmaak', 'cleaning'] }),
  item('practical.movinghelp', 'PRACTICAL_SERVICE', { icon: 'Truck', tone: 'service', parentId: G_PRACTICAL, searchTerms: ['verhuishulp', 'moving help'] }),
  item('practical.computerhelp', 'PRACTICAL_SERVICE', { icon: 'Monitor', tone: 'service', parentId: G_PRACTICAL, searchTerms: ['computerhulp', 'computer help', 'it support'] }),
  item('practical.repair', 'PRACTICAL_SERVICE', { icon: 'Wrench', tone: 'service', parentId: G_PRACTICAL, searchTerms: ['reparatie', 'repair'] }),
  item('practical.handyman', 'PRACTICAL_SERVICE', { icon: 'Hammer', tone: 'service', parentId: G_PRACTICAL, searchTerms: ['klushulp', 'handyman'] }),
  item('practical.assembly', 'PRACTICAL_SERVICE', { icon: 'Package', tone: 'service', parentId: G_PRACTICAL, searchTerms: ['montage', 'assembly'] }),
  item('practical.childcare', 'PRACTICAL_SERVICE', { icon: 'Baby', tone: 'service', parentId: G_PRACTICAL, searchTerms: ['oppas', 'childcare', 'kinderopvang', 'babysit'] }),
  item('practical.bike_repair', 'PRACTICAL_SERVICE', { icon: 'Bike', tone: 'service', parentId: G_PRACTICAL, searchTerms: ['fietsreparatie', 'bike repair', 'fiets', 'bicycle'] }),

  item('knowledge.workshop', 'KNOWLEDGE', { icon: 'Users', tone: 'knowledge', parentId: G_KNOWLEDGE, searchTerms: ['workshop'] }),
  item('knowledge.cookingclass', 'KNOWLEDGE', { icon: 'ChefHat', tone: 'knowledge', parentId: G_KNOWLEDGE, searchTerms: ['kookles', 'cooking class'] }),
  item('knowledge.musicclass', 'KNOWLEDGE', { icon: 'Music', tone: 'knowledge', parentId: G_KNOWLEDGE, searchTerms: ['muziekles', 'music class'] }),
  item('knowledge.tutoring', 'KNOWLEDGE', { icon: 'BookOpen', tone: 'knowledge', parentId: G_KNOWLEDGE, searchTerms: ['bijles', 'tutoring'] }),
  item('knowledge.language', 'KNOWLEDGE', { icon: 'Languages', tone: 'knowledge', parentId: G_KNOWLEDGE, searchTerms: ['taalles', 'language'] }),
  item('knowledge.coaching', 'KNOWLEDGE', { icon: 'HeartHandshake', tone: 'knowledge', parentId: G_KNOWLEDGE, searchTerms: ['coaching'] }),
  item('knowledge.coaching_lifestyle', 'KNOWLEDGE', { icon: 'Heart', tone: 'knowledge', parentId: G_KNOWLEDGE, searchTerms: ['lifestyle', 'leefstijl', 'life coaching'] }),
  item('knowledge.coaching_sport', 'KNOWLEDGE', { icon: 'Dumbbell', tone: 'knowledge', parentId: G_KNOWLEDGE, searchTerms: ['sport', 'sportcoaching', 'fitness coaching'] }),

  blockedItem('dropshipping'),
  blockedItem('resale'),
  blockedItem('rental'),
  blockedItem('medical_treatment'),
  blockedItem('botox_fillers'),
  blockedItem('health_claims'),
  blockedItem('financial_advice'),
  blockedItem('legal_representation'),
];
