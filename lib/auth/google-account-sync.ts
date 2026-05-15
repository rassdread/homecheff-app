/**
 * Shared Google account upsert for NextAuth web OAuth and native Android idToken login.
 * Must stay in sync with prior Google signIn behaviour in lib/auth.ts.
 */
import { prisma } from '@/lib/prisma';
import { Prisma, UserRole } from '@prisma/client';
import { tryAwardAccountCreated } from '@/lib/gamification/award-account-created';
import { tryNormalizeEmail } from '@/lib/auth/normalize-email';
import { linkGoogleOAuthAccount } from '@/lib/auth/link-google-oauth-account';

export type SyncGoogleProfileInput = {
  email: string;
  name?: string | null;
  image?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  /** Google `sub` — used to persist Account row */
  googleSub?: string | null;
  /** When false, do not create a new user (existing users may still be updated). */
  emailVerified?: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
};

export type SyncGoogleProfileResult = {
  userId: string;
  role: UserRole;
  username: string | null;
  socialOnboardingCompleted: boolean;
  isNewSocialUser: boolean;
};

export async function syncGoogleProfileToDatabase(
  input: SyncGoogleProfileInput,
): Promise<SyncGoogleProfileResult> {
  const email = tryNormalizeEmail(input.email);
  if (!email) {
    throw new Error('missing_email');
  }

  let existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });

  let isNewSocialUser = false;

  if (existingUser) {
    if (existingUser.accountDeletedAt) {
      throw new Error('account_deleted');
    }

    const updateData: Record<string, unknown> = {
      name: input.name || existingUser.name,
      email,
    };

    if (!existingUser.emailVerified) {
      updateData.emailVerified = new Date();
    }

    const hasCustomPhoto =
      existingUser.profileImage &&
      (!existingUser.profileImage.startsWith('http') ||
        existingUser.profileImage.startsWith('data:') ||
        existingUser.profileImage.includes('vercel-storage') ||
        existingUser.profileImage.includes('blob.vercel-storage'));

    if (!hasCustomPhoto && input.image) {
      updateData.image = input.image;
      updateData.profileImage = input.image;
    }

    await prisma.user.update({
      where: { id: existingUser.id },
      data: updateData as any,
    });

    existingUser = await prisma.user.findUniqueOrThrow({ where: { id: existingUser.id } });
  } else {
    if (input.emailVerified === false) {
      throw new Error('google_email_not_verified');
    }

    isNewSocialUser = true;
    let tempUsername = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let usernameExists = await prisma.user.findUnique({ where: { username: tempUsername } });
    let attempts = 0;
    while (usernameExists && attempts < 5) {
      tempUsername = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      usernameExists = await prisma.user.findUnique({ where: { username: tempUsername } });
      attempts++;
    }

    if (usernameExists) {
      throw new Error('temp_username_failed');
    }

    try {
      existingUser = await prisma.user.create({
        data: {
          email,
          name: input.name || '',
          username: tempUsername,
          image: input.image || null,
          profileImage: input.image || null,
          passwordHash: '',
          role: UserRole.BUYER,
          interests: [],
          bio: '',
          socialOnboardingCompleted: false,
          termsAccepted: false,
          privacyPolicyAccepted: false,
          emailVerified: new Date(),
          displayFullName: true,
          displayNameOption: 'full',
          showFansList: true,
          marketingAccepted: false,
          messageGuidelinesAccepted: false,
          encryptionEnabled: false,
          sellerRoles: [],
          buyerRoles: [],
        },
      });
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const again = await prisma.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
        });
        if (again) {
          existingUser = again;
          isNewSocialUser = false;
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
    if (isNewSocialUser) {
      void tryAwardAccountCreated(existingUser.id).catch(() => {});
    }
  }

  if (input.googleSub?.trim()) {
    await linkGoogleOAuthAccount(prisma, {
      userId: existingUser.id,
      googleSub: input.googleSub.trim(),
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      expiresAt: input.expiresAt,
    });
  }

  return {
    userId: existingUser.id,
    role: existingUser.role,
    username: existingUser.username,
    socialOnboardingCompleted: existingUser.socialOnboardingCompleted,
    isNewSocialUser,
  };
}
