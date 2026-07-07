import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Alias only (CE-2A.7, Option A) — the unified hub lives at /profile/deals. */
export default function AgreementsAliasPage() {
  redirect('/profile/deals');
}
