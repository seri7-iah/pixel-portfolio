import { useLayoutEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../lib/useMotion.js'
import {
  WORLD_NAME_MS,
  depthFromProgress,
  formatDepth,
  markerTravelOffset,
  pageProgress,
  worldCenterOffset,
  worldIndexAt,
} from '../lib/depth.js'

// Phase 3d: a fixed mine-shaft gauge. Four palette segments, ladder rungs and
// a Pix-head marker that follows page scroll. It is also a second navigation:
// every segment is a real button that lands where its signpost link lands.
const WORLDS = [
  { id: 'home', name: 'THE SURFACE', label: 'Go to Home, the surface' },
  { id: 'projects', name: 'THE CAVE', label: 'Go to Projects, the cave' },
  { id: 'about', name: 'EMBER DEPTHS', label: 'Go to About, the Ember depths' },
  { id: 'contact', name: 'THE VOID', label: 'Go to Contact, the void' },
]

// An 8x8 head cropped from Pix's side view. Same palette letters and colours
// as PIX_PALETTE in pixelArt.js, so the marker is the same character.
const PIX_HEAD_MARKER = [
  'KKKKKKKK',
  'KKKKKKKK',
  'RRRRRRRR',
  'KKKSSSSS',
  'KKKSSSES',
  'KKKSSSSS',
  'KKKSSSSM',
  'KKSSSSSS',
]

const MARKER_COLORS = {
  K: '#1a1626', // black hair
  R: '#e05a3c', // red-orange headband
  S: '#f0c39b', // warm skin
  E: '#221a2b', // dark eye
  M: '#b9825c', // mouth
}

const MARKER_UNIT = 1
const MARKER_SIZE = 16
const RUNG_COUNT = 40
const LERP = 0.22

// One hard 1px square per art pixel. The art layer is scaled 2x on desktop and
// 1x on phones, so both sizes stay on whole pixels. Built once at module load.
const MARKER_SHADOW = PIX_HEAD_MARKER.flatMap((row, y) =>
  row
    .split('')
    .map((key, x) =>
      key === '.'
        ? null
        : `${x * MARKER_UNIT}px ${y * MARKER_UNIT}px 0 0 ${MARKER_COLORS[key]}`,
    ),
)
  .filter(Boolean)
  .join(', ')

function jumpTo(id) {
  const target = document.getElementById(id)
  if (!target) return
  // The signpost uses a plain anchor with no scroll offset; this is the same
  // target and offset through a button, so Enter and Space both work.
  target.scrollIntoView()
}

export default function DepthMeter() {
  const stripRef = useRef(null)
  const segmentsRef = useRef(null)
  const markerRef = useRef(null)
  const readoutRef = useRef(null)
  const announceRef = useRef(null)
  const worldRef = useRef(0)
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    const strip = stripRef.current
    const segments = segmentsRef.current
    const marker = markerRef.current
    const readout = readoutRef.current
    const announce = announceRef.current
    if (!strip || !segments || !marker || !readout || !announce) return undefined

    const sections = WORLDS.map((world) => document.getElementById(world.id))
    const buttons = Array.from(segments.children)

    // The gauge lives outside every section scope, so read each world's base
    // colour from its own live palette instead of copying palette hexes here.
    // Home keeps the CSS var(--bg), which will follow the future Night/Day swap.
    buttons.forEach((button, index) => {
      if (index === 0) return
      const section = sections[index]
      if (!section) return
      const base = window.getComputedStyle(section).getPropertyValue('--bg').trim()
      if (base) button.style.background = base
    })

    let frame = 0
    let dirty = true
    let current = null
    let target = 0
    let progress = 0
    let world = worldRef.current
    let nameUntil = 0
    let nameTimer = 0
    let alive = true

    const time = () => window.performance.now()

    const paintDepth = (now) => {
      if (now < nameUntil) return
      const text = formatDepth(depthFromProgress(progress))
      if (readout.textContent !== text) readout.textContent = text
    }

    const showWorld = (index, now) => {
      nameUntil = now + WORLD_NAME_MS
      const label = WORLDS[index].name
      if (readout.textContent !== label) readout.textContent = label
      if (announce.textContent !== label) announce.textContent = label

      buttons.forEach((button, buttonIndex) => {
        if (buttonIndex === index) button.setAttribute('aria-current', 'location')
        else button.removeAttribute('aria-current')
      })

      if (nameTimer) window.clearTimeout(nameTimer)
      nameTimer = window.setTimeout(() => {
        nameTimer = 0
        nameUntil = 0
        paintDepth(time())
      }, WORLD_NAME_MS)
    }

    const measure = () => {
      const viewport = window.innerHeight || 1
      progress = pageProgress(
        window.scrollY,
        document.documentElement.scrollHeight,
        viewport,
      )
      const line = window.scrollY + viewport / 2
      const tops = sections.map((section) =>
        section
          ? section.getBoundingClientRect().top + window.scrollY
          : Number.POSITIVE_INFINITY,
      )
      return worldIndexAt(line, tops)
    }

    const applyMarker = (value) => {
      marker.style.transform = `translate3d(0, ${Math.round(value)}px, 0)`
    }

    function schedule() {
      if (!alive || frame) return
      frame = window.requestAnimationFrame(step)
    }

    function step() {
      frame = 0
      if (!alive) return

      if (dirty) {
        dirty = false
        const index = measure()
        const now = time()

        if (index !== world) {
          world = index
          worldRef.current = world
          showWorld(world, now)
        } else {
          paintDepth(now)
        }

        const inner = Math.max(1, strip.clientHeight)
        const markerSize = marker.offsetWidth || MARKER_SIZE
        target = reducedMotion
          ? worldCenterOffset(world, inner / WORLDS.length, markerSize)
          : markerTravelOffset(progress, Math.max(0, inner - markerSize))

        if (reducedMotion || current === null) {
          current = target
          applyMarker(current)
        }
      }

      if (!reducedMotion && current !== target) {
        const diff = target - current
        if (Math.abs(diff) <= 0.5) current = target
        else current += diff * LERP
        applyMarker(current)
      }

      if (dirty || (!reducedMotion && current !== target)) schedule()
    }

    const onScroll = () => {
      dirty = true
      schedule()
    }

    const onResize = () => {
      dirty = true
      schedule()
    }

    if (buttons[world]) buttons[world].setAttribute('aria-current', 'location')
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!alive) return
        dirty = true
        schedule()
      })
    }

    schedule()

    return () => {
      alive = false
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (frame) window.cancelAnimationFrame(frame)
      if (nameTimer) window.clearTimeout(nameTimer)
      frame = 0
      nameTimer = 0
    }
  }, [reducedMotion])

  return (
    <nav className="depth-meter" aria-label="World depth">
      <p className="depth-meter__readout" aria-hidden="true" ref={readoutRef}>
        {formatDepth(0)}
      </p>

      <div className="depth-meter__strip" ref={stripRef}>
        <div className="depth-meter__segments" ref={segmentsRef}>
          {WORLDS.map((world) => (
            <button
              key={world.id}
              type="button"
              className={`depth-meter__segment depth-meter__segment--${world.id}`}
              aria-label={world.label}
              onClick={() => jumpTo(world.id)}
            />
          ))}
        </div>

        <div className="depth-meter__rungs" aria-hidden="true">
          {Array.from({ length: RUNG_COUNT }, (_, index) => (
            <span className="depth-meter__rung" key={index} />
          ))}
        </div>

        <span className="depth-meter__marker" aria-hidden="true" ref={markerRef}>
          <span
            className="depth-meter__marker-art"
            style={{ boxShadow: MARKER_SHADOW }}
          />
        </span>
      </div>

      <p
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        ref={announceRef}
      />
    </nav>
  )
}
