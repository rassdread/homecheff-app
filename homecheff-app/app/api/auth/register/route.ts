import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Ongeldige body" }, { status: 400 });

    const { name, email, password, isCompany, company } = body as any;
    if (!email || !password) {
      return NextResponse.json({ error: "E-mail en wachtwoord vereist" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "E-mail bestaat al" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    let user;
    if (isCompany) {
      const { v4: uuidv4 } = require('uuid');
      user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: hashed,
          role: UserRole.SELLER,
            SellerProfile: {
            create: {
              id: uuidv4(),
              displayName: name,
              bio: null,
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
      if (company?.name) {
  await prisma.business.create({
          data: {
            userId: user.id,
            name: company.name,
            kvkNumber: company.kvkNumber,
            vatNumber: company.vatNumber,
            address: company.address,
            city: company.city,
            country: company.country || "NL",
            verified: false,
          },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: hashed,
          role: UserRole.BUYER,
        },
        select: { id: true }
      });
    }

    const next = isCompany ? "/onboarding/seller" : "/onboarding/buyer";
    return NextResponse.json({ ok: true, userId: user.id, next });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Fout bij registratie" }, { status: 500 });
  }
}
