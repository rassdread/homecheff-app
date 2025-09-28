import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { User, MapPin, Calendar, Mail, Phone, Star, Package, Heart, Users, ChefHat, Sprout, Palette, Clock, Camera, Eye } from 'lucide-react';
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
      quote: true,
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

  // Get user's products if they're a seller, filtered by roles
  let chefProducts: any[] = [];
  let gardenProducts: any[] = [];
  let designerProducts: any[] = [];
  
  if (user.SellerProfile) {
    // Chef products (if user has chef role)
    if (user.sellerRoles?.includes('chef')) {
      chefProducts = await prisma.product.findMany({
        where: {
          sellerId: user.SellerProfile.id,
          isActive: true,
          // Add category filter for chef products if needed
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
    
    // Garden products (if user has garden role)
    if (user.sellerRoles?.includes('garden')) {
      gardenProducts = await prisma.product.findMany({
        where: {
          sellerId: user.SellerProfile.id,
          isActive: true,
          // Add category filter for garden products if needed
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
    
    // Designer products (if user has designer role)
    if (user.sellerRoles?.includes('designer')) {
      designerProducts = await prisma.product.findMany({
        where: {
          sellerId: user.SellerProfile.id,
          isActive: true,
          // Add category filter for designer products if needed
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
  }

  // Get follower count
  const followerCount = await prisma.follow.count({
    where: { sellerId: user.SellerProfile?.id }
  });

  // Get workspace content only if user has chef role
  let workspaceContent: any[] = [];
  if (user.SellerProfile && user.sellerRoles?.includes('chef')) {
    workspaceContent = await prisma.workspaceContent.findMany({
      where: {
        sellerProfileId: user.SellerProfile.id,
        isPublic: true
      },
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' }
        },
        recipe: true,
        growingProcess: true,
        designItem: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get workspace photos for each category based on user roles
  let kitchenPhotos: any[] = [];
  let gardenPhotos: any[] = [];
  let atelierPhotos: any[] = [];
  
  if (user.SellerProfile) {
    // Kitchen photos - only if user has chef role
    if (user.sellerRoles?.includes('chef')) {
      kitchenPhotos = await prisma.workplacePhoto.findMany({
        where: {
          sellerProfileId: user.SellerProfile.id,
          role: 'KITCHEN'
        },
        orderBy: { sortOrder: 'asc' },
        take: 6
      });
    }
    
    // Garden photos - only if user has garden role
    if (user.sellerRoles?.includes('garden')) {
      gardenPhotos = await prisma.workplacePhoto.findMany({
        where: {
          sellerProfileId: user.SellerProfile.id,
          role: 'GARDEN'
        },
        orderBy: { sortOrder: 'asc' },
        take: 6
      });
    }
    
    // Atelier photos - only if user has designer role
    if (user.sellerRoles?.includes('designer')) {
      atelierPhotos = await prisma.workplacePhoto.findMany({
        where: {
          sellerProfileId: user.SellerProfile.id,
          role: 'ATELIER'
        },
        orderBy: { sortOrder: 'asc' },
        take: 6
      });
    }
  }

  // Get reviews for seller's products
  let reviews: any[] = [];
  if (user.SellerProfile) {
    reviews = await prisma.productReview.findMany({
      where: {
        product: {
          sellerId: user.SellerProfile.id
        }
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true
          }
        },
        product: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }

  // Get user's dishes (creations and ideas)
  let dishes: any[] = [];
  if (user.id) {
    dishes = await prisma.dish.findMany({
      where: {
        userId: user.id,
        status: 'PUBLISHED'
      },
      include: {
        photos: {
          orderBy: { idx: 'asc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 12
    });
  }

  return {
    user,
    chefProducts,
    gardenProducts,
    designerProducts,
    followerCount,
    workspaceContent,
    kitchenPhotos,
    gardenPhotos,
    atelierPhotos,
    reviews,
    dishes
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { userId } = await params;
  const profileData = await getPublicProfile(userId);

  if (!profileData) {
    notFound();
  }

  const { 
    user, 
    chefProducts, 
    gardenProducts, 
    designerProducts, 
    followerCount, 
    workspaceContent, 
    kitchenPhotos, 
    gardenPhotos, 
    atelierPhotos,
    reviews,
    dishes
  } = profileData;
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

              {/* Quote */}
              {user.quote && (
                <div className="mt-4">
                  <div className="bg-gradient-to-r from-primary-brand/10 to-secondary-brand/10 rounded-xl p-4 border-l-4 border-primary-brand">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-primary-brand" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <blockquote className="text-gray-800 italic text-lg leading-relaxed">
                          "{user.quote}"
                        </blockquote>
                      </div>
                    </div>
                  </div>
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
            <div className="text-2xl font-bold text-gray-600">
              {chefProducts.length + gardenProducts.length + designerProducts.length}
            </div>
            <div className="text-sm text-gray-600">Producten</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{dishes.length}</div>
            <div className="text-sm text-gray-600">Creaties</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{reviews.length}</div>
            <div className="text-sm text-gray-600">Reviews</div>
          </div>
        </div>

        {/* Dynamic Workspace Section */}
        {user.sellerRoles && user.sellerRoles.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Werkruimte</h2>
            
            {/* Dynamic Tabs based on seller roles */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
              {user.sellerRoles.includes('chef') && (
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm">
                  <ChefHat className="w-4 h-4" />
                  Mijn Keuken
                </button>
              )}
              {user.sellerRoles.includes('garden') && (
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700">
                  <Sprout className="w-4 h-4" />
                  Mijn Tuin
                </button>
              )}
              {user.sellerRoles.includes('designer') && (
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700">
                  <Palette className="w-4 h-4" />
                  Mijn Atelier
                </button>
              )}
            </div>

            {/* Kitchen Content - Recipes */}
            {user.sellerRoles.includes('chef') && (
              <div className="space-y-6">
                {/* Kitchen Photos */}
                {kitchenPhotos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      De Keuken
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {kitchenPhotos.map((photo) => (
                        <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                          <Image
                            src={photo.fileUrl}
                            alt="Keuken foto"
                            width={200}
                            height={200}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kitchen Recipes */}
                {workspaceContent.filter(content => content.type === 'RECIPE').length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <ChefHat className="w-5 h-5" />
                      Recepten
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {workspaceContent
                        .filter(content => content.type === 'RECIPE')
                        .map((content) => (
                          <div key={content.id} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                            {content.photos && content.photos.length > 0 && (
                              <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-200">
                                <Image
                                  src={content.photos[0].fileUrl}
                                  alt={content.title}
                                  width={200}
                                  height={200}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                              {content.title}
                            </h4>
                            {content.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                                {content.description}
                              </p>
                            )}
                            {content.recipe && (
                              <div className="space-y-1">
                                {content.recipe.servings && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Users className="w-4 h-4" />
                                    <span>{content.recipe.servings} personen</span>
                                  </div>
                                )}
                                {content.recipe.prepTime && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>{content.recipe.prepTime} min</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen recepten</h3>
                    <p className="text-gray-600">Deze chef heeft nog geen recepten gedeeld.</p>
                  </div>
                )}
              </div>
            )}

            {/* Garden Content - Template for products */}
            {user.sellerRoles.includes('garden') && (
              <div className="space-y-6">
                {/* Garden Photos */}
                {gardenPhotos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      De Tuin
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {gardenPhotos.map((photo) => (
                        <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                          <Image
                            src={photo.fileUrl}
                            alt="Tuin foto"
                            width={200}
                            height={200}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Garden Products Template */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Sprout className="w-5 h-5" />
                    Tuin Producten
                  </h3>
                  <div className="text-center py-8">
                    <Sprout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Nog geen tuin producten</h4>
                    <p className="text-gray-600">Deze tuinier heeft nog geen producten gedeeld.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Designer Content - Template for products */}
            {user.sellerRoles.includes('designer') && (
              <div className="space-y-6">
                {/* Atelier Photos */}
                {atelierPhotos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Het Atelier
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {atelierPhotos.map((photo) => (
                        <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                          <Image
                            src={photo.fileUrl}
                            alt="Atelier foto"
                            width={200}
                            height={200}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Designer Products Template */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Design Producten
                  </h3>
                  <div className="text-center py-8">
                    <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Nog geen design producten</h4>
                    <p className="text-gray-600">Deze designer heeft nog geen producten gedeeld.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reviews Section */}
        {user.SellerProfile && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Reviews
            </h2>
            
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                    <div className="flex items-start gap-4">
                      {/* Reviewer Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                          {review.buyer.profileImage ? (
                            <Image
                              src={review.buyer.profileImage}
                              alt={review.buyer.name || 'Reviewer'}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary-brand text-white text-sm font-bold">
                              {(review.buyer.name || 'R').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Review Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {review.buyer.name || review.buyer.username || 'Anoniem'}
                          </h4>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('nl-NL')}
                          </span>
                        </div>

                        {review.title && (
                          <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                        )}

                        {review.comment && (
                          <p className="text-gray-700 mb-3">{review.comment}</p>
                        )}

                        {/* Product Info */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Package className="w-4 h-4" />
                          <span>Over: {review.product.title}</span>
                        </div>

                        {/* Verified Badge */}
                        {review.isVerified && (
                          <div className="mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              <Star className="w-3 h-3" />
                              Geverifieerde aankoop
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen reviews</h3>
                <p className="text-gray-600">Deze verkoper heeft nog geen reviews ontvangen.</p>
              </div>
            )}
          </div>
        )}

        {/* Creations & Ideas Section */}
        {dishes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              Creaties & Ideeën
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {dishes.map((dish) => (
                <div key={dish.id} className="group cursor-pointer">
                  <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    {/* Dish Photo */}
                    <div className="aspect-square bg-gray-200 relative overflow-hidden">
                      {dish.photos && dish.photos.length > 0 ? (
                        <Image
                          src={dish.photos[0].url}
                          alt={dish.title}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Dish Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {dish.title}
                      </h3>
                      
                      {dish.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {dish.description}
                        </p>
                      )}
                      
                      {/* Dish Details */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          {dish.servings && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{dish.servings}</span>
                            </div>
                          )}
                          {dish.prepTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{dish.prepTime}min</span>
                            </div>
                          )}
                        </div>
                        
                        {dish.difficulty && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            <span className="capitalize">{dish.difficulty.toLowerCase()}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Tags */}
                      {dish.tags && dish.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {dish.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-primary-brand/10 text-primary-brand text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {dish.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{dish.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Show more link if there are many dishes */}
            {dishes.length >= 12 && (
              <div className="text-center mt-6">
                <button className="text-primary-brand hover:text-primary-700 font-medium text-sm">
                  Alle creaties bekijken ({dishes.length}+)
                </button>
              </div>
            )}
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


