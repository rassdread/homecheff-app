import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { User, Package, Star, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import StartChatButton from '@/components/chat/StartChatButton';
import FollowButton from '@/components/follow/FollowButton';

interface SellerProfilePageProps {
  params: Promise<{ sellerId: string }>;
}

async function getSellerProfile(sellerId: string) {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { id: sellerId },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          profileImage: true,
          bio: true,
          place: true,
          createdAt: true,
        }
      },
      products: {
        where: { isActive: true },
        include: {
          Image: {
            where: { sortOrder: 0 },
            take: 1,
          },
          reviews: {
            select: {
              rating: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!sellerProfile) {
    return null;
  }

  // Calculate average rating
  const allReviews = sellerProfile.products.flatMap(product => product.reviews);
  const averageRating = allReviews.length > 0 
    ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
    : 0;

  return {
    ...sellerProfile,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: allReviews.length,
  };
}

export default async function SellerProfilePage({ params }: SellerProfilePageProps) {
  const { sellerId } = await params;
  const seller = await getSellerProfile(sellerId);

  if (!seller) {
    notFound();
  }

  const user = seller.User;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {user.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt={user.name || 'Verkoper'}
                  width={120}
                  height={120}
                  className="w-30 h-30 rounded-full object-cover border-4 border-primary-100"
                />
              ) : (
                <div className="w-30 h-30 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-2xl">
                    {(user.name || user.username || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {user.name || user.username || 'Anonieme Verkoper'}
                  </h1>
                  
                  {user.bio && (
                    <p className="text-gray-600 mb-4 max-w-2xl">
                      {user.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    {user.place && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{user.place}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Lid sinds {new Date(user.createdAt).toLocaleDateString('nl-NL')}</span>
                    </div>

                    {seller.averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>{seller.averageRating} ({seller.totalReviews} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <StartChatButton
                      sellerId={user.id}
                      sellerName={user.name || user.username || 'Verkoper'}
                      className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    />
                    <FollowButton 
                      sellerId={user.id}
                      sellerName={user.name || user.username || 'deze verkoper'}
                      className="flex-shrink-0"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="w-4 h-4" />
                    <span>{seller.products.length} actieve producten</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Producten van {user.name || user.username || 'deze verkoper'}
          </h2>

          {seller.products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Deze verkoper heeft nog geen actieve producten.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seller.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group block bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {product.Image[0] ? (
                    <Image
                      src={product.Image[0].fileUrl}
                      alt={product.title}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {product.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-600">
                        €{(product.priceCents / 100).toFixed(2)}
                      </span>
                      
                      {product.reviews.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>
                            {(product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length).toFixed(1)}
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
      </div>
    </div>
  );
}