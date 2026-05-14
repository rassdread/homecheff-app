import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { getCorsHeaders } from '@/lib/apiCors';
import { buildProfileMePayload } from '@/lib/profile/build-profile-me-payload';

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    // NextAuth v5
    try {
      const mod: any = await import("@/lib/auth");
      const session = await mod.auth?.();
      const email: string | undefined = session?.user?.email || undefined;
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { 
            id: true, 
            name: true, 
            username: true, 
            email: true, 
            image: true, 
            profileImage: true,
            address: true,
            city: true,
            postalCode: true,
            country: true,
            lat: true,
            lng: true,
            stripeConnectAccountId: true,
            stripeConnectOnboardingCompleted: true,
            role: true,
            sellerRoles: true,
            buyerRoles: true,
            Business: {
              select: {
                kvkNumber: true,
              }
            },
            SellerProfile: {
              select: {
                kvk: true,
              }
            },
            DeliveryProfile: {
              select: {
                id: true,
              }
            },
            affiliate: {
              select: {
                id: true,
                status: true,
                parentAffiliateId: true,
              }
            },
            privacyPolicyAccepted: true,
            termsAccepted: true,
            hideHomeHero: true,
            hideHowItWorks: true,
            emailVerified: true,
            passwordHash: true,
            Account: { select: { provider: true } },
          },
        });
        
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
        }
        
        return NextResponse.json(buildProfileMePayload(user as any), { headers: cors });
      }
    } catch {}

    // NextAuth v4
    try {
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/lib/auth");
      const session = await getServerSession(authOptions as any);
      const email: string | undefined = (session as any)?.user?.email;
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { 
            id: true, 
            name: true, 
            username: true, 
            email: true, 
            image: true, 
            profileImage: true,
            address: true,
            city: true,
            postalCode: true,
            country: true,
            lat: true,
            lng: true,
            stripeConnectAccountId: true,
            stripeConnectOnboardingCompleted: true,
            role: true,
            sellerRoles: true,
            buyerRoles: true,
            Business: {
              select: {
                kvkNumber: true,
              }
            },
            SellerProfile: {
              select: {
                kvk: true,
              }
            },
            DeliveryProfile: {
              select: {
                id: true,
              }
            },
            affiliate: {
              select: {
                id: true,
                status: true,
                parentAffiliateId: true,
              }
            },
            privacyPolicyAccepted: true,
            termsAccepted: true,
            hideHomeHero: true,
            hideHowItWorks: true,
            emailVerified: true,
            passwordHash: true,
            Account: { select: { provider: true } },
          },
        });
        
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
        }
        
        return NextResponse.json(buildProfileMePayload(user as any), { headers: cors });
      }
    } catch {}

    // Dev fallback
    return NextResponse.json({ user: null }, { headers: cors });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: cors });
  }
}
