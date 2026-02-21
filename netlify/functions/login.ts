/**
 * Netlify Function: Login endpoint
 * Initiates Spotify OAuth flow by redirecting to Spotify authorization URL
 */

import { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import { generateAuthUrl, SpotifyAuthConfig } from '../../src/oauth.js';
import { handleError } from '../../src/error-handler.js';
import { validateEnvironment } from '../../src/env-validator.js';

/**
 * Generates a random state parameter for CSRF protection
 */
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Login handler - redirects to Spotify authorization URL
 * Requirements: 1.1, 6.3
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
): Promise<HandlerResponse> => {
  try {
    // Validate environment variables (Requirement 6.3)
    const env = validateEnvironment();

    // Configure OAuth with required scopes (Requirement 1.1)
    const config: SpotifyAuthConfig = {
      clientId: env.SPOTIFY_CLIENT_ID,
      clientSecret: '', // Not needed for URL generation
      redirectUri: env.SPOTIFY_REDIRECT_URI,
      scopes: ['playlist-modify-private', 'playlist-modify-public'],
    };

    // Generate state parameter for CSRF protection
    const state = generateState();

    // Generate authorization URL (Requirement 1.1)
    const authUrl = generateAuthUrl(config, state);

    // Redirect to Spotify authorization page
    return {
      statusCode: 302,
      headers: {
        'Location': authUrl,
        'Cache-Control': 'no-cache',
      },
      body: '',
    };
  } catch (error) {
    // Handle errors
    const { statusCode, body } = handleError(
      error instanceof Error ? error : new Error('Unknown error')
    );

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    };
  }
};
