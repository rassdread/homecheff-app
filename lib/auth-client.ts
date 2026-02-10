'use client';

import { create } from 'zustand';

type User = {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'BUYER' | 'SELLER';
  name?: string | null;
  profileImage?: string | null;
};

type AuthState = {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
  hydrate: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  setUser: (u) => {
    if (typeof window !== 'undefined') {
      if (u) localStorage.setItem('hc:user', JSON.stringify(u));
      else localStorage.removeItem('hc:user');
    }
    set({ user: u });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hc:user');
      // eventueel: call server logout endpoint als je die hebt
      window.location.href = '/'; // terug naar home
    }
    set({ user: null });
  },
  hydrate: () => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('hc:user');
      if (raw) {
        try { set({ user: JSON.parse(raw) }); } catch {}
      }
    }
  }
}));
