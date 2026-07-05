/**
 * Placement roles (chef / garden / designer) required before opening create flow.
 */

export const CREATE_ROLES_SETTINGS_HREF = '/settings?tab=profile&section=roles';

/** Normalize API/session sellerRoles to chef | garden | designer slugs. */
export function normalizeCreatePlacementRoles(raw: unknown): string[] {
  const arr = Array.isArray(raw) ? raw : [];
  const out = new Set<string>();
  for (const x of arr) {
    const r = String(x).toLowerCase().trim();
    if (r === 'chef' || r === 'cheff') out.add('chef');
    else if (r === 'garden' || r === 'grower' || r === 'grown') out.add('garden');
    else if (r === 'designer' || r === 'design') out.add('designer');
  }
  return [...out];
}

export function userHasCreatePlacementRoles(input: {
  sellerRoles?: unknown;
}): boolean {
  return normalizeCreatePlacementRoles(input.sellerRoles).length > 0;
}
