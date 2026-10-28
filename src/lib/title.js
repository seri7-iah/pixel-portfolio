// Phase 3e-1: session-only bookkeeping for the Press Start screen. Every
// storage call is wrapped, so a blocked sessionStorage (private mode, embedded
// webview) simply shows the title again instead of breaking the page.

export const TITLE_SESSION_KEY = 'pop:pixel-portfolio:title-seen'
export const TITLE_WIPE_MS = 900

// A deep link such as #projects must land straight in that world, so any hash
// other than an empty one skips the title for this load.
export function hasDeepLink() {
  if (typeof window === 'undefined') return false
  try {
    const hash = window.location.hash
    return Boolean(hash && hash !== '#')
  } catch {
    return false
  }
}

// Read synchronously during the first render, so the overlay is part of the
// very first paint instead of appearing after an effect.
export function shouldShowTitle() {
  if (typeof window === 'undefined') return false
  if (hasDeepLink()) return false

  try {
    return window.sessionStorage.getItem(TITLE_SESSION_KEY) !== '1'
  } catch {
    return true
  }
}

// Marked when the visitor actually leaves the title, not when it appears, so a
// reload mid-intro still offers the title once.
export function markTitleSeen() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(TITLE_SESSION_KEY, '1')
  } catch {
    // Storage is unavailable. Showing the title next time is the safe default.
  }
}
