import { redirect } from 'next/navigation';

/** Legacy seller settings → central settings hub. */
export default function VerkoperInstellingenRedirectPage() {
  redirect('/settings?tab=payments');
}
