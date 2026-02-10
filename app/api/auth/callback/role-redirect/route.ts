import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // Redirect everyone to inspiratie (standaard startpagina)
    return NextResponse.redirect(new URL('/inspiratie', req.url));
  } catch (error) {
    console.error('Role redirect error:', error);
    return NextResponse.redirect(new URL('/inspiratie', req.url));
  }
}
