import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { geocodeAddress } from '@/lib/geocoding';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      username, 
      bio, 
      quote,
      place, 
      address,
      city,
      postalCode,
      gender, 
      interests, 
      sellerRoles, 
      buyerRoles, 
      displayFullName,
      displayNameOption,
      encryptionEnabled,
      messageGuidelinesAccepted,
      bankName,
      iban,
      accountHolderName
    } = body;

    // Validate required fields
    if (!name || !username) {
      return NextResponse.json({ 
        error: 'Naam en gebruikersnaam zijn verplicht' 
      }, { status: 400 });
    }

    // Get current user to check if username is being changed
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { username: true, messageGuidelinesAcceptedAt: true }
    });

    // Prevent username changes - username is immutable after registration
    if (currentUser?.username && currentUser.username !== username) {
      return NextResponse.json({ 
        error: 'Gebruikersnaam kan niet worden gewijzigd na registratie' 
      }, { status: 400 });
    }

    // Geocode address if provided
    let lat: number | null = null;
    let lng: number | null = null;
    
    if (address && city && postalCode) {
      console.log('Geocoding address:', { address, city, postalCode });
      const geocodeResult = await geocodeAddress(address, city, postalCode);
      
      if ('error' in geocodeResult) {
        console.warn('Geocoding failed:', geocodeResult.message);
        // Continue without coordinates - user can still save profile
      } else {
        lat = geocodeResult.lat;
        lng = geocodeResult.lng;
        console.log('Geocoding successful:', { lat, lng });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        username,
        bio: bio || null,
        quote: quote || null,
        place: place || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        lat: lat,
        lng: lng,
        gender: gender || null,
        interests: interests || [],
        sellerRoles: sellerRoles || [],
        buyerRoles: buyerRoles || [],
        displayFullName: displayFullName !== undefined ? displayFullName : true,
        displayNameOption: displayNameOption || 'full',
        encryptionEnabled: encryptionEnabled !== undefined ? encryptionEnabled : false,
        messageGuidelinesAccepted: messageGuidelinesAccepted !== undefined ? messageGuidelinesAccepted : false,
        messageGuidelinesAcceptedAt: messageGuidelinesAccepted && !currentUser?.messageGuidelinesAcceptedAt ? new Date() : undefined,
        bankName: bankName || null,
        iban: iban || null,
        accountHolderName: accountHolderName || null,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        quote: true,
        place: true,
        address: true,
        city: true,
        postalCode: true,
        lat: true,
        lng: true,
        gender: true,
        interests: true,
        sellerRoles: true,
        buyerRoles: true,
        displayFullName: true,
        displayNameOption: true,
        encryptionEnabled: true,
        messageGuidelinesAccepted: true,
        messageGuidelinesAcceptedAt: true,
        profileImage: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profiel succesvol bijgewerkt'
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het bijwerken van het profiel' 
    }, { status: 500 });
  }
}
