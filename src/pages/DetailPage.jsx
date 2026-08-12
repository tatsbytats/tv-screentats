import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import tmdb, { hasApiKey, runtimeLabel } from '../lib/tmdb'
import { useStore } from '../context/StoreContext'
import useGenres from '../hooks/useGenres'
import Image from '../components/Image'
import Modal from '../components/Modal'
import { MovieCard } from '../components/MovieCard'
import Reveal from '../components/Reveal'
import { ErrorState } from '../components/States'
import {
  StarIcon,
  PlayIcon,
  PlusIcon,
  CheckIcon,
  ClockIcon,
  CalendarIcon,
} from '../components/Icons'
import { initials } from '../lib/format'

function SkeletonHero() {
  return (
    <div className="detail-hero">
      <div className="container detail-content" aria-hidden="true">
        <div className="skeleton" style={{ aspectRatio: '2/3', width: '100%' }} />
        <div style={{ display: 'grid', gap: 20 }}>
          <div className="skeleton" style={{ height: 44, width: '70%' }} />
          <div className="skeleton" style={{ height: 14, width: '40%' }} />
          <div className="skeleton" style={{ height: 14, width: '90%' }} />
          <div className="skeleton" style={{ height: 14, width: '85%' }} />
          <div className="skeleton" style={{ height: 14, width: '60%' }} />
        </div>
      </div>
    </div>
  )
}

export default function DetailPage({ mediaType }) {
  const { id } = useParams()
  const isMovie = mediaType === 'movie'
  const navigate = useNavigate()
  const genreMap = useGenres(mediaType)
  const { hasInWatchlist, toggleWatchlist } = useStore()

  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)
  const [trailerOpen, setTrailerOpen] = useState(false)

  /* TV: season + episodes */
  const [seasonNum, setSeasonNum] = useState(1)
  const [season, setSeason] = useState(null)

  useEffect(() => {
    let alive = true
    setDetail(null)
    setError(null)
    tmdb
      .detail(mediaType, id)
      .then((d) => alive && setDetail(d))
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [mediaType, id])

  useEffect(() => {
    if (mediaType !== 'tv') return
    let alive = true
    setSeason(null)
    tmdb
      .season('tv', id, seasonNum)
      .then((s) => alive && setSeason(s))
      .catch(() => alive && setSeason(null))
    return () => {
      alive = false
    }
  }, [mediaType, id, seasonNum])

  const inList = detail ? hasInWatchlist(detail.id, detail.mediaType) : false

  const watchUrl = useMemo(() => {
    if (!detail) return null
    return isMovie
      ? `/watch/movie/${detail.id}`
      : `/watch/tv/${detail.id}/${seasonNum}/1`
  }, [detail, isMovie, seasonNum])

  const releaseDate = detail
    ? isMovie
      ? detail.year
      : detail.lastAir
        ? `Premiered ${detail.firstAir ?? detail.year} · Last aired ${detail.lastAir}`
        : `Premiered ${detail.year}`
    : null

  if (!hasApiKey) {
    return (
      <div className="container section">
        <ErrorState message="Add your TMDB API key in the .env file to view movie details." />
      </div>
    )
  }

  if (error && !detail) {
    return (
      <div className="container section">
        <ErrorState message="We could not find that title." hint="It may have been removed, or the link is incorrect." />
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/" className="btn btn-outline">Back to Home</Link>
        </div>
      </div>
    )
  }

  if (!detail) {
    return <SkeletonHero />
  }

  const genreNames = (detail.genreIds ?? []).map((gid) => genreMap.get(gid)).filter(Boolean)
  const cast = detail.cast ?? []
  const info = {
    Director: detail.director,
    Writers: detail.writers?.length ? detail.writers.join(', ') : null,
    Cast: cast.slice(0, 6).map((c) => c.name).join(', '),
    Production: detail.production?.length ? detail.production.slice(0, 3).join(', ') : null,
    Language: detail.languages?.length ? detail.languages.join(', ') : null,
    Country: detail.country,
    Release: isMovie ? detail.release_date ?? detail.year : releaseDate,
    Status: detail.status,
  }

  return (
    <>
      <section className="detail-hero">
        <div className="detail-backdrop" role="img" aria-label={`${detail.title} backdrop`}>
          <Image src={detail.backdrop} alt="" loading="eager" fetchPriority="high" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div className="aurora" aria-hidden="true" />
        <div className="container detail-content">
          <div className="detail-poster">
            <Image src={detail.poster} alt={`${detail.title} poster`} loading="eager" fetchPriority="high" />
          </div>
          <div>
            <p className="eyebrow">{isMovie ? 'Movie' : 'TV Series'}</p>
            <h1>{detail.title}</h1>
            {detail.tagline && <p className="detail-tagline">{detail.tagline}</p>}

            <div className="detail-meta">
              {detail.year && (
                <span>
                  <CalendarIcon width={15} height={15} /> {detail.year}
                </span>
              )}
              {detail.runtime && (
                <span>
                  <ClockIcon width={15} height={15} /> {runtimeLabel(detail.runtime)}
                </span>
              )}
              {detail.rating != null && (
                <span style={{ color: 'var(--mint)' }}>
                  <StarIcon width={15} height={15} /> {detail.rating.toFixed(1)}
                </span>
              )}
              {detail.certification && <span>{detail.certification}</span>}
              {detail.numberOfEpisodes != null && <span>{detail.numberOfEpisodes} episodes</span>}
            </div>

            <p className="detail-synopsis">{detail.overview}</p>

            <div className="detail-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => (detail.trailer ? setTrailerOpen(true) : watchUrl && navigate(watchUrl))}
              >
                <PlayIcon width={16} height={16} /> {detail.trailer ? 'Watch Trailer' : 'Watch Now'}
              </button>
              {watchUrl && detail.trailer && (
                <button type="button" className="btn btn-outline" onClick={() => navigate(watchUrl)}>
                  <PlayIcon width={16} height={16} /> Watch Now
                </button>
              )}
              <button
                type="button"
                className={`btn btn-outline ${inList ? 'is-added' : ''}`}
                aria-pressed={inList}
                onClick={() => toggleWatchlist(detail)}
              >
                {inList ? <CheckIcon width={16} height={16} /> : <PlusIcon width={16} height={16} />}
                {inList ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
            </div>

            {genreNames.length > 0 && (
              <div className="genre-links">
                {genreNames.map((name, i) => (
                  <Link key={name} to={`/genres?g=${detail.genreIds[i]}&media=${mediaType}`} className="chip">
                    {name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Modal open={trailerOpen} onClose={() => setTrailerOpen(false)} title={`Trailer · ${detail.title}`}>
        {detail.trailer && (
          <iframe
            className="trailer-frame"
            src={`https://www.youtube-nocookie.com/embed/${detail.trailer.key}?autoplay=1&rel=0`}
            title={`${detail.title} official trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </Modal>

      <div className="container section">
        <div className="detail-grid">
          {/* ---------- Left column ---------- */}
          <div>
            {!isMovie && (
              <Reveal>
                <section aria-label="Seasons and episodes">
                <h2 style={{ marginBottom: 24 }}>Episodes</h2>
                <div className="field" style={{ maxWidth: 220 }}>
                  <label htmlFor="detail-season">Season</label>
                  <select
                    id="detail-season"
                    className="select"
                    value={seasonNum}
                    onChange={(e) => setSeasonNum(Number(e.target.value))}
                  >
                    {(detail.seasons ?? [])
                      .filter((s) => s.season_number > 0 && s.episode_count > 0)
                      .map((s) => (
                        <option key={s.id ?? s.season_number} value={s.season_number}>
                          Season {s.season_number} · {s.episode_count} episodes
                        </option>
                      ))}
                  </select>
                </div>
                {season ? (
                  <div className="episode-grid">
                    {season.episodes.map((ep) => (
                      <button
                        type="button"
                        key={ep.id}
                        className="episode-card"
                        onClick={() => navigate(`/watch/tv/${detail.id}/${seasonNum}/${ep.episode}`)}
                        aria-label={`Play season ${seasonNum} episode ${ep.episode}: ${ep.name}`}
                      >
                        <Image src={ep.still} alt="" />
                        <div className="episode-info">
                          <strong>
                            E{ep.episode} · {ep.name}
                          </strong>
                          <small>
                            {ep.airDate ?? ''}
                            {ep.rating != null && (
                              <span className="episode-rating">
                                <StarIcon width={11} height={11} /> {ep.rating.toFixed(1)}
                              </span>
                            )}
                          </small>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="episode-grid" aria-hidden="true">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div className="skeleton" key={i} style={{ aspectRatio: '16/9' }} />
                    ))}
                  </div>
                )}
                </section>
              </Reveal>
            )}

            {!isMovie && cast.length > 0 && (
              <Reveal delay={60}>
                <section aria-label="Cast" style={{ marginTop: 64 }}>
                  <h2 style={{ marginBottom: 28 }}>Cast</h2>
                  <CastRow cast={cast} />
                </section>
              </Reveal>
            )}

            {detail.similar?.length > 0 && (
              <Reveal delay={60}>
                <section aria-label="Similar titles" style={{ marginTop: 64 }}>
                  <h2 style={{ marginBottom: 28 }}>More Like This</h2>
                  <div className="movie-grid">
                    {detail.similar.slice(0, 10).map((item) => (
                      <MovieCard
                        key={`${item.mediaType}-${item.id}`}
                        item={item}
                        genres={item.genreIds.map((gid) => genreMap.get(gid)).filter(Boolean)}
                      />
                    ))}
                  </div>
                </section>
              </Reveal>
            )}
          </div>

          {/* ---------- Right column: info panel ---------- */}
          <Reveal delay={80}>
            <aside aria-label="Movie information">
              <div className="info-list">
                {Object.entries(info)
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <dl className="info-item" key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </dl>
                  ))}
              </div>
              {isMovie && cast.length > 0 && (
                <div style={{ marginTop: 48 }}>
                  <h3 style={{ marginBottom: 20 }}>Cast</h3>
                  <CastRow cast={cast.slice(0, 8)} />
                </div>
              )}
            </aside>
          </Reveal>
        </div>
      </div>
    </>
  )
}

function CastRow({ cast }) {
  return (
    <div className="cast-row">
      {cast.map((c) => (
        <div className="cast-item" key={c.id}>
          <div className="cast-photo">
            {c.photo ? (
              <Image src={c.photo} alt={`Portrait of ${c.name}`} />
            ) : (
              <span className="cast-fallback" aria-hidden="true">
                {initials(c.name)}
              </span>
            )}
          </div>
          <div>
            <div className="cast-name">{c.name}</div>
            <div className="cast-char">{c.character ?? ''}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
