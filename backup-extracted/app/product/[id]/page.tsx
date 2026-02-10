'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ArrowLeft, Star, Clock, ChefHat, Sprout, Palette, Truck, Package, 
  Euro, Shield, CheckCircle, Edit3, Trash2, MessageCircle, Heart, 
  Share2, MapPin, Award, Zap, Eye, ShoppingBag, X, Check, AlertCircle,
  Download, Printer, Utensils, Flame, Users, BookOpen
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
import { getDisplayName as getDisplayNameUtil } from "@/lib/displayName";
import NewProductForm from "@/components/products/NewProductForm";
import PhotoCarousel from "@/components/ui/PhotoCarousel";

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
  // Recipe/Dish fields (for CHEFF category)
  ingredients?: string[];
  instructions?: string[];
  prepTime?: number | null;
  servings?: number | null;
  difficulty?: string | null;
  tags?: string[];
  // Step photos for recipes
  stepPhotos?: Array<{
    id: string;
    url: string;
    stepNumber: number;
    description?: string | null;
    idx: number;
  }>;
  // Garden fields (for GROWN category)
  plantType?: string | null;
  plantDate?: string | null;
  harvestDate?: string | null;
  growthDuration?: number | null;
  sunlight?: string | null;
  waterNeeds?: string | null;
  location?: string | null;
  soilType?: string | null;
  notes?: string | null;
  growthPhotos?: Array<{
    id: string;
    url: string;
    phaseNumber: number;
    description?: string | null;
    idx: number;
  }>;
  // Designer fields (for DESIGNER category)
  materials?: string[];
  dimensions?: string | null;
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
        gradient: 'from-primary-600 via-primary-700 to-primary-800',
        bg: 'bg-primary-50',
        text: 'text-primary-700',
        badge: 'bg-primary-100 text-primary-800 border-primary-200',
        icon: ChefHat,
        label: 'Chef Special',
        accent: 'bg-primary-600'
      };
    case 'GROWN':
      return {
        gradient: 'from-primary-600 via-primary-700 to-primary-800',
        bg: 'bg-primary-50',
        text: 'text-primary-700',
        badge: 'bg-primary-100 text-primary-800 border-primary-200',
        icon: Sprout,
        label: 'Garden Fresh',
        accent: 'bg-primary-600'
      };
    case 'DESIGNER':
      return {
        gradient: 'from-primary-600 via-primary-700 to-primary-800',
        bg: 'bg-primary-50',
        text: 'text-primary-700',
        badge: 'bg-primary-100 text-primary-800 border-primary-200',
        icon: Palette,
        label: 'Designer Piece',
        accent: 'bg-primary-600'
      };
    default:
      return {
        gradient: 'from-primary-600 via-primary-700 to-primary-800',
        bg: 'bg-primary-50',
        text: 'text-primary-700',
        badge: 'bg-primary-100 text-primary-800 border-primary-200',
        icon: Package,
        label: 'HomeCheff Product',
        accent: 'bg-primary-600'
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
  const { data: session } = useSession();

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => {
    console.log('🚀 Product Page useEffect triggered, product ID:', params.id);
    console.log('📍 Current URL:', window.location.href);
    setBaseUrl(window.location.origin);
    
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 Fetching product:', params.id);
        const response = await fetch(`/api/products/${params.id}`);
        console.log('📡 API Response status:', response.status);
        
        if (!response.ok) {
          // If product not found, check if it's an inspiration/dish instead
          if (response.status === 404) {
            console.log('🔍 Product not found, checking if it\'s an inspiration...');
            try {
              const errorData = await response.json();
              // Check if API indicated it's an inspiration item
              if (errorData.isInspiration && errorData.inspirationId) {
                console.log('✅ Found as inspiration, redirecting...');
                router.replace(`/inspiratie/${errorData.inspirationId}`);
                return;
              }
            } catch (parseError) {
              // If JSON parse fails, it's likely not an inspiration item
              // Just continue with normal error handling
            }
          }
          
          const errorText = await response.text();
          console.error('❌ Product fetch failed:', response.status, errorText);
          // Don't show alert, just redirect to home
          router.push('/');
          return;
        }
        const data = await response.json();
        console.log('✅ API Response received:', data);
        
        // Check if data and data.product exist
        if (!data || !data.product) {
          console.error('❌ Invalid product data:', data);
          // Don't show alert, just redirect to home
          router.push('/');
          return;
        }

        // Debug logging
        console.log('📦 Product Page - Received data:', {
          productId: params.id,
          category: data.product.category,
          hasStepPhotos: !!data.product.stepPhotos?.length,
          hasGrowthPhotos: !!data.product.growthPhotos?.length,
          hasTags: !!data.product.tags?.length,
          hasMaterials: !!data.product.materials?.length,
          stepPhotosCount: data.product.stepPhotos?.length || 0,
          growthPhotosCount: data.product.growthPhotos?.length || 0,
          tagsCount: data.product.tags?.length || 0,
          materialsCount: data.product.materials?.length || 0,
          stepPhotos: data.product.stepPhotos,
          growthPhotos: data.product.growthPhotos,
          tags: data.product.tags,
          materials: data.product.materials,
          rawProduct: data.product
        });

        // Set stats if available
        if (data.stats) {
          setStats(data.stats);
        }
        
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
          // Recipe fields
          ingredients: data.product.ingredients,
          instructions: data.product.instructions,
          prepTime: data.product.prepTime,
          servings: data.product.servings,
          difficulty: data.product.difficulty,
          tags: data.product.tags,
          stepPhotos: data.product.stepPhotos,
          // Garden fields
          plantType: data.product.plantType,
          plantDate: data.product.plantDate,
          harvestDate: data.product.harvestDate,
          growthDuration: data.product.growthDuration,
          sunlight: data.product.sunlight,
          waterNeeds: data.product.waterNeeds,
          location: data.product.location,
          soilType: data.product.soilType,
          notes: data.product.notes,
          growthPhotos: data.product.growthPhotos,
          // Designer fields
          materials: data.product.materials,
          dimensions: data.product.dimensions,
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
        console.error('❌ Error fetching product:', error);
        alert(`Fout bij ophalen product: ${error instanceof Error ? error.message : 'Onbekende fout'}. Check console voor details.`);
        // Don't redirect on error, let user see the error
        setIsLoading(false);
      }
    };

    if (params.id) {
      console.log('✅ params.id exists, calling fetchProduct');
      fetchProduct();
      trackView(Array.isArray(params.id) ? params.id[0] : params.id);
    } else {
      console.warn('⚠️ No params.id found!');
    }
  }, [params.id, router]);

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

  const handleEditSave = (updatedProduct: any) => {
    setProduct(updatedProduct);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!product) return;
    
    try {
      const response = await fetch(`/api/profile/dishes/${product.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');

      alert('Product succesvol verwijderd');
      router.push('/profile');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Er is een fout opgetreden bij het verwijderen van het product');
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
        alert('Beoordeling succesvol geplaatst!');
      } else {
        const error = await response.json();
        alert(error.error || 'Er is een fout opgetreden');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Er is een fout opgetreden bij het plaatsen van de beoordeling');
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
        alert('Reactie succesvol geplaatst!');
      } else {
        const error = await response.json();
        alert(error.error || 'Er is een fout opgetreden');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Er is een fout opgetreden bij het plaatsen van je reactie');
    }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Product niet gevonden</h1>
          <BackButton fallbackUrl="/" label="Terug naar overzicht" />
        </div>
      </main>
    );
  }

  const theme = getCategoryTheme(product.category);
  const CategoryIcon = theme.icon;
  
  // Build images array - prioritize Image array, then photos, then single image
  const images: Array<{ id: string; fileUrl: string; url: string; sortOrder?: number; idx?: number }> = (() => {
    if (product.Image && product.Image.length > 0) {
      return product.Image.map((img: any) => ({
        id: img.id,
        fileUrl: img.fileUrl,
        url: img.fileUrl,
        sortOrder: img.sortOrder || 0
      }));
    }
    if (product.photos && product.photos.length > 0) {
      return product.photos.map((photo: any) => ({
        id: photo.id,
        fileUrl: photo.url,
        url: photo.url,
        idx: photo.idx || 0
      }));
    }
    if (product.image) {
      return [{
        id: '1',
        fileUrl: product.image,
        url: product.image,
        sortOrder: 0
      }];
    }
    return [];
  })();
  
  const currentImage = images[selectedImageIndex];
  const currentImageUrl = currentImage ? (currentImage.fileUrl || currentImage.url) : product.image;

  // Als we in edit mode zijn, toon het NewProductForm
  if (isEditing) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Product Bewerken</h1>
              <p className="text-gray-600 mt-2">Pas je product aan en beheer de voorraad</p>
            </div>
            
            <NewProductForm 
              editMode={true}
              existingProduct={product}
              onSave={handleEditSave}
              onCancel={handleEditCancel}
            />
          </div>
        </div>
      </main>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert('💡 In het print venster: kies "Opslaan als PDF" als bestemming om te downloaden!');
    setTimeout(() => {
      window.print();
    }, 300);
  };

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
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{showPrintView ? 'Sluit' : 'Print/PDF'} weergave</span>
            </button>
            {showPrintView && (
              <>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm bg-gradient-to-r from-secondary-600 to-secondary-700 text-white rounded-lg hover:from-secondary-700 hover:to-secondary-800 transition-all shadow-md hover:shadow-lg"
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
              {/* Photo Carousel with support for future videos */}
              {images && images.length > 0 ? (
                <div className="relative">
                  <PhotoCarousel
                    photos={images.map((img, index) => {
                      const fileUrl = img.fileUrl || img.url || '';
                      return {
                        id: img.id || `img-${index}`,
                        fileUrl: fileUrl,
                        sortOrder: img.sortOrder || img.idx || index
                      };
                    }).filter(img => img.fileUrl && img.fileUrl.trim() !== '')}
                    className="rounded-3xl overflow-hidden shadow-2xl"
                    showThumbnails={true}
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
                  {product.stock !== undefined && product.stock !== null && (
                    <div className="absolute top-6 right-6 z-20 pointer-events-none">
                      <div className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg backdrop-blur-sm border-2 pointer-events-auto ${
                        product.stock === 0 ? 'bg-red-100 text-red-800 border-red-200' :
                        product.stock <= 5 ? 'bg-orange-100 text-orange-800 border-orange-200 animate-pulse' :
                        'bg-green-100 text-green-800 border-green-200'
                      }`}>
                        {product.stock === 0 ? '❌ Uitverkocht' :
                         product.stock <= 5 ? `⚠️ Nog ${product.stock} over!` :
                         `✓ ${product.stock} beschikbaar`}
                      </div>
                    </div>
                  )}

                  {/* Owner Actions - Overlay on carousel */}
                  {isOwner && (
                    <div className="absolute bottom-6 right-6 z-20 flex gap-2 pointer-events-none">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(!isEditing);
                        }}
                        className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white shadow-lg transition-all hover:scale-110 pointer-events-auto"
                        title="Bewerken"
                      >
                        <Edit3 className="w-5 h-5 text-blue-600" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(true);
                        }}
                        className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white shadow-lg transition-all hover:scale-110 pointer-events-auto"
                        title="Verwijderen"
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
          <div className={`relative mx-auto w-full max-w-4xl px-0 sm:px-4 lg:px-6 ${showPrintView ? 'block' : 'hidden'}`}>
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
                {product.stock !== undefined && product.stock !== null && (
                  <div className="absolute top-6 right-6">
                    <div className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg backdrop-blur-sm border-2 ${
                      product.stock === 0 ? 'bg-red-100 text-red-800 border-red-200' :
                      product.stock <= 5 ? 'bg-orange-100 text-orange-800 border-orange-200 animate-pulse' :
                      'bg-green-100 text-green-800 border-green-200'
                    }`}>
                      {product.stock === 0 ? '❌ Uitverkocht' :
                       product.stock <= 5 ? `⚠️ Nog ${product.stock} over!` :
                       `✓ ${product.stock} beschikbaar`}
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery for Print View */}
              {images.length > 1 && (
                <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-center">
                  {images.map((img, index) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden transition-all duration-300 ${
                        selectedImageIndex === index 
                          ? `ring-4 ring-${theme.accent} ring-offset-2 scale-105 shadow-xl` 
                          : 'opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <Image 
                        src={(img as any).fileUrl || (img as any).url || product.image || ''} 
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 space-y-8">
              {/* Product Title & Details */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
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
                        {product.description || "Geen beschrijving beschikbaar."}
                      </p>
                    </div>

                    {/* Recipe Content - Only for CHEFF category */}
                    {product.category === 'CHEFF' && (product.ingredients || product.instructions) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        {/* Ingredients */}
                        {product.ingredients && product.ingredients.length > 0 && (
                          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-amber-300">
                            <div className="flex items-center mb-6">
                              <div className="h-px bg-amber-300 flex-grow"></div>
                              <h2 className="text-2xl font-bold text-amber-900 px-4 flex items-center">
                                <Utensils className="w-6 h-6 mr-2 text-amber-600" />
                                Ingrediënten
                              </h2>
                              <div className="h-px bg-amber-300 flex-grow"></div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
                              <ul className="space-y-3">
                                {product.ingredients.map((ingredient, index) => (
                                  <li key={index} className="flex items-start gap-3 group">
                                    <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 group-hover:bg-amber-600 transition-colors">
                                      {index + 1}
                                    </span>
                                    <span className="text-gray-800 text-lg leading-relaxed">{ingredient}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Instructions */}
                        {product.instructions && product.instructions.length > 0 && (
                          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-amber-300">
                            <div className="flex items-center mb-6">
                              <div className="h-px bg-amber-300 flex-grow"></div>
                              <h2 className="text-2xl font-bold text-amber-900 px-4 flex items-center">
                                <Flame className="w-6 h-6 mr-2 text-orange-600" />
                                Bereidingswijze
                              </h2>
                              <div className="h-px bg-amber-300 flex-grow"></div>
                            </div>
                            
                            <div className="space-y-6">
                              {product.instructions.map((instruction, index) => {
                                const stepNumber = index + 1;
                                // Group step photos by step number
                                const currentStepPhotos = (product.stepPhotos || []).filter(
                                  (photo) => photo.stepNumber === stepNumber
                                );
                                
                                return (
                                  <div key={index} className="bg-gradient-to-br from-white to-amber-50 border-2 border-amber-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                    <div className="flex gap-4">
                                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                                        {stepNumber}
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-gray-800 leading-relaxed text-lg mb-3">{instruction}</p>
                                        
                                        {/* Step Photos */}
                                        {currentStepPhotos.length > 0 && (
                                          <div className="grid grid-cols-2 gap-3 mt-4">
                                            {currentStepPhotos.map((photo) => (
                                              <div key={photo.id} className="relative group">
                                                <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-amber-300 shadow-md">
                                                  <Image
                                                    src={photo.url}
                                                    alt={`Stap ${stepNumber} foto`}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                  />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recipe Meta Info */}
                    {product.category === 'CHEFF' && (product.prepTime || product.servings || product.difficulty) && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                        {product.prepTime && product.prepTime > 0 && (
                          <div className="border-2 border-amber-200 rounded-lg p-4 bg-gradient-to-b from-white to-amber-50 text-center">
                            <div className="text-xs uppercase tracking-wider text-amber-600 mb-2 font-semibold">Bereidingstijd</div>
                            <div className="flex items-center justify-center space-x-2">
                              <Clock className="w-5 h-5 text-amber-600" />
                              <span className="text-lg font-bold text-gray-800">{product.prepTime} min</span>
                            </div>
                          </div>
                        )}
                        
                        {product.servings && product.servings > 0 && (
                          <div className="border-2 border-amber-200 rounded-lg p-4 bg-gradient-to-b from-white to-amber-50 text-center">
                            <div className="text-xs uppercase tracking-wider text-amber-600 mb-2 font-semibold">Porties</div>
                            <div className="flex items-center justify-center space-x-2">
                              <Users className="w-5 h-5 text-amber-600" />
                              <span className="text-lg font-bold text-gray-800">{product.servings} personen</span>
                            </div>
                          </div>
                        )}

                        {product.difficulty && (
                          <div className="border-2 border-amber-200 rounded-lg p-4 bg-gradient-to-b from-white to-amber-50 text-center">
                            <div className="text-xs uppercase tracking-wider text-amber-600 mb-2 font-semibold">Moeilijkheidsgraad</div>
                            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                              product.difficulty === 'EASY' ? 'bg-green-100 text-green-800 border-2 border-green-400' :
                              product.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400' :
                              'bg-red-100 text-red-800 border-2 border-red-400'
                            }`}>
                              {product.difficulty === 'EASY' ? 'Makkelijk' :
                               product.difficulty === 'MEDIUM' ? 'Gemiddeld' :
                               'Moeilijk'}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delivery Options */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(product.delivery === 'PICKUP' || product.delivery === 'BOTH') && (
                        <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-2xl border-2 border-primary-100 print-avoid-break">
                          <div className="p-3 bg-primary-600 rounded-xl">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Ophalen mogelijk</div>
                            <div className="text-sm text-gray-600">Kom het product ophalen</div>
                          </div>
                        </div>
                      )}
                      {(product.delivery === 'DELIVERY' || product.delivery === 'BOTH') && (
                        <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-2xl border-2 border-primary-100 print-avoid-break">
                          <div className="p-3 bg-primary-600 rounded-xl">
                            <Truck className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Bezorging mogelijk</div>
                            <div className="text-sm text-gray-600">We bezorgen bij jou</div>
                          </div>
                        </div>
                      )}
                  </div>

                    {/* GROWN Category - Growth Photos */}
                    {product.category === 'GROWN' && product.growthPhotos && product.growthPhotos.length > 0 && (
                      <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 border-2 border-green-300">
                        <div className="flex items-center mb-6">
                          <div className="h-px bg-green-300 flex-grow"></div>
                          <h2 className="text-2xl font-bold text-green-900 px-4 flex items-center">
                            <Sprout className="w-6 h-6 mr-2 text-green-600" />
                            Groeifases
                          </h2>
                          <div className="h-px bg-green-300 flex-grow"></div>
                        </div>
                        
                        {/* Group growth photos by phase */}
                        {(() => {
                          const growthPhases = (product.growthPhotos || []).reduce((acc: Record<number, typeof product.growthPhotos>, photo) => {
                            if (!acc[photo.phaseNumber]) {
                              acc[photo.phaseNumber] = [];
                            }
                            acc[photo.phaseNumber]!.push(photo);
                            return acc;
                          }, {} as Record<number, typeof product.growthPhotos>);
                          
                          const sortedPhases = Object.keys(growthPhases).sort((a, b) => Number(a) - Number(b));
                          const PHASE_NAMES = [
                            '🌱 Zaaien/Planten',
                            '🌿 Kiemen',
                            '🌾 Groeien',
                            '🌺 Bloeien',
                            '🍅 Oogsten'
                          ];
                          
                          return (
                            <div className="space-y-8">
                              {sortedPhases.map((phaseKey) => {
                                const phaseNumber = Number(phaseKey);
                                const phasePhotos = growthPhases[phaseNumber] || [];
                                return (
                                  <div key={phaseNumber} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                                    <h3 className="text-xl font-bold text-green-900 mb-4">
                                      {PHASE_NAMES[phaseNumber - 1] || `Fase ${phaseNumber}`}
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                      {phasePhotos.map((photo) => (
                                        <div key={photo.id} className="relative group">
                                          <div className="relative w-full h-40 rounded-lg overflow-hidden border-2 border-green-300 shadow-md">
                                            <Image
                                              src={photo.url}
                                              alt={photo.description || `Fase ${phaseNumber} foto`}
                                              fill
                                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                          </div>
                                          {photo.description && (
                                            <p className="text-sm text-gray-600 mt-2">{photo.description}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* GROWN Category - Plant Info */}
                    {product.category === 'GROWN' && (product.plantType || product.plantDate || product.harvestDate || product.growthDuration || product.sunlight || product.waterNeeds || product.location || product.soilType) && (
                      <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 border-2 border-green-300">
                        <div className="flex items-center mb-6">
                          <div className="h-px bg-green-300 flex-grow"></div>
                          <h2 className="text-2xl font-bold text-green-900 px-4 flex items-center">
                            <Sprout className="w-6 h-6 mr-2 text-green-600" />
                            Plant Informatie
                          </h2>
                          <div className="h-px bg-green-300 flex-grow"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {product.plantType && (
                            <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                              <div className="text-sm font-semibold text-green-700 mb-1">Plant Type</div>
                              <div className="text-lg font-bold text-gray-800">{product.plantType}</div>
                            </div>
                          )}
                          {product.plantDate && (
                            <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                              <div className="text-sm font-semibold text-green-700 mb-1">Plant Datum</div>
                              <div className="text-lg font-bold text-gray-800">{product.plantDate}</div>
                            </div>
                          )}
                          {product.harvestDate && (
                            <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                              <div className="text-sm font-semibold text-green-700 mb-1">Oogst Datum</div>
                              <div className="text-lg font-bold text-gray-800">{product.harvestDate}</div>
                            </div>
                          )}
                          {product.growthDuration && (
                            <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                              <div className="text-sm font-semibold text-green-700 mb-1">Groeiduur</div>
                              <div className="text-lg font-bold text-gray-800">{product.growthDuration} dagen</div>
                            </div>
                          )}
                          {product.sunlight && (
                            <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                              <div className="text-sm font-semibold text-green-700 mb-1">Zonlicht</div>
                              <div className="text-lg font-bold text-gray-800">{product.sunlight}</div>
                            </div>
                          )}
                          {product.waterNeeds && (
                            <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                              <div className="text-sm font-semibold text-green-700 mb-1">Waterbehoefte</div>
                              <div className="text-lg font-bold text-gray-800">{product.waterNeeds}</div>
                            </div>
                          )}
                          {product.location && (
                            <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                              <div className="text-sm font-semibold text-green-700 mb-1">Locatie</div>
                              <div className="text-lg font-bold text-gray-800">{product.location}</div>
                            </div>
                          )}
                          {product.soilType && (
                            <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                              <div className="text-sm font-semibold text-green-700 mb-1">Grondsoort</div>
                              <div className="text-lg font-bold text-gray-800">{product.soilType}</div>
                            </div>
                          )}
                        </div>
                        {product.notes && (
                          <div className="mt-6 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                            <div className="text-sm font-semibold text-green-700 mb-2">Notities</div>
                            <div className="text-gray-800 whitespace-pre-wrap">{product.notes}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* DESIGNER Category - Materials */}
                    {product.category === 'DESIGNER' && product.materials && product.materials.length > 0 && (
                      <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-300">
                        <div className="flex items-center mb-6">
                          <div className="h-px bg-purple-300 flex-grow"></div>
                          <h2 className="text-2xl font-bold text-purple-900 px-4 flex items-center">
                            <Palette className="w-6 h-6 mr-2 text-purple-600" />
                            Materialen
                          </h2>
                          <div className="h-px bg-purple-300 flex-grow"></div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                          <ul className="space-y-3">
                            {product.materials.map((material, index) => (
                              <li key={index} className="flex items-start gap-3 group">
                                <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 group-hover:bg-purple-600 transition-colors">
                                  {index + 1}
                                </span>
                                <span className="text-gray-800 text-lg leading-relaxed">{material}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {product.dimensions && (
                          <div className="mt-6 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                            <div className="text-sm font-semibold text-purple-700 mb-1">Afmetingen</div>
                            <div className="text-lg font-bold text-gray-800">{product.dimensions}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Additional Photos */}
                    {images.length > 1 && (
                      <div className="mt-8 bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-300">
                        <div className="flex items-center mb-5">
                          <div className="h-px bg-gray-300 flex-grow"></div>
                          <h2 className="text-xl font-bold text-gray-900 px-4">
                            📸 Foto's
                          </h2>
                          <div className="h-px bg-gray-300 flex-grow"></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {images.slice(1).map((img, index) => (
                            <div 
                              key={img.id || index} 
                              className="relative group bg-gray-50 p-2 border-2 border-gray-300 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-105"
                            >
                              <div className="relative w-full h-40 bg-white">
                                <Image
                                  src={(img as any).fileUrl || (img as any).url || product.image || ''}
                                  alt={`Foto ${index + 2}`}
                                  fill
                                  className="object-contain p-2"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                      <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-300">
                        <div className="flex items-center mb-8">
                          <div className="h-px bg-gray-300 flex-grow"></div>
                          <h2 className="text-2xl font-bold text-gray-900 px-4 flex items-center">
                            <BookOpen className="w-7 h-7 mr-3 text-gray-600" />
                            Kenmerken
                          </h2>
                          <div className="h-px bg-gray-300 flex-grow"></div>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center">
                          {product.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 rounded-full text-sm font-bold border-2 border-gray-400 shadow-md hover:shadow-lg transition-all hover:scale-105"
                            >
                              <span className="mr-2">📌</span>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
            </div>

              {/* Trust & Safety */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 print-avoid-break">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary-600" />
                  Veilig & Vertrouwd
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-100 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Veilig Betalen</div>
                      <div className="text-sm text-gray-600">Via Stripe beveiligd</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary-100 rounded-xl">
                      <Shield className="w-5 h-5 text-secondary-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Kopers Bescherming</div>
                      <div className="text-sm text-gray-600">Geld terug garantie</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-100 rounded-xl">
                      <Award className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Kwaliteit</div>
                      <div className="text-sm text-gray-600">Top beoordelingen</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary-100 rounded-xl">
                      <Zap className="w-5 h-5 text-secondary-600" />
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
                {!isOwner && product.stock !== 0 && (
                  <div className="mb-6">
                    <label className="block text-sm opacity-80 mb-2">Aantal</label>
                  <select 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-2xl text-white font-semibold focus:ring-2 focus:ring-white/50 cursor-pointer"
                  >
                      {Array.from({ length: Math.min(10, product.stock || 10) }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num} className="text-gray-900">{num}</option>
                    ))}
                  </select>
                </div>
                )}

                {/* CTA Buttons */}
                <div className="space-y-3">
              {product.stock === 0 ? (
                    <div className="w-full py-4 px-6 bg-white/20 backdrop-blur-sm rounded-2xl text-center font-bold border-2 border-white/30">
                  Uitverkocht
                </div>
                  ) : isOwner ? (
                <button
                  onClick={() => setIsEditing(true)}
                      className="block w-full bg-white text-gray-900 py-4 px-6 rounded-2xl text-center font-bold transition-all hover:scale-105 shadow-xl"
                >
                  <Edit3 className="w-5 h-5 inline mr-2" />
                  Product bewerken
                </button>
              ) : (
                    <AddToCartButton
                      product={{
                        id: product.id,
                        title: product.title,
                        priceCents: product.priceCents,
                        image: currentImageUrl || undefined,
                        sellerName: getDisplayName(product),
                        sellerId: product.seller?.User?.id || '',
                        deliveryMode: (product.delivery as 'PICKUP' | 'DELIVERY' | 'BOTH') || 'PICKUP',
                        stock: typeof product.stock === 'number' ? product.stock : null,
                      }}
                      className="w-full font-bold transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-2"
                      size="lg"
                      variant="outline"
                      quantity={quantity}
                      onAdded={() => setQuantity(1)}
                    />
              )}

                  {!isOwner && (
                    <StartChatButton
                      productId={product.id}
                      sellerId={product.seller?.User?.id || ''}
                      sellerName={getDisplayName(product)}
                      showSuccessMessage={true}
                      className="w-full bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:bg-white/30 text-white py-4 px-6 rounded-2xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
                    />
                  )}
            </div>

                {/* Quick Actions */}
                {!isOwner && (
                  <div className="mt-6 pt-6 border-t border-white/20 space-y-2">
                    <div className="flex gap-2">
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
                    <ReportContentButton
                      entityType="PRODUCT"
                      entityId={product.id}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white rounded-xl font-semibold transition-all hover:scale-105"
                    />
                  </div>
                )}
            </div>

              {/* Seller Card */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 print-avoid-break">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="w-6 h-6 text-primary-600" />
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
                        className="w-20 h-20 rounded-full object-cover border-4 border-primary-100 shadow-lg"
                    />
                  ) : (
                      <div className={`w-20 h-20 bg-gradient-to-br ${theme.gradient} rounded-full flex items-center justify-center border-4 border-primary-100 shadow-lg`}>
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
                    <div className="p-3 bg-primary-50 rounded-xl text-center">
                      <div className="text-2xl font-bold text-primary-600">
                        {Math.round((stats.averageRating / 5) * 100)}%
                      </div>
                      <div className="text-xs text-gray-600">Positief</div>
                    </div>
                  )}
                  <div className={`p-3 bg-secondary-50 rounded-xl text-center ${stats.reviewCount === 0 ? 'col-span-2' : ''}`}>
                    <div className="text-2xl font-bold text-secondary-600">{stats.favoriteCount}</div>
                    <div className="text-xs text-gray-600">Favoriet</div>
                  </div>
                </div>

                {/* Link to Seller Profile */}
                {product.seller?.User?.id && (
                  <Link
                    href={`/user/${product.seller.User.username || product.seller.User.id}`}
                    className="block w-full mt-4 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-center font-semibold transition-all hover:scale-105"
                  >
                    Bekijk alle producten van {getDisplayName(product)}
                  </Link>
                )}

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

      {/* Image Zoom Modal */}
      {showImageZoom && currentImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageZoom(false)}
        >
              <button
            onClick={() => setShowImageZoom(false)}
            className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all"
              >
            <X className="w-6 h-6 text-white" />
              </button>
          <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
            <Image 
              src={currentImageUrl || product.image || '/placeholder.jpg'} 
              alt={product.title} 
              fill
              className="object-contain" 
              sizes="100vw"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Item verwijderen</h3>
            <p className="text-gray-600 mb-6 text-center">
              Weet je zeker dat je <strong>{product.title}</strong> wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all font-bold shadow-lg hover:shadow-xl"
              >
                Ja, verwijderen
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all font-bold"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </>
  );
}
