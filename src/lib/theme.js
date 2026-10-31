// Phase 3e-2: Home Night/Day theme bookkeeping.
//
// index.html resolves the very first theme with a tiny inline script, so the
// saved choice or the system preference is on <html> before React mounts and
// there is no flash of the wrong world. React only reads that resolved value
// and writes later choices back.

export const THEME_KEY = 'pop:theme'
export const THEME_WIPE_MS = 600
export const THEME_EVENT = 'pop:theme'

// The theme is already on the document; never re-derive it from storage here or
// the first React render could disagree with the first paint.
export function currentTheme() {
  if (typeof document === 'undefined') return 'night'
  return document.documentElement.getAttribute('data-theme') === 'day'
    ? 'day'
    : 'night'
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  const next = theme === 'day' ? 'day' : 'night'
  document.documentElement.setAttribute('data-theme', next)

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', next === 'day' ? '#8fd3ff' : '#0b1026')
  }
}

// A blocked store (private mode, embedded webview) must never break the toggle.
export function saveTheme(theme) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(THEME_KEY, theme === 'day' ? 'day' : 'night')
  } catch {
    // The choice simply will not persist. The current session still works.
  }
}

// Lit sprites cache the Home rim accent. This tells them to re-bake once.
export function announceTheme() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(THEME_EVENT))
}

// Read the outgoing Home palette before the theme attribute flips, so the
// dither wipe can paint the old sky and ground for its first frame.
export function readHomePalette() {
  if (typeof document === 'undefined') return null
  const home = document.getElementById('home')
  if (!home) return null

  const styles = window.getComputedStyle(home)
  const read = (name) => styles.getPropertyValue(name).trim()

  return {
    skyTop: read('--sky-top'),
    skyBottom: read('--sky-bottom'),
    grass: read('--grass'),
    grassLight: read('--grass-light'),
    grassDark: read('--grass-dark'),
    dirt: read('--dirt'),
    dirtDark: read('--dirt-dark'),
    grassDepth: parseFloat(read('--grass-depth')) || 96,
  }
}
