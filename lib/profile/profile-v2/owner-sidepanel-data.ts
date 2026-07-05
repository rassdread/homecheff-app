import type {
  ProfileV2Context,
  ProfileV2Stats,
  ProfileV2TabId,
  ProfileV2User,
} from './types';

export type WorkspacePhotoCounts = {
  CHEFF: number;
  GROWN: number;
  DESIGNER: number;
};

export type CompletenessItemId =
  | 'profilePhoto'
  | 'bio'
  | 'roles'
  | 'workspacePhotos'
  | 'stripe'
  | 'aanbod'
  | 'inspiratie';

export type CompletenessItem = {
  id: CompletenessItemId;
  done: boolean;
  labelKey: string;
};

export type NextStepId =
  | 'setupRoles'
  | 'firstAanbod'
  | 'firstInspiratie'
  | 'workspacePhotos'
  | 'stripe'
  | 'viewPublicProfile';

export type NextStep = {
  id: NextStepId;
  titleKey: string;
  descriptionKey: string;
  ctaKey: string;
  tab?: ProfileV2TabId;
};

export function hasStripeConnected(user: ProfileV2User): boolean {
  return Boolean(
    user.stripeConnectOnboardingCompleted && user.stripeConnectAccountId,
  );
}

export function hasWorkspacePhotosForRoles(
  user: ProfileV2User,
  counts: WorkspacePhotoCounts,
): boolean {
  const roles = user.sellerRoles ?? [];
  if (roles.length === 0) return false;
  return roles.every((role) => {
    if (role === 'chef') return counts.CHEFF > 0;
    if (role === 'garden') return counts.GROWN > 0;
    if (role === 'designer') return counts.DESIGNER > 0;
    return true;
  });
}

export function computeCompletenessItems(
  user: ProfileV2User,
  stats: ProfileV2Stats | null,
  workspaceCounts: WorkspacePhotoCounts,
): CompletenessItem[] {
  const hasRoles =
    (user.sellerRoles?.length ?? 0) > 0 || (user.interests?.length ?? 0) > 0;

  return [
    {
      id: 'profilePhoto',
      done: Boolean(user.profileImage?.trim()),
      labelKey: 'profileV2.sidepanel.completeness.profilePhoto',
    },
    {
      id: 'bio',
      done: Boolean(user.bio?.trim()),
      labelKey: 'profileV2.sidepanel.completeness.bio',
    },
    {
      id: 'roles',
      done: hasRoles,
      labelKey: 'profileV2.sidepanel.completeness.roles',
    },
    {
      id: 'workspacePhotos',
      done: hasWorkspacePhotosForRoles(user, workspaceCounts),
      labelKey: 'profileV2.sidepanel.completeness.workspacePhotos',
    },
    {
      id: 'stripe',
      done: hasStripeConnected(user),
      labelKey: 'profileV2.sidepanel.completeness.stripe',
    },
    {
      id: 'aanbod',
      done: (stats?.products ?? 0) > 0,
      labelKey: 'profileV2.sidepanel.completeness.aanbod',
    },
    {
      id: 'inspiratie',
      done: (stats?.dishes ?? 0) > 0,
      labelKey: 'profileV2.sidepanel.completeness.inspiratie',
    },
  ];
}

export function computeCompletenessPercent(items: CompletenessItem[]): number {
  if (items.length === 0) return 0;
  const done = items.filter((i) => i.done).length;
  return Math.round((done / items.length) * 100);
}

export function computeRecommendedNextStep(
  user: ProfileV2User,
  stats: ProfileV2Stats | null,
  workspaceCounts: WorkspacePhotoCounts,
): NextStep {
  const sellerRoles = user.sellerRoles ?? [];

  if (sellerRoles.length === 0 && (user.interests?.length ?? 0) === 0) {
    return {
      id: 'setupRoles',
      titleKey: 'profileV2.sidepanel.nextStep.setupRoles.title',
      descriptionKey: 'profileV2.sidepanel.nextStep.setupRoles.description',
      ctaKey: 'profileV2.sidepanel.nextStep.setupRoles.cta',
      tab: 'overview',
    };
  }

  if ((stats?.products ?? 0) === 0) {
    return {
      id: 'firstAanbod',
      titleKey: 'profileV2.sidepanel.nextStep.firstAanbod.title',
      descriptionKey: 'profileV2.sidepanel.nextStep.firstAanbod.description',
      ctaKey: 'profileV2.sidepanel.nextStep.firstAanbod.cta',
      tab: 'aanbod',
    };
  }

  if ((stats?.dishes ?? 0) === 0) {
    return {
      id: 'firstInspiratie',
      titleKey: 'profileV2.sidepanel.nextStep.firstInspiratie.title',
      descriptionKey: 'profileV2.sidepanel.nextStep.firstInspiratie.description',
      ctaKey: 'profileV2.sidepanel.nextStep.firstInspiratie.cta',
      tab: 'inspiratie',
    };
  }

  if (!hasWorkspacePhotosForRoles(user, workspaceCounts)) {
    return {
      id: 'workspacePhotos',
      titleKey: 'profileV2.sidepanel.nextStep.workspacePhotos.title',
      descriptionKey: 'profileV2.sidepanel.nextStep.workspacePhotos.description',
      ctaKey: 'profileV2.sidepanel.nextStep.workspacePhotos.cta',
      tab: 'vertrouwen',
    };
  }

  if (sellerRoles.length > 0 && !hasStripeConnected(user)) {
    return {
      id: 'stripe',
      titleKey: 'profileV2.sidepanel.nextStep.stripe.title',
      descriptionKey: 'profileV2.sidepanel.nextStep.stripe.description',
      ctaKey: 'profileV2.sidepanel.nextStep.stripe.cta',
      tab: 'overview',
    };
  }

  return {
    id: 'viewPublicProfile',
    titleKey: 'profileV2.sidepanel.nextStep.viewPublic.title',
    descriptionKey: 'profileV2.sidepanel.nextStep.viewPublic.description',
    ctaKey: 'profileV2.sidepanel.nextStep.viewPublic.cta',
    tab: 'community',
  };
}

export function getTrustActionKeys(user: ProfileV2User): Array<{
  id: 'kitchen' | 'garden' | 'studio' | 'vehicle';
  labelKey: string;
  visible: boolean;
  done: boolean;
}> {
  const roles = user.sellerRoles ?? [];
  const vehicleCount = user.DeliveryProfile?.vehiclePhotos?.length ?? 0;
  const hasDelivery = Boolean(user.DeliveryProfile);

  return [
    {
      id: 'kitchen' as const,
      labelKey: 'profileV2.sidepanel.trust.kitchen',
      visible: roles.includes('chef'),
      done: false,
    },
    {
      id: 'garden' as const,
      labelKey: 'profileV2.sidepanel.trust.garden',
      visible: roles.includes('garden'),
      done: false,
    },
    {
      id: 'studio' as const,
      labelKey: 'profileV2.sidepanel.trust.studio',
      visible: roles.includes('designer'),
      done: false,
    },
    {
      id: 'vehicle' as const,
      labelKey: 'profileV2.sidepanel.trust.vehicle',
      visible: hasDelivery,
      done: vehicleCount >= 2,
    },
  ].filter((item): item is {
    id: 'kitchen' | 'garden' | 'studio' | 'vehicle';
    labelKey: string;
    visible: boolean;
    done: boolean;
  } => item.visible);
}

export function enrichTrustActions(
  actions: ReturnType<typeof getTrustActionKeys>,
  workspaceCounts: WorkspacePhotoCounts,
): ReturnType<typeof getTrustActionKeys> {
  return actions.map((action) => {
    if (action.id === 'kitchen') {
      return { ...action, done: workspaceCounts.CHEFF > 0 };
    }
    if (action.id === 'garden') {
      return { ...action, done: workspaceCounts.GROWN > 0 };
    }
    if (action.id === 'studio') {
      return { ...action, done: workspaceCounts.DESIGNER > 0 };
    }
    return action;
  });
}

export type QuickActionId =
  | 'addAanbod'
  | 'addInspiratie'
  | 'trust'
  | 'editProfile';

export function getHighlightedQuickAction(
  activeTab: ProfileV2TabId,
): QuickActionId | null {
  switch (activeTab) {
    case 'aanbod':
      return 'addAanbod';
    case 'inspiratie':
      return 'addInspiratie';
    case 'vertrouwen':
      return 'trust';
    default:
      return null;
  }
}

export function getHighlightedCommunityAction(
  activeTab: ProfileV2TabId,
): 'publicProfile' | 'fans' | null {
  if (activeTab === 'community') return 'publicProfile';
  return null;
}

export function getPublicProfileHref(user: ProfileV2User): string | null {
  if (!user.username?.trim()) return null;
  return `/user/${encodeURIComponent(user.username)}`;
}

export function emptyWorkspaceCounts(): WorkspacePhotoCounts {
  return { CHEFF: 0, GROWN: 0, DESIGNER: 0 };
}

export function parseWorkspacePhotoCounts(
  photos: Record<string, unknown[] | undefined> | undefined,
): WorkspacePhotoCounts {
  return {
    CHEFF: photos?.CHEFF?.length ?? 0,
    GROWN: photos?.GROWN?.length ?? 0,
    DESIGNER: photos?.DESIGNER?.length ?? 0,
  };
}

export type OwnerSidepanelDerived = {
  completenessItems: CompletenessItem[];
  completenessPercent: number;
  nextStep: NextStep;
  trustActions: ReturnType<typeof enrichTrustActions>;
  publicProfileHref: string | null;
  hasSellerRoles: boolean;
};

export function deriveOwnerSidepanelData(
  ctx: ProfileV2Context,
  workspaceCounts: WorkspacePhotoCounts,
): OwnerSidepanelDerived {
  const { user, stats } = ctx;
  const completenessItems = computeCompletenessItems(
    user,
    stats,
    workspaceCounts,
  );

  return {
    completenessItems,
    completenessPercent: computeCompletenessPercent(completenessItems),
    nextStep: computeRecommendedNextStep(user, stats, workspaceCounts),
    trustActions: enrichTrustActions(
      getTrustActionKeys(user),
      workspaceCounts,
    ),
    publicProfileHref: getPublicProfileHref(user),
    hasSellerRoles: (user.sellerRoles?.length ?? 0) > 0,
  };
}
