import { useCallback, useEffect, useRef, useState } from 'react'
import tmdb, { hasApiKey } from '../lib/tmdb'
import useGenres from '../hooks/useGenres'
import { MovieCard } from '../components/MovieCard'
import { SkeletonGrid } from '../components/Skeleton'
import { ErrorState, EmptyState } from '../components/States'
import Reveal from '../components/Reveal'
import { FilmIcon, TvIcon } from '../components/Icons'

const YEARS = Array.from({ length: 27 }, (_, i) => new Date().getFullYear() - i)

const SORTS = [
  { value: 'popularity.desc', label: 'Most popular' },
  { value: 'vote_average.desc', label: 'Top rated' },
  { value: 'release.desc', label: 'Newest first' },
]

function toSortBy(mediaType, sort) {
  if (sort === 'release.desc') {
    return mediaType === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc'
  }
  return sort
}

export default function MediaGridPage({ mediaType }) {
  const isMovie = mediaType === 'movie'
  const genreMap = useGenres(mediaType)
  const genres = [...genreMap.entries()].sort((a, b) => a[1].localeCompare(b[1]))

  const [genre, setGenre] = useState(null)
  const [year, setYear] = useState('')
  const [minRating, setMinRating] = useState('')
  const [sort, setSort] = useState(SORTS[0].value)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const pageRef = useRef(0)

  const fetchPage = useCallback(
    async (page, replace) => {
      if (!hasApiKey) return null
      try {
        const d = await tmdb.discover({
          mediaType,
          genres: genre ? [genre] : undefined,
          year: year || undefined,
          minRating: minRating || undefined,
          sort: toSortBy(mediaType, sort),
          page,
        })
        setData((prev) =>
          replace
            ? d
            : prev
              ? { ...d, items: [...prev.items, ...d.items] }
              : d,
        )
        setHasMore(d.page < d.totalPages)
        pageRef.current = page
        return d
      } catch (e) {
        setError(e.message)
        return null
      }
    },
    [mediaType, genre, year, minRating, sort],
  )

  useEffect(() => {
    setData(null)
    setError(null)
    setHasMore(true)
    fetchPage(1, true)
  }, [fetchPage])

  const loadMore = async () => {
    setLoadingMore(true)
    await fetchPage(pageRef.current + 1, false)
    setLoadingMore(false)
  }

  if (!hasApiKey) {
    return (
      <div className="container section">
        <ErrorState message="Add your TMDB API key in the .env file to browse titles." />
      </div>
    )
  }

  const showGenres = genres.slice(0, 19)

  return (
    <div className="container grid-page">
      <Reveal>
        <div className="page-head">
          <p className="eyebrow">{isMovie ? 'Cinema' : 'Series'}</p>
          <h1>{isMovie ? 'Movies' : 'TV Shows'}</h1>
          <p>
            {isMovie
              ? 'Every film worth your evening, sorted, filtered, and ready to watch.'
              : 'Complete series across every genre. Pick a season and press play.'}
          </p>
        </div>
      </Reveal>

      <search className="filters" aria-label={`Filter ${isMovie ? 'movies' : 'TV shows'}`}>
        <div className="field grow">
          <label htmlFor={`genre-${mediaType}`}>Genre</label>
          <select
            id={`genre-${mediaType}`}
            className="select"
            value={genre ?? ''}
            onChange={(e) => setGenre(e.target.value || null)}
          >
            <option value="">All genres</option>
            {showGenres.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`year-${mediaType}`}>{isMovie ? 'Release year' : 'Premiered'}</label>
          <select
            id={`year-${mediaType}`}
            className="select"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">Any year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`rating-${mediaType}`}>Minimum rating</label>
          <select
            id={`rating-${mediaType}`}
            className="select"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
          >
            <option value="">Any rating</option>
            {[8, 7, 6, 5].map((r) => (
              <option key={r} value={r}>
                {r}.0+
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`sort-${mediaType}`}>Sort by</label>
          <select
            id={`sort-${mediaType}`}
            className="select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </search>

      {error && <ErrorState message="Could not load this collection." onRetry={() => fetchPage(1, true)} />}

      {!data && !error && <div style={{ marginTop: 40 }}><SkeletonGrid /></div>}

      {data && (
        <>
          {data.items.length === 0 ? (
            <EmptyState
              icon={isMovie ? <FilmIcon width={26} height={26} /> : <TvIcon width={26} height={26} />}
              title="Nothing matches those filters"
              body="Loosen a filter or two and try again. There is always something worth watching."
            />
          ) : (
            <>
              <Reveal delay={60}>
                <div style={{ marginTop: 40 }}>
                  <div className="movie-grid">
                    {data.items.map((item) => (
                      <MovieCard
                        key={`${item.mediaType}-${item.id}`}
                        item={item}
                        genres={item.genreIds.map((id) => genreMap.get(id)).filter(Boolean)}
                      />
                    ))}
                  </div>
                </div>
              </Reveal>
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 48 }}>
                  <button type="button" className="btn btn-outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}