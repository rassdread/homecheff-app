import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
// import { UserRole } from "@prisma/client";
import { geocodeAddress } from "@/lib/global-geocoding";
import { tryAwardAccountCreated } from "@/lib/gamification/award-account-created";
import { stripe, PLAN_TO_PRICE, normalizeSubscriptionName } from "@/lib/stripe";
import { processAttributionOnSignup } from "@/lib/affiliate-attribution";
import { maybeClaimBetaTesterFromSignupCookies } from "@/lib/beta-tester-rewards";
import { randomBytes } from "crypto";
import { generateVerificationToken, generateVerificationCode, getVerificationExpires } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";
import { logEmailSendFailure, summarizeEmailError } from "@/lib/email-log";
import { logEmailVerificationDiag } from "@/lib/email-verification-diagnostics";
import { EmailSendFailure } from "@/lib/email-send-failure";
import { registrationUsernamePasswordConflictMessage } from "@/lib/auth/registrationUsernameGuards";
import { buildRegistrationFullName } from "@/lib/person-name";
import { tryNormalizeEmail } from "@/lib/auth/normalize-email";
import { findUserByCanonicalEmail } from "@/lib/auth/find-user-by-email";
import { getDuplicateSignupKindForUser } from "@/lib/auth/signup-duplicate";
import { jsonRegisterDuplicate } from "@/lib/auth/register-duplicate-response";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  /** Set after successful normalize; used in catch for P2002 race handling */
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
      birthMonth,
      birthYear,
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
      // Bank details now handled via Stripe
      kvk,
      btw,
      subscription,
      // Privacy en marketing
      acceptPrivacyPolicy,
      acceptTerms,
      acceptMarketing,
      // Belastingverantwoordelijkheid
      acceptTaxResponsibility,
      // Sub-affiliate invite token
      subAffiliateInviteToken,
      confirmPassword,
    } = body as any;
    
    // Validatie van verplichte velden met specifieke foutmeldingen
    if (!email) {
      return NextResponse.json({ error: "E-mailadres is verplicht" }, { status: 400 });
    }
    
    if (!password) {
      return NextResponse.json({ error: "Wachtwoord is verplicht" }, { status: 400 });
    }
    
    const firstNameTrim = typeof firstName === "string" ? firstName.trim() : "";
    const middleNameTrim = typeof middleName === "string" ? middleName.trim() : "";
    const lastNameTrim = typeof lastName === "string" ? lastName.trim() : "";

    if (!firstNameTrim) {
      return NextResponse.json({ error: "Voornaam is verplicht" }, { status: 400 });
    }

    if (!lastNameTrim) {
      return NextResponse.json({ error: "Achternaam is verplicht" }, { status: 400 });
    }

    const normalizedEmail = tryNormalizeEmail(email);
    if (!normalizedEmail) {
      return NextResponse.json({ error: "Voer een geldig e-mailadres in (bijvoorbeeld: naam@voorbeeld.nl)" }, { status: 400 });
    }
    raceNormalizedEmail = normalizedEmail;

    // Wachtwoord validatie
    if (password.length < 6) {
      return NextResponse.json({ error: "Wachtwoord moet minimaal 6 tekens lang zijn" }, { status: 400 });
    }

    if (
      typeof confirmPassword === "string" &&
      confirmPassword.length > 0 &&
      confirmPassword !== password
    ) {
      return NextResponse.json({ error: "Wachtwoorden komen niet overeen." }, { status: 400 });
    }

    const usernamePasswordConflict = registrationUsernamePasswordConflictMessage(
      username,
      password,
      confirmPassword
    );
    if (usernamePasswordConflict) {
      return NextResponse.json({ error: usernamePasswordConflict }, { status: 400 });
    }

    const usernameTrim = typeof username === "string" ? username.trim() : "";
    if (!usernameTrim) {
      return NextResponse.json({ error: "Gebruikersnaam is verplicht" }, { status: 400 });
    }

    if (usernameTrim.length < 3 || usernameTrim.length > 20) {
      return NextResponse.json({ error: "Gebruikersnaam moet tussen 3 en 20 tekens lang zijn" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(usernameTrim)) {
      return NextResponse.json({ error: "Gebruikersnaam mag alleen letters, cijfers, - . en _ bevatten" }, { status: 400 });
    }

    const reservedWords = [
      'admin', 'administrator', 'homecheff', 'api', 'www', 'mail', 'support',
      'help', 'info', 'contact', 'about', 'terms', 'privacy', 'login', 'register',
      'dashboard', 'profile', 'settings', 'logout', 'user', 'users', 'seller',
      'buyer', 'delivery', 'order', 'orders', 'product', 'products', 'message',
      'messages', 'conversation', 'conversations', 'review', 'reviews', 'favorite',
      'favorites', 'follow', 'follows', 'notification', 'notifications'
    ];

    if (reservedWords.includes(usernameTrim.toLowerCase())) {
      return NextResponse.json({ error: "Deze gebruikersnaam is gereserveerd. Kies een andere gebruikersnaam." }, { status: 400 });
    }

    const normalizedUserTypes = Array.isArray(userTypes)
      ? userTypes.filter((t: unknown) => typeof t === "string")
      : [];
    const buyerType =
      typeof selectedBuyerType === "string" && selectedBuyerType.trim().length > 0
        ? selectedBuyerType.trim()
        : "";

    // Privacy en voorwaarden validatie
    if (!acceptPrivacyPolicy) {
      return NextResponse.json({ error: "Je moet de privacyverklaring accepteren om door te gaan" }, { status: 400 });
    }
    
    if (!acceptTerms) {
      return NextResponse.json({ error: "Je moet de algemene voorwaarden accepteren om door te gaan" }, { status: 400 });
    }

    // Belastingverantwoordelijkheid validatie voor verkopers
    if (
      normalizedUserTypes.length > 0 &&
      normalizedUserTypes.some((type: string) => ['chef', 'garden', 'designer'].includes(type)) &&
      !acceptTaxResponsibility
    ) {
      return NextResponse.json({ error: "Als verkoper moet je de belastingverantwoordelijkheid accepteren" }, { status: 400 });
    }

    // Bedrijfsgegevens validatie voor business accounts (internationaal)
    if (isBusiness) {
      if (!company || company.trim().length === 0) {
        return NextResponse.json({ error: "COMPANY_NAME_REQUIRED" }, { status: 400 });
      }
      if (!kvk || kvk.trim().length === 0) {
        return NextResponse.json({ error: "BUSINESS_REGISTRATION_REQUIRED" }, { status: 400 });
      }
      
      // Internationale validatie op basis van land
      const businessRegNumber = kvk.replace(/\s/g, '');
      const userCountry = country || 'NL';
      const isNetherlands = userCountry === 'NL';
      const isEU = ['BE', 'DE', 'FR', 'IT', 'ES', 'AT', 'PT', 'GR', 'IE', 'FI', 'SE', 'DK', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU'].includes(userCountry);
      
      if (isNetherlands) {
        // KVK: 8 cijfers voor Nederland
        if (!/^[0-9]{8}$/.test(businessRegNumber)) {
          return NextResponse.json({ error: "KVK_INVALID_FORMAT" }, { status: 400 });
        }
      } else if (isEU) {
        // VAT nummer voor EU landen: minimaal 2 karakters (landcode) + nummer
        if (businessRegNumber.length < 3) {
          return NextResponse.json({ error: "VAT_INVALID_FORMAT" }, { status: 400 });
        }
      } else {
        // Voor andere landen: minimaal 3 karakters (algemene business registration)
        if (businessRegNumber.length < 3) {
          return NextResponse.json({ error: "BUSINESS_REGISTRATION_INVALID_FORMAT" }, { status: 400 });
        }
      }
    }

    const name =
      buildRegistrationFullName({
        firstName: firstNameTrim,
        middleName: middleNameTrim,
        lastName: lastNameTrim,
      }) || firstNameTrim;

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
      return NextResponse.json({ error: "Deze gebruikersnaam is al in gebruik. Kies een andere gebruikersnaam." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Calculate dateOfBirth from birthMonth and birthYear if provided
    let dateOfBirth: Date | null = null;
    if (birthMonth && birthYear) {
      const month = parseInt(birthMonth, 10);
      const year = parseInt(birthYear, 10);
      if (month >= 1 && month <= 12 && year >= 1900 && year <= new Date().getFullYear()) {
        // Use first day of month for privacy (we only need month and year)
        dateOfBirth = new Date(year, month - 1, 1);
      }
    }

    // Geocode address if provided
    let lat: number | null = null;
    let lng: number | null = null;
    
    if (address && city) {

      const geocodeResult = await geocodeAddress(address, city, country || 'NL');
      
      if (geocodeResult.error) {
        console.warn('Geocoding failed during registration:', geocodeResult.error);
        // Continue without coordinates - user can still register
      } else {
        lat = geocodeResult.lat;
        lng = geocodeResult.lng;

      }
    }

    // Determine user role based on userTypes (light signup = buyer, no seller roles)
    const hasSellerRole = normalizedUserTypes.length > 0;
    const userRole = hasSellerRole ? 'SELLER' : 'BUYER';

    let user;
    if (hasSellerRole) {
      const { v4: uuidv4 } = require('uuid');
      
      // Get subscription if provided
      user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash: hashed,
          role: userRole,
          username: usernameTrim,
          socialOnboardingCompleted: true,
          gender,
          dateOfBirth: dateOfBirth,
          bio: bio || null,
          place: location || null,
          country: country || "NL",
          address: address || null,
          city: city || null,
          postalCode: postalCode || null,
          lat: lat,
          lng: lng,
          interests: interests || [],
          sellerRoles: normalizedUserTypes,
          // Privacy en marketing toestemmingen
          privacyPolicyAccepted: acceptPrivacyPolicy || false,
          privacyPolicyAcceptedAt: acceptPrivacyPolicy ? new Date() : null,
          termsAccepted: acceptTerms || false,
          termsAcceptedAt: acceptTerms ? new Date() : null,
          marketingAccepted: acceptMarketing || false,
          marketingAcceptedAt: acceptMarketing ? new Date() : null,
          // Belastingverantwoordelijkheid
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
          socialOnboardingCompleted: true,
          gender,
          dateOfBirth: dateOfBirth,
          bio: bio || null,
          place: location || null,
          country: country || "NL",
          address: address || null,
          city: city || null,
          postalCode: postalCode || null,
          lat: lat,
          lng: lng,
          interests: interests || [],
          buyerRoles: buyerType ? [buyerType] : [],
          // Privacy en marketing toestemmingen
          privacyPolicyAccepted: acceptPrivacyPolicy || false,
          privacyPolicyAcceptedAt: acceptPrivacyPolicy ? new Date() : null,
          termsAccepted: acceptTerms || false,
          termsAcceptedAt: acceptTerms ? new Date() : null,
          marketingAccepted: acceptMarketing || false,
          marketingAcceptedAt: acceptMarketing ? new Date() : null,
          // Belastingverantwoordelijkheid
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
          const referralCode = `REF${user.id.slice(0, 8).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`;
          
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

    // Generate email verification token and code
    const verificationToken = generateVerificationToken();
    const verificationCode = generateVerificationCode();
    const verificationExpires = getVerificationExpires();

    // Update user with verification data
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires
      }
    });

    let verificationEmailSent = false;
    let verificationEmailSkippedReason:
      | 'EMAIL_UNAVAILABLE'
      | 'EMAIL_NOT_CONFIGURED'
      | null = null;

    // Send verification email
    try {
      await sendVerificationEmail({
        email: normalizedEmail,
        name: name || username || 'Gebruiker',
        verificationToken,
        verificationCode
      });
      verificationEmailSent = true;
      logEmailVerificationDiag('email_verification_send_success', { context: 'register' });
    } catch (emailError) {
      logEmailSendFailure("register_verification", emailError, {
        recipientEmail: normalizedEmail,
      });
      logEmailVerificationDiag('email_verification_send_failed', {
        context: 'register',
        reason: summarizeEmailError(emailError, 120),
      });
      if (emailError instanceof EmailSendFailure) {
        verificationEmailSkippedReason =
          emailError.apiCode === 'EMAIL_NOT_CONFIGURED'
            ? 'EMAIL_NOT_CONFIGURED'
            : 'EMAIL_UNAVAILABLE';
      } else {
        const msg = emailError instanceof Error ? emailError.message : String(emailError);
        if (msg.includes('RESEND_API_KEY_NOT_CONFIGURED')) {
          verificationEmailSkippedReason = 'EMAIL_NOT_CONFIGURED';
        } else if (msg.includes('Email service unavailable')) {
          verificationEmailSkippedReason = 'EMAIL_UNAVAILABLE';
        }
      }
    }

    // Als bedrijf met abonnement: start Stripe Checkout direct
    let checkoutUrl: string | null = null;
    // Standaard: homepage met gemengde feed; verkopers met bedrijf naar sell-flow
    let redirectUrl = "/";

    if (isBusiness && hasSellerRole) {
      redirectUrl = "/sell";
    } else if (userRole === 'SELLER') {
      redirectUrl = "/";
    } else if (userRole === 'BUYER') {
      redirectUrl = "/";
    }

    const requiresPayment = false; // Abonnement wordt na registratie gekozen op /sell
    console.log(`🔵 [REGISTER] Response: requiresPayment=${requiresPayment}, checkoutUrl=${checkoutUrl ? 'SET' : 'NULL'}, redirectUrl=${redirectUrl}`);

    return NextResponse.json({ 
      ok: true, 
      redirectUrl,
      checkoutUrl, // Als bedrijf met abonnement: Stripe Checkout URL
      requiresPayment,
      needsVerification: true,
      verificationEmailSent,
      verificationEmailSkippedReason,
      user: {
        id: user.id,
        email: normalizedEmail,
        name,
        username: usernameTrim,
        role: userRole
      }
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
        return NextResponse.json(
          { error: "Deze gebruikersnaam is al in gebruik. Kies een andere gebruikersnaam." },
          { status: 400 },
        );
      }
    }

    // Handle specific Prisma errors
    if (e instanceof Error) {
      // Unique constraint violations
      if (e.message.includes('Unique constraint') || e.message.includes('UNIQUE constraint')) {
        if (e.message.includes('email')) {
          return NextResponse.json({ error: "Dit e-mailadres is al geregistreerd. Gebruik een ander e-mailadres." }, { status: 400 });
        }
        if (e.message.includes('username')) {
          return NextResponse.json({ error: "Deze gebruikersnaam is al in gebruik. Kies een andere gebruikersnaam." }, { status: 400 });
        }
        return NextResponse.json({ error: "Deze gegevens zijn al in gebruik. Controleer je e-mailadres en gebruikersnaam." }, { status: 400 });
      }
      
      // Foreign key constraint violations
      if (e.message.includes('Foreign key constraint') || e.message.includes('FOREIGN KEY constraint')) {
        return NextResponse.json({ error: "Er is een probleem met de geselecteerde gegevens. Controleer je selecties en probeer opnieuw." }, { status: 400 });
      }
      
      // Invalid data format
      if (e.message.includes('Invalid value') || e.message.includes('invalid input')) {
        return NextResponse.json({ error: "Een of meer gegevens zijn ongeldig. Controleer alle ingevulde velden." }, { status: 400 });
      }
      
      // Required field violations
      if (e.message.includes('Required field') || e.message.includes('NOT NULL constraint')) {
        return NextResponse.json({ error: "Niet alle verplichte velden zijn ingevuld. Controleer je gegevens." }, { status: 400 });
      }
      
      // Database connection issues
      if (e.message.includes('connect') || e.message.includes('timeout')) {
        return NextResponse.json({ error: "Er is een verbindingsprobleem. Probeer het over een paar minuten opnieuw." }, { status: 503 });
      }
    }
    
    // Generic error fallback
    return NextResponse.json({ 
      error: "ACCOUNT_CREATION_ERROR" 
    }, { status: 500 });
  }
}
