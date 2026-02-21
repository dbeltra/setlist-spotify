/**
 * OAuth handler for Spotify authentication
 */

import { AuthenticationError } from './error-handler.js';

export interface SpotifyAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

/**
 * Generates Spotify authorization URL with CSRF protection
 * @param config - Spotify authentication configuration
 * @param state - State parameter for CSRF protection
 * @returns Authorization URL
 */
export function generateAuthUrl(config: SpotifyAuthConfig, state: string): string {
  const authEndpoint = 'https://accounts.spotify.com/authorize';
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    state: state,
    scope: config.scopes.join(' '),
  });

  return `${authEndpoint}?${params.toString()}`;
}

/**
 * Exchanges authorization code for access token
 * @param code - Authorization code from Spotify callback
 * @param config - Spotify authentication configuration
 * @returns Token response with access token
 * @throws AuthenticationError if token exchange fails
 */
export async function exchangeCodeForToken(
  code: string,
  config: SpotifyAuthConfig
): Promise<TokenResponse> {
  const tokenEndpoint = 'https://accounts.spotify.com/api/token';
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: config.redirectUri,
  });

  const authHeader = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString('base64');

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AuthenticationError(
        `Token exchange failed: ${response.status} ${response.statusText}`,
        { 
          statusCode: response.status, 
          ...(typeof errorData === 'object' && errorData !== null ? errorData : {})
        }
      );
    }

    const tokenData = await response.json();
    return tokenData as TokenResponse;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new AuthenticationError(`Token exchange error: ${error.message}`);
    }
    throw new AuthenticationError('Token exchange failed with unknown error');
  }
}
