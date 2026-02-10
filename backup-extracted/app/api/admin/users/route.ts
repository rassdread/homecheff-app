import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
// import { UserRole } from '@prisma/client';

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN' && adminUser?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Geen admin rechten' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
        image: true,
        profileImage: true,
        bio: true,
        place: true,
        gender: true,
        interests: true,
        phoneNumber: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        lat: true,
        lng: true,
        SellerProfile: {
          select: {
            companyName: true,
            kvk: true,
            btw: true,
          }
        },
        DeliveryProfile: {
          select: {
            homeLat: true,
            homeLng: true,
            currentLat: true,
            currentLng: true,
            isOnline: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het ophalen van gebruikers' 
    }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN' && adminUser?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Geen admin rechten' }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, username, password, role, kvk, btw } = body;

    // Validate required fields
    if (!email || !name || !username || !password || !role) {
      return NextResponse.json({ 
        error: 'Alle velden zijn verplicht' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Ongeldig email adres' 
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['USER', 'ADMIN', 'SELLER', 'BUYER', 'DELIVERY'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: 'Ongeldige rol' 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Gebruiker met dit email adres bestaat al' 
      }, { status: 400 });
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUsername) {
      return NextResponse.json({ 
        error: 'Gebruikersnaam is al in gebruik' 
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with proper profile data based on role
    const userData: any = {
      email,
      name,
      username,
      passwordHash: hashedPassword,
      role: role as any,
      emailVerified: new Date(), // Auto-verify admin created users
      bio: `Account aangemaakt door admin op ${new Date().toLocaleDateString('nl-NL')}`,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
      taxResponsibilityAccepted: true,
      taxResponsibilityAcceptedAt: new Date(),
      marketingAccepted: false,
      displayFullName: false,
      displayNameOption: 'username',
      interests: role === 'ADMIN' ? ['Beheer', 'Moderatie', 'Ondersteuning'] : []
    };

    // Add role-specific profile creation
    if (role === 'SELLER') {
      // Validate KVK and BTW if provided (optional for admin-created users)
      const kvk = body.kvk || '00000000'; // Placeholder if not provided
      const btw = body.btw || 'NL000000000B01'; // Placeholder if not provided
      
      // Basic validation for KVK (8 digits)
      if (kvk && kvk !== '00000000' && !/^\d{8}$/.test(kvk)) {
        return NextResponse.json({ 
          error: 'KVK nummer moet 8 cijfers bevatten' 
        }, { status: 400 });
      }
      
      // Basic validation for BTW (NL + 9 digits + B + 2 digits)
      if (btw && btw !== 'NL000000000B01' && !/^NL\d{9}B\d{2}$/.test(btw)) {
        return NextResponse.json({ 
          error: 'BTW nummer moet formaat NL123456789B01 hebben' 
        }, { status: 400 });
      }

      userData.SellerProfile = {
        create: {
          id: require('crypto').randomUUID(),
          displayName: username,
          companyName: name,
          bio: `Verkoper account aangemaakt door admin op ${new Date().toLocaleDateString('nl-NL')}. Let op: KVK/BTW zijn placeholder waarden en moeten door de gebruiker worden bijgewerkt.`,
          // Add required fields for SellerProfile
          kvk: kvk,
          btw: btw,
          deliveryMode: 'FIXED',
          deliveryRadius: 5.0,
          deliveryRegions: []
        }
      };
    } else if (role === 'DELIVERY') {
      userData.DeliveryProfile = {
        create: {
          age: 25, // Default age, should be updated by user
          bio: `Bezorger account aangemaakt door admin`,
          transportation: ['BIKE'], // Default to bike
          maxDistance: 5.0,
        }
      };
    }

    const newUser = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
        emailVerified: true,
      }
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'Gebruiker succesvol aangemaakt'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het aanmaken van de gebruiker' 
    }, { status: 500 });
  }
}