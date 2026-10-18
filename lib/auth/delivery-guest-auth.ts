/**
 * Guest login and signup links while someone is in delivery onboarding.
 * They stay on the delivery wizard instead of the marketplace register form.
 */
import type { UserRole } from '@prisma/client';
import { deliveryRegistrationReturnPath } from '@/lib/auth/delivery-registration-return';

export function deliveryGuestAuthHrefs(
  pathname: string | null | undefined,
  search?: string | null,
): { login: string; register: string } | null {
  const returnPath = deliveryRegistrationReturnPath(pathname, search);
  if (!returnPath) return null;
  const path = (pathname || '').split('?')[0] || '';
  const query = returnPath.includes('?') ? returnPath.slice(returnPath.indexOf('?')) : '';
  const register = path.startsWith('/delivery/company')
    ? `/delivery/company/signup${query}`
    : path.startsWith('/delivery/signup')
      ? returnPath
      : `/delivery/signup${query}`;
  return {
    login: `/login?callbackUrl=${encodeURIComponent(returnPath)}`,
    register,
  };
}

/** Adding a delivery profile must not rewrite BUYER, SELLER, or any other role. */
export function preserveAccountRoleOnDeliveryProfile(role: string): string {
  return role;
}

/**
 * Existing Marketplace accounts keep their own address. The delivery work
 * address is stored on DeliveryProfile, not copied onto User.
 */
export function marketplaceUserPatchForDeliveryProfile(
  role: string,
  contactPhone: string | null,
): { role: UserRole; phoneNumber?: string } {
  return {
    role: preserveAccountRoleOnDeliveryProfile(role) as UserRole,
    ...(contactPhone ? { phoneNumber: contactPhone } : {}),
  };
}
