/**
 * Playlist creator for creating and populating Spotify playlists
 */

import axios from 'axios';
import { AuthenticationError, ExternalAPIError, logError } from './error-handler.js';

export interface PlaylistCreationParams {
  artistName: string;
  year: number;
  trackUris: string[];
  accessToken: string;
}

export interface PlaylistCreationResult {
  playlistId: string;
  tracksAdded: number;
  year: number;
}

interface SpotifyUserResponse {
  id: string;
  display_name: string;
}

interface SpotifyPlaylistResponse {
  id: string;
  name: string;
  public: boolean;
}

/**
 * Gets the authenticated user's Spotify ID
 * @param accessToken - Spotify access token
 * @returns User ID
 * @throws AuthenticationError if authentication fails
 * @throws ExternalAPIError if Spotify API is unavailable
 */
async function getUserId(accessToken: string): Promise<string> {
  try {
    const url = 'https://api.spotify.com/v1/me';
    
    const response = await axios.get<SpotifyUserResponse>(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    return response.data.id;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        const authError = new AuthenticationError(
          'Invalid or expired access token',
          { statusCode: error.response.status }
        );
        logError(authError);
        throw authError;
      }
      const apiError = new ExternalAPIError(
        `Spotify API is unavailable: ${error.message}`,
        'Spotify',
        { statusCode: error.response?.status }
      );
      logError(apiError);
      throw apiError;
    }
    throw error;
  }
}


/**
 * Creates a new Spotify playlist
 * @param userId - Spotify user ID
 * @param artistName - Name of the artist
 * @param year - Year of the setlist
 * @param accessToken - Spotify access token
 * @returns Playlist ID
 * @throws AuthenticationError if authentication fails
 * @throws ExternalAPIError if Spotify API is unavailable
 */
async function createSpotifyPlaylist(
  userId: string,
  artistName: string,
  year: number,
  accessToken: string
): Promise<string> {
  try {
    const url = `https://api.spotify.com/v1/users/${userId}/playlists`;
    
    // Format playlist name: "{Artist} — Average Setlist {year}" (Requirement 4.2)
    const playlistName = `${artistName} — Average Setlist ${year}`;
    
    const response = await axios.post<SpotifyPlaylistResponse>(
      url,
      {
        name: playlistName,
        public: false, // Set visibility to private (Requirement 4.3)
        description: `Average setlist for ${artistName} in ${year}`,
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data.id;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        const authError = new AuthenticationError(
          'Invalid or expired access token',
          { statusCode: error.response.status }
        );
        logError(authError, { artistName, year });
        throw authError;
      }
      const apiError = new ExternalAPIError(
        `Spotify API is unavailable: ${error.message}`,
        'Spotify',
        { statusCode: error.response?.status }
      );
      logError(apiError, { artistName, year });
      throw apiError;
    }
    throw error;
  }
}


/**
 * Adds tracks to a Spotify playlist
 * @param playlistId - Spotify playlist ID
 * @param trackUris - Array of Spotify track URIs
 * @param accessToken - Spotify access token
 * @throws AuthenticationError if authentication fails
 * @throws ExternalAPIError if Spotify API is unavailable
 */
async function addTracksToPlaylist(
  playlistId: string,
  trackUris: string[],
  accessToken: string
): Promise<void> {
  if (trackUris.length === 0) {
    return;
  }
  
  try {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    
    // Add all collected track URIs to the playlist (Requirement 4.4)
    await axios.post(
      url,
      {
        uris: trackUris,
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        const authError = new AuthenticationError(
          'Invalid or expired access token',
          { statusCode: error.response.status }
        );
        logError(authError, { playlistId, trackCount: trackUris.length });
        throw authError;
      }
      const apiError = new ExternalAPIError(
        `Spotify API is unavailable: ${error.message}`,
        'Spotify',
        { statusCode: error.response?.status }
      );
      logError(apiError, { playlistId, trackCount: trackUris.length });
      throw apiError;
    }
    throw error;
  }
}


/**
 * Creates a Spotify playlist with the provided tracks
 * @param params - Playlist creation parameters
 * @returns Playlist creation result with ID, track count, and year
 */
export async function createPlaylist(
  params: PlaylistCreationParams
): Promise<PlaylistCreationResult> {
  const { artistName, year, trackUris, accessToken } = params;
  
  try {
    // Get authenticated user's Spotify ID (Requirement 4.1)
    const userId = await getUserId(accessToken);
    
    // Create playlist with formatted name (Requirements 4.2, 4.3)
    const playlistId = await createSpotifyPlaylist(
      userId,
      artistName,
      year,
      accessToken
    );
    
    // Add all collected track URIs to the playlist (Requirement 4.4)
    await addTracksToPlaylist(playlistId, trackUris, accessToken);
    
    // Return response with playlistId, tracksAdded count, and year (Requirement 4.5)
    return {
      playlistId,
      tracksAdded: trackUris.length,
      year,
    };
  } catch (error) {
    // Log all API failures (Requirement 5.4)
    if (error instanceof Error) {
      logError(error, { artistName, year, trackCount: trackUris.length });
    }
    
    if (error instanceof AuthenticationError || error instanceof ExternalAPIError) {
      throw error;
    }
    if (error instanceof Error) {
      const wrappedError = new Error(`Failed to create playlist: ${error.message}`);
      logError(wrappedError, { artistName, year });
      throw wrappedError;
    }
    const unknownError = new Error('Failed to create playlist with unknown error');
    logError(unknownError, { artistName, year });
    throw unknownError;
  }
}
