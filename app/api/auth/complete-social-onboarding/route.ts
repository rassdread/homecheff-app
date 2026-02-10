import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
// import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Niet geauthenticeerd' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      username, role, isBuyer, isSeller, userTypes, selectedBuyerType, 
      phoneNumber, address, city, postalCode, country,
      lat, lng, // Optional geocoded coordinates
      dateOfBirth, // Optional date of birth
      password, // Optional password for social login users
      acceptedTerms, acceptedPrivacy 
    } = body;

    // Validate input
    if (!username || username.length < 3) {
      return NextResponse.json({ message: 'Ongeldige gebruikersnaam' }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ message: 'Rol is verplicht' }, { status: 400 });
    }

    // Phone number is optional, only validate required contact fields
    if (!address || !city || !postalCode || !country) {
      return NextResponse.json({ message: 'Contactgegevens zijn verplicht' }, { status: 400 });
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      return NextResponse.json({ message: 'Je moet akkoord gaan met de voorwaarden' }, { status: 400 });
    }

    // Get existing incomplete user
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Check if username is already taken (by another user)
    if (username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username }
      });

      if (usernameExists) {
        return NextResponse.json({ message: 'Gebruikersnaam is al in gebruik' }, { status: 400 });
      }
    }

    // Build interests array based on selections
    let interests: string[] = [];
    let sellerRoles: string[] = [];
    let buyerRoles: string[] = [];
    
    // User can be BOTH buyer and seller!
    if (isSeller && userTypes && userTypes.length > 0) {
      sellerRoles = userTypes; // Chef, Garden, Designer
      interests = [...interests, ...userTypes];
    }
    
    if (isBuyer && selectedBuyerType) {
      buyerRoles = [selectedBuyerType]; // Ontdekker, Verzamelaar, etc.
      interests = [...interests, selectedBuyerType];
    }

    // Hash password if provided (optional for social login users)
    let passwordHash = existingUser.passwordHash; // Keep existing password if no new one provided
    if (password && password.length >= 8) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Update user with complete onboarding data including contact info
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        username,
        name: existingUser.name || username, // Keep social name or use username as fallback
        role: role as any,
        interests,
        sellerRoles,
        buyerRoles,
        phoneNumber: phoneNumber || null, // Allow null for optional phone number
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null, // Optional date of birth
        address,
        city,
        postalCode,
        country,
        lat: lat ?? null,
        lng: lng ?? null,
        place: city, // Use city as place for location
        passwordHash, // Update password if provided
        socialOnboardingCompleted: true, // Mark as completed!
        // Ensure email is marked as verified (social login providers already verified it)
        emailVerified: existingUser.emailVerified || new Date(),
        termsAccepted: acceptedTerms,
        termsAcceptedAt: acceptedTerms ? new Date() : null,
        privacyPolicyAccepted: acceptedPrivacy,
        privacyPolicyAcceptedAt: acceptedPrivacy ? new Date() : null,
        bio: `Welkom op HomeCheff!`,
        // Set default values to match regular registration
        displayFullName: true,
        displayNameOption: 'full',
        showFansList: true,
        marketingAccepted: false,
        messageGuidelinesAccepted: false,
        encryptionEnabled: false,
      }
    });
    return NextResponse.json({ 
      message: 'Onboarding succesvol voltooid',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Error completing social onboarding:', error);
    return NextResponse.json(
      { message: 'Er ging iets mis bij het voltooien van de onboarding' },
      { status: 500 }
    );
  }
}

