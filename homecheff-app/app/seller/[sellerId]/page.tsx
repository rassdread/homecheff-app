'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  Star, 
  Package, 
  TrendingUp, 
  MessageCircle, 
  MapPin, 
  Calendar,
  Heart,
  Share2,
  ChefHat,
  Sprout,
  Palette
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import StartChatButton from '@/components/chat/StartChatButton';

interface SellerData {
  id: string;
  displayName: string | null;
  bio: string | null;
  lat: number | null;
  lng: number | null;
  User: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
    createdAt: string;
    bio: string | null;
  };
  products: Array<{
    id: string;
    title: string;
    priceCents: number;
    category: string;
    createdAt: string;
    Image: Array<{
      fileUrl: string;
      sortOrder: number;
    }>;
    reviews: Array<{
      rating: number;
    }>;
  }>;
  statistics: {
    totalProducts: number;
    activeProducts: number;
    averageRating: number;
    totalReviews: number;
    recentOrders: number;
  };
}

export default function SellerProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const [sellerData, setSellerData] = useState<SellerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'about'>('products');

  const sellerId = params.sellerId as string;

  useEffect(() => {
    loadSellerData();
  }, [sellerId]);

  const loadSellerData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/seller/${sellerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load seller data');
      }

      const { seller } = await response.json();
      setSellerData(seller);
    } catch (error) {
      console.error('Error loading seller data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (priceCents: number) => {
    return `€${(priceCents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CHEFF':
        return <ChefHat className="w-4 h-4" />;
      case 'GROWN':
        return <Sprout className="w-4 h-4" />;
      case 'DESIGNER':
        return <Palette className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'CHEFF':
        return 'Chef';
      case 'GROWN':
        return 'Garden';
      case 'DESIGNER':
        return 'Designer';
      default:
        return category;
    }
  };

  const getDisplayName = () => {
    if (!sellerData) return 'Onbekend';
    return sellerData.User.name || sellerData.User.username || 'Onbekend';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Verkoper profiel laden...</div>
      </div>
    );
  }

  if (!sellerData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verkoper niet gevonden</h1>
          <p className="text-gray-600 mb-4">Deze verkoper bestaat niet of is niet meer actief.</p>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar homepage
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === sellerId;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Terug
            </Link>
            
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Header */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {sellerData.User.profileImage ? (
                <Image
                  src={sellerData.User.profileImage}
                  alt={getDisplayName()}
                  width={120}
                  height={120}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-30 h-30 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 font-bold text-4xl">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {getDisplayName()}
                  </h1>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-semibold">{sellerData.statistics.averageRating}</span>
                      <span className="text-gray-500">({sellerData.statistics.totalReviews} reviews)</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Package className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{sellerData.statistics.activeProducts} actieve producten</span>
                    </div>
                  </div>

                  {sellerData.User.bio && (
                    <p className="text-gray-600 mb-4 max-w-2xl">
                      {sellerData.User.bio}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Lid sinds {formatDate(sellerData.User.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {!isOwnProfile && (
                  <div className="flex flex-col space-y-3">
                    <StartChatButton
                      productId="" // We'll handle this differently for general seller contact
                      sellerId={sellerData.User.id}
                      sellerName={getDisplayName()}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{sellerData.statistics.totalProducts}</div>
              <div className="text-sm text-gray-500">Totaal producten</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{sellerData.statistics.activeProducts}</div>
              <div className="text-sm text-gray-500">Actieve producten</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{sellerData.statistics.averageRating}</div>
              <div className="text-sm text-gray-500">Gemiddelde rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{sellerData.statistics.recentOrders}</div>
              <div className="text-sm text-gray-500">Bestellingen (30d)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'products', label: 'Producten', count: sellerData.products.length },
              { id: 'reviews', label: 'Reviews', count: sellerData.statistics.totalReviews },
              { id: 'about', label: 'Over' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'products' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Producten van {getDisplayName()}
            </h2>
            
            {sellerData.products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen producten</h3>
                <p className="text-gray-500">Deze verkoper heeft nog geen producten geplaatst.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sellerData.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {product.Image[0] && (
                      <div className="aspect-square relative">
                        <Image
                          src={product.Image[0].fileUrl}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        {getCategoryIcon(product.category)}
                        <span className="text-xs text-gray-500 uppercase">
                          {getCategoryName(product.category)}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-600">
                          {formatPrice(product.priceCents)}
                        </span>
                        {product.reviews.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-500">
                              {(product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Reviews over {getDisplayName()}
            </h2>
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Reviews worden geladen...</h3>
              <p className="text-gray-500">Deze functionaliteit wordt binnenkort toegevoegd.</p>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Over {getDisplayName()}
            </h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {sellerData.User.bio ? (
                <p className="text-gray-600 leading-relaxed">
                  {sellerData.User.bio}
                </p>
              ) : (
                <p className="text-gray-500 italic">
                  Deze verkoper heeft nog geen informatie over zichzelf gedeeld.
                </p>
              )}
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-4">Statistieken</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Lid sinds</div>
                    <div className="font-medium">{formatDate(sellerData.User.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Totaal producten</div>
                    <div className="font-medium">{sellerData.statistics.totalProducts}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
