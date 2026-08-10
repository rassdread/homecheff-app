import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureSellerProfileForUser } from '@/lib/seller-access';
import { resolvePlaceInput } from '@/lib/geo/resolve-place-input';
import { placeTextMateriallyChanged } from '@/lib/geo/resolve-place-input';
import { needsDefinitiveUsername } from '@/lib/account-requirements';
import { validateUsernameCandidate } from '@/lib/username-validation';
import { tryAwardProfileCompleted } from '@/lib/gamification/profile-hcp';
import { syncSellerProfileCoordsForUserId } from '@/lib/seller/sync-seller-profile-coords';

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
      select: {
        id: true,
        username: true,
        messageGuidelinesAcceptedAt: true,
        place: true,
        city: true,
        lat: true,
        lng: true,
        country: true,
      },
    });
    let resolvedUsername = trimmedIncomingUsername;

    if (currentUser?.username !== trimmedIncomingUsername) {
      const oldName = currentUser?.username ?? '';
      if (!needsDefinitiveUsername(oldName)) {
        return NextResponse.json(
          {
            error:
              'Gebruikersnaam kan niet worden gewijzigd. Alleen accounts met een tijdelijke of voorlopige naam mogen eenmalig een definitieve, unieke naam kiezen — zoals op de site beschreven.',
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
    let finalLat: number | null =
      lat != null && Number.isFinite(Number(lat)) ? Number(lat) : null;
    let finalLng: number | null =
      lng != null && Number.isFinite(Number(lng)) ? Number(lng) : null;

    const placeChanged = placeTextMateriallyChanged(
      currentUser?.place || currentUser?.city,
      place || city,
    );
    // Changing place without new coords must invalidate stale coordinates.
    if (placeChanged) {
      const clientSentFreshCoords =
        lat != null &&
        lng != null &&
        Number.isFinite(Number(lat)) &&
        Number.isFinite(Number(lng));
      if (!clientSentFreshCoords) {
        finalLat = null;
        finalLng = null;
      }
    }

    const countryCode =
      (typeof country === 'string' && country.trim()) ||
      currentUser?.country ||
      'NL';

    // Do not overwrite an already precise valid profile coordinate with a city
    // centroid when place text did not change and coords were provided.
    const hasUsableCoords =
      finalLat != null &&
      finalLng != null &&
      !(finalLat === 0 && finalLng === 0);

    if (!hasUsableCoords) {
      const geocodeParts = [address, postalCode, place, city]
        .map((part) => (typeof part === 'string' ? part.trim() : ''))
        .filter(Boolean);
      const geocodeQuery = geocodeParts.join(', ');

      if (geocodeQuery) {
        const resolution = await resolvePlaceInput({
          query: geocodeQuery,
          countryCode,
        });

        if (resolution.status === 'resolved') {
          finalLat = resolution.result.lat;
          finalLng = resolution.result.lng;
        } else if (resolution.status === 'ambiguous') {
          return NextResponse.json(
            {
              error: resolution.message,
              code: 'location_ambiguous',
              candidates: resolution.candidates,
            },
            { status: 400 },
          );
        } else {
          console.warn('Profile place resolution:', resolution);
        }
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

    if (finalLat != null && finalLng != null) {
      await syncSellerProfileCoordsForUserId(updatedUser.id, {
        lat: finalLat,
        lng: finalLng,
      }).catch((e) => console.warn('[profile/update] seller coords sync', e));
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
