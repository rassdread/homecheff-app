'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ArrowLeft, Star, Clock, ChefHat, Sprout, Palette, Truck, Package, 
  Euro, Shield, CheckCircle, Edit3, Trash2, MessageCircle, Heart, 
  Share2, MapPin, Award, Zap, Eye, ShoppingBag, X, Check, AlertCircle
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
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll for sticky cart
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        
        console.log('📦 Product data loaded:', data.product);
        console.log('📊 Product stats:', data.stats);
        
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
      alert('Er is een fout opgetreden bij het bijwerken van het product');
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
    console.log('Reply to review:', reviewId);
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
  const images = product.Image || product.photos || (product.image ? [{ id: '1', fileUrl: product.image, url: product.image }] : []);
  const currentImage = images[selectedImageIndex];
  const currentImageUrl = currentImage ? ('fileUrl' in currentImage ? currentImage.fileUrl : currentImage.url) : product.image;

  return (
    <main className={`min-h-screen bg-gradient-to-br ${theme.bg} via-white to-gray-50`}>
      {/* Sticky Navigation */}
      <div className={`sticky top-16 z-40 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <BackButton 
              fallbackUrl="/"
              label={scrolled ? product.title : "Terug"}
              variant="minimal"
            />
            {scrolled && (
              <div className="flex items-center gap-4 animate-in slide-in-from-right duration-300">
                <span className="text-2xl font-bold text-gray-900">
                  €{(product.priceCents / 100).toFixed(2)}
                </span>
                {!isOwner && product.stock !== 0 && (
                  <AddToCartButton
                    product={{
                      id: product.id,
                      title: product.title,
                      priceCents: product.priceCents,
                      image: currentImageUrl || undefined,
                      sellerName: getDisplayName(product),
                      sellerId: product.seller?.User?.id || '',
                      deliveryMode: (product.delivery as 'PICKUP' | 'DELIVERY' | 'BOTH') || 'PICKUP',
                    }}
                    className=""
                    size="md"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section with Large Image */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Image Gallery */}
          <div className="relative">
            {/* Main Image */}
            <div 
              onClick={() => setShowImageZoom(true)}
              className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-white shadow-2xl cursor-zoom-in group"
            >
              {currentImageUrl ? (
                <Image 
                  src={currentImageUrl} 
                  alt={product.title} 
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  sizes="(max-width: 768px) 100vw, 90vw"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <CategoryIcon className="w-32 h-32 text-gray-300" />
                </div>
              )}

              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${theme.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
              
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

              {/* Owner Actions */}
              {isOwner && (
                <div className="absolute bottom-6 right-6 flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(!isEditing);
                    }}
                    className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white shadow-lg transition-all hover:scale-110"
                    title="Bewerken"
                  >
                    <Edit3 className="w-5 h-5 text-blue-600" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white shadow-lg transition-all hover:scale-110"
                    title="Verwijderen"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              )}

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-6 left-6 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
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
                      src={'fileUrl' in img ? img.fileUrl : img.url} 
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prijs (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={(editData.priceCents / 100).toFixed(2)}
                        onChange={(e) => setEditData({...editData, priceCents: Math.round(parseFloat(e.target.value) * 100)})}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Voorraad</label>
                      <input
                        type="number"
                        value={editData.stock}
                        onChange={(e) => setEditData({...editData, stock: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max</label>
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
                        {isSaving ? 'Opslaan...' : '✓ Opslaan'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 transition-all font-semibold"
                    >
                      Annuleren
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
                        {product.description || "Geen beschrijving beschikbaar."}
                      </p>
                    </div>

                    {/* Delivery Options */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(product.delivery === 'PICKUP' || product.delivery === 'BOTH') && (
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border-2 border-blue-100">
                          <div className="p-3 bg-blue-500 rounded-xl">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Ophalen mogelijk</div>
                            <div className="text-sm text-gray-600">Kom het product ophalen</div>
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
                      <div className="font-semibold text-gray-900">Kopers Bescherming</div>
                      <div className="text-sm text-gray-600">Geld terug garantie</div>
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
            <div className="lg:col-span-1">
              <div className={`sticky top-32 bg-gradient-to-br ${theme.gradient} rounded-3xl p-8 shadow-2xl text-white`}>
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
                <Link
                  href={`/product/${product.id}/edit`}
                      className="w-full bg-white text-gray-900 py-4 px-6 rounded-2xl text-center font-bold transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-5 h-5" />
                  Product bewerken
                </Link>
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
                      }}
                      className="w-full bg-white text-gray-900 py-4 px-6 rounded-2xl text-center font-bold transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-2"
                      size="lg"
                    />
              )}

                  {!isOwner && (
                    <StartChatButton
                      productId={product.id}
                      sellerId={product.seller?.User?.id || ''}
                      sellerName={getDisplayName(product)}
                      className="w-full bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:bg-white/30 text-white py-4 px-6 rounded-2xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
                    />
                  )}
            </div>

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
  );
}
