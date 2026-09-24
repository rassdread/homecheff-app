import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Legacy typo route. One affiliate join flow lives on /affiliate. */
export default function AviliateAliasPage() {
  redirect('/affiliate');
}
