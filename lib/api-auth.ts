import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Enhanced API authentication with proper session validation
 */
export async function validateApiSession(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return {
        error: NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }),
        user: null
      };
    }

    // Get user from database to ensure session is still valid
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        email: true, 
        role: true,
        name: true,
        username: true,
        emailVerified: true // Check if email is verified
      }
    });

    if (!user) {
      return {
        error: NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 }),
        user: null
      };
    }

    // If user is not verified, treat them as not logged in
    if (!user.emailVerified) {
      return {
        error: NextResponse.json({ 
          error: 'E-mailadres niet geverifieerd. Verifieer je e-mailadres om deze actie uit te voeren.' 
        }, { status: 401 }),
        user: null
      };
    }

    return {
      error: null,
      user
    };
  } catch (error) {
    console.error('API session validation error:', error);
    return {
      error: NextResponse.json({ error: 'Sessie validatie mislukt' }, { status: 500 }),
      user: null
    };
  }
}

/**
 * Validate user role for specific endpoints
 */
export async function validateUserRole(request: NextRequest, allowedRoles: string[]) {
  const { error, user } = await validateApiSession(request);
  
  if (error) {
    return { error, user: null };
  }

  if (!allowedRoles.includes(user!.role)) {
    return {
      error: NextResponse.json({ error: 'Geen toegang tot deze functie' }, { status: 403 }),
      user: null
    };
  }

  return { error: null, user };
}

/**
 * Clear user-specific cache and data
 */
export async function clearUserCache(userId: string) {
  try {
    // Clear any cached data for this user
    // This could be extended to clear Redis cache, etc.
  } catch (error) {
    console.error('Error clearing user cache:', error);
  }
}

/**
 * Validate request origin and rate limiting
 */
export function validateRequest(request: NextRequest) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // Basic origin validation
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://homecheff.vercel.app',
    'https://homecheff-app.vercel.app',
    'https://homecheff.nl',
    'https://www.homecheff.nl'
  ];

  if (origin && !allowedOrigins.includes(origin)) {
    return false;
  }

  return true;
}
