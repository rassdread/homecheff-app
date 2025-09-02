'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

export default function NavBar() {
  const { data: session, status } = useSession();
  const user = session && 'user' in session ? (session.user as typeof session['user'] & { profileImage?: string }) : undefined;

  return (
    <header className="w-full border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold">HomeCheff</Link>
        <nav className="flex items-center gap-3">
          <Link href="/"><Button variant="ghost">Feed</Button></Link>

          {status !== 'loading' && !user && (
            <>
              <Link href="/login"><Button>Inloggen</Button></Link>
              <Link href="/register"><Button variant="outline">Aanmelden</Button></Link>
            </>
          )}

          {user && (
            <>
              <Link href="/profile" className="flex items-center gap-2">
                {user.profileImage && (
                  <Image
                    src={user.profileImage}
                    alt="Profielfoto"
                    width={28}
                    height={28}
                    className="rounded-full border"
                  />
                )}
                <Button variant="outline">Profiel</Button>
              </Link>
              <Button onClick={() => signOut({ callbackUrl: '/' })}>Uitloggen</Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
