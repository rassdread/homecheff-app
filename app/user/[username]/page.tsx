import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PublicProfileClient from "./PublicProfileClient";

export const revalidate = 0;

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const { username } = params;

  // Probeer eerst via username, dan via id als username een UUID is
  let user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      bio: true,
      quote: true,
      place: true,
      gender: true,
      interests: true,
      profileImage: true,
      role: true,
      sellerRoles: true,
      buyerRoles: true,
      displayFullName: true,
      displayNameOption: true,
      showFansList: true,
      showProfileToEveryone: true,
      createdAt: true,
      profileViews: true,
      // Publieke producten (alleen gepubliceerde)
      Dish: {
        where: {
          status: "PUBLISHED"
        },
        select: {
          id: true,
          title: true,
          description: true,
          priceCents: true,
          status: true,
          createdAt: true,
          category: true,
          subcategory: true,
          photos: {
            select: { url: true, idx: true, isMain: true }
          },
          growthPhotos: {
            select: { id: true, url: true, phaseNumber: true },
            orderBy: { phaseNumber: 'asc' }
          },
          reviews: {
            select: {
              rating: true
            }
          },
          _count: {
            select: {
              reviews: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
              // Ook Producten ophalen via SellerProfile
              SellerProfile: {
                select: {
                  id: true,
                  kvk: true,
                  companyName: true,
                  subscriptionId: true,
                  Subscription: {
                    select: {
                      id: true,
                      name: true
                    }
                  },
                  products: {
                    where: {
                      isActive: true
                    },
                    select: {
                      id: true,
                      title: true,
                      description: true,
                      priceCents: true,
                      category: true,
                      createdAt: true,
                      Image: {
                        select: { fileUrl: true }
                      }
                    },
                    orderBy: { createdAt: 'desc' }
                  }
                }
              },
              // Bezorger data
              DeliveryProfile: {
                select: {
                  id: true,
                  age: true,
                  bio: true,
                  transportation: true,
                  maxDistance: true,
                  preferredRadius: true,
                  deliveryMode: true,
                  availableDays: true,
                  availableTimeSlots: true,
                  isActive: true,
                  isVerified: true,
                  totalDeliveries: true,
                  averageRating: true,
                  totalEarnings: true,
                  createdAt: true,
                  reviews: {
                    include: {
                      reviewer: {
                        select: {
                          id: true,
                          name: true,
                          username: true,
                          profileImage: true,
                          displayFullName: true,
                          displayNameOption: true
                        }
                      }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                  },
                  vehiclePhotos: {
                    orderBy: { sortOrder: 'asc' }
                  }
                }
              }
    }
  });

  // Als geen user gevonden via username, probeer via id (voor bestaande accounts)
  if (!user) {
    // Check if the username parameter is actually a UUID (for existing accounts)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(username);
    
    if (isUUID) {
      user = await prisma.user.findUnique({
        where: { id: username },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          bio: true,
          quote: true,
          place: true,
          gender: true,
          interests: true,
          profileImage: true,
          role: true,
          sellerRoles: true,
          buyerRoles: true,
          displayFullName: true,
          displayNameOption: true,
          showFansList: true,
          showProfileToEveryone: true,
          createdAt: true,
          profileViews: true,
          // Publieke producten (alleen gepubliceerde)
          Dish: {
            where: {
              status: "PUBLISHED"
            },
            select: {
              id: true,
              title: true,
              description: true,
              priceCents: true,
              status: true,
              createdAt: true,
              category: true,
              subcategory: true,
              photos: {
                select: { url: true, idx: true, isMain: true }
              },
              growthPhotos: {
                select: { id: true, url: true, phaseNumber: true },
                orderBy: { phaseNumber: 'asc' }
              },
              reviews: {
                select: {
                  rating: true
                }
              },
              _count: {
                select: {
                  reviews: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          // Ook Producten ophalen via SellerProfile
          SellerProfile: {
            select: {
              id: true,
              kvk: true,
              companyName: true,
              subscriptionId: true,
              Subscription: {
                select: {
                  id: true,
                  name: true
                }
              },
              products: {
                where: {
                  isActive: true
                },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  priceCents: true,
                  category: true,
                  createdAt: true,
                  Image: {
                    select: { fileUrl: true }
                  }
                },
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          // Bezorger data
          DeliveryProfile: {
            select: {
              id: true,
              age: true,
              bio: true,
              transportation: true,
              maxDistance: true,
              preferredRadius: true,
              deliveryMode: true,
              availableDays: true,
              availableTimeSlots: true,
              isActive: true,
              isVerified: true,
              totalDeliveries: true,
              averageRating: true,
              totalEarnings: true,
              createdAt: true,
              reviews: {
                include: {
                  reviewer: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                      profileImage: true,
                      displayFullName: true,
                      displayNameOption: true
                    }
                  }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
              },
              vehiclePhotos: {
                orderBy: { sortOrder: 'asc' }
              }
            }
          }
        }
      });
    }
  }

  if (!user) {
    notFound();
  }

  // 🔒 PRIVACY CHECK: Check if profile is public
  if (!user.showProfileToEveryone) {
    notFound(); // Return 404 to hide that the profile exists
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicProfileClient user={user as any} openNewProducts={false} />
    </div>
  );
}

// Generate static params for popular users (optional)
export async function generateStaticParams() {
  // Optioneel: pre-generate voor populaire gebruikers
  return [];
}
