import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import useGenres from '../hooks/useGenres'
import { WideCard } from '../components/MovieCard'
import { EmptyState } from '../components/States'
import Reveal from '../components/Reveal'
import { FilmIcon, PlayIcon } from '../components/Icons'
import { initials, timeAgo, remainingLabel } from '../lib/format'

export default function Profile() {
  const navigate = useNavigate()
  const {
    profile,
    updateProfile,
    watchedCount,
    watchlist,
    continueItems,
    favoriteGenres,
    recent,
  } = useStore()
  const movieGenres = useGenres('movie')
  const tvGenres = useGenres('tv')
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile.name)

  const favNames = favoriteGenres
    .map((id) => movieGenres.get(id) || tvGenres.get(id))
    .filter(Boolean)

  const saveName = () => {
    const trimmed = name.trim()
    if (trimmed) updateProfile({ name: trimmed })
    setEditing(false)
  }

  const recentWithProgress = recent.slice(0, 10).map((r) => {
    const prog = continueItems.find((c) => c.id === r.id && c.mediaType === r.mediaType)
    return { ...r, progress: prog?.progress ?? null, currentTime: prog?.currentTime ?? null, duration: prog?.duration ?? null, key: prog?.key }
  })

  return (
    <div className="container section">
      <Reveal>
        <div className="page-head" style={{ paddingTop: 0 }}>
          <p className="eyebrow">Your dashboard</p>
          <h1>Profile</h1>
        </div>
      </Reveal>

      <div className="profile-hero" style={{ marginBlock: 32 }}>
        <div className="avatar profile-avatar" aria-hidden="true">
          {initials(profile.name || 'G')}
        </div>
        <div className="profile-edit">
          {editing ? (
            <>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Your display name"
                maxLength={32}
                style={{ minWidth: 220 }}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={saveName}>
                Save
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <div>
                <h2 style={{ fontSize: '1.9rem' }}>{profile.name || 'Guest Viewer'}</h2>
                <p className="muted" style={{ fontSize: 13 }}>
                  Your viewing habits are stored locally on this device.
                </p>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
                Edit name
              </button>
            </>
          )}
        </div>
      </div>

      <Reveal delay={60}>
        <div className="profile-stats" style={{ marginBottom: 56 }}>
        <div className="stat-card">
          <span className="stat-value">{watchedCount}</span>
          <span className="stat-label">Movies &amp; shows watched</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{watchlist.length}</span>
          <span className="stat-label">In your watchlist</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{continueItems.length}</span>
          <span className="stat-label">In progress</span>
        </div>
        <div className="stat-card wide">
          <span className="stat-label" style={{ marginBottom: 8 }}>Favorite genres</span>
          {favNames.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {favNames.map((g) => (
                <Link key={g} to="/genres" className="chip">
                  {g}
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ fontSize: 13 }}>
              Watch or save a few titles and we will figure out your taste.
            </p>
          )}
        </div>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <section aria-label="Recently watched" style={{ marginBottom: 48 }}>
        <h2 style={{ marginBottom: 28 }}>Recently Watched</h2>
        {recentWithProgress.length === 0 ? (
          <EmptyState
            icon={<FilmIcon width={26} height={26} />}
            title="Nothing watched yet"
            body="Press play on any movie or show and your history will show up here."
            action={
              <Link to="/" className="btn btn-outline">
                Start exploring
              </Link>
            }
          />
        ) : (
          <div className="row wide">
            {recentWithProgress.map((r) => (
              <WideCard
                key={`${r.mediaType}-${r.id}-${r.timestamp}`}
                item={r}
                progress={r.progress}
                progressLabel={
                  r.duration
                    ? remainingLabel(r.currentTime, r.duration)
                    : `Watched ${timeAgo(r.timestamp)}`
                }
                onContinue={
                  r.progress && r.progress > 0 && r.progress < 98
                    ? () =>
                        navigate(
                          r.season != null
                            ? `/watch/tv/${r.id}/${r.season}/${r.episode}?t=${Math.round(r.currentTime ?? 0)}`
                            : `/watch/movie/${r.id}?t=${Math.round(r.currentTime ?? 0)}`,
                        )
                    : undefined
                }
              />
            ))}
          </div>
        )}
        </section>
      </Reveal>

      <Reveal delay={80}>
        <section aria-label="Continue watching" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 28 }}>Continue Watching</h2>
          {continueItems.length === 0 ? (
            <EmptyState
              icon={<PlayIcon width={26} height={26} />}
              title="Nothing in progress"
              body="Start a movie or series and come back anytime. We remember where you stopped."
            />
          ) : (
            <div className="row wide">
              {continueItems.slice(0, 6).map((item) => (
                <WideCard
                  key={item.key}
                  item={item}
                  progress={item.progress}
                  progressLabel={remainingLabel(item.currentTime, item.duration)}
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
          )}
        </section>
      </Reveal>
    </div>
  )
}