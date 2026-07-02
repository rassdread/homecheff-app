import { NextRequest, NextResponse } from "next/server";

/** @legacy Niet gebruikt door app-UI; prefer `/api/auth/register`. Alleen voor externe callers/docs. */
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  generateVerificationCode,
  generateVerificationToken,
  getVerificationExpires,
} from "@/lib/verification";
import { processAttributionOnSignup } from "@/lib/affiliate-attribution";
import { maybeClaimBetaTesterFromSignupCookies } from "@/lib/beta-tester-rewards";
import { tryAwardAccountCreated } from "@/lib/gamification/award-account-created";
import { registrationUsernamePasswordConflictMessage } from "@/lib/auth/registrationUsernameGuards";
import { buildRegistrationFullName } from "@/lib/person-name";
import { tryNormalizeEmail } from "@/lib/auth/normalize-email";
import { findUserByCanonicalEmail } from "@/lib/auth/find-user-by-email";
import { getDuplicateSignupKindForUser } from "@/lib/auth/signup-duplicate";
import { jsonRegisterDuplicate } from "@/lib/auth/register-duplicate-response";
import { trySendSignupVerificationEmail } from "@/lib/auth/send-signup-verification-email";
import { Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let raceNormalizedEmail: string | null = null;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Geen gegevens ontvangen. Probeer het opnieuw." }, { status: 400 });

    const { 
      firstName, 
      middleName,
      lastName, 
      email, 
      password, 
      isBusiness, 
      company, 
      username, 
      gender,
      phoneNumber,
      userTypes,
      selectedBuyerType,
      interests,
      location,
      country,
      address,
      city,
      postalCode,
      bio,
      kvk,
      btw,
      subscription,
      acceptPrivacyPolicy,
      acceptTerms,
      acceptMarketing,
      acceptTaxResponsibility,
      subAffiliateInviteToken, // Token voor sub-affiliate invite
      confirmPassword,
    } = body as any;
    
    const firstNameTrim = typeof firstName === "string" ? firstName.trim() : "";
    const lastNameTrim = typeof lastName === "string" ? lastName.trim() : "";

    // Basic validation
    if (!email || !password || !firstNameTrim || !lastNameTrim) {
      return NextResponse.json({ error: "Alle verplichte velden moeten worden ingevuld." }, { status: 400 });
    }

    const normalizedEmail = tryNormalizeEmail(email);
    if (!normalizedEmail) {
      return NextResponse.json({ error: "Voer een geldig e-mailadres in." }, { status: 400 });
    }
    raceNormalizedEmail = normalizedEmail;

    // Password validation
    if (password.length < 6) {
      return NextResponse.json({ error: "Wachtwoord moet minimaal 6 tekens lang zijn." }, { status: 400 });
    }

    if (
      typeof confirmPassword === "string" &&
      confirmPassword.length > 0 &&
      confirmPassword !== password
    ) {
      return NextResponse.json({ error: "Wachtwoorden komen niet overeen." }, { status: 400 });
    }

    const usernameTrim = typeof username === "string" ? username.trim() : "";
    if (!usernameTrim) {
      return NextResponse.json({ error: "Gebruikersnaam is verplicht." }, { status: 400 });
    }

    const usernamePasswordConflict = registrationUsernamePasswordConflictMessage(
      usernameTrim,
      password,
      confirmPassword
    );
    if (usernamePasswordConflict) {
      return NextResponse.json({ error: usernamePasswordConflict }, { status: 400 });
    }

    const existing = await findUserByCanonicalEmail(prisma, normalizedEmail, {
      select: { id: true },
    });
    if (existing) {
      const kind = await getDuplicateSignupKindForUser(existing.id);
      return jsonRegisterDuplicate(kind);
    }

    const existingUsername = await prisma.user.findFirst({
      where: { username: { equals: usernameTrim, mode: "insensitive" } },
      select: { id: true },
    });
    if (existingUsername) {
      return NextResponse.json({ error: "Deze gebruikersnaam is al in gebruik." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const fn = firstNameTrim;
    const mn = typeof middleName === "string" ? middleName.trim() : "";
    const ln = lastNameTrim;
    const name = buildRegistrationFullName({ firstName: fn, middleName: mn, lastName: ln }) || fn;

    // Determine user role
    const hasSellerRole = userTypes && userTypes.length > 0;
    const userRole = hasSellerRole ? 'SELLER' : 'BUYER';

    let user;
    if (hasSellerRole) {
      const { v4: uuidv4 } = require('uuid');
      
      user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash: hashed,
          role: userRole,
          username: usernameTrim,
          gender,
          bio: bio || null,
          place: location || null,
          country: country || "NL",
          address: address || null,
          city: city || null,
          postalCode: postalCode || null,
          interests: interests || [],
          sellerRoles: userTypes || [],
          privacyPolicyAccepted: acceptPrivacyPolicy || false,
          privacyPolicyAcceptedAt: acceptPrivacyPolicy ? new Date() : null,
          termsAccepted: acceptTerms || false,
          termsAcceptedAt: acceptTerms ? new Date() : null,
          marketingAccepted: acceptMarketing || false,
          marketingAcceptedAt: acceptMarketing ? new Date() : null,
          taxResponsibilityAccepted: acceptTaxResponsibility || false,
          taxResponsibilityAcceptedAt: acceptTaxResponsibility ? new Date() : null,
          SellerProfile: {
            create: {
              id: uuidv4(),
              displayName: name,
              bio: bio || null,
              lat: null,
              lng: null,
              btw: btw || null,
              companyName: company || null,
              kvk: kvk || null,
              subscriptionId: null,
              subscriptionValidUntil: null
            }
          }
        },
        select: { id: true }
      });
      
      // Create Business record if company data is provided (internationaal)
      if (isBusiness && company) {
        await prisma.business.create({
          data: {
            userId: user.id,
            name: company,
            kvkNumber: kvk || null, // Business registration number (KVK voor NL, VAT voor EU, etc.)
            vatNumber: btw || null, // VAT/BTW number (voor EU landen)
            address: address || null, // Bedrijfsadres
            city: city || null, // Bedrijfsstad
            country: country || "NL", // Land van het bedrijf (internationaal)
            verified: false
          }
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash: hashed,
          role: userRole,
          username: usernameTrim, 
          gender,
          bio: bio || null,
          place: location || null,
          country: country || "NL",
          address: address || null,
          city: city || null,
          postalCode: postalCode || null,
          interests: interests || [],
          buyerRoles: selectedBuyerType ? [selectedBuyerType] : [],
          privacyPolicyAccepted: acceptPrivacyPolicy || false,
          privacyPolicyAcceptedAt: acceptPrivacyPolicy ? new Date() : null,
          termsAccepted: acceptTerms || false,
          termsAcceptedAt: acceptTerms ? new Date() : null,
          marketingAccepted: acceptMarketing || false,
          marketingAcceptedAt: acceptMarketing ? new Date() : null,
          taxResponsibilityAccepted: acceptTaxResponsibility || false,
          taxResponsibilityAcceptedAt: acceptTaxResponsibility ? new Date() : null
        },
        select: { id: true }
      });
    }

    void tryAwardAccountCreated(user.id).catch(() => {});

    // Process sub-affiliate invite if token is provided
    if (subAffiliateInviteToken) {
      try {
        const invite = await prisma.subAffiliateInvite.findUnique({
          where: { inviteToken: subAffiliateInviteToken },
          include: {
            parentAffiliate: true,
          },
        });

        if (
          invite &&
          invite.status === 'PENDING' &&
          invite.expiresAt > new Date() &&
          tryNormalizeEmail(invite.email) === normalizedEmail
        ) {
          // Create sub-affiliate account
          const subAffiliate = await prisma.affiliate.create({
            data: {
              userId: user.id,
              parentAffiliateId: invite.parentAffiliateId,
              status: 'ACTIVE',
            },
          });

          // Generate referral link code
          const { randomBytes: rb } = await import('crypto');
          const referralCode = `REF${user.id.slice(0, 8).toUpperCase()}${rb(2).toString('hex').toUpperCase()}`;
          
          await prisma.referralLink.create({
            data: {
              affiliateId: subAffiliate.id,
              code: referralCode,
            },
          });

          // Mark invite as accepted
          await prisma.subAffiliateInvite.update({
            where: { id: invite.id },
            data: { status: 'ACCEPTED' },
          });
        }
      } catch (inviteError) {
        console.error('Failed to process sub-affiliate invite:', inviteError);
        // Don't fail registration if invite processing fails
      }
    }

    // Process affiliate attribution (if referral cookie exists)
    try {
      const cookieHeader = req.headers.get('cookie');
      await processAttributionOnSignup(user.id, cookieHeader, isBusiness || false);
      await maybeClaimBetaTesterFromSignupCookies(user.id, cookieHeader);
    } catch (attributionError) {
      console.error('Failed to process attribution:', attributionError);
      // Don't fail registration if attribution fails
    }

    const verificationToken = generateVerificationToken();
    const verificationCode = generateVerificationCode();
    const verificationExpires = getVerificationExpires();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
      },
    });

    const signupLocale = (body as { locale?: string })?.locale === "en" ? "en" : "nl";
    const { sent: verificationEmailSent, skippedReason: verificationEmailSkippedReason } =
      await trySendSignupVerificationEmail({
        email: normalizedEmail,
        name: name || usernameTrim,
        verificationToken,
        verificationCode,
        locale: signupLocale,
      });

    return NextResponse.json({ 
      ok: true, 
      redirectUrl: "/login",
      needsVerification: true,
      verificationEmailSent,
      verificationEmailSkippedReason,
      user: {
        id: user.id,
        email: normalizedEmail,
        name,
        username: usernameTrim,
        role: userRole
      },
      message: "ACCOUNT_CREATED_SUCCESS"
    });
  } catch (e) {
    console.error("Register error:", e);

    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = e.meta?.target as string | string[] | undefined;
      const t = Array.isArray(target) ? target.join(" ") : String(target ?? "");
      if (/email/i.test(t) && raceNormalizedEmail) {
        const ex = await findUserByCanonicalEmail(prisma, raceNormalizedEmail, {
          select: { id: true },
        });
        if (ex) {
          const kind = await getDuplicateSignupKindForUser(ex.id);
          return jsonRegisterDuplicate(kind);
        }
      }
      if (/username/i.test(t)) {
        return NextResponse.json({ error: "Deze gebruikersnaam is al in gebruik." }, { status: 400 });
      }
    }

    // Handle specific Prisma errors
    if (e instanceof Error) {
      if (e.message.includes('Unique constraint') || e.message.includes('UNIQUE constraint')) {
        if (e.message.includes('email')) {
          return NextResponse.json({ error: "Dit e-mailadres is al geregistreerd." }, { status: 400 });
        }
        if (e.message.includes('username')) {
          return NextResponse.json({ error: "Deze gebruikersnaam is al in gebruik." }, { status: 400 });
        }
        return NextResponse.json({ error: "Deze gegevens zijn al in gebruik." }, { status: 400 });
      }
      
      if (e.message.includes('connect') || e.message.includes('timeout')) {
        return NextResponse.json({ error: "Er is een verbindingsprobleem. Probeer het over een paar minuten opnieuw." }, { status: 503 });
      }
    }
    
    return NextResponse.json({ 
      error: "ACCOUNT_CREATION_ERROR" 
    }, { status: 500 });
  }
}
