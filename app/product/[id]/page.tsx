'use client';
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ArrowLeft, Star, Clock, ChefHat, Sprout, Palette, Truck, Package, 
  Euro, Shield, CheckCircle, Edit3, Trash2, MessageCircle, Heart, 
  Share2, MapPin, Award, Zap, Eye, ShoppingBag, X, Check, AlertCircle,
  Printer, Download
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/cart/AddToCartButton";
import ShareButton from "@/components/ui/ShareButton";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewForm from "@/components/reviews/ReviewForm";
import StartChatButton from "@/components/chat/StartChatButton";
import PropsButton from "@/components/props/PropsButton";
import ReportContentButton from "@/components/reporting/ReportContentButton";
import ClickableName from "@/components/ui/ClickableName";
import BackButton from "@/components/navigation/BackButton";
import FavoriteButton from "@/components/favorite/FavoriteButton";
import PhotoCarousel from "@/components/ui/PhotoCarousel";
import { getDisplayName as getDisplayNameUtil } from "@/lib/displayName";
import { useTranslation } from '@/hooks/useTranslation';

type Product = {
  id: string;
  title: string;
  description?: string | null;
  priceCents: number;
  image?: string | null;
  photos?: { id: string; url: string; idx: number }[];
  stock?: number | null;
  maxStock?: number | null;
  deliveryMode?: string | null;
  createdAt: string | Date;
  category?: string;
  subcategory?: string;
  displayNameType?: string;
  delivery?: 'PICKUP' | 'DELIVERY' | 'BOTH';
  Image?: { id: string; fileUrl: string }[];
  Video?: { id: string; url: string; thumbnail?: string | null; duration?: number | null }[];
  seller?: { 
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

const getCategoryTheme = (category?: string) => {
  switch (category) {
    case 'CHEFF':
      return {
        gradient: 'from-orange-500 via-red-500 to-pink-500',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        badge: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: ChefHat,
        label: 'Chef Special',
        accent: 'bg-orange-500'
      };
    case 'GROWN':
      return {
        gradient: 'from-emerald-500 via-green-500 to-teal-500',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: Sprout,
        label: 'Garden Fresh',
        accent: 'bg-emerald-500'
      };
    case 'DESIGNER':
      return {
        gradient: 'from-purple-500 via-pink-500 to-yellow-500',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        badge: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: Palette,
        label: 'Designer Piece',
        accent: 'bg-purple-500'
      };
    default:
      return {
        gradient: 'from-gray-500 via-gray-600 to-gray-700',
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Package,
        label: 'Special Item',
        accent: 'bg-gray-500'
      };
  }
};

const getDisplayName = (product: Product | null) => {
  if (!product?.seller?.User) return 'Anoniem';
  
  return getDisplayNameUtil(product.seller.User);
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  
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

  if (!params?.id || typeof params.id !== 'string') {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Product ID niet gevonden</h1>
            <BackButton fallbackUrl="/" />
          </div>
        </div>
      </main>
    );
  }

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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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
  const [showPrintView, setShowPrintView] = useState(false);
  const [dishInfo, setDishInfo] = useState<{ 
    isDish: boolean; 
    category: string | null;
    ingredients?: string[];
    instructions?: string[];
    stepPhotos?: Array<{ id: string; url: string; stepNumber: number; description?: string | null }>;
    growthPhotos?: Array<{ id: string; url: string; phaseNumber: number; description?: string | null }>;
    materials?: string[];
    plantType?: string | null;
    notes?: string | null;
    video?: { id: string; url: string; thumbnail?: string | null; duration?: number | null } | null;
  }>({
    isDish: false,
    category: null
  });

  useEffect(() => {
    setBaseUrl(window.location.origin);
    
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${params.id}`);
        if (!response.ok) {
          console.error('Product fetch failed:', response.status);
          router.push('/');
          return;
        }
        const data = await response.json();
        
        // Check if data and data.product exist
        if (!data || !data.product) {
          console.error('Invalid product data:', data);
          router.push('/');
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
          stepPhotos: (data.dish?.stepPhotos || []).map((p: any) => ({
            id: p.id,
            url: p.url,
            stepNumber: p.stepNumber,
            description: p.description
          })),
          growthPhotos: (data.dish?.growthPhotos || []).map((p: any) => ({
            id: p.id,
            url: p.url,
            phaseNumber: p.phaseNumber,
            description: p.description
          })),
          materials: data.dish?.materials || [],
          plantType: data.dish?.plantType || null,
          notes: data.dish?.notes || null,
          video: data.dish?.video || null
        };
        
        console.log('Dish info loaded:', {
          isDish: dishData.isDish,
          category: dishData.category,
          instructionsCount: dishData.instructions.length,
          stepPhotosCount: dishData.stepPhotos.length,
          stepPhotos: dishData.stepPhotos,
          hasVideo: !!dishData.video,
          video: dishData.video
        });
        
        console.log('Product data:', {
          hasProductVideo: !!data.product.Video,
          productVideo: data.product.Video,
          productId: data.product.id
        });
        
        setDishInfo(dishData);
        
        const transformedProduct: Product = {
          id: data.product.id,
          title: data.product.title,
          description: data.product.description,
          priceCents: data.product.priceCents,
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
          displayNameType: data.product.displayNameType || 'fullname',
          Image: data.product.Image?.map((img: any) => ({
            id: img.id,
            fileUrl: img.fileUrl
          })) || [],
          Video: data.product.Video || [],
          seller: {
            User: {
              id: data.product.seller?.User?.id || data.product.User?.id,
              name: data.product.seller?.User?.name || data.product.User?.name,
              username: data.product.seller?.User?.username || data.product.User?.username,
              avatar: data.product.seller?.User?.image || data.product.seller?.User?.profileImage || data.product.User?.image || data.product.User?.profileImage,
              image: data.product.seller?.User?.image || data.product.User?.image,
              profileImage: data.product.seller?.User?.profileImage || data.product.User?.profileImage,
              displayFullName: data.product.seller?.User?.displayFullName || data.product.User?.displayFullName,
              displayNameOption: data.product.seller?.User?.displayNameOption || data.product.User?.displayNameOption,
              place: data.product.seller?.User?.place || data.product.User?.place,
              sellerRoles: data.product.seller?.User?.sellerRoles || data.product.User?.sellerRoles
            }
          }
        };
        
        setProduct(transformedProduct);
        
        if (session?.user?.email) {
          try {
            const userResponse = await fetch('/api/profile/me');
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setCurrentUser(userData);
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
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
      trackView(Array.isArray(params.id) ? params.id[0] : params.id);
    }
  }, [params.id]);

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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert('💡 In het print venster: kies "Opslaan als PDF" als bestemming om te downloaden!');
    setTimeout(() => {
      window.print();
    }, 300);
  };

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

  if (!product) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('product.notFound')}</h1>
          <BackButton fallbackUrl="/" label={t('product.backToOverview')} />
        </div>
      </main>
    );
  }

  const theme = getCategoryTheme(product.category);
  const CategoryIcon = theme.icon;
  const baseImages = product.Image || product.photos || (product.image ? [{ id: '1', fileUrl: product.image, url: product.image }] : []);
  
  // Get video from dish (if dish) or from product directly
  const productVideo = product.Video?.[0] || null;
  const video = dishInfo.video || productVideo;
  
  // Debug logging
  console.log('🎬 Video debug:', {
    hasDishVideo: !!dishInfo.video,
    dishVideo: dishInfo.video,
    hasProductVideo: !!productVideo,
    productVideo: productVideo,
    finalVideo: video,
    baseImagesCount: baseImages.length
  });
  
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

  // Get current image for print view
  const currentImageUrl = carouselMedia.length > 0 && carouselMedia[selectedImageIndex]?.type === 'image' 
    ? carouselMedia[selectedImageIndex].fileUrl 
    : carouselPhotos.length > 0 
      ? carouselPhotos[selectedImageIndex]?.fileUrl 
      : product.image;

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 12mm;
        }
        
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body * {
            visibility: hidden;
          }
          
          #printable-product,
          #printable-product * {
            visibility: visible;
          }
          
          #printable-product {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-avoid-break {
            page-break-inside: avoid;
          }
        }
      `}</style>
      <main className={`min-h-screen bg-gradient-to-br ${theme.bg} via-white to-gray-50`}>
      {/* Header with Print/Download buttons */}
      <div className="no-print bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <BackButton fallbackUrl="/" variant="minimal" />
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setShowPrintView(!showPrintView)}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{showPrintView ? 'Sluit' : 'Print/PDF'} weergave</span>
            </button>
            {showPrintView && (
              <>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Printen</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Hero Section with Large Image */}
      <section id="printable-product" className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Image Gallery - Slideshow/Carousel (Default View) - ALWAYS shown when showPrintView is false */}
          <div className={`relative mx-auto w-full max-w-4xl px-0 sm:px-4 lg:px-6 mb-8 ${showPrintView ? 'hidden' : 'block'}`}>
            {/* Photo Carousel with support for videos */}
            {carouselMedia.length > 0 ? (
              <div className="relative">
                <PhotoCarousel
                  media={carouselMedia}
                  className="rounded-3xl"
                  showThumbnails={carouselMedia.length > 1}
                  autoPlay={false}
                />

                {/* Category Badge - Overlay on carousel */}
                <div className="absolute top-6 left-6 z-20 pointer-events-none">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${theme.badge} border-2 backdrop-blur-sm shadow-lg pointer-events-auto`}>
                    <CategoryIcon className="w-5 h-5" />
                    <span className="font-bold text-sm">{theme.label}</span>
                  </div>
                </div>

                {/* Stock Badge - Overlay on carousel */}
                {(() => {
                  // Use same logic as checkout: stock as primary, maxStock as fallback
                  const availableStock = typeof product.stock === 'number' && product.stock !== null
                    ? product.stock
                    : typeof product.maxStock === 'number' && product.maxStock !== null
                      ? product.maxStock
                      : null;
                  
                  if (availableStock === null) {
                    // No stock management
                    return null;
                  }
                  
                  return (
                  <div className="absolute top-6 right-6 z-20 pointer-events-none">
                    <div className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg backdrop-blur-sm border-2 pointer-events-auto ${
                        availableStock === 0 ? 'bg-red-100 text-red-800 border-red-200' :
                        availableStock <= 5 ? 'bg-orange-100 text-orange-800 border-orange-200 animate-pulse' :
                      'bg-green-100 text-green-800 border-green-200'
                    }`}>
                        {availableStock === 0 ? '❌ Uitverkocht' :
                         availableStock <= 5 ? `⚠️ Nog ${availableStock} over!` :
                         `✓ ${availableStock} beschikbaar`}
                    </div>
                  </div>
                  );
                })()}

                {/* Owner Actions - Overlay on carousel */}
                {isOwner && (
                  <div className="absolute bottom-6 right-6 z-20 flex gap-2 pointer-events-none">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(!isEditing);
                      }}
                      className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white shadow-lg transition-all hover:scale-110 pointer-events-auto"
                      title={t('common.edit')}
                    >
                      <Edit3 className="w-5 h-5 text-blue-600" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                      }}
                      className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white shadow-lg transition-all hover:scale-110 pointer-events-auto"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[5/3] lg:max-h-[520px] rounded-3xl overflow-hidden bg-white shadow-2xl flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <CategoryIcon className="w-32 h-32 text-gray-300" />
              </div>
            )}
          </div>

          {/* Print View - Only shown when showPrintView is true */}
          <div className={`relative mx-auto w-full max-w-4xl px-0 sm:px-4 lg:px-6 mb-8 ${showPrintView ? 'block' : 'hidden'}`}>
            {/* Main Image for Print */}
            <div 
              className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[5/3] lg:max-h-[520px] rounded-3xl overflow-hidden bg-white shadow-2xl"
            >
              {currentImageUrl ? (
                <Image 
                  src={currentImageUrl} 
                  alt={product.title} 
                  fill
                  className="object-cover" 
                  sizes="(max-width: 768px) 100vw, 90vw"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <CategoryIcon className="w-32 h-32 text-gray-300" />
                </div>
              )}

              {/* Category Badge */}
              <div className="absolute top-6 left-6">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${theme.badge} border-2 backdrop-blur-sm shadow-lg`}>
                  <CategoryIcon className="w-5 h-5" />
                  <span className="font-bold text-sm">{theme.label}</span>
                </div>
              </div>

              {/* Stock Badge */}
              {(() => {
                const availableStock = typeof product.stock === 'number' && product.stock !== null
                  ? product.stock
                  : typeof product.maxStock === 'number' && product.maxStock !== null
                    ? product.maxStock
                    : null;
                
                if (availableStock === null) {
                  return null;
                }
                
                return (
                  <div className="absolute top-6 right-6">
                    <div className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg backdrop-blur-sm border-2 ${
                      availableStock === 0 ? 'bg-red-100 text-red-800 border-red-200' :
                      availableStock <= 5 ? 'bg-orange-100 text-orange-800 border-orange-200 animate-pulse' :
                      'bg-green-100 text-green-800 border-green-200'
                    }`}>
                      {availableStock === 0 ? '❌ Uitverkocht' :
                       availableStock <= 5 ? `⚠️ Nog ${availableStock} over!` :
                       `✓ ${availableStock} beschikbaar`}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Thumbnail Gallery for Print View */}
            {carouselPhotos.length > 1 && (
              <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-center">
                {carouselPhotos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden transition-all duration-300 ${
                      selectedImageIndex === index 
                        ? `ring-4 ring-emerald-500 ring-offset-2 scale-105 shadow-xl` 
                        : 'opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <Image 
                      src={photo.fileUrl} 
                      alt={`${product.title} ${index + 1}`}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover" 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 space-y-8">
              {/* Product Title & Details */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              {isEditing ? (
                <div className="space-y-4">
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({...editData, title: e.target.value})}
                      className="w-full text-3xl font-bold px-4 py-3 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('product.price')}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={(editData.priceCents / 100).toFixed(2)}
                        onChange={(e) => setEditData({...editData, priceCents: Math.round(parseFloat(e.target.value) * 100)})}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('product.stock')}</label>
                      <input
                        type="number"
                        value={editData.stock}
                        onChange={(e) => setEditData({...editData, stock: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('product.maxStock')}</label>
                      <input
                        type="number"
                        value={editData.maxStock}
                        onChange={(e) => setEditData({...editData, maxStock: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                    <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                        className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all font-semibold shadow-lg"
                    >
                        {isSaving ? t('product.saving') : t('product.saveSuccess')}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 transition-all font-semibold"
                    >
                      {t('product.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2 leading-tight">
                          {product.title}
                        </h1>
                  {product.subcategory && (
                          <div className="inline-block px-4 py-1.5 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
                            {product.subcategory}
                          </div>
                  )}
                    </div>
                      <FavoriteButton 
                        productId={product.id}
                        productTitle={product.title}
                        size="lg"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                      {stats.reviewCount > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-5 h-5 ${
                                  star <= Math.round(stats.averageRating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="text-lg font-semibold text-gray-700">
                            {stats.averageRating.toFixed(1)}
                          </span>
                          <span className="text-gray-500">({stats.reviewCount})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          Gepost {new Date(product.createdAt).toLocaleDateString('nl-NL', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">{stats.viewCount} weergaven</span>
                      </div>
                      {stats.orderCount > 0 && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <ShoppingBag className="w-4 h-4" />
                          <span className="text-sm">{stats.orderCount} verkocht</span>
                        </div>
                      )}
                    </div>

                    <div className="prose prose-lg max-w-none">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">Over dit product</h3>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {product.description || t('product.noDescription')}
                      </p>
                    </div>

                    {/* Ingredients (for recipes) */}
                    {dishInfo.isDish && dishInfo.category === 'CHEFF' && dishInfo.ingredients && dishInfo.ingredients.length > 0 && (
                      <div className="mt-8 bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <ChefHat className="w-6 h-6 text-orange-600" />
                          Ingrediënten
                        </h3>
                        <ul className="space-y-2">
                          {dishInfo.ingredients.map((ingredient, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              <span className="text-gray-700">{ingredient}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Instructions with Step Photos (for recipes) - FOTOREPORTAGE */}
                    {dishInfo.isDish && dishInfo.category === 'CHEFF' && dishInfo.instructions && dishInfo.instructions.length > 0 && (
                      <div className="mt-8 bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                          <Clock className="w-6 h-6 text-orange-600" />
                          Bereidingswijze
                        </h3>
                        <div className="space-y-6">
                          {dishInfo.instructions.map((instruction, index) => {
                            const stepNumber = index + 1;
                            const stepPhotos = dishInfo.stepPhotos?.filter(photo => photo.stepNumber === stepNumber) || [];
                            
                            return (
                              <div key={index} className="flex gap-4 items-start bg-gradient-to-br from-white to-orange-50 border-2 border-orange-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                                    {stepNumber}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <p className="text-gray-800 leading-relaxed text-lg mb-3">{instruction}</p>
                                  {/* FOTOREPORTAGE: Step Photos per stap */}
                                  {stepPhotos.length > 0 && (
                                    <div className="mt-4">
                                      <div className="grid grid-cols-2 gap-3">
                                        {stepPhotos.map((photo) => (
                                          <div key={photo.id} className="relative group cursor-pointer">
                                            <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-orange-300 shadow-md">
                                              <Image
                                                src={photo.url}
                                                alt={`Stap ${stepNumber} foto`}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                sizes="(max-width: 640px) 50vw, 25vw)"
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Growth Phases (for garden projects) */}
                    {dishInfo.isDish && dishInfo.category === 'GROWN' && (
                      <div className="mt-8 bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                          <Sprout className="w-6 h-6 text-emerald-600" />
                          Groeifases
                        </h3>
                        <div className="space-y-6">
                          {(() => {
                            // Growth phase names matching GardenManager
                            const GROWTH_PHASE_NAMES = [
                              '🌱 Zaaien/Planten',  // Phase 0
                              '🌿 Kiemen',          // Phase 1
                              '🌾 Groeien',         // Phase 2
                              '🌺 Bloeien',         // Phase 3
                              '🍅 Oogsten'          // Phase 4
                            ];
                            
                            const growthPhotosArray = dishInfo.growthPhotos || [];
                            
                            // Get unique phase numbers and sort them numerically
                            const uniquePhases = Array.from(new Set(growthPhotosArray.map(p => Number(p.phaseNumber))))
                              .filter(p => !isNaN(p))
                              .sort((a, b) => a - b);
                            
                            return uniquePhases.map((phaseNumber) => {
                              const phasePhotos = growthPhotosArray.filter(photo => Number(photo.phaseNumber) === phaseNumber) || [];
                              
                              if (phasePhotos.length === 0) return null;
                              
                              // Get phase name (phaseNumber is 0-indexed in database: 0, 1, 2, 3, 4)
                              const phaseName = GROWTH_PHASE_NAMES[phaseNumber] || `Fase ${phaseNumber + 1}`;
                              
                              return (
                                <div key={phaseNumber} className="flex gap-4 items-start bg-gradient-to-br from-white to-emerald-50 border-2 border-emerald-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                  <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                                      {phaseNumber + 1}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-lg font-bold text-emerald-900 mb-2">{phaseName}</h4>
                                    {phasePhotos[0]?.description && (
                                      <p className="text-gray-800 leading-relaxed mb-3">{phasePhotos[0].description}</p>
                                    )}
                                    {/* FOTOREPORTAGE: Growth Photos per fase */}
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                      {phasePhotos.map((photo) => (
                                        <div key={photo.id} className="relative aspect-video rounded-lg overflow-hidden border-2 border-emerald-300 shadow-md group cursor-pointer">
                                          <Image
                                            src={photo.url}
                                            alt={`${phaseName} foto`}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                                            sizes="(max-width: 640px) 50vw, 25vw"
                                          />
                                          {/* Fase badge */}
                                          <div className="absolute top-2 left-2 z-10">
                                            <div className="px-2 py-1 bg-emerald-600/90 backdrop-blur-sm text-white rounded-md text-xs font-bold shadow-lg">
                                              {phaseName.replace(/^[^\w\s]+\s*/, '') || `Fase ${phaseNumber + 1}`}
                                            </div>
                                          </div>
                                          {photo.description && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                              <p className="text-white text-xs text-center">{photo.description}</p>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Materials (for designs) */}
                    {dishInfo.isDish && dishInfo.category === 'DESIGNER' && dishInfo.materials && dishInfo.materials.length > 0 && (
                      <div className="mt-8 bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Palette className="w-6 h-6 text-purple-600" />
                          Materialen
                        </h3>
                        <ul className="space-y-2">
                          {dishInfo.materials.map((material, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              <span className="text-gray-700">{material}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Delivery Options */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(product.delivery === 'PICKUP' || product.delivery === 'BOTH') && (
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border-2 border-blue-100">
                          <div className="p-3 bg-blue-500 rounded-xl">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{t('product.pickupAvailable')}</div>
                            <div className="text-sm text-gray-600">{t('product.pickupDescription')}</div>
                          </div>
                        </div>
                      )}
                      {(product.delivery === 'DELIVERY' || product.delivery === 'BOTH') && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border-2 border-green-100">
                          <div className="p-3 bg-green-500 rounded-xl">
                            <Truck className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Bezorging mogelijk</div>
                            <div className="text-sm text-gray-600">We bezorgen bij jou</div>
                          </div>
                        </div>
                      )}
                  </div>
                </>
              )}
            </div>

              {/* Trust & Safety */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-emerald-600" />
                  Veilig & Vertrouwd
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Veilig Betalen</div>
                      <div className="text-sm text-gray-600">Via Stripe beveiligd</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{t('product.buyerProtection')}</div>
                      <div className="text-sm text-gray-600">{t('product.moneyBackGuarantee')}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Kwaliteit</div>
                      <div className="text-sm text-gray-600">Top beoordelingen</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-xl">
                      <Zap className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Snelle Service</div>
                      <div className="text-sm text-gray-600">Binnen 24u reactie</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Floating Card */}
            <div className="lg:col-span-1 space-y-6">
              {/* Price & Actions Card */}
              <div className={`bg-gradient-to-br ${theme.gradient} rounded-3xl p-6 shadow-2xl text-white`}>
                {/* Price */}
                <div className="mb-6">
                  <div className="text-sm opacity-80 mb-1">Prijs</div>
                  <div className="text-5xl font-bold mb-2">
                  €{(product.priceCents / 100).toFixed(2)}
                  </div>
                  <div className="text-sm opacity-80">Inclusief BTW</div>
                </div>

                {/* Quantity Selector */}
                {(() => {
                  const availableStock = getAvailableStock(product);
                  const isOutOfStock = availableStock !== null && availableStock === 0;
                  
                  if (isOwner || isOutOfStock) return null;
                  
                  return (
                    <div className="mb-6">
                      <label className="block text-sm opacity-80 mb-2">Aantal</label>
                      <select 
                        value={quantity} 
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-2xl text-white font-semibold focus:ring-2 focus:ring-white/50 cursor-pointer"
                      >
                        {Array.from({ length: Math.min(10, availableStock || 10) }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num} className="text-gray-900">{num}</option>
                        ))}
                      </select>
                    </div>
                  );
                })()}

                {/* CTA Buttons */}
                <div className="space-y-3">
              {(() => {
                const availableStock = getAvailableStock(product);
                const isOutOfStock = availableStock !== null && availableStock === 0;
                
                if (isOutOfStock) {
                  return (
                    <div className="w-full py-4 px-6 bg-white/20 backdrop-blur-sm rounded-2xl text-center font-bold border-2 border-white/30">
                      Uitverkocht
                    </div>
                  );
                }
                
                if (isOwner) {
                  return (
                    <Link
                      href={`/product/${product.id}/edit`}
                      className="block w-full bg-white text-gray-900 py-4 px-6 rounded-2xl text-center font-bold transition-all hover:scale-105 shadow-xl"
                    >
                      <Edit3 className="w-5 h-5 inline mr-2" />
                      {t('product.editProduct')}
                    </Link>
                  );
                }
                
                return (
                  <AddToCartButton
                    product={{
                      id: product.id,
                      title: product.title,
                      priceCents: product.priceCents,
                      image: (carouselMedia.length > 0 && carouselMedia[0].type === 'image' ? carouselMedia[0].fileUrl : product.image) || undefined,
                      sellerName: getDisplayName(product),
                      sellerId: product.seller?.User?.id || '',
                      deliveryMode: (product.delivery as string) || 'PICKUP', // Can be single value, 'BOTH', or comma-separated
                      // Use same logic as checkout: stock as primary, maxStock as fallback
                      stock: availableStock,
                    }}
                    className="w-full font-bold transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-2"
                    size="lg"
                    variant="outline"
                    quantity={quantity}
                    onAdded={() => setQuantity(1)}
                  />
                );
              })()}

                  {!isOwner && (
                    <>
                      <StartChatButton
                        productId={product.id}
                        sellerId={product.seller?.User?.id || ''}
                        sellerName={getDisplayName(product)}
                        showSuccessMessage={true}
                        className="w-full bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:bg-white/30 text-white py-4 px-6 rounded-2xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
                      />
                      <button
                        onClick={() => {
                          // Store product data for short form
                          const productData = {
                            title: product.title,
                            description: product.description || '',
                            priceCents: product.priceCents,
                            category: product.category || 'CHEFF',
                            subcategory: product.subcategory || '',
                            photos: carouselPhotos.map(photo => ({ url: photo.fileUrl, id: photo.id })),
                            video: carouselVideos.length > 0 ? {
                              url: carouselVideos[0].url,
                              thumbnail: carouselVideos[0].thumbnail,
                              duration: carouselVideos[0].duration,
                              id: carouselVideos[0].id
                            } : null,
                            deliveryMode: product.delivery || 'PICKUP'
                          };
                          
                          // Store in sessionStorage for select-photos page
                          sessionStorage.setItem('productToShortFormData', JSON.stringify(productData));
                          
                          // Navigate to photo selection page
                          router.push(`/sell/select-photos?source=product&productId=${product.id}`);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 rounded-2xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        Verkoop vergelijkbaar
                      </button>
                    </>
                  )}
            </div>

                {/* Print/Download Actions (only if product is linked to a dish) */}
                {dishInfo.isDish && dishInfo.category && (
                  <div className="mt-6 pt-6 border-t border-white/20 space-y-2">
                    <button
                      onClick={() => {
                        if (dishInfo.category === 'CHEFF') {
                          router.push(`/recipe/${params.id}`);
                        } else if (dishInfo.category === 'GROWN') {
                          router.push(`/garden/${params.id}`);
                        } else if (dishInfo.category === 'DESIGNER') {
                          router.push(`/design/${params.id}`);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white rounded-xl font-semibold transition-all hover:scale-105"
                    >
                      <Printer className="w-5 h-5" />
                      <span>Printen</span>
                    </button>
                    <button
                      onClick={() => {
                        if (dishInfo.category === 'CHEFF') {
                          router.push(`/recipe/${params.id}`);
                        } else if (dishInfo.category === 'GROWN') {
                          router.push(`/garden/${params.id}`);
                        } else if (dishInfo.category === 'DESIGNER') {
                          router.push(`/design/${params.id}`);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white rounded-xl font-semibold transition-all hover:scale-105"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                )}

                {/* Quick Actions */}
                {!isOwner && (
                  <div className="mt-6 pt-6 border-t border-white/20 flex gap-2">
                    <PropsButton 
                      productId={product.id}
                      productTitle={product.title}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white rounded-xl font-semibold transition-all hover:scale-105"
                      variant="star"
                    />
                    <ShareButton
                      url={`${baseUrl}/product/${product.id}`}
                      title={product.title}
                      description={product.description || ''}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white rounded-xl font-semibold transition-all hover:scale-105"
                    />
                  </div>
                )}
            </div>

              {/* Seller Card */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Gemaakt door</h3>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                  {product.seller?.User?.avatar ? (
                      <Image
                      src={product.seller.User.avatar}
                        alt={getDisplayName(product)}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full object-cover border-4 border-emerald-100 shadow-lg"
                    />
                  ) : (
                      <div className={`w-20 h-20 bg-gradient-to-br ${theme.gradient} rounded-full flex items-center justify-center border-4 border-emerald-100 shadow-lg`}>
                        <span className="text-white font-bold text-2xl">
                        {getDisplayName(product).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                </div>
                  </div>
                  
                <div className="flex-1">
                  <ClickableName 
                    user={{
                      id: product.seller?.User?.id,
                      name: product.seller?.User?.name,
                      username: product.seller?.User?.username,
                      displayFullName: product.seller?.User?.displayFullName,
                      displayNameOption: product.seller?.User?.displayNameOption
                    }}
                      className="text-xl font-bold text-gray-900 hover:text-emerald-600 transition-colors block mb-1"
                    fallbackText="Verkoper"
                    linkTo="profile"
                  />
                    <div className="flex items-center gap-3 text-sm">
                      {stats.reviewCount > 0 && (
                        <>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="font-semibold">{stats.averageRating.toFixed(1)}</span>
                          </div>
                          <span className="text-gray-400">•</span>
                        </>
                      )}
                      <span className="text-gray-600">{stats.orderCount} verkopen</span>
                    </div>
                    </div>
                    </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {stats.reviewCount > 0 && (
                    <div className="p-3 bg-emerald-50 rounded-xl text-center">
                      <div className="text-2xl font-bold text-emerald-600">
                        {Math.round((stats.averageRating / 5) * 100)}%
                      </div>
                      <div className="text-xs text-gray-600">Positief</div>
                    </div>
                  )}
                  <div className={`p-3 bg-blue-50 rounded-xl text-center ${stats.reviewCount === 0 ? 'col-span-2' : ''}`}>
                    <div className="text-2xl font-bold text-blue-600">{stats.favoriteCount}</div>
                    <div className="text-xs text-gray-600">Favoriet</div>
                  </div>
                </div>

                <Link
                  href={`/user/${product.seller?.User?.username || product.seller?.User?.id}`}
                  className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl text-center font-semibold transition-all flex items-center justify-center gap-2"
                >
                  Bekijk profiel
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
          </div>
        </div>

        {/* Reviews Section */}
          <div className="mt-12 bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                Beoordelingen
              </h2>
            {currentUser && !isOwner && (
              <button
                onClick={() => setShowReviewForm(true)}
                  className={`px-6 py-3 bg-gradient-to-r ${theme.gradient} text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105`}
              >
                Schrijf een beoordeling
              </button>
            )}
          </div>

          {showReviewForm && (
              <div className="mb-8 p-6 bg-gray-50 rounded-2xl">
              <ReviewForm
                productId={product.id}
                onSubmit={handleReviewSubmit}
                onCancel={() => setShowReviewForm(false)}
                isSubmitting={isSubmittingReview}
              />
            </div>
          )}

          <ReviewList
            reviews={reviews}
            onReply={handleReviewReply}
            onResponseSubmit={handleReviewResponseSubmit}
            canReply={isOwner}
            isSeller={isOwner}
          />
        </div>
      </div>
      </section>


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
    </>
  );
}
