import { useEffect, useState } from 'react'
import tmdb from '../lib/tmdb'

/**
 * Loads a TMDB genre map (id -> name) for the given media type.
 */
export default function useGenres(mediaType = 'movie') {
  const [map, setMap] = useState(new Map())

  useEffect(() => {
    let alive = true
    if (!tmdb.hasApiKey) return
    tmdb.getGenreMap(mediaType).then((m) => {
      if (alive) setMap(m)
    })
    return () => {
      alive = false
    }
  }, [mediaType])

  return map
}

/** Resolves genre ids into display names. */
export function useGenreNames(mediaType = 'movie') {
  const map = useGenres(mediaType)
  return (ids) => (ids ?? []).map((id) => map.get(id)).filter(Boolean)
}