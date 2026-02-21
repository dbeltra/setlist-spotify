/**
 * Setlist fetcher for retrieving average setlist data from setlist.fm API
 */

import axios from 'axios';
import { ExternalAPIError, DataNotFoundError, logError } from './error-handler.js';

export interface SetlistSong {
  name: string;
  position: number;
}

export interface AverageSetlistParams {
  artistId: string;
  year?: number;
}

interface SetlistFmResponse {
  setlist: Array<{
    sets: {
      set: Array<{
        song: Array<{
          name: string;
        }>;
      }>;
    };
  }>;
}

/**
 * Fetches average setlist data from setlist.fm API
 * @param params - Parameters including artist ID and optional year
 * @param apiKey - setlist.fm API key
 * @returns Array of songs with names and positions
 * @throws ExternalAPIError if API is unavailable
 * @throws DataNotFoundError if no setlist data found after retry
 */
export async function getAverageSetlist(
  params: AverageSetlistParams,
  apiKey: string
): Promise<SetlistSong[]> {
  const { artistId, year } = params;
  
  // Use current year if not provided (Requirement 2.2)
  const targetYear = year ?? new Date().getFullYear();
  
  try {
    // Try to fetch setlist for the target year
    const songs = await fetchSetlistForYear(artistId, targetYear, apiKey);
    
    // If no songs found, retry with previous year (Requirement 2.4)
    if (songs.length === 0) {
      const retryYear = targetYear - 1;
      const retrySongs = await fetchSetlistForYear(artistId, retryYear, apiKey);
      
      // If still no songs found after retry, throw DataNotFoundError (Requirement 5.3)
      if (retrySongs.length === 0) {
        const error = new DataNotFoundError(
          `No setlist data found for artist ${artistId} in years ${targetYear} or ${retryYear}`,
          { artistId, targetYear, retryYear }
        );
        logError(error, { artistId, targetYear, retryYear });
        throw error;
      }
      
      return retrySongs;
    }
    
    return songs;
  } catch (error) {
    if (error instanceof ExternalAPIError || error instanceof DataNotFoundError) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      const apiError = new ExternalAPIError(
        `setlist.fm API is unavailable: ${error.message}`,
        'setlist.fm',
        { statusCode: error.response?.status }
      );
      logError(apiError, { artistId, year: targetYear });
      throw apiError;
    }
    if (error instanceof Error) {
      const wrappedError = new ExternalAPIError(
        `Failed to fetch setlist: ${error.message}`,
        'setlist.fm'
      );
      logError(wrappedError, { artistId, year: targetYear });
      throw wrappedError;
    }
    const unknownError = new ExternalAPIError(
      'Failed to fetch setlist with unknown error',
      'setlist.fm'
    );
    logError(unknownError, { artistId, year: targetYear });
    throw unknownError;
  }
}

/**
 * Fetches setlist data for a specific year
 * @param artistId - Artist ID from setlist.fm
 * @param year - Year to fetch setlist for
 * @param apiKey - setlist.fm API key
 * @returns Array of songs with names and positions
 * @throws ExternalAPIError if API request fails
 */
async function fetchSetlistForYear(
  artistId: string,
  year: number,
  apiKey: string
): Promise<SetlistSong[]> {
  try {
    const url = `https://api.setlist.fm/rest/1.0/artist/${artistId}/setlists`;
    
    const response = await axios.get<SetlistFmResponse>(url, {
      params: { year },
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json',
      },
    });
    
    // Parse response to extract song names and positions (Requirement 2.3)
    const songs: SetlistSong[] = [];
    const songFrequency = new Map<string, number>();
    
    // Count song frequencies across all setlists
    if (response.data.setlist) {
      for (const setlist of response.data.setlist) {
        if (setlist.sets?.set) {
          for (const set of setlist.sets.set) {
            if (set.song) {
              for (const song of set.song) {
                const count = songFrequency.get(song.name) || 0;
                songFrequency.set(song.name, count + 1);
              }
            }
          }
        }
      }
    }
    
    // Sort songs by frequency (most common first) and assign positions
    const sortedSongs = Array.from(songFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name], index) => ({
        name,
        position: index + 1,
      }));
    
    return sortedSongs;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiError = new ExternalAPIError(
        `setlist.fm API request failed: ${error.message}`,
        'setlist.fm',
        { statusCode: error.response?.status, year }
      );
      logError(apiError, { artistId, year });
      throw apiError;
    }
    throw error;
  }
}
