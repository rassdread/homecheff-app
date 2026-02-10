import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, getSecurityHeaders } from '@/lib/security';

// Domain-based language routing
const DOMAIN_LANGUAGE_MAP = {
  'homecheff.nl': 'nl',
  'homecheff.eu': 'en',
  'www.homecheff.nl': 'nl',
  'www.homecheff.eu': 'en',
} as const;

// Security headers for session isolation
const SESSION_ISOLATION_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, private',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
};

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const domainLanguage = DOMAIN_LANGUAGE_MAP[hostname as keyof typeof DOMAIN_LANGUAGE_MAP];
  
  // Set language based on domain
  const response = NextResponse.next();
  
  if (domainLanguage) {
    // Set language cookie for domain-based routing
    response.cookies.set('homecheff-language', domainLanguage, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Add language header for the app to read
    response.headers.set('X-HomeCheff-Language', domainLanguage);
  }

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimit = checkRateLimit(request);
    if (!rateLimit.allowed) {
      return new NextResponse('Rate limit exceeded', { 
        status: 429,
        headers: {
          'Retry-After': '900', // 15 minutes
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        }
      });
    }
  }

  // Add security headers
  const securityHeaders = getSecurityHeaders();
  
  // Add basic security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add session isolation headers for all pages
  Object.entries(SESSION_ISOLATION_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add rate limit headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimit = checkRateLimit(request);
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(Date.now() + 15 * 60 * 1000).toISOString());
  }

  // Prevent caching of sensitive pages
  if (request.nextUrl.pathname.startsWith('/admin') || 
      request.nextUrl.pathname.startsWith('/delivery/dashboard') ||
      request.nextUrl.pathname.startsWith('/verkoper/dashboard') ||
      request.nextUrl.pathname.startsWith('/profile') ||
      request.nextUrl.pathname.startsWith('/messages') ||
      request.nextUrl.pathname.startsWith('/orders')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
  }
  
  // Redirect homepage (/) to inspiratie - nieuwe hoofdpagina
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/inspiratie';
    return NextResponse.redirect(url);
  }

  // Force no-cache for homepage to prevent routing issues
  if (request.nextUrl.pathname === '/inspiratie') {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};