import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // Username changes are no longer allowed after registration
  return NextResponse.json({ 
    error: "Gebruikersnaam kan niet worden gewijzigd na registratie" 
  }, { status: 400 });
}
