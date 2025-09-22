import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { TransportationMode } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { 
      name, 
      email, 
      password, 
      username,
      age, 
      transportation, 
      maxDistance, 
      availableDays, 
      availableTimeSlots, 
      bio,
      acceptTerms,
      acceptPrivacy,
      acceptLiability,
      acceptInsurance,
      acceptTaxResponsibility,
      acceptPlatformRules,
      parentalConsent
    } = await req.json();

    // Validate required fields
    if (!name || !email || !password || !username || !age) {
      return NextResponse.json({ 
        error: 'Alle verplichte velden moeten worden ingevuld' 
      }, { status: 400 });
    }

    // Validate email format
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      return NextResponse.json({ 
        error: 'Voer een geldig e-mailadres in' 
      }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Wachtwoord moet minimaal 6 karakters bevatten' 
      }, { status: 400 });
    }

    // Validate username format
    if (!username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
      return NextResponse.json({ 
        error: 'Gebruikersnaam moet 3-20 karakters bevatten en mag alleen letters, cijfers en underscores bevatten' 
      }, { status: 400 });
    }

    // Validate age
    if (age < 15 || age > 23) {
      return NextResponse.json({ 
        error: 'Je moet tussen 15 en 23 jaar oud zijn' 
      }, { status: 400 });
    }

    // Validate legal agreements
    if (!acceptTerms || !acceptPrivacy || !acceptLiability || !acceptInsurance || !acceptTaxResponsibility || !acceptPlatformRules) {
      return NextResponse.json({ 
        error: 'Je moet alle juridische overeenkomsten accepteren' 
      }, { status: 400 });
    }

    // Validate parental consent for minors
    if (age < 18 && !parentalConsent) {
      return NextResponse.json({ 
        error: 'Minderjarigen hebben ouderlijke toestemming nodig' 
      }, { status: 400 });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingEmail) {
      return NextResponse.json({ 
        error: 'Er bestaat al een account met dit e-mailadres' 
      }, { status: 400 });
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });

    if (existingUsername) {
      return NextResponse.json({ 
        error: 'Deze gebruikersnaam is al in gebruik' 
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user account
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash: hashedPassword,
        role: 'USER',
        emailVerified: new Date() // Auto-verify for delivery users
      }
    });

    // Validate and convert transportation modes
    console.log('Transportation modes received:', transportation);
    console.log('TransportationMode enum values:', Object.values(TransportationMode));
    
    const validTransportModes = transportation.filter(t => 
      Object.values(TransportationMode).includes(t as TransportationMode)
    ) as TransportationMode[];

    console.log('Valid transport modes:', validTransportModes);

    if (validTransportModes.length === 0) {
      return NextResponse.json({ 
        error: 'Selecteer minimaal één vervoersmiddel' 
      }, { status: 400 });
    }

    // Create delivery profile
    const deliveryProfile = await prisma.deliveryProfile.create({
      data: {
        userId: user.id,
        age,
        transportation: validTransportModes,
        maxDistance: maxDistance || 3,
        availableDays: availableDays || [],
        availableTimeSlots: availableTimeSlots || [],
        bio: bio || null,
        isActive: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role
      },
      deliveryProfile: {
        id: deliveryProfile.id,
        age: deliveryProfile.age,
        isActive: deliveryProfile.isActive
      }
    });

  } catch (error) {
    console.error('Delivery signup error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('email')) {
        return NextResponse.json({ 
          error: 'Er bestaat al een account met dit e-mailadres' 
        }, { status: 400 });
      }
      if (error.meta?.target?.includes('username')) {
        return NextResponse.json({ 
          error: 'Deze gebruikersnaam is al in gebruik' 
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het aanmaken van je account',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
