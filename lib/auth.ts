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
  // Fix cookie issues - disable automatic secure cookie prefixes
  // NextAuth automatically adds __Secure- or __Host- prefixes when useSecureCookies is true
  // We disable this to have full control over cookie names and prevent prefix errors
  useSecureCookies: false, // Disable automatic prefix handling
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`, // Explicit name without prefix
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.startsWith('https://'),
        // Edge browser has stricter cookie size limits (4096 bytes)
        // Keep cookie size minimal by storing only essential data in JWT
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`, // Explicit name without prefix
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.startsWith('https://'),
        // Keep callback URL short - don't store full URLs
        maxAge: 60 * 10, // 10 minutes - shorter TTL to reduce cookie size
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`, // Explicit name without prefix (not __Host- prefix)
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.startsWith('https://'),
        maxAge: 60 * 60, // 1 hour - shorter TTL
      },
    },
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
          // Google provides given_name and family_name separately
          firstName: profile.given_name || '',
          lastName: profile.family_name || '',
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
        // Facebook can return picture in different formats
        let imageUrl = null;
        if (profile.picture?.data?.url) {
          imageUrl = profile.picture.data.url;
        } else if (profile.picture) {
          imageUrl = typeof profile.picture === 'string' ? profile.picture : profile.picture.url;
        }
        
        return {
          id: profile.id,
          name: profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
          email: profile.email,
          image: imageUrl,
          // Facebook provides first_name and last_name separately
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
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

            return null;
          }
          
          if (!user.passwordHash) {

            return null;
          }

          const ok = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!ok) {
            console.log('❌ Password mismatch for user:', user.email);
            return null;
          }

          console.log('✅ Login successful for user:', user.email, 'Role:', user.role);

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
      if (account?.provider === "google" || account?.provider === "facebook" || account?.provider === "apple") {
        try {

          // Check if user exists in database
          if (!user.email) {
            console.error(`❌ No email provided by ${account.provider}`);
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
            
            // Mark email as verified for social login (Google/Facebook already verified it)
            if (!existingUser.emailVerified) {
              updateData.emailVerified = new Date();
            }
            
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
                // Mark email as verified for social login (Google/Facebook already verified it)
                emailVerified: new Date(),
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
            
            // Store firstName and lastName from provider for onboarding form
            // These come from the provider profile functions (Google: given_name/family_name, Facebook: first_name/last_name)
            (user as any).firstName = (user as any).firstName || '';
            (user as any).lastName = (user as any).lastName || '';
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
      // CRITICAL: Remove all large data from token to prevent REQUEST_HEADER_TOO_LARGE
      // Edge browser has strict cookie size limits (4096 bytes per cookie)
      // NextAuth may add name, picture, etc. from OAuth providers - remove them explicitly
      // Keep token as small as possible - only absolute essentials
      const minimalToken: any = {
        email: token.email ? String(token.email).substring(0, 100) : token.email, // Truncate email if too long (safety)
        sub: token.sub, // Keep sub (NextAuth requirement) - usually short
        iat: token.iat, // Keep issued at time
        exp: token.exp, // Keep expiration
      };

      if (user) {
        const u = user as AppUser;
        // MINIMAL TOKEN: Only store absolute essentials
        // For Edge browser: Use shortest possible values
        minimalToken.role = u.role; // 'BUYER', 'SELLER', etc. - short
        // Store only first 36 chars of ID (UUID length) - Edge browser limit
        minimalToken.id = u.id ? String(u.id).substring(0, 36) : undefined;
        // Set flag for new social users (boolean - minimal size)
        if ((user as any).isNewSocialUser) {
          minimalToken.isNewSocialUser = true;
        }
        // Set flag if this is a social login provider (only store provider name)
        if (account?.provider === "google" || account?.provider === "facebook" || account?.provider === "apple") {
          minimalToken.isSocialLogin = true;
          minimalToken.socialProvider = account.provider; // 'google', 'facebook', or 'apple' - very short (5-8 chars)
          
          // Store firstName/lastName temporarily for onboarding (only for new social users)
          // These will be used to pre-fill the registration form
          // We remove them from token after onboarding to keep token size minimal
          if ((user as any).isNewSocialUser) {
            const firstName = (user as any).firstName || '';
            const lastName = (user as any).lastName || '';
            // Only store if they exist and are reasonable length (max 50 chars each)
            if (firstName && firstName.length <= 50) {
              minimalToken.socialFirstName = firstName.substring(0, 50);
            }
            if (lastName && lastName.length <= 50) {
              minimalToken.socialLastName = lastName.substring(0, 50);
            }
          }
        }
      } else {
        // Preserve existing token data (but only minimal fields)
        // Keep all fields as small as possible for Edge browser compatibility
        minimalToken.role = (token as { role?: Role }).role;
        // Truncate ID to 36 chars max (UUID length) for Edge browser
        minimalToken.id = (token as { id?: string }).id ? String((token as { id?: string }).id).substring(0, 36) : undefined;
        // Only preserve boolean flags (minimal size - 1 byte each)
        if ((token as any).isNewSocialUser) minimalToken.isNewSocialUser = true;
        if ((token as any).isSocialLogin) minimalToken.isSocialLogin = true;
        if ((token as any).socialProvider) minimalToken.socialProvider = String((token as any).socialProvider).substring(0, 8); // Max 8 chars ('facebook')
        if ((token as any).needsOnboarding) minimalToken.needsOnboarding = true;
        if ((token as any).tempUsername) minimalToken.tempUsername = true;
        if ((token as any).socialOnboardingCompleted) minimalToken.socialOnboardingCompleted = true;
        if ((token as any).onboardingChecked) minimalToken.onboardingChecked = true;
        
        // Preserve firstName/lastName only during onboarding (for new social users)
        // Remove after onboarding to keep token size minimal
        if ((token as any).needsOnboarding || (token as any).tempUsername) {
          if ((token as any).socialFirstName) minimalToken.socialFirstName = String((token as any).socialFirstName).substring(0, 50);
          if ((token as any).socialLastName) minimalToken.socialLastName = String((token as any).socialLastName).substring(0, 50);
        }
      }
      
      // Always check database for social login users to ensure fresh onboarding status
      // Also check when trigger is 'update' to refresh username after onboarding
      const isSocialLogin = minimalToken.isNewSocialUser || minimalToken.tempUsername || minimalToken.socialOnboardingCompleted === false;
      const shouldCheckDB = user || trigger === 'update' || !minimalToken.onboardingChecked || isSocialLogin;
      
      if (shouldCheckDB && minimalToken.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: minimalToken.email as string },
          select: {
            id: true,
            role: true,
            socialOnboardingCompleted: true,
            username: true,
            // Don't select name, image, profileImage - we'll get these in session callback
          }
        });
        
        if (dbUser) {
          // MINIMAL TOKEN: Only store essential IDs and boolean flags
          // For Edge browser: Keep everything as small as possible
          minimalToken.role = dbUser.role as Role;
          // Truncate ID to 36 chars max (UUID length) for Edge browser
          minimalToken.id = dbUser.id ? String(dbUser.id).substring(0, 36) : undefined;
          
          // Only store boolean flags (1 byte each) - no strings
          const hasTempUsername = dbUser.username?.startsWith('temp_');
          const onboardingNotCompleted = !dbUser.socialOnboardingCompleted;
          
          minimalToken.needsOnboarding = onboardingNotCompleted && hasTempUsername;
          minimalToken.tempUsername = hasTempUsername;
          minimalToken.socialOnboardingCompleted = dbUser.socialOnboardingCompleted;
          minimalToken.onboardingChecked = true;
          
          // Remove firstName/lastName from token after onboarding is completed to keep token size minimal
          if (!hasTempUsername && dbUser.socialOnboardingCompleted) {
            delete minimalToken.socialFirstName;
            delete minimalToken.socialLastName;
          }
          
          // Force session callback to refresh by clearing cached onboarding check
          // This ensures username is refreshed in session callback
          if (trigger === 'update') {
            minimalToken.onboardingChecked = false; // Force re-check next time
          }
        }
      }
      
      // Explicitly remove any large fields that NextAuth might have added
      // DO NOT include: name, picture, image, socialName, socialImage, username (unless needed for flags)
      
      // DEBUG: Log token size for Edge browser debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        const tokenString = JSON.stringify(minimalToken);
        const tokenSize = new Blob([tokenString]).size;
        if (tokenSize > 1000) {
          console.warn(`⚠️ [EDGE DEBUG] Token size is ${tokenSize} bytes - may cause issues in Edge browser (limit: 4096 bytes)`);
        } else {
          console.log(`✅ [EDGE DEBUG] Token size: ${tokenSize} bytes (safe for Edge)`);
        }
      }
      
      return minimalToken;
    },
    async session({ session, token }) {
      if (session.user && token) {
        // MINIMAL TOKEN APPROACH: Fetch ALL user data from database
        // Token only contains: id, email, role, and boolean flags
        // Everything else comes from database to keep token size minimal
        let dbUser = null;
        if (token.email) {
          try {
            dbUser = await prisma.user.findUnique({
              where: { email: token.email as string },
              select: {
                name: true,
                image: true,
                profileImage: true,
                username: true,
                socialOnboardingCompleted: true,
                sellerRoles: true,
                adminRoles: true, // Include adminRoles for admin dashboard visibility
                role: true, // Ensure role is also fetched from DB for consistency
                DeliveryProfile: {
                  select: {
                    id: true, // Just check if DeliveryProfile exists
                  }
                },
                affiliate: {
                  select: {
                    id: true, // Just check if Affiliate exists
                  }
                }
              }
            });
          } catch (error) {
            console.error('Error fetching user data in session callback:', error);
          }
        }

        // Essential data from minimal token (id, role only)
        // BUT prefer database role if available for consistency
        (session.user as { id?: string }).id = (token as { id?: string }).id;
        
        // CRITICAL: Ensure email is always set from token (required for social login registration)
        // NextAuth should set this automatically, but we explicitly ensure it's available
        // Always use token email if available (it's the source of truth)
        if (token.email) {
          session.user.email = token.email as string;
        }
        
        // All other data from database (name, username, images, etc.)
        if (dbUser) {
          // Use role from database if available, otherwise from token
          (session.user as { role?: Role }).role = (dbUser.role as Role) || (token as { role?: Role }).role;
          (session.user as { name?: string }).name = dbUser.name || session.user.name;
          (session.user as { image?: string | null }).image = dbUser.profileImage || dbUser.image || session.user.image;
          // ALWAYS use username from database - this ensures temp usernames are replaced
          (session.user as any).username = dbUser.username || null;
          (session.user as any).socialOnboardingCompleted = dbUser.socialOnboardingCompleted;
          // Get socialImage from database
          (session.user as any).socialImage = dbUser.profileImage || dbUser.image || session.user.image;
          // Use database name as socialName
          (session.user as any).socialName = dbUser.name || session.user.name;
          
          // Get firstName/lastName from token if available (for new social users during onboarding)
          // These are stored temporarily in token from provider profile data
          if ((token as any).socialFirstName) {
            (session.user as any).socialFirstName = (token as any).socialFirstName;
          }
          if ((token as any).socialLastName) {
            (session.user as any).socialLastName = (token as any).socialLastName;
          }
          // Include sellerRoles for dashboard visibility - CRITICAL for dashboard links
          (session.user as any).sellerRoles = dbUser.sellerRoles || [];
          // Include adminRoles for admin dashboard visibility - CRITICAL for admin dashboard links
          (session.user as any).adminRoles = dbUser.adminRoles || [];
          // Include hasDeliveryProfile flag - CRITICAL for delivery dashboard visibility
          // Users can be SELLER but also have DeliveryProfile, so they should see both dashboards
          (session.user as any).hasDeliveryProfile = !!dbUser.DeliveryProfile;
          // Include hasAffiliate flag - CRITICAL for affiliate dashboard visibility
          (session.user as any).hasAffiliate = !!dbUser.affiliate;
          
          // Log for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [SESSION] User data from database:', {
              username: dbUser.username,
              role: dbUser.role,
              sellerRoles: dbUser.sellerRoles,
              sellerRolesLength: dbUser.sellerRoles?.length || 0,
              hasDeliveryProfile: !!dbUser.DeliveryProfile
            });
          }
        } else {
          // If DB fetch fails, use token data as fallback
          (session.user as { role?: Role }).role = (token as { role?: Role }).role;
          (session.user as any).username = null;
          (session.user as any).socialOnboardingCompleted = false;
          (session.user as any).socialImage = session.user.image;
          (session.user as any).socialName = session.user.name;
          
          // Get firstName/lastName from token if available (for new social users during onboarding)
          if ((token as any).socialFirstName) {
            (session.user as any).socialFirstName = (token as any).socialFirstName;
          }
          if ((token as any).socialLastName) {
            (session.user as any).socialLastName = (token as any).socialLastName;
          }
          
          (session.user as any).sellerRoles = []; // Default to empty array
          (session.user as any).hasDeliveryProfile = false; // Default to false if DB fetch fails
          (session.user as any).hasAffiliate = false; // Default to false if DB fetch fails
          
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [SESSION] DB fetch failed, using token data only');
          }
        }
        
        // Essential boolean flags from minimal token
        (session.user as any).needsOnboarding = (token as any).needsOnboarding || false;
        (session.user as any).tempUsername = (token as any).tempUsername || false;
        (session.user as any).socialProvider = (token as any).socialProvider;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Use NEXTAUTH_URL from environment, or fallback to baseUrl
      const actualBaseUrl = process.env.NEXTAUTH_URL || baseUrl;

      try {
        // For social login callback, check if user needs onboarding
        if (url.includes('/api/auth/callback/google') || url.includes('/api/auth/callback/facebook') || url.includes('/api/auth/callback/apple')) {
          // Check if this is a new social login user who needs onboarding
          // We need to check the database to see if user has temp username
          try {
            // Extract email from callback if possible, or check session
            // Since we're in redirect callback, we can't easily check DB here
            // So we'll always go to social-login-success which will check and redirect
          } catch (error) {
            console.error('Error in social login redirect check:', error);
          }
          
          // Always go to social-login-success first for social logins
          // This page will check onboarding status and redirect accordingly
          return actualBaseUrl + '/social-login-success';
        }
        
        // If explicitly requesting social-login-success, let it handle the redirect
        // (Don't redirect it again, let the page component handle it)
        if (url.includes('/social-login-success')) {
          return actualBaseUrl + '/social-login-success';
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
        // Keep URLs short to prevent large callback-url cookie (Edge browser limit)
        const u = new URL(url);
        const shortUrl = actualBaseUrl + u.pathname; // Don't include search params to keep cookie small
        return shortUrl.length > 200 ? actualBaseUrl : shortUrl;
      } catch (error) {
        console.error('🔍 Redirect error:', error);
        // On error, default to social-login-success which will check and redirect
        if (url.includes('google') || url.includes('facebook') || url.includes('apple')) {
          return actualBaseUrl + '/social-login-success';
        }
        return actualBaseUrl + '/dorpsplein';
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// For server-side usage in API routes
export const auth = () => getServerSession(authOptions);
