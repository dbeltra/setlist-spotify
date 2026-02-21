/**
 * Main orchestrator for the setlist-to-spotify-playlist application
 */

import { getAverageSetlist, AverageSetlistParams } from './setlist-fetcher.js';
import { matchAllTracks } from './track-matcher.js';
import { createPlaylist, PlaylistCreationResult } from './playlist-creator.js';
import { ValidationError } from './error-handler.js';

export interface CreatePlaylistRequest {
  artistId: string;
  artistName: string;
  year?: number;
  accessToken: string;
}

/**
 * Main workflow function that orchestrates the entire playlist creation process
 * @param request - Request parameters including artist info, optional year, and access token
 * @returns Playlist creation result with ID, track count, and year
 * @throws ValidationError if required parameters are missing
 * @throws AuthenticationError if access token is invalid
 * @throws ExternalAPIError if external APIs are unavailable
 * @throws DataNotFoundError if no setlist data is found
 */
export async function handleCreatePlaylist(
  request: CreatePlaylistRequest
): Promise<PlaylistCreationResult> {
  const { artistId, artistName, year, accessToken } = request;

  // Validate access token is present (Requirement 1.1)
  if (!accessToken || accessToken.trim() === '') {
    throw new ValidationError('Access token is required', { field: 'accessToken' });
  }

  // Validate required parameters
  if (!artistId || artistId.trim() === '') {
    throw new ValidationError('Artist ID is required', { field: 'artistId' });
  }

  if (!artistName || artistName.trim() === '') {
    throw new ValidationError('Artist name is required', { field: 'artistName' });
  }

  try {
    // Step 1: Fetch average setlist from setlist.fm (Requirement 2.1)
    const setlistParams: AverageSetlistParams = {
      artistId,
      year,
    };
    
    const apiKey = process.env.SETLISTFM_API_KEY;
    if (!apiKey) {
      throw new ValidationError('setlist.fm API key is not configured', {
        field: 'SETLISTFM_API_KEY',
      });
    }

    const songs = await getAverageSetlist(setlistParams, apiKey);

    // Step 2: Match songs to Spotify tracks (Requirement 3.1)
    const trackResults = await matchAllTracks(songs, artistName, accessToken);

    // Filter out tracks that weren't found and collect URIs
    const trackUris = trackResults
      .filter((result) => result.found && result.trackUri !== null)
      .map((result) => result.trackUri as string);

    // Step 3: Create playlist with matched tracks (Requirement 4.1)
    const actualYear = year ?? new Date().getFullYear();
    const playlistResult = await createPlaylist({
      artistName,
      year: actualYear,
      trackUris,
      accessToken,
    });

    return playlistResult;
  } catch (error) {
    // Handle errors and return appropriate responses (Requirement 5.1, 5.2, 5.3)
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}
