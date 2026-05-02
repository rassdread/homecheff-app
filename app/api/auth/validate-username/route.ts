import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { validateUsernameCandidate } from "@/lib/username-validation";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        {
          available: false,
          valid: false,
          message: "Gebruikersnaam is verplicht",
          error: "Gebruikersnaam is verplicht",
        },
        { status: 400 }
      );
    }

    const result = await validateUsernameCandidate(username);

    return NextResponse.json({
      available: result.available,
      valid: result.available,
      message: result.message,
      error: result.available ? null : result.message,
    });
  } catch (error) {
    console.error("Username validation error:", error);
    return NextResponse.json(
      {
        available: false,
        valid: false,
        message: "Er is een fout opgetreden bij het valideren van de gebruikersnaam",
        error: "Er is een fout opgetreden bij het valideren van de gebruikersnaam",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    const result = await validateUsernameCandidate(username);

    return NextResponse.json({
      available: result.available,
      valid: result.available,
      error: result.available ? null : result.message,
      message: result.message,
    });
  } catch (error) {
    console.error("Username validation error:", error);
    return NextResponse.json(
      {
        available: false,
        valid: false,
        error: "Er is een fout opgetreden bij het valideren van de gebruikersnaam",
        message: "Er is een fout opgetreden bij het valideren van de gebruikersnaam",
      },
      { status: 500 }
    );
  }
}
