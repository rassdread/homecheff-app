import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Example: extract id from the URL
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  return new Response(JSON.stringify({ message: `Listing details for id: ${id}` }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
