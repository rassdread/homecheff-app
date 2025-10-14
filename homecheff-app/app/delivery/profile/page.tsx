import { redirect } from 'next/navigation';

// Redirect delivery profile to main profile page
export default async function DeliveryProfilePage() {
  redirect('/profile');
}
