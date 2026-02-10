import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { processAttributionOnSignup } from "@/lib/affiliate-attribution";

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
      acceptTaxResponsibility,
      subAffiliateInviteToken // Token voor sub-affiliate invite
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
          const { randomBytes } = await import('crypto');
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
      message: "ACCOUNT_CREATED_SUCCESS"
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
      error: "ACCOUNT_CREATION_ERROR" 
    }, { status: 500 });
  }
}
