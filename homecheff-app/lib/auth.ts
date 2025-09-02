/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

type Role = "BUYER" | "SELLER" | "ADMIN";
type AppUser = { id: string; email: string; role: Role };

export const authOptions: NextAuthOptions = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Inloggen",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Wachtwoord", type: "password" },
      },
      async authorize(credentials): Promise<AppUser | null> {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, role: user.role as Role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as AppUser;
        (token as { role?: Role }).role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: Role }).role = (token as { role?: Role }).role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        const u = new URL(url, baseUrl);
        if (u.pathname === '/login' || u.pathname === '/auth/signin') return baseUrl + '/';
      } catch {}
      return url.startsWith(baseUrl) ? url : baseUrl + '/';
    },
  },
};

export const { auth } = NextAuth(authOptions);
