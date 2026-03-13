# API Implementation

## Goal

Make `imprint` on `http://localhost:3003` the source of truth for:

- Artist and manager platform connections
- Fan-side verification connections
- Server-to-server revenue and conviction imports
- Future provider adapters without adding one-off schema debt

## Current State

- Real now: Spotify artist auth, Spotify fan auth/sync, Oryx server-to-server import, email import.
- Partially real now: YouTube artist auth and sync.
- Placeholder now: Twitch, Discord, Apple Music, Bandcamp, Boomplay.
- Current blocker: only Spotify has a fan-side verification flow wired through the new generic connection model.

## Implementation Order

1. Normalize app URLs for `localhost:3003`.
2. Split artist and fan OAuth callback config per provider.
3. Add a generic `FanPlatformConnection` model.
4. Move fan-side Spotify reads onto the generic connection model.
5. Keep legacy Spotify fields temporarily for backward compatibility.
6. Implement real provider adapters in this order:
   - YouTube
   - Discord
   - Twitch
   - Apple Music
   - Bandcamp
   - Boomplay

## Environment Variables

```bash
APP_URL="http://localhost:3003"
NEXTAUTH_URL="http://localhost:3003"
AUTH_SECRET="..."

SPOTIFY_CLIENT_ID="..."
SPOTIFY_CLIENT_SECRET="..."
SPOTIFY_ARTIST_REDIRECT_URI="http://localhost:3003/api/auth/spotify/callback"
SPOTIFY_FAN_REDIRECT_URI="http://localhost:3003/api/fan/auth/spotify/callback"

YOUTUBE_CLIENT_ID=""
YOUTUBE_CLIENT_SECRET=""
YOUTUBE_ARTIST_REDIRECT_URI="http://localhost:3003/api/auth/youtube/callback"
YOUTUBE_FAN_REDIRECT_URI="http://localhost:3003/api/fan/auth/youtube/callback"

TWITCH_CLIENT_ID=""
TWITCH_CLIENT_SECRET=""
TWITCH_ARTIST_REDIRECT_URI="http://localhost:3003/api/auth/twitch/callback"
TWITCH_FAN_REDIRECT_URI="http://localhost:3003/api/fan/auth/twitch/callback"

DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
DISCORD_ARTIST_REDIRECT_URI="http://localhost:3003/api/auth/discord/callback"
DISCORD_FAN_REDIRECT_URI="http://localhost:3003/api/fan/auth/discord/callback"

APPLE_MUSIC_KEY_ID=""
APPLE_MUSIC_TEAM_ID=""
APPLE_MUSIC_PRIVATE_KEY=""
APPLE_MUSIC_FAN_REDIRECT_URI="http://localhost:3003/api/fan/auth/apple-music/callback"

ORYX_API_URL="http://localhost:4000"
ECOSYSTEM_API_SECRET=""
```

## Data Model Direction

### Artist Side

Keep using `PlatformConnection` on the artist `User` model.

### Fan Side

Add `FanPlatformConnection`:

- `fanUserId`
- `platform`
- `platformUserId`
- `accessToken`
- `refreshToken`
- `tokenExpiresAt`
- `platformScope`
- `status`
- `lastSyncAt`
- `syncError`

This replaces future provider-specific token columns on `FanUser`.

## Provider Notes

### Spotify

- Artist side: connect account, store tokens, resolve `spotifyArtistId`.
- Fan side: connect fan Spotify, sync listening signals against registered artists.
- Status in repo: partially implemented.

### Oryx

- Server-to-server only.
- Match by shared artist email.
- Import historical backers and ongoing conviction events.
- Status in repo: implemented.

### YouTube

- Artist side: YouTube Analytics API + YouTube Data API.
- Fan side: Google OAuth, subscription/comment/engagement matching where available.
- Status in repo: artist-side auth/sync implemented and public subscriber import added. Private subscribers and deeper engagement signals are still pending.

### Discord

- Use for identity, guild joins, roles, and activity.
- Do not treat it as a substitute for streaming analytics.

### Twitch

- Use Helix/EventSub for follows, subs, bits, and live activity.
- UI should stay disabled until real backend support exists.

### Apple Music

- Fan side first via MusicKit / Apple Music API.
- Artist-facing analytics likely remain export or partner territory.

### Bandcamp

- Prefer API access if approved.
- Fallback path already exists via server-to-server purchase import.

### Boomplay

- Treat as partner/export/manual import until official access is secured.

## Immediate Deliverables In This Pass

- `3003` URL normalization
- Separate Spotify artist/fan redirect handling
- Generic fan platform connections
- Spotify fan flow migrated onto the generic connection layer
- YouTube artist OAuth callback and sync wiring
- UI corrected so unsupported platforms are not shown as ready
