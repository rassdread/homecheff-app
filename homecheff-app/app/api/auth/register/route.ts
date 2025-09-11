import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Ongeldige body" }, { status: 400 });

    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      isBusiness, 
      company, 
      username, 
      gender,
      userTypes,
      selectedBuyerType,
      interests,
      location,
      bio,
      bankName,
      iban,
      accountHolderName
    } = body as any;
    
    if (!email || !password) {
      return NextResponse.json({ error: "E-mail en wachtwoord vereist" }, { status: 400 });
    }

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Voornaam en achternaam zijn vereist" }, { status: 400 });
    }

    const name = `${firstName} ${lastName}`.trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "E-mail bestaat al" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Determine user role based on userTypes
    const hasSellerRole = userTypes && userTypes.length > 0;
    const userRole = hasSellerRole ? UserRole.SELLER : UserRole.BUYER;

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
          interests: interests || [],
          SellerProfile: {
            create: {
              id: uuidv4(),
              displayName: name,
              bio: bio || null,
              lat: null,
              lng: null,
              btw: null,
              companyName: company?.name || null,
              kvk: company?.kvkNumber || null,
              subscriptionId: null,
              subscriptionValidUntil: null
            }
          }
        },
        select: { id: true }
      });
      
      // Create Business record if company data is provided
      if (isBusiness && company?.name) {
        await prisma.business.create({
          data: {
            userId: user.id,
            name: company.name,
            kvkNumber: company.kvkNumber,
            vatNumber: company.vatNumber,
            address: company.address,
            city: company.city,
            country: company.country || "NL",
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
          interests: interests || []
        },
        select: { id: true }
      });
    }

    const next = hasSellerRole ? "/onboarding/seller" : "/onboarding/buyer";
    return NextResponse.json({ ok: true, userId: user.id, next });
  } catch (e) {
    console.error("Register error:", e);
    
    // Handle specific Prisma errors
    if (e instanceof Error) {
      if (e.message.includes('Unique constraint')) {
        return NextResponse.json({ error: "Gebruikersnaam of e-mail bestaat al" }, { status: 400 });
      }
      if (e.message.includes('Invalid value')) {
        return NextResponse.json({ error: "Ongeldige gegevens ontvangen" }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      error: "Er is een fout opgetreden bij het aanmaken van je account. Probeer het opnieuw." 
    }, { status: 500 });
  }
}
