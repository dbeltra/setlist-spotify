# Requirements Document

## Introduction

This system enables users to automatically generate Spotify playlists based on an artist's average setlist for a given year, sourced from setlist.fm. The application is a serverless web app deployed on Netlify that handles Spotify OAuth authentication, fetches setlist data, and creates personalized playlists.

## Glossary

- **System**: The setlist-to-spotify-playlist serverless application
- **Spotify_API**: The Spotify Web API service
- **Setlistfm_API**: The setlist.fm API service
- **User**: A person using the application to create playlists
- **Access_Token**: OAuth token for authenticated Spotify API requests
- **Average_Setlist**: The statistically most common songs played by an artist in a given year
- **Playlist**: A Spotify playlist containing tracks
- **Track_URI**: Spotify's unique identifier for a track

## Requirements

### Requirement 1: Spotify OAuth Authentication

**User Story:** As a user, I want to authenticate with Spotify, so that the system can create playlists on my behalf.

#### Acceptance Criteria

1. WHEN a user accesses the login endpoint, THE System SHALL redirect the user to the Spotify authorization endpoint with scopes `playlist-modify-private` and `playlist-modify-public`
2. WHEN Spotify redirects to the callback endpoint with an authorization code, THE System SHALL exchange the code for an Access_Token
3. WHEN the token exchange succeeds, THE System SHALL store the Access_Token for the request lifecycle
4. IF the token exchange fails, THEN THE System SHALL return an error response with details

### Requirement 2: Fetch Average Setlist Data

**User Story:** As a user, I want to retrieve the average setlist for an artist and year, so that I can create a playlist with those songs.

#### Acceptance Criteria

1. WHEN a user requests an average setlist with a specific year, THE System SHALL fetch data from the Setlistfm_API for that artist and year
2. WHEN a user requests an average setlist without specifying a year, THE System SHALL use the current year as the default
3. WHEN the Setlistfm_API returns setlist data, THE System SHALL parse and extract song titles in order
4. IF no songs are found for the requested year, THEN THE System SHALL retry with the previous year
5. WHEN song extraction is complete, THE System SHALL return an ordered array of song names

### Requirement 3: Search and Match Spotify Tracks

**User Story:** As a user, I want the system to find Spotify tracks matching the setlist songs, so that the correct songs are added to my playlist.

#### Acceptance Criteria

1. WHEN the System has a list of song names, THE System SHALL search the Spotify_API for each song using the track name and artist name
2. WHEN searching for a track, THE System SHALL limit results to one track per search
3. WHEN a track is found, THE System SHALL collect the Track_URI for playlist addition
4. IF a track is not found, THEN THE System SHALL continue processing remaining songs without failing

### Requirement 4: Create Spotify Playlist

**User Story:** As a user, I want the system to create a new Spotify playlist with the setlist songs, so that I can listen to the average setlist.

#### Acceptance Criteria

1. WHEN creating a playlist, THE System SHALL retrieve the authenticated user's Spotify user ID
2. WHEN the user ID is obtained, THE System SHALL create a new playlist with the name format "{Artist} — Average Setlist {year}"
3. WHEN creating the playlist, THE System SHALL set the playlist visibility to private
4. WHEN the playlist is created, THE System SHALL add all collected Track_URIs to the playlist
5. WHEN playlist creation completes, THE System SHALL return a response containing the playlist ID, number of tracks added, and year

### Requirement 5: Error Handling and Resilience

**User Story:** As a user, I want the system to handle errors gracefully, so that I receive clear feedback when something goes wrong.

#### Acceptance Criteria

1. IF the Spotify_API returns an authentication error, THEN THE System SHALL return an error response indicating authentication failure
2. IF the Setlistfm_API is unavailable, THEN THE System SHALL return an error response indicating the service is unavailable
3. IF no songs are found after retrying with the previous year, THEN THE System SHALL return an error response indicating no setlist data is available
4. WHEN any API request fails, THE System SHALL log the error details for debugging
5. WHEN an error occurs, THE System SHALL return a JSON response with an error message and appropriate HTTP status code

### Requirement 6: Serverless Deployment

**User Story:** As a developer, I want to deploy the application on Netlify, so that it runs as a serverless function with HTTPS support.

#### Acceptance Criteria

1. THE System SHALL be deployable as Netlify Functions
2. THE System SHALL serve all endpoints over HTTPS
3. THE System SHALL store sensitive credentials as environment variables
4. WHEN deployed, THE System SHALL handle concurrent requests independently
5. THE System SHALL complete each request within Netlify's function timeout limits
