import { useEffect, useState } from 'react'

/**
 * True once the page has been scrolled past `threshold` pixels,
 * driven by an IntersectionObserver on the .scroll-sentinel marker.
 */
export function usePastScrollPoint(threshold) {
  const [past, setPast] = useState(false)

  useEffect(() => {
    const sentinel = document.querySelector('.scroll-sentinel')
    if (!sentinel || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([entry]) => setPast(!entry.isIntersecting),
      { rootMargin: `${threshold}px 0px 0px 0px` },
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [threshold])

  return past
}