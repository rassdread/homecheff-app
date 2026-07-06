import type { PublicContactChannel } from '@/lib/profile/maker-contact-preferences';
import type { PublicProfileHcpPayload } from '@/lib/profile/public-profile-hcp';

/** Profile V2 — shared view model for private + public surfaces. */
export type ProfileV2TabId =
  | 'overview'
  | 'aanbod'
  | 'inspiratie'
  | 'community'
  | 'vertrouwen';

export type ProfileV2AanbodFilter =
  | 'all'
  | 'chef'
  | 'garden'
  | 'designer'
  | 'products'
  | 'services'
  | 'tasks'
  | 'workshops'
  | 'coaching'
  | 'trade'
  | 'help';

/** Inspiratie-tab: filter op verticaal (geen services/trade/help/tasks). */
export type ProfileV2InspiratieFilter = 'all' | 'chef' | 'garden' | 'designer';

export type ProfileV2SellerRole = 'chef' | 'garden' | 'designer';

export type ProfileV2User = {
  id: string;
  name: string | null;
  username: string | null;
  email?: string | null;
  bio: string | null;
  quote: string | null;
  place: string | null;
  gender?: string | null;
  interests: string[];
  buyerTypes?: string[];
  selectedBuyerType?: string | null;
  image?: string | null;
  profileImage: string | null;
  role: string;
  sellerRoles: ProfileV2SellerRole[];
  buyerRoles?: string[];
  displayFullName?: boolean;
  displayNameOption?: string;
  showFansList?: boolean;
  showProfileToEveryone?: boolean;
  showOnlineStatus?: boolean;
  fanRequestEnabled?: boolean;
  emailVerified?: Date | string | null;
  hasPassword?: boolean;
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean;
  createdAt: string | Date;
  profileViews?: number;
  SellerProfile?: {
    id: string;
    companyName: string | null;
    kvk?: string | null;
    btw?: string | null;
    subscriptionId?: string | null;
    subscriptionValidUntil?: Date | string | null;
    Subscription?: {
      id: string;
      name: string;
      priceCents?: number;
      isActive: boolean;
    } | null;
    products?: unknown[];
  } | null;
  DeliveryProfile?: {
    id: string;
    isActive: boolean;
    isVerified: boolean;
    totalDeliveries: number;
    averageRating: number | null;
    reviews: unknown[];
    vehiclePhotos: unknown[];
    bio?: string | null;
    age?: number;
    transportation?: string[];
    maxDistance?: number;
    preferredRadius?: number;
    deliveryMode?: string;
    availableDays?: string[];
    availableTimeSlots?: string[];
    totalEarnings?: number;
    createdAt?: string;
  } | null;
  Dish?: unknown[];
  dish?: unknown[];
};

export type ProfileV2Stats = {
  items: number;
  dishes: number;
  products: number;
  followers: number;
  following: number;
  favorites: number;
  orders: number;
  reviews?: number;
  props?: number;
};

export type ProfileV2Context = {
  viewerIsOwner: boolean;
  /** Logged-in viewer on public URL viewing own profile */
  isOwnPublicUrl?: boolean;
  user: ProfileV2User;
  stats: ProfileV2Stats | null;
  hcp?: PublicProfileHcpPayload | null;
  publicContact?: PublicContactChannel[];
  ecosystemChipKeys?: string[];
  /** Server-provided published items for public grids */
  publishedItems?: unknown[];
};

export type ProfileV2TabDefinition = {
  id: ProfileV2TabId;
  labelKey: string;
};
