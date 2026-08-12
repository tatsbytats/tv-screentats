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
