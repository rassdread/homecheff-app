export function localityFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  const last = parts[parts.length - 1] ?? '';
  const city = last.replace(/^\d{4}\s?[A-Za-z]{2}\s+/, '').trim();
  return city || null;
}

/** City name for the courier's own screen. Exact coordinates stay off the response. */
export async function placeLabelForCoordinates(
  lat: number,
  lng: number,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  try {
    const url = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&rows=1&fl=woonplaatsnaam`;
    const response = await fetchImpl(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const body = await response.json() as {
      response?: { docs?: Array<{ woonplaatsnaam?: string }> };
    };
    const place = body.response?.docs?.[0]?.woonplaatsnaam?.trim();
    return place || null;
  } catch {
    return null;
  }
}
