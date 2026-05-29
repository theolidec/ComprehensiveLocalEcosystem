# Music Module Overview

## Features
- Upload, validate, and play music/audio files
- **Public/private music** - songs can be marked as public (discoverable by anyone) or private (only visible to owner)
- **Transfer ownership** - transfer any owned song to another user by email
- **Edit metadata** - update song title and artist after upload
- Playlist creation and management
- Playlist playback (auto-advance to next song, loop from end to start)
- Shuffle/scrambled playback
- Spotify-style UI
- Floating player visible on all pages (appears when a song is selected)

## Backend
- Endpoints: `/api/music` (see `doc/architecture/api-overview.md`)
- Models: `Music`, `Playlist`
- Controller: `musicController.js`
- Route: `routes/music.js`

## Frontend
- Routes:
  - `/music` → redirects to `/music/library`
  - `/music/library` → My Library tab
  - `/music/artists` → Artists tab
  - `/music/discover` → Discover tab (public music)
  - `/music/upload` → Upload tab
- Components: `MusicPage`, `MusicUpload`, `MusicPlayer`, `Playlist`, `FloatingMusicPlayer`
- Floating player is always visible (bottom right)
- Context: `MusicContext` manages playback state, playlist queue, shuffle, and volume (`volume`, `changeVolume`)

## Usage
- Go to `/music/library` to view your music library
- Select an audio file - a popup will appear to enter Song Name, Artist, and optionally add to a playlist
- When typing an artist name that matches an existing artist case-insensitively (but not identically), a **"Did you mean [Artist]?"** hint appears below the field; clicking "Use it" replaces the typed value with the existing artist's exact casing
- Check "Make this song public" to make a song publicly discoverable (default is private)
- Each song shows a 🔓 Public or 🔒 Private badge in "All Your Music"
- Click the 🔒/🔓 button next to any song to toggle its visibility
- Expand "Public Music" section to browse songs shared by all users
- Public songs can be added to your playlists but can only be deleted by their owners
- Click "New Playlist" to create a new playlist with name and description
- Click on a playlist to view and play songs in it
- Click "Play All" to start playing the entire playlist from the first song
- Click any song in a playlist to start playing from that song (playlist becomes the active queue)
- Click "Add to Playlist" on any song to add it to an existing playlist
- Click the ✕ button on a song in a playlist to remove it
- Click "Delete Playlist" to remove a playlist (songs are not deleted)
- Click the 🗑 button on any song to delete it (with confirmation popup)
- Click the ✏️ button on any song to edit its title or artist
- Click the ↪️ button on any song to transfer ownership to another user (enter their email)
- Play music from anywhere using the floating player
- Visual indicators show which playlist is currently playing (green border + ▶ icon)
- Currently playing track is highlighted in the playlist view
- Floating player shows playlist name and track position (e.g., "Playlist Name (2/5)")
- Use ⏮/⏭ buttons to skip to previous/next track in the playlist
- Use ⇌ button to toggle shuffle mode (randomizes playback order)
- Use ↻ button to toggle loop mode (single track loop)
- Use the 🔊/🔉/🔇 volume slider to adjust playback volume (0–100%); persisted across page navigations via cookie
- When playlist reaches the end, it loops back to the beginning (unless shuffle is on)

## Architecture References
- See also: `doc/architecture/backend.md`, `doc/architecture/frontend.md`, `doc/architecture/api-overview.md`
