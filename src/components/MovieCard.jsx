import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import tmdb, { pickTrailer } from '../lib/tmdb'
import { useStore } from '../context/StoreContext'
import { IS_TV } from '../lib/tv'
import Image from './Image'
import Modal from './Modal'
import { StarIcon, PlusIcon, CheckIcon, PlayIcon, FilmSlateIcon } from './Icons'

const videoCache = new Map()

async function getTrailer(mediaType, id) {
  const cacheKey = `${mediaType}:${id}`
  if (videoCache.has(cacheKey)) return videoCache.get(cacheKey)
  const promise = tmdb.videos(mediaType, id).then(pickTrailer).catch(() => null)
  videoCache.set(cacheKey, promise)
  return promise
}

/**
 * Poster movie card with hover actions (Play / Trailer / Watchlist).
 * Items link to their detail page.
 */
export function MovieCard({ item, genres = [] }) {
  const { id, mediaType, title, year, rating, poster } = item
  const { hasInWatchlist, toggleWatchlist } = useStore()
  const inList = hasInWatchlist(id, mediaType)
  const navigate = useNavigate()
  const [trailer, setTrailer] = useState(null)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const fetched = useRef(false)

  const detailUrl = `/${mediaType === 'movie' ? 'movie' : 'tv'}/${id}`
  const watchUrl = `/watch/${mediaType}/${id}`

  const loadTrailer = useCallback(() => {
    if (fetched.current) return
    fetched.current = true
    setVideoLoading(true)
    getTrailer(mediaType, id).then((t) => {
      setTrailer(t)
      setVideoLoading(false)
    })
  }, [mediaType, id])

  const onPlay = useCallback(() => {
    navigate(watchUrl)
  }, [navigate, watchUrl])

  return (
    <article className="card" onMouseEnter={loadTrailer} onFocus={loadTrailer}>
      <div className="card-poster">
        <Image src={poster} alt={`${title} (${year ?? 'unknown year'}) movie poster`} />
        {rating != null && (
          <span className="card-rating">
            <StarIcon width={12} height={12} />
            {rating.toFixed(1)}
          </span>
        )}
        <div className="card-actions">
          <button
            type="button"
            className="card-action"
            aria-label={`Play ${title}`}
            onClick={(e) => {
              e.preventDefault()
              onPlay()
            }}
          >
            <PlayIcon width={14} height={14} />
            <span className="card-action-label">Play</span>
          </button>
          {trailer && (
            <button
              type="button"
              className="card-action"
              aria-label={`Watch ${title} trailer`}
              onClick={(e) => {
                e.preventDefault()
                setTrailerOpen(true)
              }}
            >
              <FilmSlateIcon width={14} height={14} />
              <span className="card-action-label">Trailer</span>
            </button>
          )}
          <button
            type="button"
            className={`card-action ${inList ? 'added' : ''}`}
            aria-pressed={inList}
            aria-label={inList ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`}
            onClick={(e) => {
              e.preventDefault()
              toggleWatchlist(item)
            }}
          >
            {inList ? <CheckIcon width={14} height={14} /> : <PlusIcon width={14} height={14} />}
            <span className="card-action-label">{inList ? 'Added' : 'Watchlist'}</span>
          </button>
        </div>
      </div>
      <div className="card-body">
        <h3>{title}</h3>
        <div className="card-meta">
          {year && <span>{year}</span>}
          {genres.length > 0 && <span>{genres[0]}</span>}
        </div>
      </div>
      <Link to={detailUrl} className="card-link" aria-label={`${title} details`} />

      <Modal open={trailerOpen} onClose={() => setTrailerOpen(false)} title={`Trailer · ${title}`}>
        {trailer && (
          <iframe
            className="trailer-frame"
            src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`}
            title={`${title} official trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </Modal>
      {videoLoading && <span className="sr-status">Loading trailer info…</span>}
    </article>
  )
}

/**
 * Wide 16:9 card used for curated rows and the Continue Watching row.
 */
export function WideCard({ item, genres = [], progress, onContinue, progressLabel }) {
  const { id, mediaType, title, year, rating, poster, backdrop } = item
  return (
    <article className="card-wide">
      <Image
        src={backdrop || poster}
        alt={`${title} backdrop artwork`}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div className="card-wide-overlay">
        <h3>
          <Link
            to={`/${mediaType === 'movie' ? 'movie' : 'tv'}/${id}`}
            className="card-wide-title"
            tabIndex={IS_TV ? -1 : undefined}
          >
            {title}
          </Link>
        </h3>
        <div className="card-meta">
          {year && <span>{year}</span>}
          {rating != null && (
            <span className="mint">
              <StarIcon width={12} height={12} />
              {rating.toFixed(1)}
            </span>
          )}
          {genres.length > 0 && <span>{genres[0]}</span>}
        </div>
        {progress != null && (
          <div className="progress">
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Watch progress"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="progress-fill" style={{ '--p': progress / 100 }} />
            </div>
            <div className="progress-label">
              <span className="mint">{Math.round(progress)}% watched</span>
              {progressLabel && <span>{progressLabel}</span>}
            </div>
          </div>
        )}
        {onContinue && (
          <div style={{ marginTop: 6 }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={onContinue}>
              <PlayIcon width={14} height={14} /> Continue Watching
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
