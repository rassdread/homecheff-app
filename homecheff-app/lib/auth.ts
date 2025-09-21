/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

type Role = UserRole;
type AppUser = { id: string; email: string; role: Role; name?: string; image?: string };

export const authOptions: NextAuthOptions = {
  pages: { signIn: "/login" },
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "Inloggen",
      credentials: {
        emailOrUsername: { label: "Email of Gebruikersnaam", type: "text" },
        password: { label: "Wachtwoord", type: "password" },
      },
      async authorize(credentials): Promise<AppUser | null> {
        if (!credentials?.emailOrUsername || !credentials?.password) return null;
        
        // Check if input is email or username
        const isEmail = credentials.emailOrUsername.includes('@');
        const user = isEmail 
          ? await prisma.user.findUnique({ where: { email: credentials.emailOrUsername } })
          : await prisma.user.findUnique({ where: { username: credentials.emailOrUsername } });
          
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return { 
          id: user.id, 
          email: user.email, 
          role: user.role as Role,
          name: user.name,
          image: user.image
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        try {
          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (!existingUser) {
            // Create new user for social login with enhanced profile
            const nameParts = (user.name || "").split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";
            
            existingUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || "",
                username: user.email!.split('@')[0],
                image: user.image,
                passwordHash: "", // No password for social users
                role: UserRole.BUYER,
                // Add some default interests for social users
                interests: ["Koken", "Lokaal", "Duurzaamheid"],
                bio: "Welkom op HomeCheff! Mijn profiel is aangemaakt via social login.",
              }
            });
          }

          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        const u = user as AppUser;
        (token as { role?: Role }).role = u.role;
        (token as { id?: string }).id = u.id;
        
        // For social login, get user from database
        if (account?.provider === "google" || account?.provider === "facebook") {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });
          if (dbUser) {
            token.role = dbUser.role as Role;
            token.id = dbUser.id;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: Role }).role = (token as { role?: Role }).role;
        (session.user as { id?: string }).id = (token as { id?: string }).id;
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// For server-side usage in API routes
export const auth = () => getServerSession(authOptions);
