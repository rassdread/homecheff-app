import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Legacy debug dump — never public in Production.
 * Staff-only stub; full inventory belongs in admin tools.
 */
export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN" && role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(
    {
      ok: false,
      code: "DEBUG_ROUTE_DISABLED",
      message: "Use admin inventory tools. Public product debug dump is disabled.",
    },
    { status: 403 },
  );
}
