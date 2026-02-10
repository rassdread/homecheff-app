import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";

export async function GET() {
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
            termsAccepted: true
          },
        });
        
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        // Fix for social login accounts: prioritize profileImage over image, but handle base64
        const { Business, SellerProfile, DeliveryProfile, affiliate, ...rest } = user;
        const kvkNumber = Business?.kvkNumber ?? SellerProfile?.kvk ?? null;

        const processedUser = {
          ...rest,
          kvkNumber,
          address: rest.address,
          city: rest.city,
          postalCode: rest.postalCode,
          country: rest.country,
          lat: rest.lat,
          lng: rest.lng,
          businessKvkNumber: Business?.kvkNumber ?? null,
          sellerKvk: SellerProfile?.kvk ?? null,
          DeliveryProfile: DeliveryProfile || null,
          affiliate: affiliate || null,
          profileImage: rest.profileImage?.startsWith('data:') ? rest.profileImage : (rest.profileImage || rest.image),
          image: rest.profileImage?.startsWith('data:') ? rest.profileImage : (rest.image || rest.profileImage)
        };
        
        return NextResponse.json({ user: processedUser });
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
            termsAccepted: true
          },
        });
        
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        // Fix for social login accounts: prioritize profileImage over image, but handle base64
        const { Business, SellerProfile, DeliveryProfile, affiliate, ...rest } = user;
        const kvkNumber = Business?.kvkNumber ?? SellerProfile?.kvk ?? null;

        const processedUser = {
          ...rest,
          kvkNumber,
          address: rest.address,
          city: rest.city,
          postalCode: rest.postalCode,
          country: rest.country,
          lat: rest.lat,
          lng: rest.lng,
          businessKvkNumber: Business?.kvkNumber ?? null,
          sellerKvk: SellerProfile?.kvk ?? null,
          DeliveryProfile: DeliveryProfile || null,
          affiliate: affiliate || null,
          profileImage: rest.profileImage?.startsWith('data:') ? rest.profileImage : (rest.profileImage || rest.image),
          image: rest.profileImage?.startsWith('data:') ? rest.profileImage : (rest.image || rest.profileImage)
        };
        
        return NextResponse.json({ user: processedUser });
      }
    } catch {}

    // Dev fallback
    return NextResponse.json({ user: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
