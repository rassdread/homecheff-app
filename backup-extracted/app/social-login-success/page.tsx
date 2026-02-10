import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function SocialLoginSuccessPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    const needsOnboarding = (session.user as any).needsOnboarding;
    const tempUsername = (session.user as any).tempUsername;
    const username = (session.user as any).username;

    if (!needsOnboarding && !tempUsername && username && !username.startsWith('temp_')) {
      redirect('/');
    }
  }

  const baseUrl = process.env.NEXTAUTH_URL || '';
  redirect(`${baseUrl.replace(/\/$/, '')}/register?social=true`);
}
