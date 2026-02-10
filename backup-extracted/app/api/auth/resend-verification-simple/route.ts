import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "E-mailadres ontbreekt." }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Geen gebruiker gevonden met dit e-mailadres." }, { status: 404 });
    }

    // For now, just send a new verification email
    const verificationToken = randomBytes(32).toString('hex');
    
    await sendVerificationEmail({ 
      email, 
      name: user.name || user.username || 'Gebruiker', 
      verificationToken 
    });

    return NextResponse.json({ message: "Een nieuwe verificatie-e-mail is verzonden. Controleer je inbox." }, { status: 200 });
  } catch (error) {
    console.error("Resend verification email error:", error);
    return NextResponse.json({ error: "Er is een fout opgetreden bij het opnieuw verzenden van de verificatie-e-mail." }, { status: 500 });
  }
}


