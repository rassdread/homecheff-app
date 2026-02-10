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

type Role = UserRole | 'SUPERADMIN';
type AppUser = { id: string; email: string; role: Role; name?: string; image?: string };

export const authOptions: NextAuthOptions = {
  pages: { signIn: "/login" },
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Let NextAuth handle cookies automatically based on environment
  // This prevents __Secure- and __Host- prefix issues on Vercel
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

            return null;
          }
          
          // Check if input is email or username
          const isEmail = credentials.emailOrUsername.includes('@');

          const user = isEmail 
            ? await prisma.user.findUnique({ where: { email: credentials.emailOrUsername } })
            : await prisma.user.findUnique({ where: { username: credentials.emailOrUsername } });
            
          if (!user) {
            // Track failed login attempt - user not found
            try {
              await prisma.analyticsEvent.create({
                data: {
                  eventType: 'LOGIN_FAILED',
                  entityType: 'USER',
                  entityId: 'unknown',
                  userId: null,
                  metadata: {
                    method: 'credentials',
                    reason: 'user_not_found',
                    emailOrUsername: credentials.emailOrUsername,
                    userAgent: credentials.userAgent || 'unknown',
                    timestamp: new Date().toISOString()
                  }
                }
              });
            } catch (analyticsError) {
              console.error('Failed to track login failure:', analyticsError);
            }
            return null;
          }
          
          if (!user.passwordHash) {

            return null;
          }

          const ok = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!ok) {
            console.log('❌ Password mismatch for user:', user.email);
            
            // Track failed login attempt - wrong password
            try {
              await prisma.analyticsEvent.create({
                data: {
                  eventType: 'LOGIN_FAILED',
                  entityType: 'USER',
                  entityId: user.id,
                  userId: user.id,
                  metadata: {
                    method: 'credentials',
                    reason: 'wrong_password',
                    email: user.email,
                    userAgent: credentials.userAgent || 'unknown',
                    timestamp: new Date().toISOString()
                  }
                }
              });
            } catch (analyticsError) {
              console.error('Failed to track login failure:', analyticsError);
            }
            
            return null;
          }

          console.log('✅ Login successful for user:', user.email, 'Role:', user.role);

          // Track successful login
          try {
            await prisma.analyticsEvent.create({
              data: {
                eventType: 'LOGIN_SUCCESS',
                entityType: 'USER',
                entityId: user.id,
                userId: user.id,
                metadata: {
                  method: 'credentials',
                  email: user.email,
                  userAgent: credentials.userAgent || 'unknown',
                  timestamp: new Date().toISOString(),
                  role: user.role
                }
              }
            });
          } catch (analyticsError) {
            console.error('Failed to track login success:', analyticsError);
          }

          // Return the actual role from database, don't transform it
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
      // Track social login success
      if (account?.provider && account.provider !== 'credentials') {
        try {
          await prisma.analyticsEvent.create({
            data: {
              eventType: 'LOGIN_SUCCESS',
              entityType: 'USER',
              entityId: user.id || 'unknown',
              userId: user.id || null,
              metadata: {
                method: account.provider,
                email: user.email,
                timestamp: new Date().toISOString(),
                isNewUser: !user.id // If no ID, it's likely a new user
              }
            }
          });
        } catch (analyticsError) {
          console.error('Failed to track social login:', analyticsError);
        }
      }
      
      if (account?.provider === "google" || account?.provider === "facebook") {
        try {

          // Check if user exists in database
          if (!user.email) {
            console.error('❌ No email provided by Facebook');
            return false;
          }
          
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          });

          if (existingUser) {
            // Update existing user with latest social data
            // BUT preserve custom uploaded photos - only use social image if user has no custom photo
            const updateData: any = {
              name: user.name || existingUser.name,
            };
            
            // Only update images if user hasn't uploaded a custom profile photo
            // Check if existing image is from social provider (starts with http) or is a data URL (custom upload)
            const hasCustomPhoto = existingUser.profileImage && 
              (!existingUser.profileImage.startsWith('http') || 
               existingUser.profileImage.startsWith('data:') ||
               existingUser.profileImage.includes('vercel-storage') ||
               existingUser.profileImage.includes('blob.vercel-storage'));
            
            if (!hasCustomPhoto && user.image) {
              updateData.image = user.image;
              updateData.profileImage = user.image;
            }
            
            await prisma.user.update({
              where: { id: existingUser.id },
              data: updateData
            });

          } else {
            // NEW USER - Create with temp data, onboarding required
            let tempUsername = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Check if temp username already exists (very unlikely but possible)
            let usernameExists = await prisma.user.findUnique({ where: { username: tempUsername } });
            let attempts = 0;
            while (usernameExists && attempts < 5) {
              tempUsername = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              usernameExists = await prisma.user.findUnique({ where: { username: tempUsername } });
              attempts++;
            }
            
            if (usernameExists) {
              console.error('❌ Failed to generate unique temp username after 5 attempts');
              return false;
            }
            
            existingUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || "",
                username: tempUsername,
                image: user.image,
                profileImage: user.image,
                passwordHash: "",
                role: UserRole.BUYER,
                interests: [],
                bio: "",
                socialOnboardingCompleted: false, // Needs onboarding!
                termsAccepted: false,
                privacyPolicyAccepted: false,
                // Set default values to match regular registration
                displayFullName: true,
                displayNameOption: 'full',
                showFansList: true,
                marketingAccepted: false,
                messageGuidelinesAccepted: false,
                encryptionEnabled: false,
                // Initialize empty arrays for consistency
                sellerRoles: [],
                buyerRoles: []
              }
            });

            // Set flag in user object to indicate new social user
            (user as any).isNewSocialUser = true;
          }

          return true;
        } catch (error) {
          console.error("❌ Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        const u = user as AppUser;
        (token as { role?: Role }).role = u.role;
        (token as { id?: string }).id = u.id;
        // Set flag for new social users
        if ((user as any).isNewSocialUser) {
          (token as any).isNewSocialUser = true;
        }
      }
      
      // Always check database for social login users to ensure fresh onboarding status
      // For regular users, only check on first sign-in or explicit updates
      const isSocialLogin = (token as any).isNewSocialUser || (token as any).tempUsername;
      const shouldCheckDB = user || trigger === 'update' || !(token as any).onboardingChecked || isSocialLogin;
      
      if (shouldCheckDB && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: {
            id: true,
            role: true,
            socialOnboardingCompleted: true,
            username: true,
            name: true,
            image: true,
            profileImage: true
          }
        });
        
        if (dbUser) {
          token.role = dbUser.role as Role;
          token.id = dbUser.id;
          // Update name from database (important for social login users)
          token.name = dbUser.name;
          (token as any).username = dbUser.username; // Add username to token
          // Update profile image from database
          token.picture = dbUser.profileImage || dbUser.image || token.picture;
          
          // Check if onboarding is completed - multiple checks for safety
          const hasTempUsername = dbUser.username?.startsWith('temp_');
          const onboardingNotCompleted = !dbUser.socialOnboardingCompleted;
          
          // User needs onboarding if EITHER condition is true
          (token as any).needsOnboarding = onboardingNotCompleted && hasTempUsername;
          (token as any).tempUsername = hasTempUsername;
          (token as any).socialOnboardingCompleted = dbUser.socialOnboardingCompleted;
          (token as any).onboardingChecked = true; // Mark as checked

        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as { role?: Role }).role = (token as { role?: Role }).role;
        (session.user as { id?: string }).id = (token as { id?: string }).id;
        // Update name from token (from database) for social login users
        (session.user as { name?: string }).name = (token as { name?: string }).name || session.user.name;
        // Update image from token (from database)
        (session.user as { image?: string | null }).image = (token as { picture?: string | null }).picture || session.user.image;
        (session.user as any).username = (token as any).username; // Add username to session
        (session.user as any).needsOnboarding = (token as any).needsOnboarding || false;
        (session.user as any).tempUsername = (token as any).tempUsername || false;
        (session.user as any).socialProvider = (token as any).socialProvider;
        (session.user as any).socialImage = (token as any).socialImage;
        (session.user as any).socialName = (token as any).socialName;

      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Use NEXTAUTH_URL from environment, or fallback to baseUrl
      const actualBaseUrl = process.env.NEXTAUTH_URL || baseUrl;

      try {
        // For social login callback, always go to registration flow
        if (url.includes('/api/auth/callback/google') || url.includes('/api/auth/callback/facebook')) {
          return actualBaseUrl + '/register?social=true';
        }
        
        // If explicitly requesting social-login-success (legacy), redirect to registration flow
        if (url.includes('/social-login-success')) {

          return actualBaseUrl + '/register?social=true';
        }
        
        // If url is relative or starts with /, return it with actualBaseUrl
        if (url.startsWith('/')) {

          return actualBaseUrl + url;
        }
        
        // If url is absolute and starts with actualBaseUrl, return it
        if (url.startsWith(actualBaseUrl)) {

          return url;
        }
        
        // Otherwise, extract path and use actualBaseUrl
        const u = new URL(url);

        return actualBaseUrl + u.pathname + u.search;
      } catch (error) {
        console.error('🔍 Redirect error:', error);
        return actualBaseUrl + '/inspiratie';
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// For server-side usage in API routes
export const auth = () => getServerSession(authOptions);
