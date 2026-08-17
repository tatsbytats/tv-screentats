/**
 * TV / Google TV detection.
 * The Android wrapper appends "ScreenTatsTV/1.0" to its user agent.
 * Also catches other TV browsers (Android TV Leanback, Tizen, webOS, Roku, …).
 */
export const IS_TV = (() => {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /ScreenTatsTV|Android TV|Smart ?TV|Leanback|Tizen|WebOS|NetCast|Roku|Fire ?TV|Apple ?TV|Opera ?TV/i.test(ua)
})()

/** Adds a `tv` class to <html> so TV-specific CSS can key off it. */
export function initTV() {
  if (!IS_TV) return
  document.documentElement.classList.add('tv')
}
