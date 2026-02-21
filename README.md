# Setlist to Spotify Playlist

Automatically create Spotify playlists from an artist's average setlist using data from setlist.fm.

## Features

- 🎵 Fetches average setlist data from setlist.fm
- 🔍 Searches and matches tracks on Spotify
- 📝 Creates a private Spotify playlist with the setlist songs
- 🎨 Simple, clean web interface
- ⚡ Serverless deployment on Netlify

## How to Use

1. **Visit your deployed site** (e.g., `https://your-site.netlify.app`)

2. **Login with Spotify** - Click the "Login with Spotify" button to authorize the app

3. **Find an artist on setlist.fm**:
   - Go to [setlist.fm](https://www.setlist.fm)
   - Search for your favorite artist
   - Copy the artist ID from the URL (e.g., `https://www.setlist.fm/setlists/taylor-swift-53926dfc.html` → ID is `53926dfc`)

4. **Create your playlist**:
   - Enter the artist ID
   - Enter the artist name
   - Optionally specify a year (defaults to current year)
   - Click "Create Playlist"

5. **Enjoy!** - Your new playlist will open in Spotify

## Setup

### Prerequisites

- Node.js 20+
- Netlify account
- Spotify Developer account
- setlist.fm API key

### Environment Variables

Create a `.env` file or set these in Netlify:

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-site.netlify.app/callback
SETLISTFM_API_KEY=your_setlistfm_api_key
```

**Important**: The redirect URI should be `https://your-site.netlify.app/callback` (not `/.netlify/functions/callback`). The app uses Netlify redirects to route this cleanly.

### Local Development

```bash
npm install
npm run build
netlify dev
```

### Deployment

```bash
npm run build
netlify deploy --prod
```

Or connect your GitHub repo to Netlify for automatic deployments.

## Project Structure

```
.
├── public/                # Static frontend files
│   └── index.html        # Web UI
├── src/                  # Core application logic
├── netlify/functions/    # Netlify serverless function endpoints
├── tests/
│   ├── unit/            # Unit tests
│   └── properties/      # Property-based tests
├── tsconfig.json        # TypeScript configuration
├── vitest.config.ts     # Vitest test configuration
└── package.json         # Project dependencies and scripts
```

## API Endpoints

- `GET /.netlify/functions/login` - Initiates Spotify OAuth flow
- `GET /.netlify/functions/callback` - Handles OAuth callback
- `GET /.netlify/functions/create-playlist` - Creates the playlist

## Testing

- Run all tests: `npm test`
- Run tests in watch mode: `npm run test:watch`
- Run tests with coverage: `npm run test:coverage`

## Tech Stack

- TypeScript
- Netlify Functions (Serverless)
- Spotify Web API
- setlist.fm API
- Vanilla JavaScript (frontend)

## License

MIT
