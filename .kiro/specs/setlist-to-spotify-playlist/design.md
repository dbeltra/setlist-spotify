# Design Document: Setlist to Spotify Playlist

## Overview

This system is a serverless web application that bridges setlist.fm and Spotify to automatically generate playlists. Users authenticate via Spotify OAuth, specify an artist and optional year, and receive a private Spotify playlist containing the artist's average setlist for that year.

The application follows a serverless architecture deployed on Netlify Functions, with three main endpoints: `/login` for initiating OAuth, `/callback` for completing authentication, and `/create-playlist` for the main workflow. The system uses the setlist.fm API to fetch average setlist data and the Spotify Web API to search for tracks and create playlists.

## Architecture

### Deployment Model

- **Platform**: Netlify Functions (Node.js runtime)
- **Protocol**: HTTPS only
- **State Management**: Stateless functions with OAuth tokens passed via session/cookies or returned to client

### Key Components

1. **OAuth Handler**: Manages Spotify authentication flow
2. **Setlist Fetcher**: Retrieves average setlist data from setlist.fm API
3. **Track Matcher**: Searches Spotify for tracks matching setlist songs
4. **Playlist Creator**: Creates and populates Spotify playlists
5. **Error Handler**: Provides consistent error responses

### External Dependencies

- **Spotify Web API**: OAuth and playlist management
- **setlist.fm API**: Average setlist data retrieval
- **Environment Variables**: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `SETLISTFM_API_KEY`

## Components and Interfaces

### 1. OAuth Handler

**Endpoints:**

`GET /login`

- Redirects to Spotify authorization URL
- Includes scopes: `playlist-modify-private playlist-modify-public`
- Includes state parameter for CSRF protection

`GET /callback`

- Receives authorization code from Spotify
- Exchanges code for access token
- Returns token to client or stores in session

**Interface:**

```typescript
interface SpotifyAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

function generateAuthUrl(config: SpotifyAuthConfig, state: string): string;
function exchangeCodeForToken(
  code: string,
  config: SpotifyAuthConfig
): Promise<TokenResponse>;
```

### 2. Setlist Fetcher

**Purpose:** Retrieve average setlist data from setlist.fm API

**Interface:**

```typescript
interface SetlistSong {
  name: string;
  position: number;
}

interface AverageSetlistParams {
  artistId: string;
  year?: number;
}

async function getAverageSetlist(
  params: AverageSetlistParams,
  apiKey: string
): Promise<SetlistSong[]>;
```

**Logic:**

1. Determine target year (provided or current year)
2. Call setlist.fm API: `GET /rest/1.0/artist/{artistId}/setlists?year={year}`
3. Parse response to extract song names and order
4. If no songs found, retry with `year - 1`
5. Return ordered array of songs

**Note:** The setlist.fm API provides structured data, eliminating the need for HTML scraping with Cheerio.

### 3. Track Matcher

**Purpose:** Find Spotify tracks matching setlist song names

**Interface:**

```typescript
interface TrackSearchResult {
  songName: string;
  trackUri: string | null;
  found: boolean;
}

async function searchSpotifyTrack(
  songName: string,
  artistName: string,
  accessToken: string
): Promise<TrackSearchResult>;

async function matchAllTracks(
  songs: SetlistSong[],
  artistName: string,
  accessToken: string
): Promise<TrackSearchResult[]>;
```

**Logic:**

1. For each song, query Spotify: `GET /v1/search?q=track:{song} artist:{artist}&type=track&limit=1`
2. Extract track URI from first result if available
3. Continue processing even if individual tracks aren't found
4. Return array of results with found/not-found status

### 4. Playlist Creator

**Purpose:** Create Spotify playlist and add tracks

**Interface:**

```typescript
interface PlaylistCreationParams {
  artistName: string;
  year: number;
  trackUris: string[];
  accessToken: string;
}

interface PlaylistCreationResult {
  playlistId: string;
  tracksAdded: number;
  year: number;
}

async function createPlaylist(
  params: PlaylistCreationParams
): Promise<PlaylistCreationResult>;
```

**Logic:**

1. Get user ID: `GET /v1/me`
2. Create playlist: `POST /v1/users/{userId}/playlists`
   - Name: `"{Artist} — Average Setlist {year}"`
   - Public: false
3. Add tracks: `POST /v1/playlists/{playlistId}/tracks` with array of track URIs
4. Return playlist ID, track count, and year

### 5. Main Orchestrator

**Endpoint:** `GET /create-playlist?artistId={id}&artistName={name}&year={year}`

**Interface:**

```typescript
interface CreatePlaylistRequest {
  artistId: string;
  artistName: string;
  year?: number;
  accessToken: string;
}

async function handleCreatePlaylist(
  request: CreatePlaylistRequest
): Promise<PlaylistCreationResult>;
```

**Workflow:**

1. Validate access token is present
2. Fetch average setlist from setlist.fm
3. Match songs to Spotify tracks
4. Create playlist with matched tracks
5. Return result

## Data Models

### SetlistSong

```typescript
interface SetlistSong {
  name: string; // Song title
  position: number; // Order in setlist (1-indexed)
}
```

### TrackSearchResult

```typescript
interface TrackSearchResult {
  songName: string; // Original song name from setlist
  trackUri: string | null; // Spotify URI if found
  found: boolean; // Whether track was found
}
```

### PlaylistCreationResult

```typescript
interface PlaylistCreationResult {
  playlistId: string; // Spotify playlist ID
  tracksAdded: number; // Number of tracks successfully added
  year: number; // Year of the setlist
}
```

### SpotifyTokenData

```typescript
interface SpotifyTokenData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: OAuth URL Generation

_For any_ Spotify auth configuration, the generated authorization URL should contain the correct authorization endpoint, client ID, redirect URI, and required scopes (`playlist-modify-private` and `playlist-modify-public`)
**Validates: Requirements 1.1**

### Property 2: Token Exchange Error Handling

_For any_ invalid authorization code, the token exchange should return an error response with details rather than throwing an unhandled exception
**Validates: Requirements 1.4**

### Property 3: Default Year Assignment

_For any_ setlist request without a specified year, the system should use the current year as the target year
**Validates: Requirements 2.2**

### Property 4: Song Order Preservation

_For any_ setlist API response containing songs, the extracted song array should preserve the original order from the API response
**Validates: Requirements 2.3, 2.5**

### Property 5: Year Retry Logic

_For any_ artist ID, if the setlist API returns no songs for year Y, the system should retry with year Y-1
**Validates: Requirements 2.4**

### Property 6: Track Search Completeness

_For any_ list of song names, the system should perform a Spotify search for each song in the list, regardless of whether previous searches succeeded or failed
**Validates: Requirements 3.1, 3.4**

### Property 7: Playlist Name Format

_For any_ artist name and year, the created playlist name should follow the format "{Artist} — Average Setlist {year}"
**Validates: Requirements 4.2**

### Property 8: Playlist Visibility

_For any_ playlist creation request, the playlist should be created with visibility set to private (public: false)
**Validates: Requirements 4.3**

### Property 9: Track URI Addition

_For any_ set of collected track URIs, all URIs should be added to the created playlist
**Validates: Requirements 4.4**

### Property 10: Response Format Completeness

_For any_ successful playlist creation, the response should contain all three required fields: playlistId, tracksAdded, and year
**Validates: Requirements 4.5**

### Property 11: Error Response Format

_For any_ error condition (authentication failure, API unavailability, no data found), the system should return a JSON response with an error message and appropriate HTTP status code
**Validates: Requirements 5.1, 5.2, 5.3, 5.5**

### Property 12: Error Logging

_For any_ failed API request, the system should log error details including the error message and context
**Validates: Requirements 5.4**

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Invalid or expired access token
   - OAuth flow failures
   - Response: 401 Unauthorized with message

2. **External API Errors**
   - setlist.fm API unavailable or rate limited
   - Spotify API unavailable or rate limited
   - Response: 502 Bad Gateway with service name

3. **Data Not Found Errors**
   - No setlist data for artist/year (after retry)
   - No Spotify tracks found for any songs
   - Response: 404 Not Found with details

4. **Validation Errors**
   - Missing required parameters (artistId, artistName)
   - Invalid parameter formats
   - Response: 400 Bad Request with validation details

5. **Server Errors**
   - Unexpected exceptions
   - Function timeout
   - Response: 500 Internal Server Error with generic message

### Error Response Format

All errors return JSON:

```json
{
  "error": {
    "message": "Human-readable error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Retry Strategy

- **setlist.fm year fallback**: If no songs found for year Y, automatically retry with Y-1 (one retry only)
- **Spotify track search**: Continue processing all songs even if individual searches fail
- **No automatic retries**: For API failures (rate limits, timeouts), return error to client

### Logging

All errors should be logged with:

- Timestamp
- Error type and message
- Request context (artist ID, year, user ID if available)
- Stack trace for unexpected errors

## Testing Strategy

### Dual Testing Approach

This system will use both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and integration points with external APIs
- **Property tests**: Verify universal properties hold across all inputs using randomized testing

### Unit Testing Focus

Unit tests should cover:

- Specific OAuth flow examples (successful auth, callback handling)
- Integration with Spotify API (mocked responses for user ID fetch, playlist creation)
- Integration with setlist.fm API (mocked responses for setlist data)
- Edge cases: empty setlists, no tracks found, API errors
- Error conditions: invalid tokens, missing parameters, API failures

### Property-Based Testing Focus

Property tests should cover:

- URL generation with various configurations (Property 1)
- Error handling across different error types (Properties 2, 11, 12)
- Default parameter behavior (Property 3)
- Data transformation and ordering (Property 4)
- Retry logic with various inputs (Property 5)
- Search completeness with different song lists (Property 6)
- String formatting with various inputs (Property 7)
- Parameter values across all requests (Properties 8, 9)
- Response structure validation (Property 10)

### Property-Based Testing Configuration

- **Library**: fast-check (for Node.js/TypeScript)
- **Iterations**: Minimum 100 runs per property test
- **Tagging**: Each test must reference its design property
  - Format: `// Feature: setlist-to-spotify-playlist, Property {N}: {property text}`

### Test Organization

```
tests/
├── unit/
│   ├── oauth.test.ts
│   ├── setlist-fetcher.test.ts
│   ├── track-matcher.test.ts
│   ├── playlist-creator.test.ts
│   └── error-handler.test.ts
└── properties/
    ├── oauth.properties.test.ts
    ├── setlist.properties.test.ts
    ├── playlist.properties.test.ts
    └── error-handling.properties.test.ts
```

### Integration Testing

Since this is a serverless application with external API dependencies:

- Use mocked HTTP responses for Spotify and setlist.fm APIs
- Test the full workflow with realistic mock data
- Verify error propagation through the entire stack
- Test OAuth flow with mock authorization codes and tokens

### Manual Testing Checklist

Before deployment:

- [ ] Test OAuth flow in browser with real Spotify account
- [ ] Verify playlist creation with real artist data
- [ ] Test with various artists and years
- [ ] Verify error messages are user-friendly
- [ ] Check HTTPS enforcement on Netlify
- [ ] Verify environment variables are properly configured
