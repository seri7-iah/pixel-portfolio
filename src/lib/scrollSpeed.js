// One shared, smoothed scroll-velocity reading for the world effects.
// A single passive scroll listener accumulates distance and the shared ticker
// turns it into a 0..1 speed that eases back to rest when scrolling stops.
// Nothing here touches React state.

import { subscribe } from './ticker.js'

let pendingPx = 0
let lastY = 0
let smoothed = 0
let watchers = 0
let stopTicker = null

function readY() {
  return typeof window === 'undefined' ? 0 : window.scrollY || 0
}

function onScroll() {
  const y = readY()
  pendingPx += Math.abs(y - lastY)
  lastY = y
}

function reset() {
  lastY = readY()
  pendingPx = 0
}

function tick(delta) {
  const ms = delta > 0 ? delta : 16
  const pxPerMs = pendingPx / ms
  pendingPx = 0

  // 2.6 px/ms is a brisk flick; anything faster still clamps to full speed.
  const target = Math.min(1, pxPerMs / 2.6)
  const ease = 1 - Math.exp(-ms / 110)
  smoothed += (target - smoothed) * ease
  if (smoothed < 0.002) smoothed = 0
}

// Retain the shared watcher while any world effect needs the speed. Returns a
// release function; the listener and ticker subscription are removed with the
// last release.
export function retainScrollSpeed() {
  if (typeof window === 'undefined') return () => {}

  if (watchers === 0) {
    reset()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', reset, { passive: true })
    stopTicker = subscribe(tick)
  }

  watchers += 1
  let released = false

  return () => {
    if (released) return
    released = true
    watchers -= 1

    if (watchers === 0) {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', reset)
      if (stopTicker) stopTicker()
      stopTicker = null
      smoothed = 0
      pendingPx = 0
    }
  }
}

export function getScrollSpeed() {
  return smoothed
}
