import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import tmdb, { hasApiKey, runtimeLabel } from '../lib/tmdb'
import { useStore } from '../context/StoreContext'
import useGenres from '../hooks/useGenres'
import { MovieCard, WideCard } from '../components/MovieCard'
import SectionHeader from '../components/SectionHeader'
import Modal from '../components/Modal'
import Image from '../components/Image'
import Reveal from '../components/Reveal'
import { SkeletonRow } from '../components/Skeleton'
import { ErrorState } from '../components/States'
import { StarIcon, PlayIcon, PlusIcon, CheckIcon, ClockIcon, FilmSlateIcon } from '../components/Icons'
import { remainingLabel } from '../lib/format'

const FEATURED = [
  { id: 693134, mediaType: 'movie' }, // Dune: Part Two
  { id: 157336, mediaType: 'movie' }, // Interstellar
  { id: 27205, mediaType: 'movie' }, // Inception
  { id: 155, mediaType: 'movie' }, // The Dark Knight
  { id: 955916, mediaType: 'movie' }, // The Batman
]

const GENRE_TILES = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 878, name: 'Science Fiction' },
  { id: 53, name: 'Thriller' },
  { id: 10749, name: 'Romance' },
  { id: 16, name: 'Animation' },
  { id: 99, name: 'Documentary' },
]

export default function Home() {
  const genreMap = useGenres('movie')
  const { hasInWatchlist, toggleWatchlist, continueItems, lastWatched } = useStore()
  const navigate = useNavigate()

  /* Featured hero */
  const featuredId = useMemo(() => {
    const day = Math.floor(Date.now() / 86400000)
    return FEATURED[day % FEATURED.length]
  }, [])

  const [featured, setFeatured] = useState(null)
  const [featuredError, setFeaturedError] = useState(false)
  const [trailerOpen, setTrailerOpen] = useState(false)

  /* Collections */
  const [trending, setTrending] = useState(null)
  const [popular, setPopular] = useState(null)
  const [recs, setRecs] = useState(null)
  const [recSource, setRecSource] = useState(null)

  useEffect(() => {
    let alive = true
    if (!hasApiKey) return
    tmdb
      .detail(featuredId.mediaType, featuredId.id)
      .then((d) => alive && setFeatured(d))
      .catch(() => alive && setFeaturedError(true))
    return () => {
      alive = false
    }
  }, [featuredId])

  useEffect(() => {
    let alive = true
    if (!hasApiKey) return
    tmdb.trending('all', 'week').then((d) => alive && setTrending(d))
    tmdb.popular('movie', 1).then((d) => alive && setPopular(d))
    return () => {
      alive = false
    }
  }, [])

  /* Personalized recommendations */
  useEffect(() => {
    let alive = true
    if (!hasApiKey) return
    const source = lastWatched
    if (source) {
      tmdb
        .recommendations(source.mediaType, source.id)
        .then((d) => {
          if (!alive) return
          if (d.items.length) {
            setRecs(d)
            setRecSource(source)
          } else {
            setRecs(null)
            setRecSource(null)
          }
        })
        .catch(() => {})
      return () => {
        alive = false
      }
    }
    setRecs(null)
    setRecSource(null)
    return undefined
  }, [lastWatched])

  const featuredGenres = featured?.genreIds?.map((id) => genreMap.get(id)).filter(Boolean) ?? []
  const inFeaturedList = featured ? hasInWatchlist(featured.id, featured.mediaType) : false
  const featuredWatchUrl = featured ? `/watch/${featured.mediaType}/${featured.id}` : null

  if (!hasApiKey) {
    return (
      <div className="container section">
        <ErrorState
          message="ScreenTats needs a TMDB API key to fetch movies."
          hint="Create a free key at themoviedb.org/settings/api, then add it to the .env file as VITE_TMDB_API_KEY and restart the dev server."
        />
      </div>
    )
  }

  const continueList = continueItems.slice(0, 8)

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero" aria-label="Featured movie">
        {featuredError && (
          <div className="container hero-skeleton">
            <ErrorState message="Could not load the featured movie right now." onRetry={() => window.location.reload()} />
          </div>
        )}
        {!featured && !featuredError && (
          <div className="container hero-skeleton" aria-hidden="true">
            <div className="hero-skeleton-inner">
              <div className="skeleton" style={{ width: 150, height: 14 }} />
              <div className="skeleton" style={{ width: 'min(560px, 80%)', height: 52 }} />
              <div className="skeleton" style={{ width: 320, height: 14 }} />
              <div className="skeleton" style={{ width: 'min(520px, 75%)', height: 14 }} />
              <div className="skeleton" style={{ width: 'min(440px, 65%)', height: 14 }} />
              <div className="skeleton" style={{ width: 360, height: 44, borderRadius: 999 }} />
            </div>
          </div>
        )}
        {featured && (
          <div className="hero-inner">
            <div className="hero-backdrop" role="img" aria-label={`${featured.title} backdrop`}>
              <Image
                src={featured.backdrop}
                alt=""
                loading="eager"
                fetchPriority="high"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div className="aurora" aria-hidden="true" />
            <div className="container hero-content">
              <p className="eyebrow">Featured Film</p>
              <h1>{featured.title}</h1>
              <div className="hero-meta">
                {featured.year && <span>{featured.year}</span>}
                {featured.runtime && (
                  <span>
                    <ClockIcon width={15} height={15} /> {runtimeLabel(featured.runtime)}
                  </span>
                )}
                {featured.rating != null && (
                  <span className="mint">
                    <StarIcon width={15} height={15} /> {featured.rating.toFixed(1)}
                  </span>
                )}
                {featuredGenres.length > 0 && (
                  <span className="hero-genre">{featuredGenres.join(', ')}</span>
                )}
              </div>
              <p className="hero-synopsis">{featured.overview}</p>
              <div className="hero-actions">
                {featuredWatchUrl && (
                  <button type="button" className="btn btn-primary" onClick={() => navigate(featuredWatchUrl)}>
                    <PlayIcon width={16} height={16} /> Watch Now
                  </button>
                )}
                {featured?.trailer && (
                  <button type="button" className="btn btn-outline" onClick={() => setTrailerOpen(true)}>
                    <FilmSlateIcon width={16} height={16} /> Watch Trailer
                  </button>
                )}
                <button
                  type="button"
                  className={`btn btn-outline ${inFeaturedList ? 'is-added' : ''}`}
                  aria-pressed={inFeaturedList}
                  onClick={() => toggleWatchlist(featured)}
                >
                  {inFeaturedList ? <CheckIcon width={16} height={16} /> : <PlusIcon width={16} height={16} />}
                  {inFeaturedList ? 'In Watchlist' : 'Add to Watchlist'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <Modal open={trailerOpen} onClose={() => setTrailerOpen(false)} title={`Trailer · ${featured?.title ?? ''}`}>
        {featured?.trailer && (
          <iframe
            className="trailer-frame"
            src={`https://www.youtube-nocookie.com/embed/${featured.trailer.key}?autoplay=1&rel=0`}
            title={`${featured.title} official trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </Modal>

      {/* ---------- Trending Now ---------- */}
      <section className="section container" aria-label="Trending movies and shows">
        <Reveal>
          <SectionHeader title="Trending Now" sub="What everyone is watching right now." />
        </Reveal>
        {trending ? (
          <Reveal delay={80}>
            <div className="row">
              {trending.items.slice(0, 12).map((item) => (
                <MovieCard key={`${item.mediaType}-${item.id}`} item={item} genres={item.genreIds.map((id) => genreMap.get(id)).filter(Boolean)} />
              ))}
            </div>
          </Reveal>
        ) : (
          <SkeletonRow />
        )}
      </section>

      {/* ---------- Continue Watching ---------- */}
      {continueList.length > 0 && (
        <section className="section container" aria-label="Continue watching">
          <Reveal>
            <SectionHeader title="Continue Watching" />
          </Reveal>
          <Reveal delay={80}>
            <div className="row wide">
              {continueList.map((item) => (
                <WideCard
                  key={item.key}
                  item={item}
                  progress={item.progress}
                  progressLabel={
                    item.duration
                      ? `${remainingLabel(item.currentTime, item.duration)} · ${item.season != null ? `S${item.season} E${item.episode}` : ''}`
                      : undefined
                  }
                  onContinue={() =>
                    navigate(
                      item.season != null
                        ? `/watch/tv/${item.id}/${item.season}/${item.episode}?t=${Math.round(item.currentTime ?? 0)}`
                        : `/watch/movie/${item.id}?t=${Math.round(item.currentTime ?? 0)}`,
                    )
                  }
                />
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ---------- Popular This Week (bento) ---------- */}
      <section className="section container" aria-label="Popular this week">
        <Reveal>
          <SectionHeader title="Popular This Week" seeAllTo="/movies" />
        </Reveal>
        {popular ? (
          <Reveal delay={80}>
            <div className="bento popular-bento">
              <PopularFeature item={popular.items[0]} genres={genreMap} />
              {popular.items[1] && (
                <div className="bento-item tall">
                  <MovieCard item={popular.items[1]} genres={popular.items[1].genreIds.map((id) => genreMap.get(id)).filter(Boolean)} />
                </div>
              )}
              {popular.items.slice(2, 6).map((item) => (
                <div className="bento-item wide" key={item.id}>
                  <MovieCard item={item} genres={item.genreIds.map((id) => genreMap.get(id)).filter(Boolean)} />
                </div>
              ))}
            </div>
          </Reveal>
        ) : (
          <SkeletonGrid />
        )}
      </section>

      {/* ---------- Browse by Genre ---------- */}
      <section className="section container" aria-label="Browse by genre">
        <Reveal>
          <SectionHeader title="Browse by Genre" sub="Explore curated collections across nine categories." eyebrow="Find your mood" />
        </Reveal>
        <Reveal delay={80}>
          <div className="bento">
            {GENRE_TILES.map((g) => (
              <Link key={g.id} to={`/genres?g=${g.id}`} className="genre-tile">
                <FilmSlateIcon width={20} height={20} aria-hidden="true" />
                {g.name}
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ---------- Recommended For You ---------- */}
      {recs && (
        <section className="section container" aria-label="Recommended for you">
          <Reveal>
            <SectionHeader
              title="Recommended For You"
              sub={recSource ? `Because you watched "${recSource.title}"` : 'Picked for you'}
            />
          </Reveal>
          <Reveal delay={80}>
            <div className="row">
              {recs.items.slice(0, 12).map((item) => (
                <MovieCard key={`${item.mediaType}-${item.id}`} item={item} genres={item.genreIds.map((id) => genreMap.get(id)).filter(Boolean)} />
              ))}
            </div>
          </Reveal>
        </section>
      )}
    </>
  )
}

function PopularFeature({ item, genres }) {
  if (!item) return null
  const names = item.genreIds.map((id) => genres.get(id)).filter(Boolean)
  return (
    <Link
      to={`/${item.mediaType === 'movie' ? 'movie' : 'tv'}/${item.id}`}
      className="bento-item feature"
    >
      {item.backdrop && (
        <Image
          src={item.backdrop}
          alt={`${item.title} backdrop`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
        />
      )}
      <div className="aurora" aria-hidden="true" />
      <div style={{ position: 'relative', marginTop: 'auto', padding: 'var(--card-pad)', display: 'grid', gap: 10 }}>
        <p className="eyebrow">#1 Most Popular</p>
        <h3 style={{ fontSize: '1.5rem' }}>{item.title}</h3>
        <div className="card-meta" style={{ color: 'var(--text-muted)' }}>
          {item.year && <span>{item.year}</span>}
          {item.rating != null && (
            <span style={{ color: 'var(--mint)' }}>
              <StarIcon width={13} height={13} /> {item.rating.toFixed(1)}
            </span>
          )}
          {names.length > 0 && <span>{names[0]}</span>}
        </div>
      </div>
    </Link>
  )
}

function SkeletonGrid() {
  return (
    <div className="bento popular-bento" aria-hidden="true">
      <div className="bento-item skeleton feature" style={{ minHeight: 320 }} />
      <div className="bento-item skeleton tall" style={{ aspectRatio: '2/3' }} />
      {[1, 2, 3, 4].map((i) => (
        <div className="bento-item skeleton wide" key={i} style={{ aspectRatio: '2/3' }} />
      ))}
    </div>
  )
}