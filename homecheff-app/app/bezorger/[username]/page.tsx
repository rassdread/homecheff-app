import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PublicDeliveryProfileClient from "./PublicDeliveryProfileClient";

export const revalidate = 0;

export default async function PublicDeliveryProfilePage({
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
      createdAt: true,
      SellerProfile: {
        select: {
          id: true,
          displayName: true,
          companyName: true,
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
              Image: {
                select: { fileUrl: true },
                take: 1
              }
            },
            take: 6,
            orderBy: { createdAt: 'desc' }
          }
        }
      },
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
            orderBy: {
              createdAt: 'desc'
            }
          },
          vehiclePhotos: {
            orderBy: {
              sortOrder: 'asc'
            }
          }
        }
      }
    }
  });

  // Als geen user gevonden via username, probeer via id (voor bestaande accounts)
  if (!user) {
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
          createdAt: true,
          SellerProfile: {
            select: {
              id: true,
              displayName: true,
              companyName: true,
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
                  Image: {
                    select: { fileUrl: true },
                    take: 1
                  }
                },
                take: 6,
                orderBy: { createdAt: 'desc' }
              }
            }
          },
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
                orderBy: {
                  createdAt: 'desc'
                }
              },
              vehiclePhotos: {
                orderBy: {
                  sortOrder: 'asc'
                }
              }
            }
          }
        }
      });
    }
  }

  if (!user || !user.DeliveryProfile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicDeliveryProfileClient user={user as any} />
    </div>
  );
}

// Generate static params for popular delivery drivers (optional)
export async function generateStaticParams() {
  return [];
}

