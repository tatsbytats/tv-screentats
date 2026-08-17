import { Outlet, useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar, { MobileNav } from './Navbar'
import { useStore } from '../context/StoreContext'
import { usePastScrollPoint } from '../hooks/useSentinel'
import { useTvNav } from '../hooks/useTvNav'
import { IS_TV } from '../lib/tv'
import { CheckIcon, ArrowUpIcon } from './Icons'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function BackToTop() {
  const show = usePastScrollPoint(640)
  const scrollTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }
  return (
    <button
      type="button"
      className={`scroll-top ${show ? 'show' : ''}`}
      aria-label="Back to top"
      onClick={scrollTop}
    >
      <ArrowUpIcon width={18} height={18} />
    </button>
  )
}

const footerLinks = [
  { to: '/', label: 'Home' },
  { to: '/movies', label: 'Movies' },
  { to: '/tv', label: 'TV Shows' },
  { to: '/genres', label: 'Genres' },
  { to: '/watchlist', label: 'Watchlist' },
]

export default function Layout() {
  const { toast } = useStore()
  useTvNav()
  const skipToContent = (e) => {
    e.preventDefault()
    const main = document.getElementById('main')
    main?.focus()
    main?.scrollIntoView()
  }
  return (
    <>
      <div className="scroll-sentinel" aria-hidden="true" />
      <ScrollToTop />
      <button type="button" className="skip-link" onClick={skipToContent}>
        Skip to content
      </button>
      <Navbar />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <Link to="/" className="logo" aria-label="ScreenTats home">
              ScreenTats<span className="logo-dot" aria-hidden="true" />
            </Link>
            <p className="footer-note" style={{ marginTop: 14 }}>
              Find something worth watching. All streaming powered by the VidKing embeddable
              player; metadata courtesy of TMDB.
            </p>
          </div>
          <nav className="footer-links" aria-label="Footer">
            {footerLinks.map((l) => (
              <Link key={l.to} to={l.to}>
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="footer-note footer-disclaimer">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </footer>
      <BackToTop />
      <MobileNav />
      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
        <CheckIcon width={15} height={15} style={{ color: 'var(--mint)' }} />
        {toast}
      </div>
    </>
  )
}