import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

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

    if (adminUser?.role !== 'ADMIN') {
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

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen admin rechten' }, { status: 403 });
    }

    const { email, name, username, password, role } = await request.json();

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
    if (!Object.values(UserRole).includes(role)) {
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

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        username,
        passwordHash: hashedPassword,
        role: role as UserRole,
        emailVerified: new Date(), // Auto-verify admin created users
        bio: `Account aangemaakt door admin op ${new Date().toLocaleDateString('nl-NL')}`,
      },
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