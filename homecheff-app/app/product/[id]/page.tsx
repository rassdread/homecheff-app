'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Star, Clock, ChefHat, Sprout, Palette, Truck, Package, Euro, Shield, CheckCircle, Edit3, Trash2, MessageCircle, Plus, X } from "lucide-react";
import Link from "next/link";
import AddToCartButton from "@/components/cart/AddToCartButton";
import ShareButton from "@/components/ui/ShareButton";
// import { auth } from "@/lib/auth"; // Removed - using client-side auth instead
import ReviewList from "@/components/reviews/ReviewList";
import ReviewForm from "@/components/reviews/ReviewForm";
import StartChatButton from "@/components/chat/StartChatButton";
import FollowButton from "@/components/follow/FollowButton";
import PropsButton from "@/components/props/PropsButton";
import ReportContentButton from "@/components/reporting/ReportContentButton";

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
    };
  } | null;
};

// Helper function to get display name based on displayNameType
const getDisplayName = (product: Product | null) => {
  if (!product?.seller?.User) return 'Anoniem';
  
  if (product.displayNameType === 'username') {
    return product.seller.User.username || product.seller.User.name || 'Anoniem';
  } else {
    return product.seller.User.name || product.seller.User.username || 'Anoniem';
  }
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const handleSellerNameClick = (e: React.MouseEvent) => {
    if (!session && product?.seller?.User?.id) {
      e.preventDefault();
      router.push('/login?callbackUrl=' + encodeURIComponent(`/seller/${product.seller.User.id}`));
    }
  };

  if (!params?.id || typeof params.id !== 'string') {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Product ID niet gevonden</h1>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar home
            </Link>
          </div>
        </div>
      </main>
    );
  }
  const [product, setProduct] = useState<Product | null>(null);
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
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Set base URL for sharing
    setBaseUrl(window.location.origin);
    
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${params.id}`);
        if (!response.ok) {
          router.push('/');
          return;
        }
        const data = await response.json();
        
        // Transform the data to match the expected structure
        const transformedProduct: Product = {
          id: data.id,
          title: data.title,
          description: data.description,
          priceCents: data.priceCents,
          image: data.photos?.[0]?.url || data.ListingMedia?.[0]?.url || null,
          photos: data.photos || data.ListingMedia?.map((media: any) => ({
            id: media.id,
            url: media.url,
            idx: media.order || media.idx
          })) || [],
          stock: data.stock,
          maxStock: data.maxStock,
          deliveryMode: data.deliveryMode,
          delivery: data.delivery || 'PICKUP',
          createdAt: data.createdAt,
          category: data.category,
          subcategory: data.subcategory,
          displayNameType: data.displayNameType || 'fullname',
          Image: data.photos?.map((photo: any) => ({
            id: photo.id,
            fileUrl: photo.url
          })) || data.Image?.map((img: any) => ({
            id: img.id,
            fileUrl: img.fileUrl
          })) || [],
          seller: {
            User: {
              id: data.User?.id,
              name: data.User?.name,
              username: data.User?.username,
              avatar: data.User?.image || data.User?.profileImage
            }
          }
        };
        
        setProduct(transformedProduct);
        
        // Check if current user is the owner
        if (session?.user?.email) {
          try {
            const userResponse = await fetch('/api/profile/me');
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setCurrentUser(userData);
              setIsOwner(userData.id === data.User?.id);
              
              // Set edit data
              setEditData({
                title: data.title || '',
                description: data.description || '',
                priceCents: data.priceCents || 0,
                stock: data.stock || 0,
                maxStock: data.maxStock || 0
              });
            }
          } catch (authError) {
            console.error('Error checking user profile:', authError);
            // Don't redirect for auth errors, just log them
          }
        }

        // Load reviews
        try {
          await loadReviews(data.id);
        } catch (reviewError) {
          console.error('Error loading reviews:', reviewError);
          // Don't redirect for review errors, just log them
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
      // Track view
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

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

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      alert('Product succesvol verwijderd');
      router.push('/profile');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Er is een fout opgetreden bij het verwijderen van het product');
    }
  };

  const handleContactSeller = async () => {
    if (!contactMessage.trim()) {
      alert('Voer een bericht in');
      return;
    }

    try {
      // Hier zou je een bericht API kunnen aanroepen
      // Voor nu tonen we gewoon een bevestiging
      alert(`Bericht verzonden naar ${getDisplayName(product)}: "${contactMessage}"`);
      setShowContactModal(false);
      setContactMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Er is een fout opgetreden bij het verzenden van het bericht');
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        setShowReviewForm(false);
        await loadReviews(product.id);
        alert('Beoordeling succesvol geplaatst!');
      } else {
        const error = await response.json();
        alert(error.error || 'Er is een fout opgetreden bij het plaatsen van de beoordeling');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Er is een fout opgetreden bij het plaatsen van de beoordeling');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReviewReply = async (reviewId: string) => {
    // TODO: Implement review reply functionality
    console.log('Reply to review:', reviewId);
  };

  const handleReviewResponseSubmit = async (reviewId: string, comment: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });

      if (response.ok) {
        await loadReviews(product!.id);
        alert('Reactie succesvol geplaatst!');
      } else {
        const error = await response.json();
        alert(error.error || 'Er is een fout opgetreden bij het plaatsen van je reactie');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Er is een fout opgetreden bij het plaatsen van je reactie');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-32 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-neutral-200 rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                <div className="h-4 bg-neutral-200 rounded w-full"></div>
                <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Product niet gevonden</h1>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar home
          </Link>
        </div>
      </div>

      {/* Product Details */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden bg-white shadow-sm">
              {product.Image && product.Image.length > 0 ? (
                <img 
                  src={product.Image[selectedImageIndex]?.fileUrl} 
                  alt={product.title} 
                  className="w-full h-full object-cover" 
                />
              ) : product.photos && product.photos.length > 0 ? (
                <img 
                  src={product.photos[selectedImageIndex]?.url} 
                  alt={product.title} 
                  className="w-full h-full object-cover" 
                />
              ) : product.image ? (
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                  <div className="text-neutral-400 text-6xl">
                    {product.category === 'CHEFF' ? <ChefHat className="w-16 h-16 mx-auto" /> :
                     product.category === 'GROWN' ? <Sprout className="w-16 h-16 mx-auto" /> :
                     product.category === 'DESIGNER' ? <Palette className="w-16 h-16 mx-auto" /> :
                     <ChefHat className="w-16 h-16 mx-auto" />}
                  </div>
                </div>
              )}
              
              {/* Category Badge */}
              {product.category && (
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    product.category === 'CHEFF' ? 'bg-warning-100 text-warning-800' :
                    product.category === 'GROWN' ? 'bg-success-100 text-success-800' :
                    product.category === 'DESIGNER' ? 'bg-secondary-100 text-secondary-800' :
                    'bg-neutral-100 text-neutral-800'
                  }`}>
                    {product.category === 'CHEFF' ? '🍳 Chef' :
                     product.category === 'GROWN' ? '🌱 Garden' :
                     product.category === 'DESIGNER' ? '🎨 Designer' : product.category}
                  </span>
                </div>
              )}

              {/* Stock Badge */}
              {product.stock !== undefined && product.stock !== null && (
                <div className="absolute top-4 right-20">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    product.stock === 0 ? 'bg-red-100 text-red-800' :
                    product.stock <= 5 ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {product.stock === 0 ? 'Uitverkocht' :
                     product.stock <= 5 ? 'Laag voorraad' :
                     `${product.stock} op voorraad`}
                  </span>
                </div>
              )}

              {/* Owner Action Buttons - Keep on image for owners */}
              {isOwner && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    title="Bewerken"
                  >
                    <Edit3 className="w-6 h-6 text-blue-600" />
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    title="Verwijderen"
                  >
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </button>
                </div>
              )}

              {/* Image Navigation */}
              {((product.Image && product.Image.length > 1) || (product.photos && product.photos.length > 1)) && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                    disabled={selectedImageIndex === 0}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-5 h-5 text-neutral-600" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(Math.min(((product.Image?.length || product.photos?.length) || 1) - 1, selectedImageIndex + 1))}
                    disabled={selectedImageIndex === ((product.Image?.length || product.photos?.length) || 1) - 1}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-5 h-5 text-neutral-600 rotate-180" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {((product.Image && product.Image.length > 1) || (product.photos && product.photos.length > 1)) && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(product.Image || product.photos)?.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index 
                        ? 'border-primary-500' 
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <img 
                      src={photo.fileUrl || photo.url} 
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover" 
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Action Buttons - Under the image */}
            {!isOwner && (
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100">
                <StartChatButton
                  productId={product.id}
                  sellerId={product.seller?.User.id || ''}
                  sellerName={getDisplayName(product)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                />
                <FollowButton 
                  sellerId={product.seller?.User.id || ''}
                  sellerName={getDisplayName(product)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                />
                <PropsButton 
                  productId={product.id}
                  productTitle={product.title}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors"
                  variant="thumbs"
                />
                <ShareButton
                  url={`${baseUrl}/product/${product.id}`}
                  title={product.title}
                  description={product.description || ''}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                />
                <ReportContentButton
                  entityId={product.id}
                  entityType="PRODUCT"
                  entityTitle={product.title}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Titel</label>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({...editData, title: e.target.value})}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Beschrijving</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Prijs (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={(editData.priceCents / 100).toFixed(2)}
                        onChange={(e) => setEditData({...editData, priceCents: Math.round(parseFloat(e.target.value) * 100)})}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Voorraad</label>
                      <input
                        type="number"
                        value={editData.stock}
                        onChange={(e) => setEditData({...editData, stock: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Max voorraad</label>
                      <input
                        type="number"
                        value={editData.maxStock}
                        onChange={(e) => setEditData({...editData, maxStock: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? 'Opslaan...' : 'Opslaan'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">{product.title}</h1>
                  {product.subcategory && (
                    <p className="text-lg text-primary-600 font-medium mb-4">{product.subcategory}</p>
                  )}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-warning-400 fill-current" />
                      <span className="text-lg font-semibold text-neutral-700">4.8</span>
                      <span className="text-neutral-500">(24 reviews)</span>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-500">
                      <Clock className="w-4 h-4" />
                      <span>Gepost {new Date(product.createdAt).toLocaleDateString('nl-NL')}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Price & Payment */}
            <div className="bg-primary-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl font-bold text-primary-600">
                  €{(product.priceCents / 100).toFixed(2)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Aantal:</span>
                  <select 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="border border-neutral-200 rounded-lg px-3 py-1 text-sm"
                    disabled={product.stock === 0}
                  >
                    {Array.from({ length: Math.min(5, product.stock || 5) }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock Information */}
              {product.stock !== undefined && product.stock !== null && (
                <div className="mb-4 p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Voorraad:</span>
                    <span className={`font-medium ${
                      product.stock === 0 ? 'text-red-600' : 
                      product.stock <= 5 ? 'text-orange-600' : 
                      'text-green-600'
                    }`}>
                      {product.stock === 0 ? 'Uitverkocht' :
                       product.stock <= 5 ? `Laag voorraad (${product.stock})` :
                       `${product.stock} beschikbaar`}
                      {product.maxStock && ` / ${product.maxStock}`}
                    </span>
                  </div>
                </div>
              )}
              
              {product.stock === 0 ? (
                <div className="w-full py-3 px-4 bg-gray-300 text-gray-500 rounded-xl text-center font-medium">
                  Uitverkocht
                </div>
              ) : (session?.user as any)?.id === product.seller?.User.id ? (
                <Link
                  href={`/product/${product.id}/edit`}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-xl text-center font-semibold transition-colors flex items-center justify-center gap-2"
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
                    image: product.Image?.[0]?.fileUrl || product.photos?.[0]?.url || product.image || undefined,
                    sellerName: getDisplayName(product),
                    sellerId: product.seller?.User.id || '',
                    deliveryMode: (product.delivery as 'PICKUP' | 'DELIVERY' | 'BOTH') || 'PICKUP',
                  }}
                  className="w-full"
                  size="lg"
                />
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Beschrijving</h3>
              <p className="text-neutral-600 leading-relaxed">
                {product.description || "Geen beschrijving beschikbaar."}
              </p>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Verkoper</h3>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {product.seller?.User?.avatar ? (
                    <img
                      src={product.seller.User.avatar}
                      alt={product.seller?.User?.name ?? "Verkoper"}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-100"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-xl">
                        {getDisplayName(product).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Link 
                    href={`/seller/${product.seller?.User.id || ''}`}
                    onClick={handleSellerNameClick}
                    className="text-lg font-semibold text-neutral-900 hover:text-emerald-600 transition-colors"
                  >
                    {getDisplayName(product)}
                  </Link>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning-400 fill-current" />
                      <span className="font-medium">4.8</span>
                    </div>
                    <span className="text-neutral-500">• 24 verkopen</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-neutral-600">
                    <div className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      <span>Bezorging mogelijk</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span>Afhalen mogelijk</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Veilig betalen</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Geverifieerd</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl">
                <Truck className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Snelle levering</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Beoordelingen</h2>
            {currentUser && !isOwner && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Schrijf een beoordeling
              </button>
            )}
          </div>

          {showReviewForm && (
            <div className="mb-8">
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Item verwijderen</h3>
            <p className="text-neutral-600 mb-6">
              Weet je zeker dat je dit item wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Ja, verwijderen
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Seller Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              Contact {getDisplayName(product)}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Je bericht
              </label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Stel je vraag aan de verkoper..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleContactSeller}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Verzenden
              </button>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setContactMessage('');
                }}
                className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
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