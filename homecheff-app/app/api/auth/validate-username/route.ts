import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";

async function validateUsername(username: string) {
  if (!username) {
    return { 
      available: false, 
      message: "Gebruikersnaam is verplicht" 
    };
  }

  // Gebruikersnaam validatie regels (allow - and . too)
  const usernameRegex = /^[a-zA-Z0-9_.-]{3,20}$/;
  
  if (!usernameRegex.test(username)) {
    return { 
      available: false, 
      message: "Gebruikersnaam moet 3-20 karakters lang zijn en alleen letters, cijfers, - . en _ bevatten" 
    };
  }

  // Controleer of gebruikersnaam al bestaat
  const existingUser = await prisma.user.findUnique({ 
    where: { username: username.toLowerCase() } 
  });

  if (existingUser) {
    return { 
      available: false, 
      message: "Deze gebruikersnaam is al in gebruik" 
    };
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
    return { 
      available: false, 
      message: "Deze gebruikersnaam is gereserveerd" 
    };
  }

  return { 
    available: true, 
    message: "Gebruikersnaam is beschikbaar!" 
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ 
        available: false,
        valid: false, 
        message: "Gebruikersnaam is verplicht",
        error: "Gebruikersnaam is verplicht"
      }, { status: 400 });
    }

    const result = await validateUsername(username);
    
    // Return both formats for compatibility
    return NextResponse.json({
      available: result.available,
      valid: result.available,
      message: result.message,
      error: result.available ? null : result.message
    });

  } catch (error) {
    console.error('Username validation error:', error);
    return NextResponse.json({ 
      available: false,
      valid: false,
      message: "Er is een fout opgetreden bij het valideren van de gebruikersnaam",
      error: "Er is een fout opgetreden bij het valideren van de gebruikersnaam"
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    const result = await validateUsername(username);
    
    // Return consistent format with GET
    return NextResponse.json({ 
      available: result.available,
      valid: result.available, 
      error: result.available ? null : result.message,
      message: result.message
    });

  } catch (error) {
    console.error('Username validation error:', error);
    return NextResponse.json({ 
      available: false,
      valid: false, 
      error: "Er is een fout opgetreden bij het valideren van de gebruikersnaam",
      message: "Er is een fout opgetreden bij het valideren van de gebruikersnaam"
    }, { status: 500 });
  }
}









