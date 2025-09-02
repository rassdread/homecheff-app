import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
// Define UserRole enum manually
enum UserRole {
  ADMIN = "ADMIN",
  BUYER = "BUYER",
  SELLER = "SELLER"
}
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
  const { email, password, name, isBusiness, kvk, btw, company, subscription } = body;
  if (!email || !password)
      return NextResponse.json({ error: "Email en wachtwoord vereist" }, { status: 400 });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Bestaat al" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
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
        data: {
          email,
          passwordHash,
          role: UserRole.SELLER,
          SellerProfile: {
            create: {
              id: randomUUID(),
              kvk,
              btw,
              companyName: company,
              subscriptionId: sub.id,
              subscriptionValidUntil: new Date(Date.now() + sub.durationDays * 24 * 60 * 60 * 1000),
              displayName: company,
            },
          },
        },
        select: { id: true, email: true },
      });
    } else {
  const roleValue: UserRole = body.role === "ADMIN" ? UserRole.ADMIN : UserRole.BUYER;
      user = await prisma.user.create({
        data: { email, passwordHash, name, role: roleValue },
        select: { id: true, email: true },
      });
    }
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
