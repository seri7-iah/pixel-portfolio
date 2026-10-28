import { useEffect, useState } from 'react'

// Phase 3b-2: the first time a world comes into view, every creature in it
// pauses, turns towards the middle of the screen, shows a small pixel "!" and
// hops once. Scheduling uses one state flip and a timeout; the hop itself and
// the bubble toggle are written straight to the DOM from the shared ticker, so
// nothing here re-renders per frame.

export const NOTICE_MS = 700
export const NOTICE_STAGGER = 150

// One hop per notice: a parabola that starts and lands at 0 and rounds every
// step to the 4px/3px pixel grid.
export function noticeLift(elapsed, unit = 4) {
  if (elapsed <= 0 || elapsed >= NOTICE_MS) return 0
  const t = elapsed / NOTICE_MS
  return Math.round(unit * 4 * t * (1 - t))
}

// Floating creatures rise once on a half sine instead of hopping.
export function noticeBob(elapsed, unit = 4) {
  if (elapsed <= 0 || elapsed >= NOTICE_MS) return 0
  return Math.round(unit * 2 * Math.sin((elapsed / NOTICE_MS) * Math.PI))
}

// Which way a creature at `el` has to face to look at the middle of the screen.
export function faceTowardMiddle(el) {
  if (!el || typeof window === 'undefined') return null

  const rect = el.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const middle = window.innerWidth / 2

  if (Math.abs(centerX - middle) < 1) return null
  return centerX < middle ? 1 : -1
}

// Fires once, `delay` ms after the creature is both armed (its world has been
// seen) and awake (on screen, not paused, no reduced motion). Sleeping pauses
// the countdown instead of spending the reaction off screen.
export function useNoticeSchedule({ armed, active, delay = 0 }) {
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!armed || !active || started) return undefined

    const id = window.setTimeout(() => setStarted(true), delay)
    return () => window.clearTimeout(id)
  }, [armed, active, started, delay])

  return started
}
