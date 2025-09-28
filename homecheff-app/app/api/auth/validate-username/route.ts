import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ 
        valid: false, 
        error: "Gebruikersnaam is verplicht" 
      }, { status: 400 });
    }

    // Gebruikersnaam validatie regels
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ 
        valid: false, 
        error: "Gebruikersnaam moet 3-20 karakters lang zijn en alleen letters, cijfers en underscores bevatten" 
      }, { status: 400 });
    }

    // Controleer of gebruikersnaam al bestaat
    const existingUser = await prisma.user.findUnique({ 
      where: { username: username.toLowerCase() } 
    });

    if (existingUser) {
      return NextResponse.json({ 
        valid: false, 
        error: "Deze gebruikersnaam is al in gebruik. Kies een andere gebruikersnaam." 
      }, { status: 400 });
    }

    // Controleer gereserveerde woorden
    const reservedWords = [
      'admin', 'administrator', 'homecheff', 'api', 'www', 'mail', 'support', 
      'help', 'info', 'contact', 'about', 'terms', 'privacy', 'login', 'register',
      'dashboard', 'profile', 'settings', 'logout', 'user', 'users', 'seller',
      'buyer', 'delivery', 'order', 'orders', 'product', 'products', 'message',
      'messages', 'conversation', 'conversations', 'review', 'reviews', 'favorite',
      'favorites', 'follow', 'follows', 'notification', 'notifications'
    ];

    if (reservedWords.includes(username.toLowerCase())) {
      return NextResponse.json({ 
        valid: false, 
        error: "Deze gebruikersnaam is gereserveerd. Kies een andere gebruikersnaam." 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      valid: true, 
      message: "Gebruikersnaam is beschikbaar!" 
    });

  } catch (error) {
    console.error('Username validation error:', error);
    return NextResponse.json({ 
      valid: false, 
      error: "Er is een fout opgetreden bij het valideren van de gebruikersnaam" 
    }, { status: 500 });
  }
}








