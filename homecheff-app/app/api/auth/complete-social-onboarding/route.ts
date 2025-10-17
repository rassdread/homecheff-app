import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
      acceptedTerms, acceptedPrivacy 
    } = body;

    // Validate input
    if (!username || username.length < 3) {
      return NextResponse.json({ message: 'Ongeldige gebruikersnaam' }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ message: 'Rol is verplicht' }, { status: 400 });
    }

    if (!phoneNumber || !address || !city || !postalCode || !country) {
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
        phoneNumber,
        address,
        city,
        postalCode,
        country,
        place: city, // Use city as place for location
        socialOnboardingCompleted: true, // Mark as completed!
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

    console.log('✅ Social onboarding completed:', {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      role: updatedUser.role,
      interests: updatedUser.interests,
      sellerRoles: updatedUser.sellerRoles,
      buyerRoles: updatedUser.buyerRoles
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

