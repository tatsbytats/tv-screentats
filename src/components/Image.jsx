import { useState } from 'react'

const FALLBACK = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">
    <rect width="400" height="600" fill="#15191c"/>
    <circle cx="200" cy="240" r="64" fill="#242b30"/>
    <rect x="140" y="360" width="120" height="10" rx="5" fill="#67716b"/>
    <rect x="160" y="386" width="80" height="10" rx="5" fill="#242b30"/>
  </svg>`,
)

/**
 * TMDB image with graceful SVG fallback when artwork is unavailable
 * (e.g. cast member without a profile photo).
 */
export default function Image({ src, alt, fallback, loading = 'lazy', ...rest }) {
  const [failed, setFailed] = useState(false)
  const effective = failed || !src ? fallback || FALLBACK : src
  return (
    <img
      src={effective}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      {...rest}
    />
  )
}