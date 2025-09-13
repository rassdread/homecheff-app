'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, Star, Clock, ChefHat, Sprout, Palette, Truck, Package, Euro, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";
import PaymentButton from "@/components/PaymentButton";
import { ShareButton } from "@/components/ui/ShareButton";

type Product = {
  id: string;
  title: string;
  description?: string | null;
  priceCents: number;
  image?: string | null;
  createdAt: string | Date;
  category?: string;
  subcategory?: string;
  seller?: { 
    id?: string | null; 
    name?: string | null; 
    username?: string | null; 
    avatar?: string | null;
    rating?: number;
    reviewCount?: number;
  } | null;
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [baseUrl, setBaseUrl] = useState('');

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
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, router]);

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
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden bg-white shadow-sm">
              {product.image ? (
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

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button className="p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                  <Heart className="w-6 h-6 text-neutral-600 hover:text-error-500" />
                </button>
                <ShareButton
                  url={`${baseUrl}/product/${product.id}`}
                  title={product.title}
                  description={product.description || ''}
                  type="buyer"
                  productId={product.id}
                  productTitle={product.title}
                  className="p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
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
                  >
                    {[1,2,3,4,5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <PaymentButton
                productId={product.id}
                amount={(product.priceCents / 100) * quantity}
                productTitle={product.title}
                sellerName={product.seller?.name ?? product.seller?.username ?? "Anoniem"}
              />
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
                  {product.seller?.avatar ? (
                    <img
                      src={product.seller.avatar}
                      alt={product.seller?.name ?? "Verkoper"}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-100"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-xl">
                        {(product.seller?.name ?? product.seller?.username ?? "A").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-neutral-900">
                    {product.seller?.name ?? product.seller?.username ?? "Anoniem"}
                  </h4>
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
      </div>

    </main>
  );
}