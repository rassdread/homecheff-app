import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Check for referral parameter on any page
  const refCode = searchParams.get('ref');
  
  if (refCode) {
    // Exclude API routes and special paths
    const isExcludedPath = pathname.startsWith('/api/') || 
                          pathname.startsWith('/_next/') || 
                          pathname.startsWith('/welkom/') ||
                          pathname.startsWith('/uitnodiging/');
    
    if (!isExcludedPath) {
      // Create URL without ref parameter for redirect
      const cleanUrl = new URL(request.url);
      cleanUrl.searchParams.delete('ref');
      const redirectUrl = cleanUrl.pathname + cleanUrl.search;
      
      // Redirect to referral API endpoint which will set cookie and redirect back
      const url = new URL(`/api/affiliate/referral?code=${refCode}&redirect=${encodeURIComponent(redirectUrl)}`, request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
