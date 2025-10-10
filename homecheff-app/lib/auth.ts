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
  // Force disable secure cookies to fix prefix issues
  useSecureCookies: false,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    }
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "email,public_profile",
        },
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
        };
      },
    }),
    Credentials({
      name: "Inloggen",
      credentials: {
        emailOrUsername: { label: "Email of Gebruikersnaam", type: "text" },
        password: { label: "Wachtwoord", type: "password" },
      },
      async authorize(credentials): Promise<AppUser | null> {
        try {
          if (!credentials?.emailOrUsername || !credentials?.password) {
            console.log('Missing credentials');
            return null;
          }
          
          // Check if input is email or username
          const isEmail = credentials.emailOrUsername.includes('@');
          console.log(`Looking for user with ${isEmail ? 'email' : 'username'}: ${credentials.emailOrUsername}`);
          
          const user = isEmail 
            ? await prisma.user.findUnique({ where: { email: credentials.emailOrUsername } })
            : await prisma.user.findUnique({ where: { username: credentials.emailOrUsername } });
            
          if (!user) {
            console.log('User not found');
            return null;
          }
          
          if (!user.passwordHash) {
            console.log('User has no password hash');
            return null;
          }
          
          console.log('User found, checking password...');
          const ok = await bcrypt.compare(credentials.password, user.passwordHash);
          console.log('Password check result:', ok);
          
          if (!ok) return null;
          
          console.log('Login successful for user:', user.email);
          return { 
            id: user.id, 
            email: user.email, 
            role: user.role as Role,
            name: user.name,
            image: user.image
          };
        } catch (error) {
          console.error('Error in authorize function:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        try {
          console.log('🔍 Social login data:', { 
            provider: account.provider, 
            userEmail: user.email, 
            userName: user.name,
            userImage: user.image,
            profile: profile 
          });

          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (!existingUser) {
            // Extract enhanced profile information
            const nameParts = (user.name || "").split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";
            
            // Generate unique username
            const baseUsername = user.email!.split('@')[0];
            let username = baseUsername;
            let counter = 1;
            
            // Ensure username is unique
            while (await prisma.user.findUnique({ where: { username } })) {
              username = `${baseUsername}${counter}`;
              counter++;
            }

            // Enhanced profile data based on provider
            let enhancedProfile = {
              email: user.email!,
              name: user.name || "",
              username: username,
              image: user.image,
              profileImage: user.image, // Also set as profile image
              passwordHash: "", // No password for social users
              role: UserRole.BUYER,
              interests: ["Koken", "Lokaal", "Duurzaamheid"],
              bio: `Welkom op HomeCheff! Mijn profiel is aangemaakt via ${account.provider === 'google' ? 'Google' : 'Facebook'} login.`,
            };

            // Add provider-specific data
            if (account.provider === "google" && profile) {
              enhancedProfile = {
                ...enhancedProfile,
                bio: profile.bio || enhancedProfile.bio,
                // Google might provide additional info
                place: profile.locale ? profile.locale.split('_')[1] : null, // Extract country from locale
              };
            }

            if (account.provider === "facebook" && profile) {
              enhancedProfile = {
                ...enhancedProfile,
                bio: profile.bio || enhancedProfile.bio,
                place: profile.location?.name || null,
                // Facebook might provide additional info
              };
            }
            
            existingUser = await prisma.user.create({
              data: enhancedProfile
            });

            console.log('✅ New social user created:', {
              id: existingUser.id,
              email: existingUser.email,
              username: existingUser.username,
              provider: account.provider
            });
          } else {
            // Update existing user with latest social data
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                image: user.image || existingUser.image,
                profileImage: user.image || existingUser.profileImage,
                name: user.name || existingUser.name,
              }
            });

            console.log('✅ Existing social user updated:', {
              id: existingUser.id,
              email: existingUser.email,
              provider: account.provider
            });
          }

          return true;
        } catch (error) {
          console.error("❌ Error in signIn callback:", error);
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
      if (session.user && token) {
        (session.user as { role?: Role }).role = (token as { role?: Role }).role;
        (session.user as { id?: string }).id = (token as { id?: string }).id;
        console.log('Session callback:', { 
          user: session.user.email, 
          hasRole: !!(token as any).role,
          hasId: !!(token as any).id,
          token: Object.keys(token)
        });
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Use NEXTAUTH_URL from environment, or fallback to baseUrl
      const actualBaseUrl = process.env.NEXTAUTH_URL || baseUrl;
      console.log('🔍 NextAuth redirect:', { url, baseUrl, actualBaseUrl });
      
      try {
        // If url is relative or starts with /, return it with actualBaseUrl
        if (url.startsWith('/')) {
          console.log('🔍 Relative URL, using actualBaseUrl');
          return actualBaseUrl + url;
        }
        
        // If url is absolute and starts with actualBaseUrl, return it
        if (url.startsWith(actualBaseUrl)) {
          console.log('🔍 Absolute URL with correct base, returning as-is');
          return url;
        }
        
        // Otherwise, extract path and use actualBaseUrl
        const u = new URL(url);
        console.log('🔍 Redirecting to:', actualBaseUrl + u.pathname);
        return actualBaseUrl + u.pathname + u.search;
      } catch (error) {
        console.error('🔍 Redirect error:', error);
        return actualBaseUrl + '/';
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// For server-side usage in API routes
export const auth = () => getServerSession(authOptions);
