/**
 * Review Token Utilities
 * Generate and validate unique review tokens for one-time use
 */

import crypto from 'crypto';

/**
 * Generate a secure, unique review token
 */
export function generateReviewToken(): string {
  // Generate 32 random bytes and convert to base64url (URL-safe)
  const randomBytes = crypto.randomBytes(32);
  return randomBytes.toString('base64url');
}

/**
 * Check if a review token is expired
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}

/**
 * Get default expiry date (30 days from now)
 */
export function getDefaultTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  return expiry;
}




