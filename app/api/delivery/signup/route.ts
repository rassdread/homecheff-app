import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { tryAwardAccountCreated } from '@/lib/gamification/award-account-created';
import { tryNormalizeEmail } from '@/lib/auth/normalize-email';
import { findUserByCanonicalEmail } from '@/lib/auth/find-user-by-email';
import { getDuplicateSignupKindForUser } from '@/lib/auth/signup-duplicate';
import { jsonRegisterDuplicate } from '@/lib/auth/register-duplicate-response';
import {
  assertCommercialCourierAgeForActivation,
  delivererAcceptDenialResponse,
} from '@/lib/delivery/delivery-eligibility';
import { COMMERCIAL_DELIVERY_MIN_AGE } from '@/lib/delivery/delivery-age';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const isExistingUser = !!session?.user;
    
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
      deliveryMode,
      preferredRadius,
      homeLat,
      homeLng,
      homeAddress,
      acceptDeliveryAgreement,
      parentalConsent
    } = await req.json();

    let user;
    
    if (isExistingUser) {
      // Get existing user from session
      user = await prisma.user.findUnique({
        where: { id: (session.user as any).id }
      });
      
      if (!user) {
        return NextResponse.json({ 
          error: 'Gebruiker niet gevonden' 
        }, { status: 404 });
      }

      // Check if user already has a delivery profile
      const existingProfile = await prisma.deliveryProfile.findUnique({
        where: { userId: user.id }
      });

      if (existingProfile) {
        return NextResponse.json({ 
          error: 'Je hebt al een bezorger profiel' 
        }, { status: 400 });
      }

      // For existing users, only validate delivery profile fields
      if (!age || !transportation || !acceptDeliveryAgreement) {
        return NextResponse.json({ 
          error: 'Alle verplichte velden moeten worden ingevuld' 
        }, { status: 400 });
      }

      const ageGate = assertCommercialCourierAgeForActivation({
        dateOfBirth: user.dateOfBirth,
        claimedAge: typeof age === 'number' ? age : Number(age),
        userId: user.id,
      });
      if (!ageGate.ok) {
        return NextResponse.json(delivererAcceptDenialResponse(ageGate), {
          status: ageGate.status,
        });
      }
      // parentalConsent retained in payload for compat but not an exception to 18+
      void parentalConsent;
    } else {
      // For new users, validate all fields including account creation
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

      // Commercial delivery: adults only (no upper bound in Phase 1)
      const claimedAge = typeof age === 'number' ? age : Number(age);
      if (
        !Number.isFinite(claimedAge) ||
        claimedAge < COMMERCIAL_DELIVERY_MIN_AGE
      ) {
        const ageGate = assertCommercialCourierAgeForActivation({
          claimedAge,
          dateOfBirth: null,
        });
        if (!ageGate.ok) {
          return NextResponse.json(delivererAcceptDenialResponse(ageGate), {
            status: ageGate.status,
          });
        }
      }

      // Validate legal agreements
      if (!acceptDeliveryAgreement) {
        return NextResponse.json({ 
          error: 'Je moet de Bezorger Overeenkomst accepteren' 
        }, { status: 400 });
      }

      void parentalConsent;

      // Check if email already exists
      const normalizedEmail = tryNormalizeEmail(email);
      if (!normalizedEmail) {
        return NextResponse.json({
          error: 'Voer een geldig e-mailadres in'
        }, { status: 400 });
      }

      const existingEmailUser = await findUserByCanonicalEmail(prisma, normalizedEmail, {
        select: { id: true },
      });

      if (existingEmailUser) {
        const kind = await getDuplicateSignupKindForUser(existingEmailUser.id);
        return jsonRegisterDuplicate(kind);
      }

      // Check if username already exists
      const usernameNorm = typeof username === 'string' ? username.trim() : '';
      const existingUsername = await prisma.user.findFirst({
        where: { username: { equals: usernameNorm, mode: 'insensitive' } },
        select: { id: true },
      });

      if (existingUsername) {
        return NextResponse.json({ 
          error: 'Deze gebruikersnaam is al in gebruik' 
        }, { status: 400 });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user account with DELIVERY role and complete profile
      user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          username: usernameNorm.toLowerCase(),
          passwordHash: hashedPassword,
          role: 'DELIVERY',
          emailVerified: new Date(), // Auto-verify for delivery users
          // Set default values to match regular registration
          displayFullName: true,
          displayNameOption: 'full',
          showFansList: true,
          privacyPolicyAccepted: true,
          privacyPolicyAcceptedAt: new Date(),
          marketingAccepted: false,
          messageGuidelinesAccepted: false,
          encryptionEnabled: false,
          // Initialize empty arrays for consistency
          interests: [],
          sellerRoles: [],
          buyerRoles: []
        }
      });
      void tryAwardAccountCreated(user.id).catch(() => {});
    }

    // Validate and convert transportation modes (for both new and existing users)
    if (!transportation || !Array.isArray(transportation) || transportation.length === 0) {
      return NextResponse.json({ 
        error: 'Selecteer minimaal één vervoersmiddel' 
      }, { status: 400 });
    }

    const validTransportModes = transportation.filter(t => 
      ['BIKE', 'EBIKE', 'CAR', 'SCOOTER', 'PUBLIC_TRANSPORT', 'WALKING'].includes(t as string)
    ) as string[];

    if (validTransportModes.length === 0) {
      return NextResponse.json({ 
        error: 'Selecteer minimaal één vervoersmiddel' 
      }, { status: 400 });
    }

    // Validate legal agreements (for both new and existing users)
    if (!acceptDeliveryAgreement) {
      return NextResponse.json({ 
        error: 'Je moet de Bezorger Overeenkomst accepteren' 
      }, { status: 400 });
    }

    // Create delivery profile
    const deliveryProfile = await prisma.deliveryProfile.create({
      data: {
        userId: user.id,
        age,
        transportation: validTransportModes as any,
        maxDistance: maxDistance || 3,
        preferredRadius: preferredRadius || 5,
        deliveryMode: deliveryMode || 'FIXED',
        availableDays: availableDays || [],
        availableTimeSlots: availableTimeSlots || [],
        bio: bio || null,
        homeLat: homeLat || null,
        homeLng: homeLng || null,
        homeAddress: homeAddress || null,
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

  } catch (error: any) {
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
      if (error.meta?.target?.includes('userId')) {
        return NextResponse.json({ 
          error: 'Je hebt al een bezorger profiel' 
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
