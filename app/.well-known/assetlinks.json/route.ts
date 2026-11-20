import { androidAssetLinksJson } from "@/lib/native/androidAssetLinks";

export const dynamic = "force-static";

export function GET() {
  return new Response(androidAssetLinksJson(), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
