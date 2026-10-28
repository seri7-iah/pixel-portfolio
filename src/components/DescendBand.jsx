import { useEffect, useLayoutEffect, useRef } from 'react'
import { bandLevel, paintBand, readColor } from '../lib/dither.js'

// Phase 3c: one dithered seam between two worlds. The canvas is repainted only
// when the quantised scroll level changes, never per frame, and never through
// React state. Reduced motion paints one still frame at a middle level.
const MIDDLE_LEVEL = 8
const CROSS_LEVEL = 8

export default function DescendBand({
  from,
  to,
  upper,
  lower,
  lip = null,
  scale = 4,
  reducedMotion = false,
  onCross,
}) {
  const bandRef = useRef(null)
  const canvasRef = useRef(null)
  const sizeRef = useRef(null)
  const levelRef = useRef(-1)
  const crossedRef = useRef(false)
  const frameRef = useRef(0)
  const crossRef = useRef(onCross)

  // Keep the latest callback without restarting the scroll layer.
  useEffect(() => {
    crossRef.current = onCross
  }, [onCross])

  useLayoutEffect(() => {
    const band = bandRef.current
    const canvas = canvasRef.current
    if (!band || !canvas) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    const measure = () => {
      const rect = band.getBoundingClientRect()
      const cssWidth = Math.max(1, Math.round(rect.width))
      const cssHeight = Math.max(1, Math.round(rect.height))
      const ratio = Math.min(3, Math.max(1, window.devicePixelRatio || 1))
      // Drawing in device pixels keeps every square whole: a cell is an integer
      // number of device pixels and fillRect never lands on a half pixel.
      const cell = Math.max(1, Math.round(scale * ratio))
      const width = Math.round(cssWidth * ratio)
      const height = Math.round(cssHeight * ratio)

      let resized = false
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        // A new backing store starts blank, so this is the one case that has to
        // repaint even if the level has not moved.
        resized = true
      }

      return {
        width,
        height,
        cell,
        cols: Math.ceil(cssWidth / scale),
        rows: Math.ceil(cssHeight / scale),
        resized,
      }
    }

    // Both base colours come from the sections themselves, so each seam follows
    // its own palette scope (and the Home night/day swap) with no hex copies.
    const render = (level) => {
      const size = sizeRef.current
      if (!size) return

      const upperEl = document.getElementById(from)
      const lowerEl = document.getElementById(to)
      let top = readColor(upperEl, upper)
      let bottom = readColor(lowerEl, lower)
      if (!top) top = bottom
      if (!bottom) bottom = top
      if (!top) return

      let paintedLip = null
      if (lip) {
        const lipEl = lip.source === 'to' ? lowerEl : upperEl
        const dark = readColor(lipEl, lip.dark) || top
        paintedLip = { kind: lip.kind, dark, light: readColor(lipEl, lip.light) || dark }
      }

      paintBand(context, {
        ...size,
        upper: top,
        lower: bottom,
        level,
        lip: paintedLip,
      })
    }

    const levelAt = () => {
      const rect = band.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      const span = viewport + rect.height
      const progress = span > 0 ? (viewport - rect.top) / span : 0
      return bandLevel(progress)
    }

    sizeRef.current = measure()

    // Reduced motion: one frame, held. Only a backing-store change (viewport
    // size or pixel ratio) repaints it.
    if (reducedMotion) {
      const onResize = () => {
        const size = measure()
        sizeRef.current = size
        if (size.resized) render(MIDDLE_LEVEL)
      }

      render(MIDDLE_LEVEL)
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }

    const update = () => {
      frameRef.current = 0
      const next = levelAt()
      const previous = levelRef.current
      if (next === previous) return

      levelRef.current = next
      render(next)

      // The entry beat fires once per band, on the level where the seam crosses
      // the middle of the screen. The first frame never counts, so a reload
      // half-way down the page does not thump.
      if (
        previous >= 0 &&
        previous < CROSS_LEVEL &&
        next >= CROSS_LEVEL &&
        !crossedRef.current
      ) {
        crossedRef.current = true
        if (crossRef.current) crossRef.current()
      }
    }

    const onScroll = () => {
      if (frameRef.current) return
      frameRef.current = window.requestAnimationFrame(update)
    }

    const onResize = () => {
      const size = measure()
      sizeRef.current = size
      if (size.resized) levelRef.current = -1
      update()
    }

    levelRef.current = levelAt()
    render(levelRef.current)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    // One settle frame after mount catches late layout shifts (fonts, images)
    // without touching the scroll path.
    frameRef.current = window.requestAnimationFrame(update)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current)
      frameRef.current = 0
    }
  }, [from, to, upper, lower, lip, scale, reducedMotion])

  return (
    <div
      className="descent-band"
      ref={bandRef}
      data-seam={`${from}-${to}`}
      aria-hidden="true"
    >
      <canvas
        className="descent-band__canvas"
        ref={canvasRef}
        aria-hidden="true"
      />
    </div>
  )
}
