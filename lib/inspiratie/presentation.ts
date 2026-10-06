/**
 * One public vocabulary for inspiration. Storage may still be a Dish row.
 * CHEFF is food, DESIGNER is design, GROWN is garden. Unknown is not a recipe.
 */
export type InspirationSemanticType = 'recipe' | 'design' | 'garden';

export type InspirationPresentation = {
  semanticType: InspirationSemanticType | null;
  badgeKey: string;
  ctaKey: string;
  detailKey: string;
  guideKey: string;
  pathSegment: 'recipe' | 'design' | 'garden' | null;
};

export function resolveInspirationSemanticType(
  category: string | null | undefined,
): InspirationSemanticType | null {
  switch ((category ?? '').trim().toUpperCase()) {
    case 'CHEFF':
    case 'CHEF':
      return 'recipe';
    case 'DESIGNER':
    case 'DESIGN':
      return 'design';
    case 'GROWN':
    case 'GARDEN':
      return 'garden';
    default:
      return null;
  }
}

export function resolveInspirationPresentation(
  category: string | null | undefined,
): InspirationPresentation {
  const semanticType = resolveInspirationSemanticType(category);
  if (semanticType === 'design') {
    return {
      semanticType,
      badgeKey: 'inspiratie.presentation.design.badge',
      ctaKey: 'inspiratie.presentation.design.cta',
      detailKey: 'inspiratie.presentation.design.detail',
      guideKey: 'inspiratie.presentation.design.guide',
      pathSegment: 'design',
    };
  }
  if (semanticType === 'garden') {
    return {
      semanticType,
      badgeKey: 'inspiratie.presentation.garden.badge',
      ctaKey: 'inspiratie.presentation.garden.cta',
      detailKey: 'inspiratie.presentation.garden.detail',
      guideKey: 'inspiratie.presentation.garden.guide',
      pathSegment: 'garden',
    };
  }
  if (semanticType === 'recipe') {
    return {
      semanticType,
      badgeKey: 'inspiratie.presentation.recipe.badge',
      ctaKey: 'inspiratie.presentation.recipe.cta',
      detailKey: 'inspiratie.presentation.recipe.detail',
      guideKey: 'inspiratie.presentation.recipe.guide',
      pathSegment: 'recipe',
    };
  }
  return {
    semanticType: null,
    badgeKey: 'inspiratie.presentation.generic.badge',
    ctaKey: 'inspiratie.presentation.generic.cta',
    detailKey: 'inspiratie.presentation.generic.detail',
    guideKey: 'inspiratie.presentation.generic.guide',
    pathSegment: null,
  };
}
