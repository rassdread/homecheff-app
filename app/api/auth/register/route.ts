import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
// import { UserRole } from "@prisma/client";
import { geocodeAddress } from "@/lib/global-geocoding";
import { stripe, PLAN_TO_PRICE, normalizeSubscriptionName } from "@/lib/stripe";
import { processAttributionOnSignup } from "@/lib/affiliate-attribution";
import { randomBytes } from "crypto";
import { generateVerificationToken, generateVerificationCode, getVerificationExpires } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Geen gegevens ontvangen. Probeer het opnieuw." }, { status: 400 });

    const { 
      firstName, 
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
      subAffiliateInviteToken
    } = body as any;
    
    // Validatie van verplichte velden met specifieke foutmeldingen
    if (!email) {
      return NextResponse.json({ error: "E-mailadres is verplicht" }, { status: 400 });
    }
    
    if (!password) {
      return NextResponse.json({ error: "Wachtwoord is verplicht" }, { status: 400 });
    }
    
    if (!firstName) {
      return NextResponse.json({ error: "Voornaam is verplicht" }, { status: 400 });
    }
    
    if (!lastName) {
      return NextResponse.json({ error: "Achternaam is verplicht" }, { status: 400 });
    }

    // E-mail validatie
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Voer een geldig e-mailadres in (bijvoorbeeld: naam@voorbeeld.nl)" }, { status: 400 });
    }

    // Wachtwoord validatie
    if (password.length < 6) {
      return NextResponse.json({ error: "Wachtwoord moet minimaal 6 tekens lang zijn" }, { status: 400 });
    }

    // Gebruikersnaam validatie (indien opgegeven)
    if (username) {
      if (username.length < 3 || username.length > 20) {
        return NextResponse.json({ error: "Gebruikersnaam moet tussen 3 en 20 tekens lang zijn" }, { status: 400 });
      }
      
      // Allow letters, numbers, underscores, dots and dashes
      if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
        return NextResponse.json({ error: "Gebruikersnaam mag alleen letters, cijfers, - . en _ bevatten" }, { status: 400 });
      }
      
      // Check reserved usernames
      const reservedWords = [
        'admin', 'administrator', 'homecheff', 'api', 'www', 'mail', 'support', 
        'help', 'info', 'contact', 'about', 'terms', 'privacy', 'login', 'register',
        'dashboard', 'profile', 'settings', 'logout', 'user', 'users', 'seller',
        'buyer', 'delivery', 'order', 'orders', 'product', 'products', 'message',
        'messages', 'conversation', 'conversations', 'review', 'reviews', 'favorite',
        'favorites', 'follow', 'follows', 'notification', 'notifications'
      ];
      
      if (reservedWords.includes(username.toLowerCase())) {
        return NextResponse.json({ error: "Deze gebruikersnaam is gereserveerd. Kies een andere gebruikersnaam." }, { status: 400 });
      }
    }

    // Validatie van gebruikersrollen - alleen als er geen selectedBuyerType is
    if ((!userTypes || userTypes.length === 0) && !selectedBuyerType) {
      return NextResponse.json({ error: "Selecteer minimaal één gebruikersrol (Koper of Verkoper)" }, { status: 400 });
    }

    // Privacy en voorwaarden validatie
    if (!acceptPrivacyPolicy) {
      return NextResponse.json({ error: "Je moet de privacyverklaring accepteren om door te gaan" }, { status: 400 });
    }
    
    if (!acceptTerms) {
      return NextResponse.json({ error: "Je moet de algemene voorwaarden accepteren om door te gaan" }, { status: 400 });
    }

    // Belastingverantwoordelijkheid validatie voor verkopers
    if (userTypes && userTypes.length > 0 && userTypes.some(type => ['chef', 'garden', 'designer'].includes(type)) && !acceptTaxResponsibility) {
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

    const name = `${firstName} ${lastName}`.trim();

    // Controleer of e-mail al bestaat
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Dit e-mailadres is al geregistreerd. Gebruik een ander e-mailadres of probeer in te loggen." }, { status: 400 });
    }

    // Controleer of gebruikersnaam al bestaat (indien opgegeven)
    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) {
        return NextResponse.json({ error: "Deze gebruikersnaam is al in gebruik. Kies een andere gebruikersnaam." }, { status: 400 });
      }
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

    // Determine user role based on userTypes
    const hasSellerRole = userTypes && userTypes.length > 0;
    const userRole = hasSellerRole ? 'SELLER' : 'BUYER';

    let user;
    if (hasSellerRole) {
      const { v4: uuidv4 } = require('uuid');
      
      // Get subscription if provided
      user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: hashed,
          role: userRole,
          username,
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
          sellerRoles: userTypes || [], // Store seller roles
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
          email,
          passwordHash: hashed,
          role: userRole,
          username, 
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
          buyerRoles: selectedBuyerType ? [selectedBuyerType] : [], // Store buyer type
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

    // Process sub-affiliate invite if token is provided
    if (subAffiliateInviteToken) {
      try {
        const invite = await prisma.subAffiliateInvite.findUnique({
          where: { inviteToken: subAffiliateInviteToken },
          include: {
            parentAffiliate: true,
          },
        });

        if (invite && invite.status === 'PENDING' && invite.expiresAt > new Date() && invite.email.toLowerCase() === email.toLowerCase()) {
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

    // Send verification email
    try {
      await sendVerificationEmail({
        email,
        name: name || username || 'Gebruiker',
        verificationToken,
        verificationCode
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email sending fails
    }

    // Als bedrijf met abonnement: start Stripe Checkout direct
    let checkoutUrl: string | null = null;
    // Bepaal redirect URL op basis van rol - focus op inspiratie
    let redirectUrl = "/inspiratie"; // Default naar inspiratie (nieuwe startpagina)
    
    if (isBusiness && hasSellerRole) {
      redirectUrl = "/sell"; // Bedrijven kiezen hun abonnement na registratie via de sell-pagina
    } else if (userRole === 'SELLER') {
      redirectUrl = "/inspiratie"; // Verkopers zonder bedrijf gaan naar inspiratie
    } else if (userRole === 'BUYER') {
      redirectUrl = "/inspiratie"; // Kopers naar inspiratie (nieuwe startpagina)
    }

    const requiresPayment = false; // Abonnement wordt na registratie gekozen op /sell
    console.log(`🔵 [REGISTER] Response: requiresPayment=${requiresPayment}, checkoutUrl=${checkoutUrl ? 'SET' : 'NULL'}, redirectUrl=${redirectUrl}`);

    return NextResponse.json({ 
      ok: true, 
      redirectUrl,
      checkoutUrl, // Als bedrijf met abonnement: Stripe Checkout URL
      requiresPayment,
      needsVerification: true, // Indicate that email verification is required
      verificationCode: verificationCode, // Return code for immediate display in popup
      user: {
        id: user.id,
        email,
        name,
        username,
        role: userRole
      }
    });
  } catch (e) {
    console.error("Register error:", e);
    
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
