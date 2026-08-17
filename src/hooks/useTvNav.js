import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { IS_TV } from '../lib/tv'

const FOCUSABLE =
  'a[href], button:not([disabled]), iframe, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const isEditable = (el) =>
  el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')

function visible(el) {
  const r = el.getClientRects()
  return r.length > 0 && r[0].width > 0 && r[0].height > 0
}

function rect(el) {
  return el.getBoundingClientRect()
}

function center(r) {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

function overlapsVertically(a, b) {
  const tolerance = Math.max(a.height, b.height) / 2
  return a.top < b.bottom + tolerance && a.bottom > b.top - tolerance
}

function overlapsHorizontally(a, b) {
  const tolerance = Math.max(a.width, b.width) / 2
  return a.left < b.right + tolerance && a.right > b.left - tolerance
}

function focusables() {
  return [...document.querySelectorAll(FOCUSABLE)].filter(visible)
}

/** Scrolls the nearest horizontal scroll container so the element is centered. */
function centerInRow(el) {
  const target = rect(el)
  let node = el.parentElement
  while (node && node !== document.body) {
    const style = getComputedStyle(node)
    const scrollable =
      node.scrollWidth > node.clientWidth &&
      /auto|scroll/.test(style.overflowX) &&
      /auto|scroll/.test(style.overflowY)
    if (scrollable) {
      const box = node.getBoundingClientRect()
      const delta =
        target.left - box.left - (node.clientWidth - target.width) / 2
      node.scrollTo({ left: Math.max(0, node.scrollLeft + delta), behavior: 'auto' })
      return
    }
    node = node.parentElement
  }
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

function moveTo(el) {
  if (!el || el === document.activeElement) return
  el.focus()
  if (visible(el)) centerInRow(el)
}

/** Netflix-style dpad navigation: rows are horizontal strips, dpad moves between them. */
export function useTvNav() {
  const location = useLocation()

  useEffect(() => {
    if (!IS_TV) return

    const onKeyDown = (e) => {
      const key = e.key
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return
      if (isEditable(document.activeElement)) return
      e.preventDefault()

      const all = focusables()
      if (!all.length) return
      const active = document.activeElement
      const fromRect = active && active !== document.body ? rect(active) : null
      if (!fromRect) {
        moveTo(all[0])
        return
      }
      const fromC = center(fromRect)

      const horizontal = key === 'ArrowLeft' || key === 'ArrowRight'
      const sign = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1

      let best = null
      let bestScore = Infinity
      for (const el of all) {
        if (el === active) continue
        const r = rect(el)
        const c = center(r)
        const dx = c.x - fromC.x
        const dy = c.y - fromC.y
        let score
        if (horizontal) {
          if (dx * sign <= 0) continue
          if (!overlapsVertically(fromRect, r)) continue
          score = Math.abs(dx) + Math.abs(dy) * 2
        } else {
          if (dy * sign <= 0) continue
          if (overlapsHorizontally(fromRect, r)) score = Math.abs(dy)
          else score = Math.abs(dy) + Math.abs(dx) * 1.6
        }
        if (score < bestScore) {
          bestScore = score
          best = el
        }
      }
      if (best) moveTo(best)
    }

    const grabInitialFocus = () => {
      const main = document.getElementById('main')
      if (!main) return
      if (location.pathname.includes('/watch/')) return // WatchPage focuses the player itself
      const first = main.querySelector(FOCUSABLE)
      if (first) {
        moveTo(first)
        return true
      }
      return false
    }

    const tryGrab = () => {
      if (grabInitialFocus()) return
      const t = setTimeout(() => {
        if (!grabInitialFocus()) {
          const first = document.querySelector(FOCUSABLE)
          if (first && first !== document.activeElement) first.focus()
        }
      }, 700)
      return () => clearTimeout(t)
    }

    document.addEventListener('keydown', onKeyDown, true)
    const cleanup = tryGrab()
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      cleanup?.()
    }
  }, [location.pathname])
}
