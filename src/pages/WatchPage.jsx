import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import tmdb, { hasApiKey } from '../lib/tmdb'
import { buildPlayerUrl, parsePlayerEvent } from '../lib/player'
import { useStore } from '../context/StoreContext'
import { IS_TV } from '../lib/tv'
import Image from '../components/Image'
import { ErrorState } from '../components/States'
import { ArrowLeftIcon, PlayIcon, StarIcon } from '../components/Icons'
import { formatSeconds, remainingLabel } from '../lib/format'

export default function WatchPage({ mediaType }) {
  const { id, season: seasonParam, episode: episodeParam } = useParams()
  const [searchParams] = useSearchParams()
  const isTv = mediaType === 'tv'

  const { recordProgress, registerContinueEntry, recordRecentlyWatched, continueItems } = useStore()

  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)
  const [season, setSeason] = useState(null)
  const [selSeason, setSelSeason] = useState(isTv ? Number(seasonParam) || 1 : null)
  const [selEpisode, setSelEpisode] = useState(isTv ? Number(episodeParam) || 1 : null)
  const [startTime, setStartTime] = useState(() => Number(searchParams.get('t')) || 0)

  /* Follow resume-time changes in the URL (e.g. re-entering from Continue Watching) */
  useEffect(() => {
    setStartTime(Number(searchParams.get('t')) || 0)
  }, [searchParams])

  /* Throttle localStorage writes for the high-frequency timeupdate events */
  const lastSave = useRef(0)
  const knownProgress = useRef(startTime)

  useEffect(() => {
    let alive = true
    setDetail(null)
    setError(null)
    tmdb
      .detail(mediaType, id)
      .then((d) => {
        if (!alive) return
        setDetail(d)
        registerContinueEntry(d, { season: selSeason, episode: selEpisode })
        recordRecentlyWatched(d)
      })
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, id])

  useEffect(() => {
    if (!isTv || !detail) return
    let alive = true
    setSeason(null)
    tmdb
      .season('tv', id, selSeason)
      .then((s) => alive && setSeason(s))
      .catch(() => alive && setSeason(null))
    return () => {
      alive = false
    }
  }, [isTv, detail, id, selSeason])

  const playerUrl = useMemo(
    () =>
      buildPlayerUrl({
        mediaType,
        id,
        season: selSeason,
        episode: selEpisode,
        startTime,
      }),
    [mediaType, id, selSeason, selEpisode, startTime],
  )

  const playerRef = useRef(null)

  /* On TV the player fills the screen: real Fullscreen API + remote focus */
  useEffect(() => {
    if (!IS_TV || !detail) return
    const frame = playerRef.current

    const goFullscreen = () => {
      if (!frame || document.fullscreenElement) return
      try {
        if (frame.requestFullscreen) frame.requestFullscreen().catch(() => {})
        else if (frame.webkitRequestFullscreen) frame.webkitRequestFullscreen()
      } catch {
        /* fallback: the CSS fixed overlay keeps the player fullscreen */
      }
    }

    const onKey = (e) => {
      if (!document.fullscreenElement) goFullscreen()
    }

    /* navigation into this page was a remote press, so the fullscreen
       request may still carry that user gesture; retry a few times */
    const timers = [0, 400, 900, 1500].map((ms) => setTimeout(goFullscreen, ms))

    const tFocus = setTimeout(() => frame?.focus(), 600)

    document.addEventListener('keydown', onKey, true)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(tFocus)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [detail, playerUrl])

  const currentKey = useMemo(
    () => (isTv ? `${selSeason}-${selEpisode}` : 'movie'),
    [isTv, selSeason, selEpisode],
  )

  /* Listen for VidKing progress events */
  useEffect(() => {
    const onMessage = (e) => {
      const payload = parsePlayerEvent(e.data, { id: Number(id), mediaType })
      if (!payload) return

      const now = Date.now()
      const throttled = payload.event !== 'timeupdate' || now - lastSave.current > 4000
      const meaningful =
        payload.event !== 'timeupdate' ||
        Math.abs(payload.progress - knownProgress.current) >= 1

      if (!throttled || !meaningful) return
      lastSave.current = now
      knownProgress.current = payload.progress

      recordProgress({
        id: Number(id),
        mediaType,
        season: payload.season ?? selSeason,
        episode: payload.episode ?? selEpisode,
        currentTime: payload.currentTime,
        duration: payload.duration,
        progress: payload.progress,
      })
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [id, mediaType, selSeason, selEpisode, recordProgress])

  const saved = continueItems.find((c) => {
    if (c.id !== Number(id) || c.mediaType !== mediaType) return false
    if (!isTv) return true
    return c.season === selSeason && c.episode === selEpisode
  })

  if (!hasApiKey) {
    return (
      <div className="container section">
        <ErrorState message="Add your TMDB API key in the .env file to watch titles." />
      </div>
    )
  }

  if (error && !detail) {
    return (
      <div className="container section">
        <ErrorState message="We could not load this title." hint="Check the link and try again." />
      </div>
    )
  }

  const pickEpisode = (seasonNum, epNum) => {
    setSelSeason(seasonNum)
    setSelEpisode(epNum)
    setStartTime(0)
  }

  return (
    <div className="container section watch-shell">
      <Link
        to={`/${isTv ? 'tv' : 'movie'}/${id}`}
        className="btn btn-ghost btn-sm watch-back"
        style={{ marginBottom: 24, marginLeft: -8 }}
      >
        <ArrowLeftIcon width={16} height={16} /> Back to {detail?.title ?? 'title'}
      </Link>

      <div className="watch-head">
        <div>
          <p className="eyebrow">{isTv ? 'Now streaming' : 'Now playing'}</p>
          <h1 style={{ fontSize: '1.7rem' }}>
            {detail?.title}
            {isTv && selSeason && selEpisode && (
              <span className="muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 400, marginLeft: 12 }}>
                S{selSeason} · E{selEpisode}
              </span>
            )}
          </h1>
        </div>
        {detail?.rating != null && (
          <span className="card-rating" style={{ position: 'static' }}>
            <StarIcon width={13} height={13} /> {detail.rating.toFixed(1)}
          </span>
        )}
      </div>

      {saved && saved.progress > 1 && saved.progress < 98 && (
        <p className="muted resume-note" style={{ marginBottom: 20, fontSize: 13.5 }}>
          Resuming at {formatSeconds(saved.currentTime)} · {remainingLabel(saved.currentTime, saved.duration)}.
        </p>
      )}

      {!detail && !error && (
        <div className="skeleton" style={{ aspectRatio: '16/9' }} aria-hidden="true" />
      )}

      {detail && (
        <>
          <iframe
            key={currentKey}
            ref={playerRef}
            className="player-frame"
            src={playerUrl}
            title={`${detail.title} ${isTv ? `season ${selSeason} episode ${selEpisode}` : ''} player`}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="eager"
            tabIndex={0}
          />

          {isTv && season && (
            <div className="filters" style={{ paddingTop: 36 }}>
              <div className="field" style={{ minWidth: 240 }}>
                <label htmlFor="watch-season">Season</label>
                <select
                  id="watch-season"
                  className="select"
                  value={selSeason}
                  onChange={(e) => pickEpisode(Number(e.target.value), 1)}
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
            </div>
          )}

          {isTv && season && (
            <div className="episode-grid" style={{ marginTop: 28 }}>
              {season.episodes.map((ep) => {
                const isCurrent = ep.episode === selEpisode && season.season_number === selSeason
                return (
                  <button
                    type="button"
                    key={ep.id}
                    className={`episode-card ${isCurrent ? 'is-active' : ''}`}
                    style={isCurrent ? { borderColor: 'var(--mint)', color: 'var(--mint)' } : undefined}
                    onClick={() => pickEpisode(season.season_number, ep.episode)}
                    aria-label={`Play season ${season.season_number} episode ${ep.episode}: ${ep.name}`}
                  >
                    <div style={{ position: 'relative' }}>
                      <Image src={ep.still} alt="" />
                      {isCurrent && (
                        <span className="card-rating right">
                          <PlayIcon width={11} height={11} /> Now playing
                        </span>
                      )}
                    </div>
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
                )
              })}
            </div>
          )}
        </>
      )}

      <p className="footer-note" style={{ marginTop: 40, maxWidth: '72ch' }}>
        Your watch progress is saved automatically while you play, so you can pick up exactly
        where you left off, on this device.
      </p>
    </div>
  )
}