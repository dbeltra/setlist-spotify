/**
 * Environment variable validation utility
 * Ensures all required environment variables are present at startup
 */

export interface EnvironmentConfig {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  SPOTIFY_REDIRECT_URI: string;
  SETLISTFM_API_KEY: string;
}

/**
 * Validates that all required environment variables are present
 * @throws Error if any required environment variable is missing
 * @returns Validated environment configuration
 */
export function validateEnvironment(): EnvironmentConfig {
  const requiredVars = [
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET',
    'SPOTIFY_REDIRECT_URI',
    'SETLISTFM_API_KEY',
  ] as const;

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Please ensure all required variables are set in your .env file or environment.\n` +
      `See .env.example for reference.`
    );
  }

  return {
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID!,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET!,
    SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI!,
    SETLISTFM_API_KEY: process.env.SETLISTFM_API_KEY!,
  };
}
