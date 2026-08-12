import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { usePastScrollPoint } from '../hooks/useSentinel'
import { SearchIcon, HomeIcon, FilmIcon, BookmarkIcon, UserIcon } from './Icons'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/movies', label: 'Movies' },
  { to: '/tv', label: 'TV Shows' },
  { to: '/genres', label: 'Genres' },
  { to: '/watchlist', label: 'Watchlist' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { profile } = useStore()
  const [query, setQuery] = useState('')
  const scrolled = usePastScrollPoint(24)

  const submit = (e) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
    setQuery('')
  }

  const letter = (profile.name || 'G').trim().charAt(0).toUpperCase()

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <nav className="container navbar-inner" aria-label="Primary">
        <Link to="/" className="logo" aria-label="ScreenTats home">
          ScreenTats<span className="logo-dot" aria-hidden="true" />
        </Link>

        <ul className="nav-links">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <form className="navbar-search" role="search" onSubmit={submit} aria-label="Site search">
          <SearchIcon width={16} height={16} />
          <input
            className="input"
            type="search"
            placeholder="Search movies, shows…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search movies and TV shows"
          />
        </form>

        <div className="navbar-user">
          <Link to="/profile" className="avatar" aria-label={`Profile for ${profile.name}`}>
            {letter}
          </Link>
        </div>
      </nav>
    </header>
  )
}

export function MobileNav() {
  const links = [
    { to: '/', label: 'Home', icon: HomeIcon, end: true },
    { to: '/movies', label: 'Movies', icon: FilmIcon },
    { to: '/search', label: 'Search', icon: SearchIcon },
    { to: '/watchlist', label: 'Watchlist', icon: BookmarkIcon },
    { to: '/profile', label: 'Profile', icon: UserIcon },
  ]
  return (
    <nav className="mobile-navbar" aria-label="Mobile">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
        >
          <l.icon width={20} height={20} />
          {l.label}
        </NavLink>
      ))}
    </nav>
  )
}