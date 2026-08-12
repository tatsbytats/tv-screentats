/**
 * VidKing embeddable player integration.
 * Docs: https://www.vidking.net/#documentation
 *
 * Routes:
 *   /embed/movie/{tmdbId}
 *   /embed/tv/{tmdbId}/{season}/{episode}
 * Params: color (hex without #), autoPlay, nextEpisode, episodeSelector, progress (start seconds)
 * The player posts progress events (PLAYER_EVENT) to the parent window.
 */

export const VIDKING_COLOR = '7CFFB2' // ScreenTats mint accent

export function buildPlayerUrl({ mediaType, id, season, episode, startTime = 0 }) {
  const base =
    mediaType === 'tv'
      ? `https://www.vidking.net/embed/tv/${id}/${season ?? 1}/${episode ?? 1}`
      : `https://www.vidking.net/embed/movie/${id}`
  const params = new URLSearchParams({
    color: VIDKING_COLOR,
    autoPlay: 'true',
  })
  if (mediaType === 'tv') {
    params.set('nextEpisode', 'true')
    params.set('episodeSelector', 'true')
  }
  if (startTime > 0) params.set('progress', String(Math.round(startTime)))
  return `${base}?${params.toString()}`
}

/**
 * Parses a VidKing postMessage event into a normalized payload.
 * Returns null for unrelated messages.
 */
export function parsePlayerEvent(raw, expected) {
  let data
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }
  if (!data || data.type !== 'PLAYER_EVENT' || !data.data) return null
  const d = data.data
  if (!d.id || !d.event) return null
  if (expected && String(d.id) !== String(expected.id)) return null
  if (expected?.mediaType && d.mediaType && d.mediaType !== expected.mediaType) return null
  return {
    id: Number(d.id),
    mediaType: d.mediaType === 'tv' ? 'tv' : 'movie',
    event: d.event,
    currentTime: Number(d.currentTime) || 0,
    duration: Number(d.duration) || 0,
    progress: Number(d.progress) || 0,
    season: d.season != null ? Number(d.season) : null,
    episode: d.episode != null ? Number(d.episode) : null,
  }
}