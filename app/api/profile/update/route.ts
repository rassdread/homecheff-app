import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureSellerProfileForUser } from '@/lib/seller-access';
import { geocodeAddress } from '@/lib/global-geocoding';
import { usernameContainsTempPlaceholder } from '@/lib/username-placeholder';
import { validateUsernameCandidate } from '@/lib/username-validation';
import { tryAwardProfileCompleted } from '@/lib/gamification/profile-hcp';

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
      country,
      lat,
      lng,
      gender, 
      interests, 
      sellerRoles, 
      buyerRoles, 
      displayFullName,
      displayNameOption,
      showFansList,
      encryptionEnabled,
      messageGuidelinesAccepted,
      // Bank details now handled via Stripe
    } = body;

    const trimmedIncomingUsername =
      typeof username === 'string' ? username.trim() : '';

    // Validate required fields
    if (!name || !trimmedIncomingUsername) {
      return NextResponse.json({ 
        error: 'Naam en gebruikersnaam zijn verplicht' 
      }, { status: 400 });
    }

    // Get current user to check if username is being changed
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, username: true, messageGuidelinesAcceptedAt: true },
    });
    let resolvedUsername = trimmedIncomingUsername;

    if (currentUser?.username !== trimmedIncomingUsername) {
      const oldName = currentUser?.username ?? '';
      if (!usernameContainsTempPlaceholder(oldName)) {
        return NextResponse.json(
          {
            error:
              'Gebruikersnaam kan niet worden gewijzigd. Alleen accounts met een tijdelijke naam (waarin “temp” voorkomt) mogen eenmalig een definitieve, unieke naam kiezen — zoals op de site beschreven.',
          },
          { status: 400 }
        );
      }
      const v = await validateUsernameCandidate(trimmedIncomingUsername, {
        excludeUserId: currentUser!.id,
        forbidTempSubstring: true,
      });
      if (!v.available) {
        return NextResponse.json({ error: v.message }, { status: 400 });
      }
      resolvedUsername = trimmedIncomingUsername;
    }

    // Use provided lat/lng if available (from client-side geocoding), otherwise geocode
    let finalLat: number | null = lat ?? null;
    let finalLng: number | null = lng ?? null;
    
    // Only geocode if lat/lng not provided and address info is available
    if ((!finalLat || !finalLng) && address && city) {
      const countryCode = country || (await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { country: true }
      }))?.country || 'NL';
      const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

      const geocodeResult = await geocodeAddress(address, city, countryCode, googleMapsApiKey);
      
      if (geocodeResult.error) {
        console.warn('Geocoding failed:', geocodeResult.error);
        // Continue without coordinates - user can still save profile
      } else {
        finalLat = geocodeResult.lat;
        finalLng = geocodeResult.lng;
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        username: resolvedUsername,
        bio: bio || null,
        quote: quote || null,
        place: place || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        country: country || null,
        lat: finalLat,
        lng: finalLng,
        gender: gender || null,
        interests: interests || [],
        sellerRoles: sellerRoles || [],
        buyerRoles: buyerRoles || [],
        displayFullName: displayFullName !== undefined ? displayFullName : true,
        displayNameOption: displayNameOption || 'full',
        showFansList: showFansList !== undefined ? showFansList : true,
        encryptionEnabled: encryptionEnabled !== undefined ? encryptionEnabled : false,
        messageGuidelinesAccepted: messageGuidelinesAccepted !== undefined ? messageGuidelinesAccepted : false,
        messageGuidelinesAcceptedAt: messageGuidelinesAccepted && !currentUser?.messageGuidelinesAcceptedAt ? new Date() : undefined,
        // Bank details now handled via Stripe
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
        image: true,
        city: true,
        place: true,
        updatedAt: true,
      }
    });

    const roles = sellerRoles || [];
    if (roles.length > 0) {
      await ensureSellerProfileForUser(updatedUser.id, {
        displayName: name,
        bio: bio ?? null,
      });
    }

    void tryAwardProfileCompleted(updatedUser.id, {
      name: updatedUser.name,
      username: updatedUser.username,
      city: updatedUser.city,
      place: updatedUser.place,
      profileImage: updatedUser.profileImage,
      image: updatedUser.image,
    }).catch(() => {});

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
