import { redirect } from 'next/navigation';
import { DELIVERY_PROFILE_EDITOR_HREF } from '@/lib/delivery/delivery-profile-completion';

export const dynamic = 'force-dynamic';

/**
 * Legacy editor wrote home* via /api/delivery/profile and skipped pricing.
 * Canonical editor is /delivery/settings.
 */
export default function DeliveryInstellingenRedirectPage() {
  redirect(DELIVERY_PROFILE_EDITOR_HREF);
}
