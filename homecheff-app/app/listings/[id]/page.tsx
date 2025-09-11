
'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, Star, Clock, ChefHat, Sprout, Palette, Truck, Package, Euro, Shield, CheckCircle, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Listing = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  place: string | null;
  lat: number | null;
  lng: number | null;
  category: string;
  status: string;
  createdAt: string;
  User: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    profileImage: string | null;
  };
  ListingMedia: {
    url: string;
    order: number;
    alt: string | null;
  }[];
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/listings/${params.id}`);
        if (!response.ok) {
          router.push('/');
          return;
        }
        const data = await response.json();
        setListing(data);
      } catch (error) {
        console.error('Error fetching listing:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchListing();
    }
  }, [params.id, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Listing niet gevonden</h1>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const mainImage = listing.ListingMedia?.[0]?.url || "/placeholder.webp";

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar home
          </Link>
        </div>
      </div>

      {/* Listing Details */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Listing Image */}
          <div className="space-y-4">
            <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden bg-white shadow-sm">
              <Image 
                src={mainImage} 
                alt={listing.title} 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              
              {/* Category Badge */}
              <div className="absolute top-4 left-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                  listing.category === 'HOMECHEFF' ? 'bg-orange-100 text-orange-800' :
                  listing.category === 'HOMEGROWN' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {listing.category === 'HOMECHEFF' ? '🍳 HomeCheff' :
                   listing.category === 'HOMEGROWN' ? '🌱 HomeGrown' : listing.category}
                </span>
              </div>

              {/* Heart Button */}
              <button className="absolute top-4 right-4 p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                <Heart className="w-6 h-6 text-gray-600 hover:text-red-500" />
              </button>
            </div>

            {/* Additional Images */}
            {listing.ListingMedia.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {listing.ListingMedia.slice(1, 5).map((media, index) => (
                  <div key={index} className="relative h-20 rounded-lg overflow-hidden">
                    <Image 
                      src={media.url} 
                      alt={media.alt || `Image ${index + 2}`} 
                      fill
                      className="object-cover"
                      sizes="25vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Listing Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-semibold text-gray-700">4.8</span>
                  <span className="text-gray-500">(24 reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Gepost {new Date(listing.createdAt).toLocaleDateString('nl-NL')}</span>
                </div>
              </div>
            </div>

            {/* Price & Purchase */}
            <div className="bg-emerald-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl font-bold text-emerald-600">
                  €{(listing.priceCents / 100).toFixed(2)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Aantal:</span>
                  <select 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="border border-gray-200 rounded-lg px-3 py-1 text-sm"
                  >
                    {[1,2,3,4,5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button className="w-full bg-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
                Contact opnemen
              </button>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Beschrijving</h3>
              <p className="text-gray-600 leading-relaxed">
                {listing.description || "Geen beschrijving beschikbaar."}
              </p>
            </div>

            {/* Location */}
            {listing.place && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Locatie</h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span>{listing.place}</span>
                </div>
              </div>
            )}

            {/* Seller Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verkoper</h3>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {listing.User.profileImage || listing.User.image ? (
                    <Image
                      src={listing.User.profileImage || listing.User.image!}
                      alt={listing.User.name || "Verkoper"}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover border-2 border-emerald-100"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-semibold text-xl">
                        {(listing.User.name || listing.User.username || "A").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {listing.User.name || listing.User.username || "Anoniem"}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium">4.8</span>
                    </div>
                    <span className="text-gray-500">• 24 verkopen</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
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
