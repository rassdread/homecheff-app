'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { Button } from '@/components/ui/Button';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      // verwacht { ok: true, user: { id, email, role, ... } }
      if (data?.user) setUser(data.user);
      router.replace('/'); // redirect naar feed/home
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Inloggen mislukt');
    }
  }

  async function handleSocialLogin(provider: 'google' | 'facebook') {
    setError(null);
    setLoading(true);
    try {
      const result = await signIn(provider, { 
        callbackUrl: '/',
        redirect: false 
      });
      
      if (result?.error) {
        setError(`Inloggen met ${provider} mislukt`);
      } else if (result?.ok) {
        router.replace('/');
      }
    } catch (error) {
      setError(`Inloggen met ${provider} mislukt`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white p-6 rounded-2xl shadow w-full max-w-md space-y-3">
        <h1 className="text-2xl font-bold">Inloggen</h1>
        <input
          className="border rounded p-2 w-full"
          placeholder="E-mail"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="border rounded p-2 w-full"
          placeholder="Wachtwoord"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Bezig...' : 'Inloggen'}
        </Button>
        
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Of</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Bezig...' : 'Inloggen met Google'}
          </Button>
          
          <Button
            type="button"
            onClick={() => handleSocialLogin('facebook')}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Bezig...' : 'Inloggen met Facebook'}
          </Button>
        </div>
      </form>
    </main>
  );
}
