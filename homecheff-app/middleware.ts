import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Admin routes are now handled by the page component itself
  // No need to redirect here - let the page component handle authentication
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
