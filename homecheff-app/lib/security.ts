import { NextRequest } from 'next/server';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = process.env.NODE_ENV === 'development' 
  ? 10000 // Much higher limit for development (React StrictMode doubles everything)
  : 1000; // 1000 requests per window for production

// Store for rate limiting (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Limit length
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone number validation
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Rate limiting
export function checkRateLimit(request: NextRequest): { allowed: boolean; remaining: number } {
  // Skip rate limiting for localhost in development
  if (process.env.NODE_ENV === 'development') {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (ip === 'unknown' || ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost')) {
      return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS };
    }
  }
  
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

// Data validation for user inputs
export function validateProductData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.title || typeof data.title !== 'string' || data.title.length < 3) {
    errors.push('Titel moet minimaal 3 karakters bevatten');
  }
  
  if (!data.description || typeof data.description !== 'string' || data.description.length < 10) {
    errors.push('Beschrijving moet minimaal 10 karakters bevatten');
  }
  
  if (!data.priceCents || typeof data.priceCents !== 'number' || data.priceCents < 0) {
    errors.push('Prijs moet een positief getal zijn');
  }
  
  if (!data.category || typeof data.category !== 'string') {
    errors.push('Categorie is verplicht');
  }
  
  return { valid: errors.length === 0, errors };
}

// User data validation
export function validateUserData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (data.name && (typeof data.name !== 'string' || data.name.length < 2)) {
    errors.push('Naam moet minimaal 2 karakters bevatten');
  }
  
  if (data.email && !isValidEmail(data.email)) {
    errors.push('E-mailadres is niet geldig');
  }
  
  if (data.phone && !isValidPhoneNumber(data.phone)) {
    errors.push('Telefoonnummer is niet geldig');
  }
  
  if (data.place && (typeof data.place !== 'string' || data.place.length < 2)) {
    errors.push('Plaats moet minimaal 2 karakters bevatten');
  }
  
  return { valid: errors.length === 0, errors };
}

// Security headers
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https: wss: https://*.pusher.com wss://*.pusher.com https://sockjs-eu.pusher.com wss://ws-eu.pusher.com;",
  };
}

// Clean up expired rate limit records
export function cleanupRateLimit() {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimit, 5 * 60 * 1000);
