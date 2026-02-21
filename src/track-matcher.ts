/**
 * Track matcher for searching and matching Spotify tracks
 */

import axios from 'axios';
import { SetlistSong } from './setlist-fetcher.js';
import { AuthenticationError, ExternalAPIError } from './error-handler.js';

export interface TrackSearchResult {
  songName: string;
  trackUri: string | null;
  found: boolean;
}

interface SpotifySearchResponse {
  tracks: {
    items: Array<{
      uri: string;
      name: string;
      artists: Array<{
        name: string;
      }>;
    }>;
  };
}

/**
 * Searches Spotify for a track matching the song name and artist
 * @param songName - Name of the song to search for
 * @param artistName - Name of the artist
 * @param accessToken - Spotify access token
 * @returns Search result with track URI if found
 * @throws AuthenticationError if authentication fails
 * @throws ExternalAPIError if Spotify API is unavailable (for critical failures)
 */
export async function searchSpotifyTrack(
  songName: string,
  artistName: string,
  accessToken: string
): Promise<TrackSearchResult> {
  try {
    const query = `track:${songName} artist:${artistName}`;
    const url = 'https://api.spotify.com/v1/search';
    
    const response = await axios.get<SpotifySearchResponse>(url, {
      params: {
        q: query,
        type: 'track',
        limit: 1,
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    // Extract track URI from first result if available (Requirement 3.3)
    if (response.data.tracks.items.length > 0) {
      const track = response.data.tracks.items[0];
      return {
        songName,
        trackUri: track.uri,
        found: true,
      };
    }
    
    // No track found
    return {
      songName,
      trackUri: null,
      found: false,
    };
  } catch (error) {
    // Check for authentication errors
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new AuthenticationError(
        'Invalid or expired access token',
        { statusCode: error.response.status }
      );
    }
    // For other API errors, continue processing (Requirement 3.4)
    // but log that there was an issue
    return {
      songName,
      trackUri: null,
      found: false,
    };
  }
}

/**
 * Matches all songs from a setlist to Spotify tracks
 * @param songs - Array of songs from setlist
 * @param artistName - Name of the artist
 * @param accessToken - Spotify access token
 * @returns Array of search results with found/not-found status
 */
export async function matchAllTracks(
  songs: SetlistSong[],
  artistName: string,
  accessToken: string
): Promise<TrackSearchResult[]> {
  const results: TrackSearchResult[] = [];
  
  // Iterate through all songs and search for each (Requirement 3.1)
  for (const song of songs) {
    const result = await searchSpotifyTrack(song.name, artistName, accessToken);
    results.push(result);
    // Continue processing even if individual searches fail (Requirement 3.4)
  }
  
  return results;
}
