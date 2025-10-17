import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
// import { UserRole } from "@prisma/client";
import { geocodeAddress } from "@/lib/global-geocoding";

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
      acceptTaxResponsibility
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

    // Bedrijfsgegevens validatie voor business accounts
    if (isBusiness) {
      if (!company || company.trim().length === 0) {
        return NextResponse.json({ error: "Bedrijfsnaam is verplicht voor bedrijfsaccounts" }, { status: 400 });
      }
      if (!kvk || kvk.trim().length === 0) {
        return NextResponse.json({ error: "KVK-nummer is verplicht voor bedrijfsaccounts" }, { status: 400 });
      }
      if (!/^[0-9]{8}$/.test(kvk.replace(/\s/g, ''))) {
        return NextResponse.json({ error: "KVK-nummer moet 8 cijfers bevatten" }, { status: 400 });
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

    // Geocode address if provided
    let lat: number | null = null;
    let lng: number | null = null;
    
    if (address && city) {
      console.log('Geocoding address during registration:', { address, city, country });
      const geocodeResult = await geocodeAddress(address, city, country || 'NL');
      
      if (geocodeResult.error) {
        console.warn('Geocoding failed during registration:', geocodeResult.error);
        // Continue without coordinates - user can still register
      } else {
        lat = geocodeResult.lat;
        lng = geocodeResult.lng;
        console.log('Geocoding successful during registration:', { lat, lng });
      }
    }

    // Determine user role based on userTypes
    const hasSellerRole = userTypes && userTypes.length > 0;
    const userRole = hasSellerRole ? 'SELLER' : 'BUYER';

    let user;
    if (hasSellerRole) {
      const { v4: uuidv4 } = require('uuid');
      
      // Get subscription if provided
      let subscriptionData: any = null;
      if (subscription) {
        subscriptionData = await prisma.subscription.findUnique({ 
          where: { id: subscription, isActive: true } 
        });
        if (!subscriptionData) {
          return NextResponse.json({ error: "Ongeldig abonnement" }, { status: 400 });
        }
      }
      
      user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: hashed,
          role: userRole,
          username,
          gender,
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
              subscriptionId: (subscriptionData as any)?.id || null,
              subscriptionValidUntil: subscriptionData ? 
                new Date(Date.now() + (subscriptionData as any).durationDays * 24 * 60 * 60 * 1000) : null
            }
          }
        },
        select: { id: true }
      });
      
      // Create Business record if company data is provided
      if (isBusiness && company) {
        await prisma.business.create({
          data: {
            userId: user.id,
            name: company,
            kvkNumber: kvk,
            vatNumber: btw,
            address: null,
            city: null,
            country: "NL",
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

    // Bepaal redirect URL op basis van rol
    let redirectUrl = "/"; // Default naar homepage
    
    if (userRole === 'SELLER') {
      redirectUrl = "/profile"; // Verkopers naar profielpagina
    } else if (userRole === 'BUYER') {
      redirectUrl = "/"; // Kopers naar homepage
    }

    return NextResponse.json({ 
      ok: true, 
      redirectUrl,
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
      error: "Er is een onverwachte fout opgetreden bij het aanmaken van je account. Probeer het opnieuw of neem contact op met de support." 
    }, { status: 500 });
  }
}
