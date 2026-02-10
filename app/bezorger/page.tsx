import { redirect } from 'next/navigation';

export default function BezorgerPage() {
  // Redirect to delivery dashboard
  redirect('/delivery/dashboard');
}

