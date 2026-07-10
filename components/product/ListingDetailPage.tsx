'use client';
import { useEffect, useState } from "react";
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
import {
  listingDetailApiPath,
  listingDetailResolvedId,
  type ListingDetailLoadError,
} from '@/lib/marketplace/detail/listing-detail-route';
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
    case 'CHEFF':
      return {
        gradient: 'from-orange-500 via-red-500 to-pink-500',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        badge: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: ChefHat,
        label: t('productCategory.cheff'),
        accent: 'bg-orange-500'
      };
    case 'GROWN':
      return {
        gradient: 'from-emerald-500 via-green-500 to-teal-500',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: Sprout,
        label: t('productCategory.garden'),
        accent: 'bg-emerald-500'
      };
    case 'DESIGNER':
      return {
        gradient: 'from-purple-500 via-pink-500 to-yellow-500',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        badge: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: Palette,
        label: t('productCategory.designer'),
        accent: 'bg-purple-500'
      };
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

export default function ListingDetailPage() {
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

  const [product, setProduct] = useState<Product | null>(null);
  const [stats, setStats] = useState<ProductStats>({
    viewCount: 0,
    orderCount: 0,
    favoriteCount: 0,
    averageRating: 0,
    reviewCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
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
  const [publicContactChannels, setPublicContactChannels] = useState<PublicContactChannel[]>([]);
  const [checkoutAvailable, setCheckoutAvailable] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PublicPaymentStatus | null>(null);
  const [sellerBadges, setSellerBadges] = useState<UserBadgeChipItem[]>([]);
  const [isBusiness, setIsBusiness] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [profileViewerCoords, setProfileViewerCoords] = useState<{
    lat?: number | null;
    lng?: number | null;
  } | null>(null);
  const [linkedInspiration, setLinkedInspiration] = useState<ProductInspirationLink | null>(null);
  const [dishInfo, setDishInfo] = useState<import('@/components/product/detail/ProductSaleDomainStory').ProductSaleDishInfo>({
    isDish: false,
    category: null,
  });
  const [discoveryTrust, setDiscoveryTrust] = useState<DiscoveryTrustContract>(
    EMPTY_DISCOVERY_TRUST_CONTRACT,
  );
  const [loadError, setLoadError] = useState<ListingDetailLoadError | null>(null);
  const [fetchGeneration, setFetchGeneration] = useState(0);

  useEffect(() => {
    if (!routeParam) return;
    setBaseUrl(window.location.origin);
    
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        navDebug('listing-detail:fetch', {
          routeParam,
          resolvedId: listingDetailResolvedId(routeParam),
        });
        const response = await fetch(listingDetailApiPath(routeParam));
        if (response.status === 404) {
          setProduct(null);
          setLoadError('not_found');
          return;
        }
        if (!response.ok) {
          setProduct(null);
          setLoadError('network');
          return;
        }
        const data = await response.json();
        
        if (!data || !data.product) {
          setProduct(null);
          setLoadError('invalid');
          return;
        }

        // Set stats if available
        if (data.stats) {
          setStats(data.stats);
        }

        // Store dish info for print/download buttons and showing steps
        const dishData = {
          isDish: data.isDish || false,
          category: data.dishCategory || null,
          ingredients: data.dish?.ingredients || [],
          instructions: data.dish?.instructions || [],
          stepPhotos: (data.dish?.stepPhotos || []).map((p: { id: string; url: string; stepNumber: number; description?: string | null }) => ({
            id: p.id,
            url: p.url,
            stepNumber: p.stepNumber,
            description: p.description,
          })),
          growthPhotos: (data.dish?.growthPhotos || []).map((p: { id: string; url: string; phaseNumber: number; description?: string | null }) => ({
            id: p.id,
            url: p.url,
            phaseNumber: p.phaseNumber,
            description: p.description,
          })),
          materials: data.dish?.materials || [],
          plantType: data.dish?.plantType || null,
          sunlight: data.dish?.sunlight || null,
          waterNeeds: data.dish?.waterNeeds || null,
          harvestDate: data.dish?.harvestDate || null,
          location: data.dish?.location || null,
          soilType: data.dish?.soilType || null,
          growthDuration: data.dish?.growthDuration ?? null,
          dimensions: data.dish?.dimensions || null,
          notes: data.dish?.notes || null,
          difficulty: data.dish?.difficulty || null,
          prepTime: data.dish?.prepTime ?? null,
          servings: data.dish?.servings ?? null,
          tags: data.dish?.tags || [],
        };
        
        setDishInfo(dishData);

        if (data.linkedInspiration?.href && data.linkedInspiration?.category) {
          setLinkedInspiration({
            href: data.linkedInspiration.href,
            category: data.linkedInspiration.category,
          });
        } else {
          setLinkedInspiration(null);
        }
        
        const transformedProduct: Product = {
          id: data.product.id,
          title: data.product.title,
          description: data.product.description,
          priceCents: data.product.priceCents,
          orderMethod: data.product.orderMethod ?? 'HOMECHEFF_PAYMENT',
          acceptHomeCheffPayment: data.product.acceptHomeCheffPayment ?? null,
          acceptDirectContact: data.product.acceptDirectContact ?? null,
          image: data.product.photos?.[0]?.url || data.product.ListingMedia?.[0]?.url || data.product.Image?.[0]?.fileUrl || null,
          photos: data.product.photos || data.product.ListingMedia?.map((media: any) => ({
            id: media.id,
            url: media.url,
            idx: media.order || media.idx
          })) || [],
          stock: data.product.stock,
          maxStock: data.product.maxStock,
          deliveryMode: data.product.deliveryMode,
          delivery: data.product.delivery || 'PICKUP',
          createdAt: data.product.createdAt,
          category: data.product.category,
          subcategory: data.product.subcategory,
          marketplaceCategory: data.product.marketplaceCategory ?? null,
          specializations: Array.isArray(data.product.specializations)
            ? data.product.specializations
            : [],
          acceptedSpecializations: Array.isArray(data.product.acceptedSpecializations)
            ? data.product.acceptedSpecializations
            : [],
          barterOpenness: data.product.barterOpenness ?? null,
          listingIntent: data.product.listingIntent ?? 'OFFER',
          priceModel: data.product.priceModel ?? 'FIXED',
          tags: Array.isArray(data.product.tags) ? data.product.tags : [],
          pickupAddress: data.product.pickupAddress ?? null,
          pickupLat: data.product.pickupLat ?? null,
          pickupLng: data.product.pickupLng ?? null,
          sellerCanDeliver: Boolean(data.product.sellerCanDeliver),
          deliveryRadiusKm: data.product.deliveryRadiusKm ?? null,
          displayNameType: data.product.displayNameType || 'fullname',
          Image: data.product.Image?.map((img: any) => ({
            id: img.id,
            fileUrl: img.fileUrl
          })) || [],
          Video: data.product.Video ?? null,
          seller: {
            lat: data.product.seller?.lat ?? null,
            lng: data.product.seller?.lng ?? null,
            kvk: data.product.seller?.kvk ?? null,
            companyName: data.product.seller?.companyName ?? null,
            User: {
              id:
                data.product.seller?.User?.id ||
                data.product.User?.id ||
                '',
              name: data.product.seller?.User?.name || data.product.User?.name,
              username: data.product.seller?.User?.username || data.product.User?.username,
              avatar: data.product.seller?.User?.image || data.product.seller?.User?.profileImage || data.product.User?.image || data.product.User?.profileImage,
              image: data.product.seller?.User?.image || data.product.User?.image,
              profileImage: data.product.seller?.User?.profileImage || data.product.User?.profileImage,
              displayFullName: data.product.seller?.User?.displayFullName || data.product.User?.displayFullName,
              displayNameOption: data.product.seller?.User?.displayNameOption || data.product.User?.displayNameOption,
              place: data.product.seller?.User?.place || data.product.User?.place,
              city: data.product.seller?.User?.city || data.product.User?.city,
              lat: data.product.seller?.User?.lat ?? data.product.User?.lat ?? null,
              lng: data.product.seller?.User?.lng ?? data.product.User?.lng ?? null,
              sellerRoles: data.product.seller?.User?.sellerRoles || data.product.User?.sellerRoles
            }
          }
        };
        
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
        setSellerBadges(Array.isArray(data.sellerBadges) ? data.sellerBadges : []);
        setIsBusiness(Boolean(data.isBusiness));
        setCompanyName(data.companyName ?? data.product.seller?.companyName ?? null);

        if (Array.isArray(data.publicContactChannels)) {
          setPublicContactChannels(data.publicContactChannels);
        }

        setCheckoutAvailable(data.checkoutAvailable !== false);
        setPaymentStatus(data.paymentStatus ?? null);
        if (data.discoveryTrust) {
          setDiscoveryTrust(data.discoveryTrust as DiscoveryTrustContract);
        }
        
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

        try {
          await loadReviews(data.product.id);
        } catch (reviewError) {
          console.error('Error loading reviews:', reviewError);
        }
      } catch (error) {
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
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-96 bg-gray-200 rounded-3xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="h-64 bg-gray-200 rounded-3xl"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <ListingDetailUnavailable
        reason={loadError}
        t={t}
        onRetry={
          loadError === 'network' || loadError === 'invalid'
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
