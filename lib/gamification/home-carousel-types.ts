/** Homepage HCP carousel — shared API ↔ client shape (lightweight rows, no badge payloads). */

export type HomeCarouselSlideKind = 'ranking' | 'promo' | 'spotlight' | 'admin';

export type HomeCarouselRow = {
  rank: number;
  userId: string;
  displayName: string;
  username: string | null;
  avatar: string | null;
  level: number;
  score: number;
  isCurrentUser: boolean;
};

export type HomeCarouselSpotlight = {
  userId: string;
  displayName: string;
  username: string | null;
  avatar: string | null;
  level: number;
  subtitle: string;
};

export type HomeCarouselSlide = {
  id: string;
  kind: HomeCarouselSlideKind;
  /** Dedup key when merging (no consecutive duplicates). */
  variantKey: string;
  sortKey: number;
  title: string;
  subtitle?: string;
  rows?: HomeCarouselRow[];
  spotlight?: HomeCarouselSpotlight;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string | null;
  backgroundStyle?: string | null;
};
