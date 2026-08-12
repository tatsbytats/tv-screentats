import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import { StoreProvider } from './context/StoreContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import MediaGridPage from './pages/MediaGridPage'
import Genres from './pages/Genres'
import Search from './pages/Search'
import DetailPage from './pages/DetailPage'
import WatchPage from './pages/WatchPage'
import Watchlist from './pages/Watchlist'
import Profile from './pages/Profile'
import { EmptyState } from './components/States'
import { FilmSlateIcon } from './components/Icons'

function NotFound() {
  return (
    <div className="container section">
      <EmptyState
        icon={<FilmSlateIcon width={26} height={26} />}
        title="This reel is empty"
        body="The page you are looking for was cut from the final edit."
        action={
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        }
      />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<MediaGridPage mediaType="movie" />} />
            <Route path="/tv" element={<MediaGridPage mediaType="tv" />} />
            <Route path="/genres" element={<Genres />} />
            <Route path="/search" element={<Search />} />
            <Route path="/movie/:id" element={<DetailPage mediaType="movie" />} />
            <Route path="/tv/:id" element={<DetailPage mediaType="tv" />} />
            <Route path="/watch/movie/:id" element={<WatchPage mediaType="movie" />} />
            <Route path="/watch/tv/:id/:season/:episode" element={<WatchPage mediaType="tv" />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}