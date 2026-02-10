import { randomBytes } from 'crypto';

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  // Generate random number between 100000 and 999999
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Calculate verification expiration (24 hours from now)
 */
export function getVerificationExpires(): Date {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

