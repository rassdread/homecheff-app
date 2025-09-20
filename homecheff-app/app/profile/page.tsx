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
      place: true,
      gender: true,
      interests: true,
      profileImage: true,
      role: true,
      sellerRoles: true,
      buyerRoles: true,
      displayFullName: true,
      bankName: true,
      iban: true,
      accountHolderName: true,
      createdAt: true
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

  return <ProfileClient user={user as any} openNewProducts={openNewProducts} />;
}
