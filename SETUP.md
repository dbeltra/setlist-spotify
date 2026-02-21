# Setup Instructions

## Current Configuration (Correct)

Your current setup is correct! Keep these settings:

### Spotify Developer Dashboard

Redirect URI should be:

```
https://setlist-to-spotify.netlify.app/.netlify/functions/callback
```

### Netlify Environment Variable

`SPOTIFY_REDIRECT_URI` should be:

```
https://setlist-to-spotify.netlify.app/.netlify/functions/callback
```

## If You're Still Getting Errors

### "Invalid redirect URI" Error

This means there's a mismatch. Double-check:

1. **Spotify Dashboard** (https://developer.spotify.com/dashboard):
   - Click your app → Edit Settings
   - Under "Redirect URIs", you should see EXACTLY:
     ```
     https://setlist-to-spotify.netlify.app/.netlify/functions/callback
     ```
   - If it's different, update it and click Save

2. **Netlify Environment Variables**:
   - Go to Site configuration → Environment variables
   - `SPOTIFY_REDIRECT_URI` should be EXACTLY:
     ```
     https://setlist-to-spotify.netlify.app/.netlify/functions/callback
     ```
   - If you change it, redeploy your site

3. **Redeploy** after any changes:
   ```bash
   git add .
   git commit -m "Update configuration"
   git push
   ```

### Common Issues

**Issue**: "INVALID_REQUEST: Invalid redirect URI"
**Solution**: The redirect URI in Spotify Dashboard and the `SPOTIFY_REDIRECT_URI` environment variable must match EXACTLY (including `https://`, trailing slashes, etc.)

**Issue**: 404 Not Found on callback
**Solution**: Make sure you've deployed the latest code

## Testing Locally

For local development with Netlify Dev:

1. Add to your Spotify app's redirect URIs:

   ```
   http://localhost:8888/.netlify/functions/callback
   ```

2. Update your local `.env` file:

   ```
   SPOTIFY_REDIRECT_URI=http://localhost:8888/.netlify/functions/callback
   ```

3. Run:

   ```bash
   npm run build
   netlify dev
   ```

4. Visit `http://localhost:8888`

## Verification Steps

After deploying, test the OAuth flow:

1. Visit `https://setlist-to-spotify.netlify.app`
2. Click "Login with Spotify"
3. You should be redirected to Spotify's authorization page
4. After approving, you should be redirected back to your app with the form visible
5. No 404 or "Invalid redirect URI" errors

If you see any errors, check the browser console and network tab for details.
