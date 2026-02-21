# Setup Instructions

## Fix the Redirect URI Issue

You're getting a 404 because your Spotify app is configured with the wrong redirect URI. Here's how to fix it:

### Step 1: Update Spotify Developer Settings

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click on your app
3. Click "Edit Settings"
4. Under "Redirect URIs", update or add:
   ```
   https://setlist-to-spotify.netlify.app/callback
   ```
   **Note**: Use `/callback` NOT `/.netlify/functions/callback`
5. Click "Save"

### Step 2: Update Netlify Environment Variable

1. Go to your Netlify dashboard
2. Select your site
3. Go to "Site configuration" → "Environment variables"
4. Update `SPOTIFY_REDIRECT_URI` to:
   ```
   https://setlist-to-spotify.netlify.app/callback
   ```
5. Save and redeploy

### Step 3: Redeploy

After updating the environment variable, trigger a new deployment:

```bash
git add .
git commit -m "Fix redirect URI"
git push
```

Or manually trigger a deploy in Netlify dashboard.

## How It Works

The app uses Netlify redirect rules (in `netlify.toml`) to route clean URLs:

- `/callback` → `/.netlify/functions/callback`
- `/login` → `/.netlify/functions/login`
- `/create-playlist` → `/.netlify/functions/create-playlist`

This gives you cleaner URLs without exposing the `/.netlify/functions/` path.

## Testing Locally

For local development with Netlify Dev:

1. Update your `.env` file:

   ```
   SPOTIFY_REDIRECT_URI=http://localhost:8888/callback
   ```

2. Add this to your Spotify app's redirect URIs:

   ```
   http://localhost:8888/callback
   ```

3. Run:

   ```bash
   npm run build
   netlify dev
   ```

4. Visit `http://localhost:8888`

## Verification

After making these changes, the OAuth flow should work:

1. Click "Login with Spotify" → redirects to Spotify
2. Approve permissions → redirects to `/callback`
3. Callback exchanges code for token → redirects to `/?access_token=...`
4. Frontend stores token and shows the form

You should no longer see the 404 error!
