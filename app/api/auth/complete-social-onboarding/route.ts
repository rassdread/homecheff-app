import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ensureSellerProfileForUser } from '@/lib/seller-access';
import { processAttributionOnSignup } from '@/lib/affiliate-attribution';
import { maybeClaimBetaTesterFromSignupCookies } from '@/lib/beta-tester-rewards';
import { UserRole } from '@prisma/client';
import { registrationUsernamePasswordConflictMessage } from '@/lib/auth/registrationUsernameGuards';
import { buildRegistrationFullName, normalizePersonNameDisplay } from '@/lib/person-name';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Niet geauthenticeerd' }, { status: 401 });
    }

    const body = await request.json();
    const completionMode = body?.completionMode as string | undefined;

    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    /** Light path: username + display name + terms only (no address / seller setup). */
    if (completionMode === 'minimal') {
      const username = body?.username as string | undefined;
      const displayName = (body?.displayName as string | undefined)?.trim();
      const firstName = typeof body?.firstName === 'string' ? body.firstName.trim() : '';
      const middleName = typeof body?.middleName === 'string' ? body.middleName.trim() : '';
      const lastName = typeof body?.lastName === 'string' ? body.lastName.trim() : '';
      const acceptedTerms = Boolean(body?.acceptedTerms);
      const acceptedPrivacy = Boolean(body?.acceptedPrivacy);

      if (!username || username.length < 3) {
        return NextResponse.json({ message: 'Ongeldige gebruikersnaam' }, { status: 400 });
      }

      if (!acceptedTerms || !acceptedPrivacy) {
        return NextResponse.json(
          { message: 'Je moet akkoord gaan met de voorwaarden en privacy' },
          { status: 400 },
        );
      }

      const minimalConflict = registrationUsernamePasswordConflictMessage(username, body?.password, body?.confirmPassword);
      if (minimalConflict) {
        return NextResponse.json({ message: minimalConflict }, { status: 400 });
      }

      if (username !== existingUser.username) {
        const usernameExists = await prisma.user.findUnique({
          where: { username },
        });
        if (usernameExists) {
          return NextResponse.json({ message: 'Gebruikersnaam is al in gebruik' }, { status: 400 });
        }
      }

      const fromParts = buildRegistrationFullName({
        firstName,
        middleName,
        lastName,
      });
      const resolvedName = normalizePersonNameDisplay(
        fromParts || displayName || existingUser.name || username || '',
      );

      if (!resolvedName) {
        return NextResponse.json(
          { message: 'Vul je voor- en achternaam in, of een weergavenaam.' },
          { status: 400 },
        );
      }

      const roleForMinimal =
        existingUser.role === UserRole.USER ? UserRole.BUYER : existingUser.role;

      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username,
          name: resolvedName,
          role: roleForMinimal,
          socialOnboardingCompleted: true,
          emailVerified: existingUser.emailVerified || new Date(),
          termsAccepted: true,
          termsAcceptedAt: new Date(),
          privacyPolicyAccepted: true,
          privacyPolicyAcceptedAt: new Date(),
        },
      });

      await ensureSellerProfileForUser(existingUser.id, {
        displayName: updatedUser.name || username,
        bio: updatedUser.bio || null,
      });

      try {
        const cookieHeader = request.headers.get('cookie');
        await processAttributionOnSignup(existingUser.id, cookieHeader, false);
        await maybeClaimBetaTesterFromSignupCookies(existingUser.id, cookieHeader);
      } catch (e) {
        console.error('Affiliate attribution after minimal social onboarding:', e);
      }

      return NextResponse.json({
        message: 'Profiel bijgewerkt',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          role: updatedUser.role,
        },
      });
    }

    const {
      username,
      role,
      isBuyer,
      isSeller,
      userTypes,
      selectedBuyerType,
      phoneNumber,
      address,
      city,
      postalCode,
      country,
      lat,
      lng,
      dateOfBirth,
      password,
      acceptedTerms,
      acceptedPrivacy,
    } = body;

    if (!username || username.length < 3) {
      return NextResponse.json({ message: 'Ongeldige gebruikersnaam' }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ message: 'Rol is verplicht' }, { status: 400 });
    }

    if (!address || !city || !postalCode || !country) {
      return NextResponse.json({ message: 'Contactgegevens zijn verplicht' }, { status: 400 });
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      return NextResponse.json({ message: 'Je moet akkoord gaan met de voorwaarden' }, { status: 400 });
    }

    const fullPathConflict = registrationUsernamePasswordConflictMessage(
      username,
      password,
      body?.confirmPassword
    );
    if (fullPathConflict) {
      return NextResponse.json({ message: fullPathConflict }, { status: 400 });
    }

    if (username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username },
      });

      if (usernameExists) {
        return NextResponse.json({ message: 'Gebruikersnaam is al in gebruik' }, { status: 400 });
      }
    }

    let interests: string[] = [];
    let sellerRoles: string[] = [];
    let buyerRoles: string[] = [];

    if (isSeller && userTypes && userTypes.length > 0) {
      sellerRoles = userTypes;
      interests = [...interests, ...userTypes];
    }

    if (isBuyer && selectedBuyerType) {
      buyerRoles = [selectedBuyerType];
      interests = [...interests, selectedBuyerType];
    }

    let passwordHash = existingUser.passwordHash;
    if (password && password.length >= 8) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        username,
        name: existingUser.name || username,
        role: role as UserRole,
        interests,
        sellerRoles,
        buyerRoles,
        phoneNumber: phoneNumber || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address,
        city,
        postalCode,
        country,
        lat: lat ?? null,
        lng: lng ?? null,
        place: city,
        passwordHash,
        socialOnboardingCompleted: true,
        emailVerified: existingUser.emailVerified || new Date(),
        termsAccepted: acceptedTerms,
        termsAcceptedAt: acceptedTerms ? new Date() : null,
        privacyPolicyAccepted: acceptedPrivacy,
        privacyPolicyAcceptedAt: acceptedPrivacy ? new Date() : null,
        bio: `Welkom op HomeCheff!`,
        displayFullName: true,
        displayNameOption: 'full',
        showFansList: true,
        marketingAccepted: false,
        messageGuidelinesAccepted: false,
        encryptionEnabled: false,
      },
    });

    await ensureSellerProfileForUser(existingUser.id, {
      displayName: updatedUser.name || username,
      bio: updatedUser.bio || null,
    });

    try {
      const cookieHeader = request.headers.get('cookie');
      await processAttributionOnSignup(existingUser.id, cookieHeader, false);
      await maybeClaimBetaTesterFromSignupCookies(existingUser.id, cookieHeader);
    } catch (e) {
      console.error('Affiliate attribution after social onboarding:', e);
    }

    return NextResponse.json({
      message: 'Onboarding succesvol voltooid',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Error completing social onboarding:', error);
    return NextResponse.json(
      { message: 'Er ging iets mis bij het voltooien van de onboarding' },
      { status: 500 },
    );
  }
}
