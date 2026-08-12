# ScreenTats — Movie Discovery & Streaming Webapp

A premium, dark cinematic movie discovery platform: browse, search, watch trailers, stream
full movies & TV series, and pick up right where you left off.

> **"Find something worth watching."**

## Features

- **Hero / featured film** with trailer + watchlist actions
- **Trending Now** & **Popular This Week** (bento grid) collections
- **Browse by Genre** (movies & TV), with live filtered grids
- **Search** — title/actor/keyword with genre, year, and rating filters plus sorting
- **Continue Watching** — real resume support, powered by the VidKing player's progress events
- **Recommended For You** — "Because you watched…" personalization
- **Watchlist** (localStorage-persisted) and **Profile dashboard** (bento stats)
- Movie & TV **detail pages**: full credits, cast row, seasons/episodes, similar titles
- Fully responsive: desktop bento → tablet → mobile with bottom navigation
- Loading skeletons, empty states, error states, keyboard navigation, focus rings, reduced-motion support

## Tech stack

- React 19 + Vite 8 (SPA, hash routing — runs from any static folder)
- TMDB v3 API for all metadata and artwork
- VidKing embeddable player for streaming: `https://www.vidking.net/embed/movie/{tmdbId}`
  and `embed/tv/{tmdbId}/{season}/{episode}`, branded with the app's mint accent
  (`color=7CFFB2`) and configured for autoPlay, next-episode, and episode-selector.
- Zero other runtime dependencies.

## Setup

1. **Get a free TMDB API key** — create an account at <https://www.themoviedb.org> →
   Settings → API → Request an API key (v3 auth).
2. Copy `.env.example` to `.env` and paste your key:

   ```
   VITE_TMDB_API_KEY=your_key_here
   ```

3. Install and run:

   ```
   npm install
   npm run dev      # local dev server (defaults to http://localhost:5173)
   ```

4. Production build:

   ```
   npm run build    # outputs to dist/
   ```

   Copy the contents of `dist/` into `htdocs/moviewebapp/` (or any web root) — hash
   routing means no server rewrites are needed.

## Deploy to Vercel

1. Push this repo to GitHub (`.env` is gitignored and never committed).
2. Import the repo at <https://vercel.com/new> — Vite is detected automatically
   (`vercel.json` is included; output directory: `dist`).
3. **Add the API key as a Production environment variable** (Project → Settings →
   Environment Variables):
   ```
   VITE_TMDB_API_KEY=your_key_here
   ```
   Never commit the key to the repository — it reads from `import.meta.env.VITE_TMDB_API_KEY`.
4. Deploy. Without the key, the app runs in "no-key" demo mode with guided error states.

## VidKing integration notes

- Progress events arrive via `window.postMessage` as `PLAYER_EVENT` with
  `timeupdate`, `play`, `pause`, `ended`, `seeked` events containing
  `currentTime`, `duration`, `progress`, `id`, `mediaType`, `season`, `episode`.
- The app validates the event's id/mediaType against the currently playing title and
  throttles `timeupdate` writes (≥1% progress change or ≥4s) before persisting to
  localStorage (`screentats:continue`).
- Resuming passes the saved position via the player's `progress` (start seconds) param.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
Streaming infrastructure: VidKing (https://www.vidking.net).
