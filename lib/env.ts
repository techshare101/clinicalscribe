// lib/env.ts

/**
 * Get the correct app URL for the current environment
 * Priority: NEXT_PUBLIC_APP_URL -> VERCEL_URL -> localhost:3000
 */
export function getAppUrl(): string {
  // Explicit env override takes priority (for custom domains)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // In production (Vercel deployment)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Local development fallback
  return "http://localhost:3000";
}

/**
 * Get the base URL for API calls (same as app URL but can be extended for different API hosts)
 */
export function getApiUrl(): string {
  return getAppUrl();
}

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if we're in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get environment-specific log level
 */
export function getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
  return isDevelopment() ? 'debug' : 'info';
}