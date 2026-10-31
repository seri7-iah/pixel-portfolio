import { useEffect, useLayoutEffect, useRef } from 'react'
import { BAYER8 } from '../lib/dither.js'
import { THEME_WIPE_MS } from '../lib/theme.js'
import { subscribe } from '../lib/ticker.js'

// Phase 3e-2: a Home-only time-of-day switch.
//
// The canvas first paints the outgoing Night (or Day) sky and ground as flat
// palette bands, then clears Bayer cells in order until the new world shows
// through. Every cell is a hard square of one colour, so there is no fade,
// gradient, blur or opacity ramp. The overlay sits under the Home copy and
// creatures, so the header, text and Pix stay visible and keep ticking while
// the scenery dissolves; the canvas removes itself after 600ms.

const LAST_LEVEL = 15
const GROUND_HEIGHT = 160

export default function ThemeWipe({
  from,
  scale = 4,
  reducedMotion = false,
  onPainted,
  onDone,
}) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const paintedRef = useRef(onPainted)
  const doneRef = useRef(onDone)
  const reducedRef = useRef(reducedMotion)

  useEffect(() => {
    paintedRef.current = onPainted
    doneRef.current = onDone
    reducedRef.current = reducedMotion
  }, [onPainted, onDone, reducedMotion])

  useLayoutEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const context = canvas ? canvas.getContext('2d') : null

    if (!root || !canvas || !context || !from) {
      // No canvas: swap instantly rather than leaving the old theme applied.
      if (paintedRef.current) paintedRef.current()
      if (doneRef.current) doneRef.current()
      return undefined
    }

    let cell = 4
    let cols = 0
    let rows = 0
    let current = 0
    let elapsed = 0
    let alive = true
    let buckets = []
    let bucket = 0

    const paintBase = () => {
      const width = canvas.width
      const height = canvas.height
      const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1))
      const ground = Math.round(GROUND_HEIGHT * dpr)
      const grass = Math.round(
        Math.min(from.grassDepth, GROUND_HEIGHT - 12) * dpr,
      )
      const lip = Math.max(2, Math.round(4 * dpr))
      const groundTop = height - ground
      const skySplit = Math.round(height * 0.62)

      context.setTransform(1, 0, 0, 1, 0, 0)
      context.clearRect(0, 0, width, height)

      context.fillStyle = from.skyTop
      context.fillRect(0, 0, width, Math.max(0, skySplit))

      context.fillStyle = from.skyBottom
      context.fillRect(0, skySplit, width, Math.max(0, groundTop - skySplit))

      context.fillStyle = from.grassLight
      context.fillRect(0, groundTop, width, lip)

      context.fillStyle = from.grass
      context.fillRect(
        0,
        groundTop + lip,
        width,
        Math.max(0, grass - lip * 2),
      )

      context.fillStyle = from.grassDark
      context.fillRect(0, groundTop + grass - lip, width, lip)

      context.fillStyle = from.dirt
      context.fillRect(
        0,
        groundTop + grass,
        width,
        Math.max(0, ground - grass - lip),
      )

      context.fillStyle = from.dirtDark
      context.fillRect(0, height - lip, width, lip)
    }

    // Cells are bucketed by Bayer value once per size, so each cell clears
    // exactly once and the dissolve is the same ordered stipple as Phase 3c.
    const buildBuckets = () => {
      buckets = Array.from({ length: 64 }, () => [])
      bucket = 0

      for (let row = 0; row < rows; row += 1) {
        const matrixRow = (row % 8) * 8
        const y = row * cell
        for (let col = 0; col < cols; col += 1) {
          buckets[BAYER8[matrixRow + (col % 8)]].push(col * cell, y)
        }
      }
    }

    const applyLevel = (next) => {
      const limit = (next / LAST_LEVEL) * 64

      while (bucket < limit) {
        const coords = buckets[bucket]
        for (let index = 0; index < coords.length; index += 2) {
          context.clearRect(coords[index], coords[index + 1], cell, cell)
        }
        bucket += 1
      }
    }

    const fit = () => {
      const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1))
      const width = Math.max(1, Math.round(root.clientWidth))
      const height = Math.max(1, Math.round(root.clientHeight))

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      cell = Math.max(2, Math.round(scale * dpr))
      cols = Math.ceil(canvas.width / cell)
      rows = Math.ceil(canvas.height / cell)

      paintBase()
      buildBuckets()
      applyLevel(current)
    }

    fit()

    // The old palette is on screen; only now may the document flip tokens.
    if (paintedRef.current) paintedRef.current()

    const unsubscribe = subscribe((delta) => {
      if (!alive) return

      // Reduced motion turned on mid-switch: close the wipe at once.
      if (reducedRef.current) {
        alive = false
        unsubscribe()
        if (doneRef.current) doneRef.current()
        return
      }

      elapsed += delta
      const next = Math.min(
        LAST_LEVEL,
        Math.floor((elapsed / THEME_WIPE_MS) * 16),
      )

      if (next !== current) {
        current = next
        applyLevel(next)
      }

      if (elapsed >= THEME_WIPE_MS) {
        alive = false
        unsubscribe()
        if (doneRef.current) doneRef.current()
      }
    })

    return () => {
      alive = false
      unsubscribe()
    }
  }, [from, scale])

  return (
    <div className="theme-wipe" ref={rootRef} aria-hidden="true">
      <canvas className="theme-wipe__canvas" ref={canvasRef} aria-hidden="true" />
    </div>
  )
}
