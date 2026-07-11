/**
 * Phase 13S — Reusable food-page identity reconciliation block (3 variants).
 */

import type { Bi } from '@/lib/i18n/seoLandingSources';

export const foodCategoryContextShared: Record<string, Bi> = {
  linkPlatform: { nl: 'Wat is HomeCheff?', en: 'What is HomeCheff?' },
  linkEcosystem: { nl: 'Hoe HomeCheff werkt', en: 'How HomeCheff works' },
};

export const foodCategoryContextV0: Record<string, Bi> = {
  body: {
    nl: 'Deze pagina gaat over eten — één categorie op HomeCheff. Het platform ondersteunt ook tuin, creaties, diensten, buurthulp en ruil. ',
    en: 'This page is about food — one category on HomeCheff. The platform also supports garden, creations, services, neighbour help and barter. ',
  },
};

export const foodCategoryContextV1: Record<string, Bi> = {
  body: {
    nl: 'HomeCheff is niet alleen een eten-site: naast thuisgemaakte maaltijden vind je tuinoogst, handmade werk, lokale diensten en buurthulp op hetzelfde dorpsplein. ',
    en: 'HomeCheff is not only a food site: alongside home meals you find garden harvest, handmade work, local services and neighbour help on the same village square. ',
  },
};

export const foodCategoryContextV2: Record<string, Bi> = {
  body: {
    nl: 'Eten is één onderdeel van persoonlijk vakmanschap op HomeCheff — samen met tuin, studio, diensten en ruil in je buurt. ',
    en: 'Food is one part of personal craftsmanship on HomeCheff — together with garden, studio, services and barter in your neighbourhood. ',
  },
};

export const FOOD_CATEGORY_CONTEXT_SOURCES: Record<string, Record<string, Bi>> = {
  foodCategoryContextShared,
  foodCategoryContextV0,
  foodCategoryContextV1,
  foodCategoryContextV2,
};

export const FOOD_CATEGORY_CONTEXT_NAMESPACES = [
  'foodCategoryContextV0',
  'foodCategoryContextV1',
  'foodCategoryContextV2',
] as const;
