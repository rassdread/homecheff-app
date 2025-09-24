import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { User, MapPin, Calendar, Mail, Phone, Star, Package, Heart, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PublicProfilePageProps {
  params: Promise<{ userId: string }>;
}

async function getPublicProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      place: true,
      profileImage: true,
      image: true,
      interests: true,
      role: true,
      sellerRoles: true,
      buyerRoles: true,
      displayFullName: true,
      createdAt: true,
      // Include seller profile if exists
      SellerProfile: {
        select: {
          id: true,
          displayName: true,
          bio: true,
          companyName: true
        }
      },
      // Include delivery profile if exists
      DeliveryProfile: {
        select: {
          id: true,
          age: true,
          transportation: true,
          maxDistance: true,
          totalDeliveries: true,
          averageRating: true,
          isActive: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  // Get user's products if they're a seller
  let products: any[] = [];
  if (user.SellerProfile) {
    products = await prisma.product.findMany({
      where: {
        sellerId: user.SellerProfile.id,
        isActive: true
      },
      include: {
        Image: {
          where: { sortOrder: 0 },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    });
  }

  // Get follower count
  const followerCount = await prisma.follow.count({
    where: { sellerId: user.SellerProfile?.id }
  });

  return {
    user,
    products,
    followerCount
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { userId } = await params;
  const profileData = await getPublicProfile(userId);

  if (!profileData) {
    notFound();
  }

  const { user, products, followerCount } = profileData;
  const session = await auth();
  const isOwnProfile = session?.user && (session.user as any).id === user.id;

  const displayName = user.displayFullName ? user.name : user.username;
  const profileImage = user.profileImage || user.image;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt={displayName || 'Gebruiker'}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-brand text-white text-2xl font-bold">
                    {(displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {displayName || 'Gebruiker'}
                  </h1>
                  {user.username && (
                    <p className="text-gray-600">@{user.username}</p>
                  )}
                  
                  {/* Role Badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {user.sellerRoles && user.sellerRoles.length > 0 && (
                      <span className="px-3 py-1 bg-primary-brand text-white text-sm rounded-full">
                        Verkoper
                      </span>
                    )}
                    {user.DeliveryProfile && (
                      <span className="px-3 py-1 bg-secondary-brand text-white text-sm rounded-full">
                        Bezorger
                      </span>
                    )}
                    {user.role === 'ADMIN' && (
                      <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {isOwnProfile ? (
                    <Link 
                      href="/profile"
                      className="px-4 py-2 bg-primary-brand text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Mijn Profiel Bewerken
                    </Link>
                  ) : (
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-primary-brand text-white rounded-lg hover:bg-primary-700 transition-colors">
                        <Heart className="w-4 h-4 mr-2 inline" />
                        Fan Worden
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        <Mail className="w-4 h-4 mr-2 inline" />
                        Bericht
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="mt-4">
                  <p className="text-gray-700">{user.bio}</p>
                </div>
              )}

              {/* Location and Join Date */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                {user.place && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{user.place}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Lid sinds {new Date(user.createdAt).toLocaleDateString('nl-NL')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-brand">{followerCount}</div>
            <div className="text-sm text-gray-600">Fans</div>
          </div>
          
          {user.DeliveryProfile && (
            <>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-secondary-brand">
                  {user.DeliveryProfile.totalDeliveries}
                </div>
                <div className="text-sm text-gray-600">Bezorgingen</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {user.DeliveryProfile.averageRating?.toFixed(1) || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Beoordeling</div>
              </div>
            </>
          )}
          
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{products.length}</div>
            <div className="text-sm text-gray-600">Producten</div>
          </div>
        </div>

        {/* Products Section */}
        {products.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Producten
              </h2>
              {products.length > 6 && (
                <Link 
                  href={`/seller/${user.SellerProfile?.id}`}
                  className="text-primary-brand hover:text-primary-700 font-medium"
                >
                  Alle producten bekijken
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Link 
                  key={product.id} 
                  href={`/product/${product.id}`}
                  className="group block"
                >
                  <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                    {product.Image[0] && (
                      <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-200">
                        <Image
                          src={product.Image[0].fileUrl}
                          alt={product.title}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-primary-brand font-bold">
                      €{(product.priceCents / 100).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Delivery Profile Info */}
        {user.DeliveryProfile && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Bezorger Informatie
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Beschikbaarheid</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {user.DeliveryProfile.isActive ? (
                    <span className="text-green-600 font-medium">Actief</span>
                  ) : (
                    <span className="text-gray-500">Niet actief</span>
                  )}
                </p>
                
                <h3 className="font-semibold text-gray-900 mb-2">Vervoer</h3>
                <div className="flex flex-wrap gap-2">
                  {user.DeliveryProfile.transportation.map((transport) => (
                    <span 
                      key={transport}
                      className="px-2 py-1 bg-secondary-brand/10 text-secondary-brand text-xs rounded-full"
                    >
                      {transport === 'BIKE' ? 'Fiets' :
                        transport === 'SCOOTER' ? 'Scooter' :      
                        transport === 'EBIKE' ? 'Elektrische fiets' : 
                        transport === 'CAR' ? 'Auto' : transport}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Maximale Afstand</h3>
                <p className="text-gray-600">{user.DeliveryProfile.maxDistance}km</p>
                
                <h3 className="font-semibold text-gray-900 mb-2">Leeftijd</h3>
                <p className="text-gray-600">{user.DeliveryProfile.age} jaar</p>
              </div>
            </div>
          </div>
        )}

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Interesses</h2>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <span 
                  key={interest}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


