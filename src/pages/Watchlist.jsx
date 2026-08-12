import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import useGenres from '../hooks/useGenres'
import { MovieCard } from '../components/MovieCard'
import { EmptyState } from '../components/States'
import Reveal from '../components/Reveal'
import { BookmarkIcon, ArrowRightIcon } from '../components/Icons'

export default function Watchlist() {
  const { watchlist, removeFromWatchlist } = useStore()
  const movieGenres = useGenres('movie')
  const tvGenres = useGenres('tv')

  if (watchlist.length === 0) {
    return (
      <div className="container section">
        <EmptyState
          icon={<BookmarkIcon width={26} height={26} />}
          title="Your watchlist is empty"
          body="Start adding movies you want to watch later. They will stay saved on this device."
          action={
            <Link to="/" className="btn btn-primary">
              Discover movies <ArrowRightIcon width={15} height={15} />
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="container grid-page">
      <Reveal>
        <div className="page-head">
          <p className="eyebrow">Saved for later</p>
          <h1>My Watchlist</h1>
          <p>{watchlist.length} {watchlist.length === 1 ? 'title' : 'titles'} waiting for you.</p>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <div className="movie-grid" style={{ marginTop: 32 }}>
          {watchlist.map((item) => (
            <div key={`${item.mediaType}-${item.id}`} style={{ position: 'relative' }}>
              <MovieCard
                item={item}
                genres={(item.genreIds ?? [])
                  .map((id) => movieGenres.get(id) || tvGenres.get(id))
                  .filter(Boolean)}
              />
              <button
                type="button"
                className="btn btn-remove"
                onClick={() => removeFromWatchlist(item.id, item.mediaType)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  )
}