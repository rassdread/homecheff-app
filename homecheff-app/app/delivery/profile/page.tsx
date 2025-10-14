import { auth } from '@/lib/auth';
<parameter name="redirect">'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function DeliveryProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;

  // Get user's username to redirect to their bezorger profile
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

  // Redirect to bezorger profile page (the updated one with roles)
  redirect(`/bezorger/${user.username || userId}`);
}

