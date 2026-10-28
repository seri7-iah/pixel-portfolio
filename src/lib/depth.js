// Phase 3d: depth-meter maths. Pure helpers so the scroll layer stays small and
// the numbers can be checked without a browser.

export const DEPTH_MAX = 3000
export const DEPTH_STEP = 5
export const WORLD_NAME_MS = 1500

export function clamp01(value) {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

// Real scroll distance mapped to 0..1. A page shorter than the viewport is 0.
export function pageProgress(scrollY, scrollHeight, viewportHeight) {
  const travel = Math.max(0, scrollHeight - viewportHeight)
  if (travel <= 0) return 0
  return clamp01(scrollY / travel)
}

// 0..100% becomes 0..3000 m in hard 5 m steps. 3000 is the only value that can
// reach four digits, so the readout never loses a character.
export function depthFromProgress(progress) {
  const metres = Math.round((clamp01(progress) * DEPTH_MAX) / DEPTH_STEP) * DEPTH_STEP
  return Math.min(DEPTH_MAX, Math.max(0, metres))
}

export function formatDepth(metres) {
  return `DEPTH ${String(metres).padStart(4, '0')} M`
}

// The section that owns the viewport's middle line. `tops` are document-space
// section tops in scroll order, so a descent band keeps the world above it
// until the next section actually reaches the line.
export function worldIndexAt(line, tops) {
  let index = 0
  for (let i = 0; i < tops.length; i += 1) {
    if (tops[i] <= line) index = i
  }
  return index
}

// Marker travel along the whole strip, snapped to a whole pixel.
export function markerTravelOffset(progress, travel) {
  return Math.round(clamp01(progress) * Math.max(0, travel))
}

// Reduced motion: one still marker at the middle of the current world's segment.
export function worldCenterOffset(index, segmentHeight, markerSize) {
  return Math.round((index + 0.5) * segmentHeight - markerSize / 2)
}
