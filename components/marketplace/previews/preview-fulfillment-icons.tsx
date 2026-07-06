import {
  MapPin,
  Monitor,
  Package,
  Store,
  Truck,
  Video,
} from 'lucide-react';
import type { PreviewFulfillmentItem } from '@/lib/marketplace/previews/types';

const ICON_BY_KEY: Record<string, typeof Store> = {
  pickup: Store,
  delivery: Truck,
  shipping: Package,
  digital: Monitor,
  onSite: MapPin,
  onlineSession: Video,
};

export function PreviewFulfillmentIcon({ item }: { item: PreviewFulfillmentItem }) {
  const Icon = ICON_BY_KEY[item.key] ?? Package;
  return <Icon className="h-4 w-4 shrink-0" aria-hidden />;
}
