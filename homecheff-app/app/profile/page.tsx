// app/profile/page.tsx — SERVER component (fix prerender)
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import ProfileClient from "@/components/profile/ProfileClient";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Niet ingelogd</h1>
          <p className="text-gray-600 mb-6">Je moet ingelogd zijn om je profiel te bekijken.</p>
          <Link 
            href="/login" 
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Inloggen
          </Link>
        </div>
      </div>
    );
  }

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email },
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
      encryptionEnabled: true,
      messageGuidelinesAccepted: true,
      messageGuidelinesAcceptedAt: true,
      // Bank details now handled via Stripe
      createdAt: true,
      profileViews: true,
      // Seller/Business data
      SellerProfile: {
        select: {
          id: true,
          companyName: true,
          kvk: true,
          btw: true,
          subscriptionId: true,
          subscriptionValidUntil: true,
          Subscription: {
            select: {
              id: true,
              name: true,
              priceCents: true,
              isActive: true
            }
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Gebruiker niet gevonden</h1>
          <p className="text-gray-600 mb-6">Er is een probleem met je account.</p>
          <Link 
            href="/login" 
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Opnieuw inloggen
          </Link>
        </div>
      </div>
    );
  }

  const openNewProducts = (searchParams?.added ?? "") === "1";

  return <ProfileClient user={user as any} openNewProducts={openNewProducts} searchParams={searchParams} />;
}
