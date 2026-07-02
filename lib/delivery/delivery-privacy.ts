export type LocationUser = {
  name?: string | null;
  username?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  place?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type DeliveryDashboardPhase = 'available' | 'assigned';

/** Area label only — no street address. */
export function formatAreaLabel(user: LocationUser | null | undefined): string {
  if (!user) return 'Regio onbekend';
  const parts = [user.place, user.city, user.postalCode?.slice(0, 4)]
    .filter(Boolean)
    .map(String);
  const unique = [...new Set(parts)];
  return unique.length > 0 ? unique.join(', ') : 'Regio onbekend';
}

export function formatFullAddress(
  user: LocationUser | null | undefined,
  deliveryAddressFallback?: string | null
): string {
  if (!user) {
    return deliveryAddressFallback?.trim() || 'Adres niet beschikbaar';
  }
  const parts = [user.address, user.postalCode, user.city || user.place].filter(
    Boolean
  );
  if (parts.length > 0) return parts.join(', ');
  return deliveryAddressFallback?.trim() || 'Adres niet beschikbaar';
}

export function customerPhoneForPhase(
  user: LocationUser | null | undefined,
  phase: DeliveryDashboardPhase
): string | null {
  if (phase === 'available') return null;
  return user?.phoneNumber?.trim() || null;
}

export function customerAddressForPhase(
  user: LocationUser | null | undefined,
  deliveryAddress: string | null | undefined,
  phase: DeliveryDashboardPhase
): string {
  if (phase === 'available') {
    return formatAreaLabel(user);
  }
  return formatFullAddress(user, deliveryAddress);
}

export function sellerAddressForPhase(
  sellerUser: LocationUser | null | undefined,
  phase: DeliveryDashboardPhase
): string {
  if (phase === 'available') {
    return formatAreaLabel(sellerUser);
  }
  return formatFullAddress(sellerUser);
}

export function sellerPhoneForPhase(
  sellerUser: LocationUser | null | undefined,
  phase: DeliveryDashboardPhase
): string | null {
  if (phase === 'available') return null;
  return sellerUser?.phoneNumber?.trim() || null;
}
