import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import tmdb, { hasApiKey } from '../lib/tmdb'
import useGenres from '../hooks/useGenres'
import { MovieCard } from '../components/MovieCard'
import { SkeletonGrid } from '../components/Skeleton'
import { ErrorState, EmptyState } from '../components/States'
import Reveal from '../components/Reveal'

export default function Genres() {
  const [params] = useSearchParams()
  const [mediaType, setMediaType] = useState(() => (params.get('media') === 'tv' ? 'tv' : 'movie'))
  const [active, setActive] = useState(() => Number(params.get('g')) || null)

  const switchMedia = (type) => {
    setMediaType(type)
    setActive(null)
  }

  const genreMap = useGenres(mediaType)
  const genres = useMemo(
    () => [...genreMap.entries()].sort((a, b) => a[1].localeCompare(b[1])),
    [genreMap],
  )

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    if (!hasApiKey) return
    setData(null)
    setError(null)
    if (!active) return
    tmdb
      .discover({ mediaType, genres: [active], sort: 'popularity.desc' })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [mediaType, active])

  const activeName = active ? genreMap.get(active) : null

  return (
    <div className="container grid-page">
      <Reveal>
        <div className="page-head">
          <p className="eyebrow">Browse by genre</p>
          <h1>Genres</h1>
          <p>Pick a genre and discover its best titles, sorted by popularity.</p>
        </div>
      </Reveal>

      <div className="filters">
        <div className="field">
          <label>Media type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={`chip ${mediaType === 'movie' ? 'is-active' : ''}`}
              aria-pressed={mediaType === 'movie'}
              onClick={() => switchMedia('movie')}
            >
              Movies
            </button>
            <button
              type="button"
              className={`chip ${mediaType === 'tv' ? 'is-active' : ''}`}
              aria-pressed={mediaType === 'tv'}
              onClick={() => switchMedia('tv')}
            >
              TV Shows
            </button>
          </div>
        </div>
      </div>

      {!hasApiKey ? (
        <div style={{ marginTop: 40 }}>
          <ErrorState message="Add your TMDB API key in the .env file to explore genres." />
        </div>
      ) : (
        <>
          <div
            className="row"
            style={{ gridAutoColumns: 'minmax(120px, 150px)', marginTop: 28 }}
            aria-label="Genre list"
          >
            <button
              type="button"
              className={`chip ${!active ? 'is-active' : ''}`}
              aria-pressed={!active}
              onClick={() => setActive(null)}
            >
              All
            </button>
            {genres.map(([id, name]) => (
              <button
                key={id}
                type="button"
                className={`chip ${active === id ? 'is-active' : ''}`}
                aria-pressed={active === id}
                onClick={() => setActive(id)}
              >
                {name}
              </button>
            ))}
          </div>

          {activeName && (
            <h2 style={{ marginTop: 56, marginBottom: 32 }}>{activeName}</h2>
          )}

          {error && <ErrorState message="Could not load this genre." />}

          {!data && !error && !active && (
            <div style={{ marginTop: 40 }}>
              <EmptyState
                title="Pick a genre to start"
                body="Choose any genre above and the grid will fill with its best titles."
              />
            </div>
          )}

          {!data && !error && active && <div style={{ marginTop: 40 }}><SkeletonGrid /></div>}

          {data && (
            data.items.length === 0 ? (
              <EmptyState title="Nothing here yet" body="Try another genre. This one is quiet right now." />
            ) : (
              <Reveal delay={40}>
                <div className="movie-grid" style={{ marginTop: 8 }}>
                  {data.items.map((item) => (
                    <MovieCard
                      key={`${item.mediaType}-${item.id}`}
                      item={item}
                      genres={item.genreIds.map((id) => genreMap.get(id)).filter(Boolean)}
                    />
                  ))}
                </div>
              </Reveal>
            )
          )}
        </>
      )}
    </div>
  )
}