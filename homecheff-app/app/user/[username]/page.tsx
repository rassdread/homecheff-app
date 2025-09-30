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
      createdAt: true,
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
            select: { url: true, idx: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
              // Ook Producten ophalen via SellerProfile
              SellerProfile: {
                select: {
                  id: true,
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
          createdAt: true,
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
                select: { url: true, idx: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          // Ook Producten ophalen via SellerProfile
          SellerProfile: {
            select: {
              id: true,
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
          }
        }
      });
    }
  }

  if (!user) {
    notFound();
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
