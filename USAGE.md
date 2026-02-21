# How to Use Your Setlist to Spotify Playlist App

## Quick Start

Your app is now deployed with a user-friendly web interface! Here's how to use it:

### 1. Access the App

Visit your Netlify site URL:

```
https://your-site.netlify.app
```

### 2. Login with Spotify

Click the green "Login with Spotify" button. This will:

- Redirect you to Spotify's authorization page
- Ask you to grant permissions to create playlists
- Redirect you back to the app with your access token

### 3. Find an Artist on setlist.fm

1. Go to [setlist.fm](https://www.setlist.fm)
2. Search for your favorite artist
3. Look at the URL - it will look like:
   ```
   https://www.setlist.fm/setlists/taylor-swift-53926dfc.html
   ```
4. The artist ID is the part after the last dash: `53926dfc`

### 4. Create Your Playlist

Fill in the form:

- **Artist ID**: The ID you found on setlist.fm (e.g., `53926dfc`)
- **Artist Name**: The artist's name (e.g., `Taylor Swift`)
- **Year** (optional): Leave blank for current year, or enter a specific year (e.g., `2023`)

Click "Create Playlist" and wait a few seconds.

### 5. Enjoy Your Playlist!

Once created, you'll see:

- A success message
- The number of tracks added
- A button to open the playlist directly in Spotify

The playlist will be private and named: `{Artist} — Average Setlist {year}`

## Example Artists to Try

Here are some popular artists with their setlist.fm IDs:

- **Taylor Swift**: `53926dfc`
- **Coldplay**: `bd6bd12`
- **Ed Sheeran**: `4bd6adf9`
- **Foo Fighters**: `bd6ad4a`
- **Metallica**: `6bd6ad4e`

## Troubleshooting

### "No setlist data available"

- The artist might not have performed in that year
- Try a different year or leave it blank for the current year

### "Authentication failed"

- Click "Login with Spotify" again
- Make sure you approve all the requested permissions

### "Track not found"

- Some songs might not be available on Spotify
- The playlist will still be created with the songs that were found

## Features

- ✅ Automatically finds the most commonly played songs
- ✅ Creates a private playlist in your Spotify account
- ✅ Preserves the typical setlist order
- ✅ Handles songs that aren't on Spotify gracefully
- ✅ Works on mobile and desktop

## Need Help?

If you encounter any issues, check:

1. Your Spotify account is properly connected
2. The artist ID is correct (from setlist.fm)
3. The artist has performed shows in the selected year

Enjoy discovering new setlists! 🎵
