'use client';
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Star, Package, Edit3, Trash2, AlertCircle,
  ChefHat, Sprout, Palette,
} from "lucide-react";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewForm from "@/components/reviews/ReviewForm";
import type { PublicContactChannel } from "@/lib/profile/maker-contact-preferences";
import BackButton from "@/components/navigation/BackButton";
import ListingDetailUnavailable from '@/components/product/ListingDetailUnavailable';
import { LEGACY_VERTICAL_DETAIL_CLASSES } from '@/lib/marketplace/marketplace-icon-colors';
import {
  listingDetailApiPath,
  listingDetailFetchUrl,
  listingDetailResolvedId,
  resolveListingDetailKind,
  type ListingDetailLoadError,
} from '@/lib/marketplace/detail/listing-detail-route';
import { listingDetailDiag } from '@/lib/marketplace/detail/listing-detail-diag';
import { shouldUseAbsoluteApiBase } from '@/lib/client/resolve-api-url';
import { isNativeApp } from '@/lib/native/capacitor';
import { navDebug } from '@/lib/nav-debug';
import PhotoCarousel from "@/components/ui/PhotoCarousel";
import { getDisplayName as getDisplayNameUtil, PUBLIC_DISPLAY_FALLBACK } from "@/lib/displayName";
import { useTranslation } from '@/hooks/useTranslation';
import {
  buildListingDetailHref,
} from '@/lib/seo/listing-routes';
import type { ProductOrderMethodValue } from '@/lib/product/order-method';
import type { PublicPaymentStatus } from '@/lib/stripe/seller-payment-status';
import type { MarketplaceCategory } from '@prisma/client';
import ProductSaleDomainStory from '@/components/product/detail/ProductSaleDomainStory';
import type { ProductInspirationLink } from '@/components/product/detail/ProductInspirationLinkCard';
import ProductSaleCommerceZone from '@/components/product/detail/ProductSaleCommerceZone';
import ProductDetailMainSections from '@/components/product/detail/ProductDetailMainSections';
import ProductSaleStickyCta from '@/components/product/detail/ProductSaleStickyCta';
import {
  EXCHANGE_FUNNEL_EVENTS,
  trackExchangeFunnelEvent,
} from '@/lib/marketplace/exchange/exchange-funnel-analytics';
import ProductSaleReviewEmpty from '@/components/product/detail/ProductSaleReviewEmpty';
import { resolveProductDetailVideo } from '@/lib/product/normalize-product-video';
import type { UserBadgeChipItem } from '@/components/gamification/UserBadgeChips';
import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import {
  EMPTY_DISCOVERY_TRUST_CONTRACT,
  type DiscoveryTrustContract,
} from '@/lib/discovery/contracts/discovery-trust-contract';
import { DESKTOP_DETAIL_GRID } from '@/lib/marketplace/detail/detail-layout-contract';
import { ProductDetailLoadingSkeleton } from '@/components/navigation/RouteLoadingSkeletons';
import { consumeRouteLoadingHandoff } from '@/lib/instant-experience/route-loading-handoff';
import {
  readListingDetailReturnCache,
  saveListingDetailReturnCache,
  type ListingDetailReturnSnapshot,
} from '@/lib/instant-experience/listing-detail-return-cache';
import type { ListingDetailPayload } from '@/lib/marketplace/detail/load-listing-detail';
import { mapListingDetailPayload } from '@/lib/marketplace/detail/map-listing-detail-payload';

type Product = {
  id: string;
  title: string;
  description?: string | null;
  priceCents: number;
  orderMethod?: ProductOrderMethodValue;
  acceptHomeCheffPayment?: boolean | null;
  acceptDirectContact?: boolean | null;
  image?: string | null;
  photos?: { id: string; url: string; idx: number }[];
  stock?: number | null;
  maxStock?: number | null;
  deliveryMode?: string | null;
  createdAt: string | Date;
  category?: string;
  subcategory?: string;
  marketplaceCategory?: string | null;
  specializations?: string[];
  acceptedSpecializations?: string[];
  barterOpenness?: string | null;
  listingIntent?: string | null;
  priceModel?: string | null;
  displayNameType?: string;
  delivery?: 'PICKUP' | 'DELIVERY' | 'BOTH';
  tags?: string[];
  pickupAddress?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  sellerCanDeliver?: boolean;
  deliveryRadiusKm?: number | null;
  Image?: { id: string; fileUrl: string }[];
  Video?: { id: string; url: string; thumbnail?: string | null; duration?: number | null } | null;
  seller?: { 
    lat?: number | null;
    lng?: number | null;
    kvk?: string | null;
    companyName?: string | null;
    User: {
      id: string;
      name?: string | null; 
      username?: string | null;
      avatar?: string | null;
      image?: string | null;
      profileImage?: string | null;
      displayFullName?: boolean | null;
      displayNameOption?: string | null;
      place?: string | null;
      city?: string | null;
      lat?: number | null;
      lng?: number | null;
      sellerRoles?: string[];
    };
  } | null;
};

type ProductStats = {
  viewCount: number;
  orderCount: number;
  favoriteCount: number;
  averageRating: number;
  reviewCount: number;
};

const getCategoryTheme = (category: string | undefined, t: (key: string) => string) => {
  switch (category) {
    case 'CHEFF': {
      const tone = LEGACY_VERTICAL_DETAIL_CLASSES.CHEFF;
      return {
        gradient: 'from-orange-500 via-red-500 to-pink-500',
        bg: 'bg-orange-50',
        text: tone.text,
        badge: tone.badge,
        icon: ChefHat,
        label: t('productCategory.cheff'),
        accent: tone.accent,
      };
    }
    case 'GROWN': {
      const tone = LEGACY_VERTICAL_DETAIL_CLASSES.GROWN;
      return {
        gradient: 'from-emerald-500 via-green-500 to-teal-500',
        bg: 'bg-emerald-50',
        text: tone.text,
        badge: tone.badge,
        icon: Sprout,
        label: t('productCategory.garden'),
        accent: tone.accent,
      };
    }
    case 'DESIGNER': {
      const tone = LEGACY_VERTICAL_DETAIL_CLASSES.DESIGNER;
      return {
        gradient: 'from-purple-500 via-pink-500 to-yellow-500',
        bg: 'bg-purple-50',
        text: tone.text,
        badge: tone.badge,
        icon: Palette,
        label: t('productCategory.designer'),
        accent: tone.accent,
      };
    }
    default:
      return {
        gradient: 'from-gray-500 via-gray-600 to-gray-700',
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Package,
        label: t('productCategory.default'),
        accent: 'bg-gray-500'
      };
  }
};

const getSellerDisplayName = (product: Product | null) => {
  if (!product?.seller?.User) return PUBLIC_DISPLAY_FALLBACK;

  return getDisplayNameUtil(product.seller.User);
};

type ListingDetailPageProps = {
  /** RSC-loaded critical listing payload — skips client /api/products waterfall. */
  initialData?: ListingDetailPayload | null;
};

export default function ListingDetailPage({
  initialData = null,
}: ListingDetailPageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const routeParam =
    typeof params?.id === 'string'
      ? params.id
      : typeof params?.slug === 'string'
        ? params.slug
        : null;
  // Helper function: Get available stock using same logic as checkout
  // Uses stock as primary, maxStock as fallback (consistent with Stripe checkout)
  const getAvailableStock = (product: Product | null) => {
    if (!product) return null;
    return typeof product.stock === 'number' && product.stock !== null
      ? product.stock
      : typeof product.maxStock === 'number' && product.maxStock !== null
        ? product.maxStock
        : null;
  };
  const { data: session } = useSession();
  const { t } = useTranslation();

  const mappedInitial = initialData
    ? mapListingDetailPayload(initialData)
    : null;

  const [product, setProduct] = useState<Product | null>(
    () => (mappedInitial?.product as Product) ?? null,
  );
  const [stats, setStats] = useState<ProductStats>(() =>
    mappedInitial?.stats
      ? (mappedInitial.stats as ProductStats)
      : {
          viewCount: 0,
          orderCount: 0,
          favoriteCount: 0,
          averageRating: 0,
          reviewCount: 0,
        },
  );
  const [isLoading, setIsLoading] = useState(() => !mappedInitial);
  const [quantity, setQuantity] = useState(1);
  const [baseUrl, setBaseUrl] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    priceCents: 0,
    stock: 0,
    maxStock: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [publicContactChannels, setPublicContactChannels] = useState<PublicContactChannel[]>(
    () =>
      (mappedInitial?.publicContactChannels as PublicContactChannel[]) ?? [],
  );
  const [checkoutAvailable, setCheckoutAvailable] = useState(
    () => mappedInitial?.checkoutAvailable !== false,
  );
  const [paymentStatus, setPaymentStatus] = useState<PublicPaymentStatus | null>(
    () => (mappedInitial?.paymentStatus as PublicPaymentStatus | null) ?? null,
  );
  const [sellerBadges, setSellerBadges] = useState<UserBadgeChipItem[]>(
    () => (mappedInitial?.sellerBadges as UserBadgeChipItem[]) ?? [],
  );
  const [isBusiness, setIsBusiness] = useState(
    () => Boolean(mappedInitial?.isBusiness),
  );
  const [companyName, setCompanyName] = useState<string | null>(
    () => mappedInitial?.companyName ?? null,
  );
  const [profileViewerCoords, setProfileViewerCoords] = useState<{
    lat?: number | null;
    lng?: number | null;
  } | null>(null);
  const [linkedInspiration, setLinkedInspiration] = useState<ProductInspirationLink | null>(
    () => mappedInitial?.linkedInspiration ?? null,
  );
  const [dishInfo, setDishInfo] = useState<import('@/components/product/detail/ProductSaleDomainStory').ProductSaleDishInfo>(
    () =>
      mappedInitial?.dishInfo ?? {
        isDish: false,
        category: null,
      },
  );
  const [discoveryTrust, setDiscoveryTrust] = useState<DiscoveryTrustContract>(
    () =>
      (mappedInitial?.discoveryTrust as DiscoveryTrustContract) ??
      EMPTY_DISCOVERY_TRUST_CONTRACT,
  );
  const [loadError, setLoadError] = useState<ListingDetailLoadError | null>(null);
  const [fetchGeneration, setFetchGeneration] = useState(0);
  const [showClientSkeleton, setShowClientSkeleton] = useState(() => !mappedInitial);
  const handoffCheckedRef = useRef(false);
  const hasStaleSnapshotRef = useRef(Boolean(mappedInitial));
  const hasServerInitialRef = useRef(Boolean(mappedInitial));

  useLayoutEffect(() => {
    if (!routeParam || typeof window === 'undefined') return;

    // Server-first payload already hydrated — no blank skeleton.
    if (hasServerInitialRef.current && product) {
      setIsLoading(false);
      setShowClientSkeleton(false);
      hasStaleSnapshotRef.current = true;
      return;
    }

    const resolvedId = listingDetailResolvedId(routeParam);
    const snapshot = readListingDetailReturnCache(resolvedId);
    if (snapshot?.product) {
      hasStaleSnapshotRef.current = true;
      setProduct(snapshot.product as Product);
      if (snapshot.stats) setStats(snapshot.stats as ProductStats);
      if (Array.isArray(snapshot.reviews)) setReviews(snapshot.reviews);
      if (Array.isArray(snapshot.sellerBadges)) {
        setSellerBadges(snapshot.sellerBadges as UserBadgeChipItem[]);
      }
      if (snapshot.discoveryTrust) {
        setDiscoveryTrust(snapshot.discoveryTrust as DiscoveryTrustContract);
      }
      if (snapshot.dishInfo) {
        setDishInfo(
          snapshot.dishInfo as import('@/components/product/detail/ProductSaleDomainStory').ProductSaleDishInfo,
        );
      }
      if (snapshot.linkedInspiration) {
        setLinkedInspiration(snapshot.linkedInspiration as ProductInspirationLink);
      }
      if (Array.isArray(snapshot.publicContactChannels)) {
        setPublicContactChannels(snapshot.publicContactChannels as PublicContactChannel[]);
      }
      setCheckoutAvailable(snapshot.checkoutAvailable !== false);
      setPaymentStatus((snapshot.paymentStatus as PublicPaymentStatus | null) ?? null);
      setIsBusiness(Boolean(snapshot.isBusiness));
      setCompanyName(snapshot.companyName ?? null);
      setIsLoading(false);
      setShowClientSkeleton(false);
      return;
    }
    if (!handoffCheckedRef.current) {
      handoffCheckedRef.current = true;
      if (consumeRouteLoadingHandoff()) {
        setShowClientSkeleton(false);
      }
    }
  }, [routeParam, product]);

  const persistListingDetailSnapshot = (
    nextProduct: Product,
    payload: {
      stats: ProductStats;
      reviews: unknown[];
      sellerBadges: UserBadgeChipItem[];
      discoveryTrust: DiscoveryTrustContract;
      dishInfo: import('@/components/product/detail/ProductSaleDomainStory').ProductSaleDishInfo;
      linkedInspiration: ProductInspirationLink | null;
      publicContactChannels: PublicContactChannel[];
      checkoutAvailable: boolean;
      paymentStatus: PublicPaymentStatus | null;
      isBusiness: boolean;
      companyName: string | null;
    },
  ) => {
    if (!routeParam) return;
    const snapshot: Omit<ListingDetailReturnSnapshot, 'savedAt'> = {
      product: nextProduct,
      stats: payload.stats,
      reviews: payload.reviews,
      sellerBadges: payload.sellerBadges,
      discoveryTrust: payload.discoveryTrust,
      dishInfo: payload.dishInfo,
      linkedInspiration: payload.linkedInspiration,
      publicContactChannels: payload.publicContactChannels,
      checkoutAvailable: payload.checkoutAvailable,
      paymentStatus: payload.paymentStatus,
      isBusiness: payload.isBusiness,
      companyName: payload.companyName,
    };
    saveListingDetailReturnCache(listingDetailResolvedId(routeParam), snapshot);
  };

  useEffect(() => {
    if (!routeParam) return;
    setBaseUrl(window.location.origin);

    // Explicit retry after error: abandon RSC snapshot and re-fetch API.
    if (fetchGeneration > 0) {
      hasServerInitialRef.current = false;
    }

    const applySecondaryClientLoads = async (productId: string, sellerUserId?: string) => {
      if (session?.user?.email) {
        try {
          const userResponse = await fetch('/api/profile/me');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setCurrentUser(userData);
            setProfileViewerCoords({
              lat: userData.lat ?? null,
              lng: userData.lng ?? null,
            });
            if (sellerUserId) {
              setIsOwner(userData.id === sellerUserId);
            }
            const p = product;
            if (p && userData.id === sellerUserId) {
              setEditData({
                title: p.title || '',
                description: p.description || '',
                priceCents: p.priceCents || 0,
                stock: p.stock || 0,
                maxStock: p.maxStock || 0,
              });
            }
          }
        } catch (authError) {
          console.error('Error checking user profile:', authError);
        }
      }

      // B-class enrichment + reviews in parallel after first paint
      const [extrasResult, reviewResult] = await Promise.all([
        fetch(`/api/products/${productId}/detail-extras`)
          .then(async (r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch(`/api/products/${productId}/reviews`)
          .then(async (r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);

      let nextSellerBadges = sellerBadges;
      let nextDiscoveryTrust = discoveryTrust;
      let nextPublicContactChannels = publicContactChannels;
      let nextDishInfo = dishInfo;
      let nextLinkedInspiration = linkedInspiration;
      let nextStats = stats;

      if (extrasResult) {
        if (Array.isArray(extrasResult.sellerBadges)) {
          nextSellerBadges = extrasResult.sellerBadges;
          setSellerBadges(nextSellerBadges);
        }
        if (extrasResult.discoveryTrust) {
          nextDiscoveryTrust = extrasResult.discoveryTrust as DiscoveryTrustContract;
          setDiscoveryTrust(nextDiscoveryTrust);
        }
        if (Array.isArray(extrasResult.publicContactChannels)) {
          nextPublicContactChannels = extrasResult.publicContactChannels;
          setPublicContactChannels(nextPublicContactChannels);
        }
        if (extrasResult.stats) {
          nextStats = {
            ...stats,
            averageRating: extrasResult.stats.averageRating ?? stats.averageRating,
            reviewCount: extrasResult.stats.reviewCount ?? stats.reviewCount,
          };
          setStats(nextStats);
        }
        if (extrasResult.isDish || extrasResult.dishCategory) {
          nextDishInfo = {
            ...dishInfo,
            isDish: Boolean(extrasResult.isDish),
            category: extrasResult.dishCategory ?? null,
          };
          setDishInfo(nextDishInfo);
        }
        if (extrasResult.linkedInspiration?.href && extrasResult.linkedInspiration?.category) {
          nextLinkedInspiration = {
            href: extrasResult.linkedInspiration.href,
            category: extrasResult.linkedInspiration.category,
          };
          setLinkedInspiration(nextLinkedInspiration);
        }
      }

      let loadedReviews: unknown[] = [];
      if (reviewResult?.reviews) {
        loadedReviews = reviewResult.reviews;
        setReviews(loadedReviews);
      }

      if (product) {
        persistListingDetailSnapshot(product, {
          stats: nextStats,
          reviews: loadedReviews,
          sellerBadges: nextSellerBadges,
          discoveryTrust: nextDiscoveryTrust,
          dishInfo: nextDishInfo,
          linkedInspiration: nextLinkedInspiration,
          publicContactChannels: nextPublicContactChannels,
          checkoutAvailable,
          paymentStatus,
          isBusiness,
          companyName,
        });
      }
    };

    // Server-first: critical body already present — defer reviews / extras / me / analytics.
    if (hasServerInitialRef.current && product?.id) {
      setIsLoading(false);
      setShowClientSkeleton(false);
      trackExchangeFunnelEvent(EXCHANGE_FUNNEL_EVENTS.detailView, {
        listingId: product.id,
        barterOpenness: product.barterOpenness,
        acceptedSpecializations: product.acceptedSpecializations,
        listingIntent: product.listingIntent,
        specializations: product.specializations,
        orderMethod: product.orderMethod,
        surface: 'detail',
        entrypoint: 'product_detail_rsc',
      });
      void applySecondaryClientLoads(
        product.id,
        product.seller?.User?.id,
      );
      trackView(listingDetailResolvedId(routeParam));
      return;
    }
    
    const fetchProduct = async () => {
      const resolvedId = listingDetailResolvedId(routeParam);
      const apiPath = listingDetailApiPath(routeParam);
      const fetchUrl = listingDetailFetchUrl(routeParam);
      const detailKind = resolveListingDetailKind(params ?? undefined);
      const origin =
        typeof window !== 'undefined' ? window.location.origin : '';
      const diagBase = {
        tileId: resolvedId,
        routeParam,
        resolvedId,
        detailKind,
        apiPath,
        fetchUrl,
        href:
          typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.search}`
            : null,
        native: isNativeApp(),
        absoluteApi: shouldUseAbsoluteApiBase(),
        origin,
      };

      try {
        if (!hasStaleSnapshotRef.current) {
          setIsLoading(true);
        }
        setLoadError(null);
        navDebug('listing-detail:fetch', diagBase);
        listingDetailDiag('fetch:start', diagBase);

        const response = await fetch(fetchUrl, {
          credentials: shouldUseAbsoluteApiBase() ? 'omit' : 'same-origin',
          cache: 'no-store',
        });

        const status = response.status;
        let bodySnippet = '';
        try {
          bodySnippet = (await response.clone().text()).slice(0, 280);
        } catch {
          bodySnippet = '';
        }

        listingDetailDiag('fetch:response', {
          ...diagBase,
          httpStatus: status,
          ok: response.ok,
          bodySnippet,
        });

        if (status === 404) {
          setProduct(null);
          setLoadError('not_found');
          return;
        }
        if (status === 403) {
          setProduct(null);
          setLoadError('unavailable');
          return;
        }
        if (status >= 500) {
          setProduct(null);
          setLoadError('server_error');
          return;
        }
        if (!response.ok) {
          setProduct(null);
          setLoadError('network');
          return;
        }

        let data: any = null;
        try {
          data = await response.json();
        } catch (parseError) {
          listingDetailDiag('fetch:json-parse-failed', {
            ...diagBase,
            httpStatus: status,
            bodySnippet,
            error: String(parseError),
          });
          setProduct(null);
          setLoadError('invalid');
          return;
        }
        
        if (!data || !data.product) {
          setProduct(null);
          setLoadError('invalid');
          return;
        }

        // Set stats if available
        if (data.stats) {
          setStats(data.stats);
        }

        const mapped = mapListingDetailPayload(data);
        const transformedProduct = mapped.product as Product;
        setDishInfo(mapped.dishInfo);
        setLinkedInspiration(mapped.linkedInspiration);
        
        setProduct(transformedProduct);
        trackExchangeFunnelEvent(EXCHANGE_FUNNEL_EVENTS.detailView, {
          listingId: transformedProduct.id,
          barterOpenness: transformedProduct.barterOpenness,
          acceptedSpecializations: transformedProduct.acceptedSpecializations,
          listingIntent: transformedProduct.listingIntent,
          specializations: transformedProduct.specializations,
          orderMethod: transformedProduct.orderMethod,
          surface: 'detail',
          entrypoint: 'product_detail_load',
        });
        const nextSellerBadges = mapped.sellerBadges as UserBadgeChipItem[];
        setSellerBadges(nextSellerBadges);
        const nextIsBusiness = mapped.isBusiness;
        setIsBusiness(nextIsBusiness);
        const nextCompanyName = mapped.companyName;
        setCompanyName(nextCompanyName);

        const nextPublicContactChannels = mapped.publicContactChannels as PublicContactChannel[];
        setPublicContactChannels(nextPublicContactChannels);

        const nextCheckoutAvailable = mapped.checkoutAvailable;
        setCheckoutAvailable(nextCheckoutAvailable);
        const nextPaymentStatus = mapped.paymentStatus as PublicPaymentStatus | null;
        setPaymentStatus(nextPaymentStatus);
        const nextDiscoveryTrust = (mapped.discoveryTrust as DiscoveryTrustContract) ?? EMPTY_DISCOVERY_TRUST_CONTRACT;
        setDiscoveryTrust(nextDiscoveryTrust);
        
        if (session?.user?.email) {
          try {
            const userResponse = await fetch('/api/profile/me');
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setCurrentUser(userData);
              setProfileViewerCoords({
                lat: userData.lat ?? null,
                lng: userData.lng ?? null,
              });
              setIsOwner(userData.id === (data.product.seller?.User?.id || data.product.User?.id));
              
              setEditData({
                title: data.product.title || '',
                description: data.product.description || '',
                priceCents: data.product.priceCents || 0,
                stock: data.product.stock || 0,
                maxStock: data.product.maxStock || 0
              });
            }
          } catch (authError) {
            console.error('Error checking user profile:', authError);
          }
        }

        let loadedReviews: unknown[] = [];
        try {
          const reviewResponse = await fetch(`/api/products/${data.product.id}/reviews`);
          if (reviewResponse.ok) {
            const reviewPayload = await reviewResponse.json();
            loadedReviews = reviewPayload.reviews || [];
            setReviews(loadedReviews);
          }
        } catch (reviewError) {
          console.error('Error loading reviews:', reviewError);
        }

        const nextStats = data.stats
          ? (data.stats as ProductStats)
          : stats;

        persistListingDetailSnapshot(transformedProduct, {
          stats: nextStats,
          reviews: loadedReviews,
          sellerBadges: nextSellerBadges,
          discoveryTrust: nextDiscoveryTrust,
          dishInfo: mapped.dishInfo,
          linkedInspiration: mapped.linkedInspiration,
          publicContactChannels: nextPublicContactChannels,
          checkoutAvailable: nextCheckoutAvailable,
          paymentStatus: nextPaymentStatus,
          isBusiness: nextIsBusiness,
          companyName: nextCompanyName,
        });
        hasStaleSnapshotRef.current = true;
      } catch (error) {
        listingDetailDiag('fetch:threw', {
          routeParam,
          resolvedId,
          apiPath,
          fetchUrl,
          error: error instanceof Error ? error.message : String(error),
          native: isNativeApp(),
          origin:
            typeof window !== 'undefined' ? window.location.origin : '',
        });
        console.error('Error fetching product:', error);
        setProduct(null);
        setLoadError('network');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
    trackView(listingDetailResolvedId(routeParam));
  }, [routeParam, fetchGeneration, session?.user?.email]);

  const trackView = async (productId: string) => {
    try {
      await fetch('/api/analytics/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          userId: (session as any)?.user?.id || null,
          type: 'product'
        })
      });
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };

  const handleSave = async () => {
    if (!product) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/profile/dishes/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!response.ok) throw new Error('Failed to update product');

      const updatedData = await response.json();
      setProduct(prev => prev ? {
        ...prev,
        title: editData.title,
        description: editData.description,
        priceCents: editData.priceCents,
        stock: editData.stock,
        maxStock: editData.maxStock
      } : null);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating product:', error);
      alert(t('product.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    
    try {
      const response = await fetch(`/api/profile/dishes/${product.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');

      alert(t('product.deleteSuccess'));
      router.push('/profile');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(t('product.deleteError'));
    }
  };

  const loadReviews = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const handleReviewSubmit = async (reviewData: any) => {
    if (!product) return;

    setIsSubmittingReview(true);
    try {
      const response = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        setShowReviewForm(false);
        await loadReviews(product.id);
        alert(t('product.reviewSuccess'));
      } else {
        const error = await response.json();
        alert(error.error || t('product.genericError'));
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(t('product.reviewError'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReviewReply = async (reviewId: string) => {

  };

  const handleReviewResponseSubmit = async (reviewId: string, comment: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });

      if (response.ok) {
        await loadReviews(product!.id);
        alert(t('product.responseSuccess'));
      } else {
        const error = await response.json();
        alert(error.error || t('product.genericError'));
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert(t('product.responseError'));
    }
  };

  if (!routeParam) {
    return <ListingDetailUnavailable reason="missing_param" t={t} />;
  }

  if (isLoading) {
    if (!showClientSkeleton) {
      return (
        <main
          className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
          aria-busy
          aria-label={t('product.loading') || 'Advertentie laden'}
        />
      );
    }
    return <ProductDetailLoadingSkeleton />;
  }

  if (loadError) {
    return (
      <ListingDetailUnavailable
        reason={loadError}
        t={t}
        onRetry={
          loadError === 'network' ||
          loadError === 'invalid' ||
          loadError === 'server_error'
            ? () => setFetchGeneration((g) => g + 1)
            : undefined
        }
      />
    );
  }

  if (!product) {
    return <ListingDetailUnavailable reason="not_found" t={t} />;
  }

  const theme = getCategoryTheme(product.category, t);
  const CategoryIcon = theme.icon;
  const baseImages = product.Image || product.photos || (product.image ? [{ id: '1', fileUrl: product.image, url: product.image }] : []);
  
  const video = resolveProductDetailVideo(product.Video, dishInfo.video);
  
  // Prepare photos for PhotoCarousel
  const carouselPhotos = baseImages.map((img, index) => ({
    id: img.id || `img-${index}`,
    fileUrl: 'fileUrl' in img ? img.fileUrl : img.url,
    sortOrder: index
  }));
  
  // Prepare videos for PhotoCarousel
  const carouselVideos = video ? [{
    id: video.id,
    url: video.url,
    thumbnail: video.thumbnail,
    duration: video.duration
  }] : [];
  
  // Prepare combined media for PhotoCarousel (video FIRST, then images)
  const carouselMedia: Array<{ id: string; type: 'image' | 'video'; fileUrl?: string; url?: string; thumbnail?: string | null; duration?: number | null; sortOrder?: number }> = [];
  // Add video FIRST if available
  if (carouselVideos.length > 0) {
    carouselMedia.push({
      id: carouselVideos[0].id,
      type: 'video',
      url: carouselVideos[0].url,
      thumbnail: carouselVideos[0].thumbnail,
      duration: carouselVideos[0].duration,
      sortOrder: 0
    });
  }
  // Add all images AFTER video
  carouselPhotos.forEach((photo, index) => {
    carouselMedia.push({
      id: photo.id,
      type: 'image',
      fileUrl: photo.fileUrl,
      sortOrder: index + (carouselVideos.length > 0 ? 1 : 0)
    });
  });

  const availableStock = getAvailableStock(product);
  const carouselImageUrl =
    carouselMedia.find((m) => m.type === 'image')?.fileUrl ?? product.image ?? null;
  const { listingKind } = deriveListingKind({
    listingIntent: product.listingIntent,
    marketplaceCategory: product.marketplaceCategory as MarketplaceCategory | null,
    specializations: product.specializations,
    subcategory: product.subcategory,
    category: product.category,
  });
  const productShareUrl = `${baseUrl}${buildListingDetailHref({
    listingKind,
    listingIntent: product.listingIntent,
    title: product.title,
    place: product.seller?.User?.place,
    id: product.id,
  })}`;
  const isRequestListing =
    listingKind === 'REQUEST' || product.listingIntent === 'REQUEST';

  return (
    <main className={`min-h-screen bg-gradient-to-br ${theme.bg} via-white to-gray-50 pb-[calc(env(safe-area-inset-bottom,0px)+10rem)] lg:pb-8`}>
      <div className="no-print sticky top-0 z-10 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <BackButton variant="minimal" />
        </div>
      </div>
      <section id="printable-product" className="relative">
        {isRequestListing ? (
          <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-950 ring-1 ring-amber-200">
              <span aria-hidden>🙋</span>
              {t('marketplace.request.detail.badge')}
            </p>
          </div>
        ) : null}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-1 items-start gap-6 ${DESKTOP_DETAIL_GRID.columns} lg:gap-8`}>
              <div className="relative min-w-0">
                {carouselMedia.length > 0 ? (
                  <div className="relative">
                    <PhotoCarousel
                      media={carouselMedia}
                      variant="detail"
                      className="rounded-2xl"
                      showThumbnails={carouselMedia.length > 1}
                      autoPlay={false}
                    />
                    {isOwner ? (
                      <div className="absolute bottom-3 right-3 z-20 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditing(!isEditing)}
                          className="rounded-full bg-white/90 p-2.5 shadow-lg backdrop-blur-sm hover:bg-white"
                          title={t('common.edit')}
                        >
                          <Edit3 className="h-5 w-5 text-blue-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="rounded-full bg-white/90 p-2.5 shadow-lg backdrop-blur-sm hover:bg-white"
                          title={t('common.delete')}
                        >
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex h-[280px] max-h-[320px] items-center justify-center rounded-2xl bg-gray-100 lg:h-[380px] lg:max-h-[420px]">
                    <CategoryIcon className="h-24 w-24 text-gray-300" />
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="w-full rounded-2xl border-2 border-gray-300 px-4 py-3 text-2xl font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  />
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={5}
                    className="w-full rounded-2xl border-2 border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">{t('product.price')}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={(editData.priceCents / 100).toFixed(2)}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            priceCents: Math.round(parseFloat(e.target.value) * 100),
                          })
                        }
                        className="w-full rounded-xl border-2 border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">{t('product.stock')}</label>
                      <input
                        type="number"
                        value={editData.stock}
                        onChange={(e) =>
                          setEditData({ ...editData, stock: parseInt(e.target.value, 10) || 0 })
                        }
                        className="w-full rounded-xl border-2 border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">{t('product.maxStock')}</label>
                      <input
                        type="number"
                        value={editData.maxStock}
                        onChange={(e) =>
                          setEditData({ ...editData, maxStock: parseInt(e.target.value, 10) || 0 })
                        }
                        className="w-full rounded-xl border-2 border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 rounded-2xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isSaving ? t('product.saving') : t('product.saveSuccess')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="rounded-2xl bg-gray-200 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-300"
                    >
                      {t('product.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <ProductSaleCommerceZone
                  product={product}
                  theme={theme}
                  categoryIcon={CategoryIcon}
                  trust={discoveryTrust}
                  listingKind={listingKind}
                  sellerName={getSellerDisplayName(product)}
                  sellerBadges={sellerBadges}
                  isBusiness={isBusiness}
                  companyName={companyName}
                  quantity={quantity}
                  availableStock={availableStock}
                  isOwner={isOwner}
                  checkoutAvailable={checkoutAvailable}
                  paymentStatus={paymentStatus}
                  publicContactChannels={publicContactChannels}
                  carouselImageUrl={carouselImageUrl}
                  shareUrl={productShareUrl}
                  onQuantityChange={setQuantity}
                  onAddedToCart={() => setQuantity(1)}
                />
              )}
            </div>

          {!isEditing ? (
            <div className="mt-8">
              <ProductDetailMainSections
                product={product}
                trust={discoveryTrust}
                sellerName={getSellerDisplayName(product)}
                categoryLabel={theme.label}
                stats={stats}
                checkoutAvailable={checkoutAvailable}
                isBusiness={isBusiness}
                companyName={companyName}
                sellerBadgeCount={sellerBadges.length}
                availableStock={availableStock}
                dishInfo={dishInfo}
                linkedInspiration={linkedInspiration}
                variant="main"
              />
            </div>
          ) : null}

        {/* Reviews Section — hidden for requests (a request is a help post, not a product). */}
          {!isRequestListing ? (
          <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                {t('marketplace.detail.sections.reviews')}
                {stats.reviewCount > 0 ? (
                  <span className="text-base font-semibold text-gray-500">
                    ({stats.reviewCount})
                  </span>
                ) : null}
              </h2>
            {currentUser && !isOwner ? (
              <button
                type="button"
                onClick={() => setShowReviewForm(true)}
                  className={`rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-semibold text-white shadow-md ${theme.gradient}`}
              >
                {t('review.title')}
              </button>
            ) : null}
          </div>

          {stats.reviewCount === 0 && !showReviewForm ? (
            <ProductSaleReviewEmpty
              product={product}
              sellerName={getSellerDisplayName(product)}
              categoryLabel={theme.label}
              stats={stats}
              checkoutAvailable={checkoutAvailable}
              isBusiness={isBusiness}
              companyName={companyName}
              sellerBadgeCount={sellerBadges.length}
            />
          ) : null}

          {showReviewForm && (
              <div className="mb-6 rounded-xl bg-gray-50 p-4">
              <ReviewForm
                productId={product.id}
                onSubmit={handleReviewSubmit}
                onCancel={() => setShowReviewForm(false)}
                isSubmitting={isSubmittingReview}
              />
            </div>
          )}

          {stats.reviewCount > 0 ? (
          <ReviewList
            reviews={reviews}
            onReply={handleReviewReply}
            onResponseSubmit={handleReviewResponseSubmit}
            canReply={isOwner}
            isSeller={isOwner}
          />
          ) : null}
        </div>
          ) : null}
        </div>
      </section>

      <ProductSaleStickyCta
        product={product}
        carouselImageUrl={carouselImageUrl}
        sellerName={getSellerDisplayName(product)}
        quantity={quantity}
        availableStock={availableStock}
        isOwner={isOwner}
        checkoutAvailable={checkoutAvailable}
        publicContactChannels={publicContactChannels}
        hidden={showDeleteConfirm || showReviewForm || isEditing}
      />


      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">{t('product.deleteTitle')}</h3>
            <p className="text-gray-600 mb-6 text-center" dangerouslySetInnerHTML={{ __html: t('product.deleteConfirm', { title: product.title }) }} />
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all font-bold shadow-lg hover:shadow-xl"
              >
                {t('product.deleteConfirmButton')}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all font-bold"
              >
                {t('product.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
