import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
    const { name, kvkNumber, vatNumber, country = "NL" } = await req.json();
    const KVK_KEY = process.env.KVK_API_KEY;
    const USE_VIES = process.env.VIES_ENABLED === "true";

    let kvkValid: boolean | null = null;
    let vatValid: boolean | null = null;

    if (kvkNumber && KVK_KEY) {
      // TODO: vervang met echte KvK API call via jouw provider
      kvkValid = true;
    }
    if (vatNumber && USE_VIES) {
      // TODO: vervang met echte VIES check (EU VAT)
      vatValid = true;
    }

    const verified = (kvkValid === true || vatValid === true);

    return NextResponse.json({
      verified,
      kvkValid,
      vatValid,
      message: verified ? "Bedrijf lijkt geldig (voorlopige check)." : "Kon bedrijf niet verifiëren (configureer KvK/VIES)."
    });
  } catch (e) {
    return NextResponse.json({ error: "Verificatie mislukt" }, { status: 500 });
  }
}
