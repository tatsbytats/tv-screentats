import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import tmdb, { hasApiKey } from '../lib/tmdb'
import useGenres from '../hooks/useGenres'
import { MovieCard } from '../components/MovieCard'
import { SkeletonGrid } from '../components/Skeleton'
import { ErrorState, EmptyState } from '../components/States'
import Reveal from '../components/Reveal'
import { SearchIcon, FilmSlateIcon } from '../components/Icons'

const YEAR_PATTERN = /^(19|20)\d{2}$/

const YEARS = Array.from({ length: 27 }, (_, i) => new Date().getFullYear() - i)

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const inputRef = useRef(null)

  const [query, setQuery] = useState(q)
  const [tab, setTab] = useState('all')
  const [genre, setGenre] = useState('')
  const [year, setYear] = useState('')
  const [minRating, setMinRating] = useState('')
  const [sort, setSort] = useState('popularity.desc')

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const movieGenreMap = useGenres('movie')
  const tvGenreMap = useGenres('tv')

  /* keep input in sync with url */
  useEffect(() => setQuery(q), [q])

  /* debounced search */
  useEffect(() => {
    const timer = setTimeout(() => {
      setParams(q ? { q } : {}, { replace: true })
    }, 120)
    return () => clearTimeout(timer)
  }, [q, setParams])

  useEffect(() => {
    let alive = true
    if (!q.trim()) {
      setResults(null)
      return undefined
    }
    setLoading(true)
    setError(null)
    Promise.allSettled([tmdb.search(q, 'movie', 1), tmdb.search(q, 'tv', 1), tmdb.search(q, 'movie', 2)])
      .then(([movies, tv, more]) => {
        if (!alive) return
        const items = [
          ...(movies.status === 'fulfilled' ? movies.value.items : []),
          ...(tv.status === 'fulfilled' ? tv.value.items : []),
          ...(more.status === 'fulfilled' ? more.value.items : []),
        ]
        const seen = new Set()
        const deduped = items.filter((it) => {
          const key = `${it.mediaType}-${it.id}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        setResults(deduped)
        setLoading(false)
      })
      .catch((e) => {
        if (alive) {
          setError(e.message)
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [q])

  const filtered = useMemo(() => {
    if (!results) return []
    let list = results.filter((it) => {
      if (tab === 'movies' && it.mediaType !== 'movie') return false
      if (tab === 'tv' && it.mediaType !== 'tv') return false
      const itemYear = it.year
      if (year && !YEAR_PATTERN.test(year)) return false
      if (year && itemYear !== year) return false
      if (minRating && (it.rating == null || it.rating < Number(minRating))) return false
      if (genre && !(it.genreIds ?? []).includes(Number(genre))) return false
      return true
    })
    if (sort === 'popularity.desc') list.sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0))
    else if (sort === 'release.desc') list.sort((a, b) => String(b.year ?? '').localeCompare(String(a.year ?? '')))
    else if (sort === 'rating.desc') list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    return list
  }, [results, tab, year, minRating, genre, sort])

  const genres = useMemo(() => {
    const merged = new Map(movieGenreMap)
    for (const [id, name] of tvGenreMap) if (!merged.has(id)) merged.set(id, name)
    return [...merged.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [movieGenreMap, tvGenreMap])

  const hasQuery = q.trim().length > 0

  return (
    <div className="container grid-page">
      <Reveal>
        <div className="page-head">
          <p className="eyebrow">Discovery</p>
          <h1>Search</h1>
          <p>Find a movie, a series, an actor, or a keyword you cannot shake.</p>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <div className="search-input-wrap">
          <SearchIcon width={22} height={22} />
          <input
            ref={inputRef}
            className="search-input"
            type="search"
            value={query}
            placeholder="Search titles, actors, genres…"
            onChange={(e) => {
              setQuery(e.target.value)
              setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })
            }}
            aria-label="Search movies and TV shows"
          />
        </div>
      </Reveal>

      {hasQuery && (
        <>
          <div className="filters" aria-label="Filter search results">
            <div className="field">
              <label htmlFor="s-tab">Type</label>
              <select id="s-tab" className="select" value={tab} onChange={(e) => setTab(e.target.value)}>
                <option value="all">Movies + TV</option>
                <option value="movies">Movies only</option>
                <option value="tv">TV only</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-genre">Genre</label>
              <select id="s-genre" className="select" value={genre} onChange={(e) => setGenre(e.target.value)}>
                <option value="">All genres</option>
                {genres.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-year">Year</label>
              <select id="s-year" className="select" value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">Any year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-rating">Minimum rating</label>
              <select id="s-rating" className="select" value={minRating} onChange={(e) => setMinRating(e.target.value)}>
                <option value="">Any rating</option>
                {[8, 7, 6, 5].map((r) => (
                  <option key={r} value={r}>
                    {r}.0+
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="s-sort">Sort by</label>
              <select id="s-sort" className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="popularity.desc">Most popular</option>
                <option value="rating.desc">Highest rated</option>
                <option value="release.desc">Newest first</option>
              </select>
            </div>
          </div>

          {loading && <div style={{ marginTop: 40 }}><SkeletonGrid /></div>}

          {!loading && error && <ErrorState message="Search is unavailable right now." />}

          {!loading && !error && results && (
            filtered.length === 0 ? (
              <EmptyState
                icon={<FilmSlateIcon width={26} height={26} />}
                title="Nothing matches those filters"
                body="Loosen a filter or two. There is always something worth watching."
              />
            ) : (
              <>
                <p className="search-count" role="status">
                  {filtered.length} {filtered.length === 1 ? 'top match' : 'top matches'} for “{q}”
                </p>
                <Reveal delay={40}>
                  <div className="search-results-grid">
                    {filtered.map((item) => (
                      <MovieCard
                        key={`${item.mediaType}-${item.id}`}
                        item={item}
                        genres={item.genreIds.map((id) => movieGenreMap.get(id) || tvGenreMap.get(id)).filter(Boolean)}
                      />
                    ))}
                  </div>
                </Reveal>
              </>
            )
          )}
        </>
      )}

      {!hasQuery && (
        <EmptyState
          icon={<SearchIcon width={26} height={26} />}
          title="Search for something"
          body="Try a title like “Interstellar”, an actor like “Cillian Murphy”, or a genre like “science fiction”."
        />
      )}
    </div>
  )
}