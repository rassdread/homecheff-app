import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export const dynamic = 'force-dynamic';

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
      kvk,
      btw,
      subscription,
      acceptPrivacyPolicy,
      acceptTerms,
      acceptMarketing,
      acceptTaxResponsibility
    } = body as any;
    
    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Alle verplichte velden moeten worden ingevuld." }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Voer een geldig e-mailadres in." }, { status: 400 });
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json({ error: "Wachtwoord moet minimaal 6 tekens lang zijn." }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Dit e-mailadres is al geregistreerd." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const name = `${firstName} ${lastName}`.trim();

    // Determine user role
    const hasSellerRole = userTypes && userTypes.length > 0;
    const userRole = hasSellerRole ? 'SELLER' : 'BUYER';

    // Generate email verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    let user;
    if (hasSellerRole) {
      const { v4: uuidv4 } = require('uuid');
      
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

    // Send verification email
    try {
      await sendVerificationEmail({
        email,
        name: name || username || 'Gebruiker',
        verificationToken
      });

    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email sending fails
    }

    return NextResponse.json({ 
      ok: true, 
      redirectUrl: "/login",
      user: {
        id: user.id,
        email,
        name,
        username,
        role: userRole
      },
      message: "Account succesvol aangemaakt! Je kunt nu inloggen."
    });
  } catch (e) {
    console.error("Register error:", e);
    
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
      error: "Er is een onverwachte fout opgetreden bij het aanmaken van je account. Probeer het opnieuw." 
    }, { status: 500 });
  }
}
