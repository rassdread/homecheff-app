import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // Redirect based on user role
    const userRole = (session.user as any).role;
    
    switch (userRole) {
      case 'ADMIN':
        return NextResponse.redirect(new URL('/admin', req.url));
      case 'SELLER':
        return NextResponse.redirect(new URL('/profile', req.url));
      case 'BUYER':
        return NextResponse.redirect(new URL('/feed', req.url));
      case 'DELIVERY':
        // Check if user has delivery profile
        try {
          const profileResponse = await fetch(`${req.nextUrl.origin}/api/delivery/profile`, {
            headers: {
              'Cookie': req.headers.get('cookie') || '',
            },
          });
          
          if (profileResponse.ok) {
            return NextResponse.redirect(new URL('/delivery/dashboard', req.url));
          } else {
            return NextResponse.redirect(new URL('/delivery/signup', req.url));
          }
        } catch (error) {
          console.error('Error checking delivery profile:', error);
          return NextResponse.redirect(new URL('/delivery/signup', req.url));
        }
      default:
        return NextResponse.redirect(new URL('/feed', req.url));
    }
  } catch (error) {
    console.error('Role redirect error:', error);
    return NextResponse.redirect(new URL('/feed', req.url));
  }
}
