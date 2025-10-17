import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import AdminProfileClient from "@/components/admin/AdminProfileClient";

export const revalidate = 0;

export default async function AdminProfilePage({
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

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  });

  if (user?.role !== 'ADMIN') {
    redirect('/');
  }

  const adminUser = await prisma.user.findUnique({ 
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
      createdAt: true,
      profileViews: true,
      // Admin-specific data
      updatedAt: true,
      emailVerified: true,
      // Seller/Business data (if admin has seller roles)
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
      // Delivery data (if admin has delivery roles)
      DeliveryProfile: {
        select: {
          id: true,
          isActive: true,
          transportation: true,
          maxDistance: true,
          bio: true,
          homeAddress: true,
          currentAddress: true,
          currentLat: true,
          currentLng: true,
          isVerified: true,
          totalDeliveries: true,
          averageRating: true,
          totalEarnings: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Gebruiker niet gevonden</h1>
          <p className="text-gray-600 mb-6">Er is een fout opgetreden bij het laden van je profiel.</p>
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Terug naar Home
          </Link>
        </div>
      </div>
    );
  }

  // Get admin statistics for the admin info block
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    activeUsers
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.transaction.count(),
    prisma.transaction.aggregate({
      _sum: { amountCents: true },
      where: { status: 'CAPTURED' as any }
    }).then(result => (result._sum?.amountCents || 0) / 100),
    prisma.user.count({
      where: {
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    })
  ]);

  const adminStats = {
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    activeUsers
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      }>
        <AdminProfileClient 
          user={adminUser} 
          adminStats={adminStats}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}
