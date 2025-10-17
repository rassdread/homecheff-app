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
            stripeConnectAccountId: true,
            stripeConnectOnboardingCompleted: true,
            role: true,
            sellerRoles: true,
            buyerRoles: true
          },
        });
        
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        // Fix for social login accounts: prioritize profileImage over image, but handle base64
        const processedUser = {
          ...user,
          profileImage: user.profileImage?.startsWith('data:') ? user.profileImage : (user.profileImage || user.image),
          image: user.profileImage?.startsWith('data:') ? user.profileImage : (user.image || user.profileImage)
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
            stripeConnectAccountId: true,
            stripeConnectOnboardingCompleted: true,
            role: true,
            sellerRoles: true,
            buyerRoles: true
          },
        });
        
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        // Fix for social login accounts: prioritize profileImage over image, but handle base64
        const processedUser = {
          ...user,
          profileImage: user.profileImage?.startsWith('data:') ? user.profileImage : (user.profileImage || user.image),
          image: user.profileImage?.startsWith('data:') ? user.profileImage : (user.image || user.profileImage)
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
