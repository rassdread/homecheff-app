import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function DeliveryProfielPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;

  // Get user's username to redirect to their profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      DeliveryProfile: {
        select: { id: true }
      }
    }
  });

  if (!user || !user.DeliveryProfile) {
    redirect('/delivery/signup');
  }

  // Redirect to public profile page
  redirect(`/bezorger/${user.username || userId}`);
}

