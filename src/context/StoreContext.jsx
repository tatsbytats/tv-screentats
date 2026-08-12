import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { storage, mediaKey } from '../lib/storage'

const StoreContext = createContext(null)

const WATCHLIST_KEY = 'watchlist'
const CONTINUE_KEY = 'continue'
const RECENT_KEY = 'recent'
const PROFILE_KEY = 'profile'

function snapshotOf(item) {
  return {
    id: item.id,
    mediaType: item.mediaType,
    title: item.title,
    year: item.year,
    rating: item.rating,
    poster: item.poster,
    backdrop: item.backdrop || null,
    genreIds: item.genreIds ?? item.genres ?? [],
    overview: item.overview || '',
  }
}

export function StoreProvider({ children }) {
  const [watchlist, setWatchlist] = useState(() => storage.get(WATCHLIST_KEY, []))
  const [continueItems, setContinueItems] = useState(() => storage.get(CONTINUE_KEY, []))
  const [recent, setRecent] = useState(() => storage.get(RECENT_KEY, []))
  const [profile, setProfile] = useState(() => storage.get(PROFILE_KEY, { name: 'Guest Viewer' }))
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  useEffect(() => storage.set(WATCHLIST_KEY, watchlist), [watchlist])
  useEffect(() => storage.set(CONTINUE_KEY, continueItems), [continueItems])
  useEffect(() => storage.set(RECENT_KEY, recent), [recent])
  useEffect(() => storage.set(PROFILE_KEY, profile), [profile])

  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const hasInWatchlist = useCallback(
    (id, mediaType) => watchlist.some((w) => w.id === id && w.mediaType === mediaType),
    [watchlist],
  )

  const addToWatchlist = useCallback(
    (item) => {
      setWatchlist((prev) => {
        if (prev.some((w) => w.id === item.id && w.mediaType === item.mediaType)) return prev
        return [snapshotOf(item), ...prev]
      })
      showToast(`Added "${item.title}" to watchlist`)
    },
    [showToast],
  )

  const removeFromWatchlist = useCallback(
    (id, mediaType) => {
      setWatchlist((prev) => {
        const item = prev.find((w) => w.id === id && w.mediaType === mediaType)
        if (item) showToast(`Removed "${item.title}" from watchlist`)
        return prev.filter((w) => !(w.id === id && w.mediaType === mediaType))
      })
    },
    [showToast],
  )

  const toggleWatchlist = useCallback(
    (item) => {
      if (hasInWatchlist(item.id, item.mediaType)) {
        removeFromWatchlist(item.id, item.mediaType)
        return false
      }
      addToWatchlist(item)
      return true
    },
    [hasInWatchlist, addToWatchlist, removeFromWatchlist],
  )

  /* Record playback progress from the VidKing player postMessage events */
  const recordProgress = useCallback((payload) => {
    setContinueItems((prev) => {
      const key = mediaKey(payload.id, payload.mediaType)
      const prevItem = prev.find((c) => c.key === key)
      if (!prevItem && payload.progress < 2) return prev
      const next = {
        key,
        ...(prevItem ?? {}),
        id: payload.id,
        mediaType: payload.mediaType,
        season: payload.season ?? prevItem?.season ?? null,
        episode: payload.episode ?? prevItem?.episode ?? null,
        currentTime: payload.currentTime ?? prevItem?.currentTime ?? 0,
        duration: payload.duration ?? prevItem?.duration ?? 0,
        progress: payload.progress ?? prevItem?.progress ?? 0,
        timestamp: Date.now(),
      }
      return [next, ...prev.filter((c) => c.key !== key)]
    })
  }, [])

  const recordRecentlyWatched = useCallback((item) => {
    setRecent((prev) => {
      const key = mediaKey(item.id, item.mediaType)
      const entry = { ...snapshotOf(item), timestamp: Date.now() }
      const next = [entry, ...prev.filter((r) => mediaKey(r.id, r.mediaType) !== key)]
      return next.slice(0, 24)
    })
  }, [])

  /* Enrich a continue-watching entry with title/poster when first started */
  const registerContinueEntry = useCallback(
    (item, extra = {}) => {
      const key = mediaKey(item.id, item.mediaType)
      setContinueItems((prev) => {
        const existing = prev.find((c) => c.key === key)
        const fresh = { key, ...snapshotOf(item), ...extra, timestamp: Date.now() }
        return [existing ? { ...existing, ...fresh } : fresh, ...prev.filter((c) => c.key !== key)]
      })
    },
    [],
  )

  const clearContinueEntry = useCallback((key) => {
    setContinueItems((prev) => prev.filter((c) => c.key !== key))
  }, [])

  const updateProfile = useCallback((patch) => {
    setProfile((prev) => ({ ...prev, ...patch }))
  }, [])

  const favoriteGenres = useMemo(() => {
    const counts = new Map()
    for (const w of watchlist) for (const g of w.genreIds ?? []) counts.set(g, (counts.get(g) ?? 0) + 1)
    for (const r of recent) for (const g of r.genreIds ?? []) counts.set(g, (counts.get(g) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => id)
  }, [watchlist, recent])

  const watchedCount = useMemo(() => recent.length, [recent])

  const lastWatched = recent[0] ?? null

  const value = {
    watchlist,
    hasInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    continueItems,
    recordProgress,
    registerContinueEntry,
    clearContinueEntry,
    recent,
    recordRecentlyWatched,
    profile,
    updateProfile,
    favoriteGenres,
    watchedCount,
    lastWatched,
    toast,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

export { mediaKey }