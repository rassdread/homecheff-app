import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
// Define UserRole enum manually
enum UserRole {
  ADMIN = "ADMIN",
  BUYER = "BUYER",
  SELLER = "SELLER",
  DELIVERY = "DELIVERY"
}
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Registration attempt with data:', { 
      email: body.email, 
      isBusiness: body.isBusiness,
      hasBankData: !!(body.bankName || body.iban || body.accountHolderName)
    });
    
  const { email, password, firstName, lastName, username, gender, userTypes, selectedBuyerType, interests, location, bio, isBusiness, kvk, btw, company, subscription, bankName, iban, accountHolderName, isDelivery } = body;
  if (!email || !password)
      return NextResponse.json({ error: "Email en wachtwoord vereist" }, { status: 400 });

  // Check if user has at least one role or buyer type
  if ((!userTypes || userTypes.length === 0) && !selectedBuyerType && !isDelivery) {
    return NextResponse.json({ error: "Selecteer tenminste één rol of koper type" }, { status: 400 });
  }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "E-mail bestaat al" }, { status: 409 });

    if (!username) return NextResponse.json({ error: "Gebruikersnaam vereist" }, { status: 400 });
    const usernameExists = await prisma.user.findUnique({ where: { username } });
    if (usernameExists) return NextResponse.json({ error: "Gebruikersnaam bestaat al" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  
  // Determine user role based on selections
  let roleValue = UserRole.BUYER; // Default to buyer
  if (isDelivery) {
    roleValue = UserRole.DELIVERY;
  } else if (isBusiness) {
    roleValue = UserRole.SELLER;
  } else if (userTypes && userTypes.length > 0) {
    roleValue = UserRole.SELLER; // Has selling roles
  } else if (selectedBuyerType) {
    roleValue = UserRole.BUYER; // Only buyer type selected
  }
  
  let user;
  if (isBusiness) {
      if (!kvk || !btw || !company || !subscription) {
        return NextResponse.json({ error: "Bedrijfsinfo en abonnement vereist" }, { status: 400 });
      }
  const sub = await prisma.subscription.findUnique({ where: { id: subscription, isActive: true } });
      if (!sub) {
        return NextResponse.json({ error: "Ongeldig abonnement" }, { status: 400 });
      }
      user = await prisma.user.create({
        data: {email,
          passwordHash,
          role: roleValue,
          username,
          name: `${firstName} ${lastName}`.trim(),
          interests: interests || [],
          place: location,
          bio,
          SellerProfile: {
            create: {
              id: randomUUID(),
              kvk,
              btw,
              companyName: company,
              subscriptionId: sub.id,
              subscriptionValidUntil: new Date(Date.now() + sub.durationDays * 24 * 60 * 60 * 1000),
              displayName: username,
            },
          },
        },
        select: { id: true, email: true, username: true, name: true },
      });
    } else if (isDelivery) {
      // Create delivery user with DeliveryProfile
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: `${firstName} ${lastName}`.trim(),
          username,
          gender,
          interests: interests || [],
          place: location,
          bio,
          role: roleValue,
          DeliveryProfile: {
            create: {
              age: 25, // Default age, should be updated by user
              bio: bio || `Bezorger uit ${location || 'Nederland'}`,
              transportation: ['BIKE'], // Default to bike
              maxDistance: 5.0,
            }
          }
        },
        select: { id: true, email: true, username: true, name: true },
      });
    } else {
  // roleValue is already determined above
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: `${firstName} ${lastName}`.trim(),
          username,
          gender,
          interests: interests || [],
          place: location,
          bio,
          role: roleValue,
        },
        select: { id: true, email: true, username: true, name: true },
      });
    }
    // Determine redirect URL based on role
    let redirectUrl = "/";
    if (roleValue === UserRole.SELLER) {
      redirectUrl = "/verkoper/dashboard?welcome=true&newUser=true";
    } else if (roleValue === UserRole.DELIVERY) {
      redirectUrl = "/delivery/dashboard?welcome=true&newUser=true";
    } else if (roleValue === UserRole.BUYER) {
      redirectUrl = "/?welcome=true&newUser=true";
    }
    
    return NextResponse.json({ 
      ok: true, 
      user,
      redirectUrl,
      role: roleValue 
    });
  } catch (e) {
    console.error("Registration error:", e);
    console.error("Error stack:", e instanceof Error ? e.stack : 'No stack trace');
    console.error("Error message:", e instanceof Error ? e.message : String(e));
    
    return NextResponse.json({ 
      error: "Server error", 
      details: process.env.NODE_ENV === 'development' ? String(e) : undefined,
      message: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
}
