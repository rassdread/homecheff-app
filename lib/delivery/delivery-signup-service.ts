/**
 * Delivery onboarding: validate → atomic create/resume → safe Dutch errors.
 * Commercial delivery remains hard 18+ (no parental-consent bypass).
 */

import bcrypt from 'bcryptjs';
import type { Prisma, PrismaClient, User } from '@prisma/client';
import { findUserByCanonicalEmail } from '@/lib/auth/find-user-by-email';
import { getDuplicateSignupKindForUser } from '@/lib/auth/signup-duplicate';
import {
  assertCommercialCourierAgeForActivation,
  delivererAcceptDenialResponse,
} from '@/lib/delivery/delivery-eligibility';
import { tryAwardAccountCreated } from '@/lib/gamification/award-account-created';
import {
  DELIVERY_SIGNUP_NL as NL,
  parseAndValidateDeliverySignupFields,
  type DeliverySignupInput,
  type DeliverySignupResult,
  type ParsedDeliverySignup,
} from '@/lib/delivery/delivery-signup-validation';

export type {
  DeliverySignupInput,
  DeliverySignupResult,
  DeliverySignupErrorCode,
  DeliveryProviderType,
  ParsedDeliverySignup,
} from '@/lib/delivery/delivery-signup-validation';

export {
  VALID_TRANSPORTATION_MODES,
  filterValidTransportation,
  parseAndValidateDeliverySignupFields,
  DELIVERY_SIGNUP_NL,
} from '@/lib/delivery/delivery-signup-validation';

function profileCreateData(
  userId: string,
  data: ParsedDeliverySignup
): Prisma.DeliveryProfileCreateInput {
  return {
    user: { connect: { id: userId } },
    age: data.age,
    transportation: data.transportation,
    maxDistance: data.maxDistance,
    preferredRadius: data.preferredRadius,
    deliveryMode: data.deliveryMode,
    availableDays: data.availableDays,
    availableTimeSlots: data.availableTimeSlots,
    bio: data.bio,
    homeLat: data.homeLat,
    homeLng: data.homeLng,
    homeAddress: data.homeAddress,
    isActive: true,
    providerType: data.providerType,
  };
}

async function ensureBusinessForUser(
  tx: Prisma.TransactionClient,
  userId: string,
  data: ParsedDeliverySignup
): Promise<{ id: string; name: string } | null> {
  if (data.providerType !== 'DELIVERY_BUSINESS' || !data.companyName) {
    return null;
  }

  const existing = await tx.business.findUnique({ where: { userId } });
  if (existing) {
    return tx.business.update({
      where: { userId },
      data: {
        name: data.companyName,
        kvkNumber: data.kvkNumber,
        vatNumber: data.vatNumber,
        address: data.homeAddress ?? undefined,
      },
      select: { id: true, name: true },
    });
  }

  return tx.business.create({
    data: {
      userId,
      name: data.companyName,
      kvkNumber: data.kvkNumber,
      vatNumber: data.vatNumber,
      address: data.homeAddress,
      country: 'NL',
    },
    select: { id: true, name: true },
  });
}

function successPayload(params: {
  user: Pick<User, 'id' | 'name' | 'email' | 'username' | 'role'>;
  deliveryProfile: { id: string; age: number; isActive: boolean; providerType: string };
  business: { id: string; name: string } | null;
  recovered: boolean;
}): DeliverySignupResult {
  return {
    ok: true,
    status: 200,
    recovered: params.recovered,
    user: {
      id: params.user.id,
      name: params.user.name,
      email: params.user.email,
      username: params.user.username,
      role: params.user.role,
    },
    deliveryProfile: params.deliveryProfile,
    business: params.business,
  };
}

async function completeForExistingUser(
  prisma: PrismaClient,
  user: User,
  data: ParsedDeliverySignup
): Promise<DeliverySignupResult> {
  const ageGate = assertCommercialCourierAgeForActivation({
    dateOfBirth: user.dateOfBirth,
    claimedAge: data.age,
    userId: user.id,
  });
  if (!ageGate.ok) {
    const body = delivererAcceptDenialResponse(ageGate);
    return {
      ok: false,
      status: ageGate.status,
      code: ageGate.code === 'DELIVERY_DOB_REQUIRED' ? 'DOB_REQUIRED' : 'UNDERAGE',
      error: body.error,
    };
  }

  const existingProfile = await prisma.deliveryProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      age: true,
      isActive: true,
      providerType: true,
    },
  });

  if (existingProfile) {
    return successPayload({
      user,
      deliveryProfile: existingProfile,
      business:
        data.providerType === 'DELIVERY_BUSINESS'
          ? await prisma.business.findUnique({
              where: { userId: user.id },
              select: { id: true, name: true },
            })
          : null,
      recovered: false,
    });
  }

  try {
    const { deliveryProfile, business, updatedUser } = await prisma.$transaction(
      async (tx) => {
        const deliveryProfile = await tx.deliveryProfile.create({
          data: profileCreateData(user.id, data),
          select: {
            id: true,
            age: true,
            isActive: true,
            providerType: true,
          },
        });

        const business = await ensureBusinessForUser(tx, user.id, data);

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            role:
              user.role === 'ADMIN' || user.role === 'SUPERADMIN'
                ? user.role
                : 'DELIVERY',
            ...(data.contactPhone ? { phoneNumber: data.contactPhone } : {}),
            ...(data.homeAddress ? { address: data.homeAddress } : {}),
          },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
          },
        });

        return { deliveryProfile, business, updatedUser };
      }
    );

    return successPayload({
      user: updatedUser as User,
      deliveryProfile,
      business,
      recovered: true,
    });
  } catch (error: unknown) {
    const prismaError = error as { code?: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002') {
      const target = prismaError.meta?.target ?? [];
      if (target.includes('userId')) {
        const again = await prisma.deliveryProfile.findUnique({
          where: { userId: user.id },
          select: {
            id: true,
            age: true,
            isActive: true,
            providerType: true,
          },
        });
        if (again) {
          return successPayload({
            user,
            deliveryProfile: again,
            business: await prisma.business.findUnique({
              where: { userId: user.id },
              select: { id: true, name: true },
            }),
            recovered: true,
          });
        }
      }
    }
    console.error('[delivery-signup] existing-user profile create failed', {
      userId: user.id,
      code: prismaError.code ?? null,
    });
    return {
      ok: false,
      status: 500,
      code: 'INTERNAL',
      error: NL.orphanRetry,
      resumeHint: 'complete_profile',
    };
  }
}

/**
 * New account + delivery profile in one transaction. Recovers orphan accounts
 * when the same credentials are presented again without a delivery profile.
 */
export async function runDeliverySignup(params: {
  prisma: PrismaClient;
  input: DeliverySignupInput;
  sessionUserId?: string | null;
}): Promise<DeliverySignupResult> {
  const { prisma, input, sessionUserId } = params;

  if (sessionUserId) {
    const parsed = parseAndValidateDeliverySignupFields(input, {
      requireAccountFields: false,
    });
    if (!parsed.ok) return parsed.result;

    const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
    if (!user) {
      return {
        ok: false,
        status: 404,
        code: 'USER_NOT_FOUND',
        error: NL.userMissing,
      };
    }
    return completeForExistingUser(prisma, user, parsed.data);
  }

  const parsed = parseAndValidateDeliverySignupFields(input, {
    requireAccountFields: true,
  });
  if (!parsed.ok) return parsed.result;
  const data = parsed.data;

  const ageGate = assertCommercialCourierAgeForActivation({
    claimedAge: data.age,
    dateOfBirth: null,
  });
  if (!ageGate.ok) {
    const body = delivererAcceptDenialResponse(ageGate);
    return {
      ok: false,
      status: ageGate.status,
      code: 'UNDERAGE',
      error: body.error,
    };
  }

  const email = data.email!;
  const username = data.username!;
  const password = data.password!;
  const name = data.name!;

  const existingEmailUser = await findUserByCanonicalEmail(prisma, email, {
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      passwordHash: true,
      dateOfBirth: true,
      DeliveryProfile: { select: { id: true } },
    },
  });

  if (existingEmailUser) {
    const hasProfile = Boolean(existingEmailUser.DeliveryProfile);

    if (hasProfile) {
      const kind = await getDuplicateSignupKindForUser(existingEmailUser.id);
      return {
        ok: false,
        status: 409,
        code: 'DUPLICATE_EMAIL',
        duplicateKind: kind,
        error:
          'Er bestaat al een account met dit e-mailadres. Log in om verder te gaan.',
        resumeHint: 'login_and_resume',
      };
    }

    const hash = existingEmailUser.passwordHash;
    const passwordOk =
      typeof hash === 'string' &&
      hash.length > 0 &&
      (await bcrypt.compare(password, hash));

    if (!passwordOk) {
      return {
        ok: false,
        status: 409,
        code: 'RESUME_REQUIRED',
        error: NL.resume,
        resumeHint: 'login_and_resume',
      };
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: existingEmailUser.id },
    });
    if (!fullUser) {
      return {
        ok: false,
        status: 404,
        code: 'USER_NOT_FOUND',
        error: NL.userMissing,
      };
    }
    return completeForExistingUser(prisma, fullUser, data);
  }

  const existingUsername = await prisma.user.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
    select: { id: true },
  });
  if (existingUsername) {
    return {
      ok: false,
      status: 400,
      code: 'DUPLICATE_USERNAME',
      error: NL.usernameTaken,
      fieldErrors: { username: NL.usernameTaken },
    };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          username,
          passwordHash: hashedPassword,
          role: 'DELIVERY',
          emailVerified: new Date(),
          displayFullName: true,
          displayNameOption: 'full',
          showFansList: true,
          privacyPolicyAccepted: true,
          privacyPolicyAcceptedAt: new Date(),
          marketingAccepted: false,
          messageGuidelinesAccepted: false,
          encryptionEnabled: false,
          interests: [],
          sellerRoles: [],
          buyerRoles: [],
          ...(data.contactPhone ? { phoneNumber: data.contactPhone } : {}),
          ...(data.homeAddress ? { address: data.homeAddress } : {}),
        },
      });

      const deliveryProfile = await tx.deliveryProfile.create({
        data: profileCreateData(user.id, data),
        select: {
          id: true,
          age: true,
          isActive: true,
          providerType: true,
        },
      });

      const business = await ensureBusinessForUser(tx, user.id, data);

      return { user, deliveryProfile, business };
    });

    void tryAwardAccountCreated(created.user.id).catch(() => {});

    return successPayload({
      user: created.user,
      deliveryProfile: created.deliveryProfile,
      business: created.business,
      recovered: false,
    });
  } catch (error: unknown) {
    const prismaError = error as { code?: string; meta?: { target?: string[] } };
    console.error('[delivery-signup] atomic create failed', {
      code: prismaError.code ?? null,
      target: prismaError.meta?.target ?? null,
    });

    if (prismaError.code === 'P2002') {
      const target = prismaError.meta?.target ?? [];
      if (target.includes('email')) {
        return {
          ok: false,
          status: 409,
          code: 'RESUME_REQUIRED',
          error: NL.resume,
          resumeHint: 'login_and_resume',
        };
      }
      if (target.includes('username')) {
        return {
          ok: false,
          status: 400,
          code: 'DUPLICATE_USERNAME',
          error: NL.usernameTaken,
          fieldErrors: { username: NL.usernameTaken },
        };
      }
    }

    return {
      ok: false,
      status: 500,
      code: 'INTERNAL',
      error: NL.internal,
    };
  }
}

export function deliverySignupErrorToJson(
  result: Extract<DeliverySignupResult, { ok: false }>
) {
  return {
    error: result.error,
    code: result.code,
    ...(result.resumeHint ? { resumeHint: result.resumeHint } : {}),
    ...(result.duplicateKind ? { duplicateKind: result.duplicateKind } : {}),
    ...(result.fieldErrors ? { fieldErrors: result.fieldErrors } : {}),
  };
}
