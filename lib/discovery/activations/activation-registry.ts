/**
 * Real-world activation registry — Phase 3G.
 */

import type { RealWorldActivationDefinition } from './activation-contract';
import { PRACTICAL_NEIGHBORHOOD_ACTIVATIONS } from './activation-library-practical-neighborhood';
import { LOCAL_DISCOVERY_ACTIVATIONS } from './activation-library-local-discovery';
import { COMMUNITY_SUPPORT_ACTIVATIONS } from './activation-library-community-support';

export const REAL_WORLD_ACTIVATION_REGISTRY: Record<
  string,
  RealWorldActivationDefinition
> = Object.fromEntries(
  [
    ...PRACTICAL_NEIGHBORHOOD_ACTIVATIONS,
    ...LOCAL_DISCOVERY_ACTIVATIONS,
    ...COMMUNITY_SUPPORT_ACTIVATIONS,
  ].map((def) => [def.id, def]),
);

export const ALL_REAL_WORLD_ACTIVATIONS: RealWorldActivationDefinition[] = [
  ...PRACTICAL_NEIGHBORHOOD_ACTIVATIONS,
  ...LOCAL_DISCOVERY_ACTIVATIONS,
  ...COMMUNITY_SUPPORT_ACTIVATIONS,
];

export function getRealWorldActivation(
  id: string,
): RealWorldActivationDefinition | undefined {
  return REAL_WORLD_ACTIVATION_REGISTRY[id];
}

export function listActivationsByCategory(
  category: RealWorldActivationDefinition['category'],
): RealWorldActivationDefinition[] {
  return ALL_REAL_WORLD_ACTIVATIONS.filter((a) => a.category === category);
}
