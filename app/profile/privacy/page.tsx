import { redirect } from 'next/navigation';

/** Legacy privacy settings URL → central settings hub. */
export default function ProfilePrivacyRedirectPage() {
  redirect('/settings?tab=privacy');
}
