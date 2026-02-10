import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import VariabelenDashboard from '@/components/admin/VariabelenDashboard';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function VariabelenPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { 
      id: true,
      role: true,
      adminRoles: true,
      email: true,
      name: true,
      username: true 
    }
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    redirect('/');
  }
  
  return <VariabelenDashboard />;
}
