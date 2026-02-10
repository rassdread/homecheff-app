/**
 * Google Analytics Data API Client
 * Voor uitgebreide analyse en filtering (SPSS-achtige mogelijkheden)
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';

let analyticsDataClient: BetaAnalyticsDataClient | null = null;

/**
 * Initialize Google Analytics Data API client
 */
export function getAnalyticsDataClient(): BetaAnalyticsDataClient | null {
  if (analyticsDataClient) {
    return analyticsDataClient;
  }

  // Check if credentials are available
  const credentials = getCredentials();
  if (!credentials) {
    console.warn('Google Analytics Data API credentials not found');
    return null;
  }

  try {
    analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: credentials,
    });
    return analyticsDataClient;
  } catch (error) {
    console.error('Failed to initialize Google Analytics Data API client:', error);
    return null;
  }
}

/**
 * Get credentials from environment variables
 */
function getCredentials() {
  // Option 1: Individual environment variables
  const projectId = process.env.GOOGLE_ANALYTICS_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      type: 'service_account',
      project_id: projectId,
      private_key_id: process.env.GOOGLE_ANALYTICS_PRIVATE_KEY_ID || '',
      private_key: privateKey.replace(/\\n/g, '\n'),
      client_email: clientEmail,
      client_id: process.env.GOOGLE_ANALYTICS_CLIENT_ID || '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      universe_domain: 'googleapis.com',
    };
  }

  // Option 2: Base64 encoded JSON
  const credentialsBase64 = process.env.GOOGLE_ANALYTICS_CREDENTIALS_BASE64;
  if (credentialsBase64) {
    try {
      const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
      return JSON.parse(credentialsJson);
    } catch (error) {
      console.error('Failed to parse base64 encoded credentials:', error);
      return null;
    }
  }

  return null;
}

/**
 * Get Property ID from environment or use default
 */
export function getPropertyId(): string {
  return process.env.GOOGLE_ANALYTICS_PROPERTY_ID || '13277240797';
}

/**
 * Format date for GA4 API (YYYY-MM-DD)
 */
export function formatDateForGA4(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse date range string to start and end dates
 */
export function parseDateRange(range: string): { startDate: string; endDate: string } {
  const endDate = new Date();
  let startDate = new Date();

  switch (range) {
    case '24h':
    case '1d':
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
    case '365d':
      startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return {
    startDate: formatDateForGA4(startDate),
    endDate: formatDateForGA4(endDate),
  };
}




