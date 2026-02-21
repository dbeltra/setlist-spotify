/**
 * Netlify Function: Callback endpoint
 * Handles Spotify OAuth callback and exchanges authorization code for access token
 */

import { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { exchangeCodeForToken, SpotifyAuthConfig } from '../../src/oauth.js';
import { handleError, ValidationError } from '../../src/error-handler.js';
import { validateEnvironment } from '../../src/env-validator.js';

/**
 * Callback handler - exchanges authorization code for access token
 * Requirements: 1.2, 1.3, 1.4, 6.3
 */
export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  try {
    // Validate environment variables (Requirement 6.3)
    const env = validateEnvironment();

    // Extract authorization code from query parameters
    const code = event.queryStringParameters?.code;
    const error = event.queryStringParameters?.error;

    // Handle authorization errors from Spotify
    if (error) {
      throw new ValidationError(
        `Spotify authorization failed: ${error}`,
        { error }
      );
    }

    if (!code) {
      throw new ValidationError('Authorization code is missing', {
        field: 'code',
      });
    }

    // Configure OAuth
    const config: SpotifyAuthConfig = {
      clientId: env.SPOTIFY_CLIENT_ID,
      clientSecret: env.SPOTIFY_CLIENT_SECRET,
      redirectUri: env.SPOTIFY_REDIRECT_URI,
      scopes: [], // Not needed for token exchange
    };

    // Exchange authorization code for access token (Requirements 1.2, 1.3)
    const tokenResponse = await exchangeCodeForToken(code, config);

    // Redirect to frontend with token (Requirement 1.3)
    return {
      statusCode: 302,
      headers: {
        Location: `/?access_token=${tokenResponse.access_token}`,
      },
      body: '',
    };
  } catch (error) {
    // Handle errors from token exchange (Requirement 1.4)
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
