/**
 * Netlify Function: Create Playlist endpoint
 * Main endpoint that orchestrates the entire playlist creation workflow
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { handleCreatePlaylist, CreatePlaylistRequest } from '../../src/index.js';
import { handleError, ValidationError } from '../../src/error-handler.js';
import { validateEnvironment } from '../../src/env-validator.js';

/**
 * Create playlist handler - orchestrates the full workflow
 * Requirements: 2.1, 2.2, 3.1, 4.1, 4.5
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  try {
    // Validate environment variables (Requirement 6.3)
    validateEnvironment();

    // Parse query parameters (Requirements 2.1, 2.2)
    const artistId = event.queryStringParameters?.artistId;
    const artistName = event.queryStringParameters?.artistName;
    const yearParam = event.queryStringParameters?.year;

    // Validate required parameters
    if (!artistId) {
      throw new ValidationError('artistId query parameter is required', {
        field: 'artistId',
      });
    }

    if (!artistName) {
      throw new ValidationError('artistName query parameter is required', {
        field: 'artistName',
      });
    }

    // Parse optional year parameter
    let year: number | undefined;
    if (yearParam) {
      year = parseInt(yearParam, 10);
      if (isNaN(year)) {
        throw new ValidationError('year parameter must be a valid number', {
          field: 'year',
          value: yearParam,
        });
      }
    }

    // Extract access token from request
    // Try Authorization header first, then fall back to query parameter
    let accessToken: string | undefined;

    // Check Authorization header (Bearer token)
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    if (authHeader) {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) {
        accessToken = match[1];
      }
    }

    // Fall back to query parameter if header not present
    if (!accessToken) {
      accessToken = event.queryStringParameters?.access_token;
    }

    if (!accessToken) {
      throw new ValidationError(
        'Access token is required (provide via Authorization header or access_token query parameter)',
        { field: 'access_token' }
      );
    }

    // Build request object
    const request: CreatePlaylistRequest = {
      artistId,
      artistName,
      year,
      accessToken,
    };

    // Call main orchestrator function (Requirements 3.1, 4.1)
    const result = await handleCreatePlaylist(request);

    // Return JSON response (Requirement 4.5)
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    // Handle errors
    const { statusCode, body } = handleError(
      error instanceof Error ? error : new Error('Unknown error'),
      {
        artistId: event.queryStringParameters?.artistId,
        artistName: event.queryStringParameters?.artistName,
        year: event.queryStringParameters?.year
          ? parseInt(event.queryStringParameters.year, 10)
          : undefined,
      }
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
