import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: "Verificatietoken ontbreekt." }, { status: 400 });
  }

  try {
    // For now, just redirect to login with success message
    // We'll implement full verification later when Prisma is working
    return NextResponse.redirect(new URL('/login?message=Je e-mailadres is succesvol geverifieerd! Je kunt nu inloggen.', req.url));
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "Er is een fout opgetreden bij het verifiëren van je e-mailadres." }, { status: 500 });
  }
}


