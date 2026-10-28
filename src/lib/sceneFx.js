import { useEffect, useRef } from 'react'
import { subscribe } from './ticker.js'
import { getScrollSpeed, retainScrollSpeed } from './scrollSpeed.js'

// Palette cycling, classic 8-bit style: a fixed set of neighbouring shades
// rotates through CSS custom properties in hard steps. Each pixel/element reads
// a different variable, so neighbours sit on different offsets. Palettes use
// existing world tokens only.
const CYCLE_STEP = 125 // 125ms = 8 steps per second at rest
const PHONE_QUERY = '(max-width: 600px)'

const CYCLES = {
  home: {
    vars: ['--cycle-star-0', '--cycle-star-1', '--cycle-star-2'],
    colors: ['#f4e9c1', '#f0ead2', '#c7c0b1'],
  },
  ember: {
    vars: [
      '--cycle-lava-0',
      '--cycle-lava-1',
      '--cycle-lava-2',
      '--cycle-lava-3',
    ],
    colors: ['#ff7a1a', '#ffd447', '#a4573c', '#4a221b'],
  },
  void: {
    vars: ['--cycle-glint-0', '--cycle-glint-1', '--cycle-glint-2'],
    colors: ['#b58cff', '#e0ccff', '#7d5fa8'],
  },
}

let phoneQuery = null

function pixelUnit() {
  if (typeof window === 'undefined' || !window.matchMedia) return 4
  if (!phoneQuery) phoneQuery = window.matchMedia(PHONE_QUERY)
  return phoneQuery.matches ? 3 : 4
}

function paint(el, cycle, index) {
  const count = cycle.colors.length
  for (let i = 0; i < cycle.vars.length; i += 1) {
    el.style.setProperty(cycle.vars[i], cycle.colors[(index + i) % count])
  }
}

// Drives one section: parallax on [data-parallax] layers and, where a cycle is
// named, the palette rotation. Everything is written straight to the DOM from
// the shared ticker; React never renders per frame.
export default function useSceneFx(
  ref,
  { cycle = null, onScreen = true, paused = false, reducedMotion = false },
) {
  const memory = useRef({ index: 0, phase: 0 })
  // Read the pause flag without restarting the layer, so pausing freezes the
  // palette exactly where it is instead of clearing and re-applying parallax.
  const pausedRef = useRef(paused)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    const layers = Array.from(el.querySelectorAll('[data-parallax]'))
    const config = cycle ? CYCLES[cycle] : null
    const state = memory.current

    const clearParallax = () => {
      for (const layer of layers) layer.style.transform = ''
    }

    // Reduced motion: static, pleasant shades and no movement at all.
    if (reducedMotion) {
      state.index = 0
      state.phase = 0
      clearParallax()
      if (config) paint(el, config, 0)
      return undefined
    }

    // Off-screen sections cost nothing; the next pass repaints on entry.
    if (!onScreen) {
      clearParallax()
      return undefined
    }

    if (config) paint(el, config, state.index)
    const releaseSpeed = retainScrollSpeed()

    const stop = subscribe((delta) => {
      // Parallax: 2 layers per world, translate only, snapped to the pixel grid.
      const rect = el.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      const unit = pixelUnit()
      const span = (rect.height + viewport) / 2
      const progress =
        span > 0
          ? Math.max(
              -1,
              Math.min(
                1,
                (viewport / 2 - (rect.top + rect.height / 2)) / span,
              ),
            )
          : 0

      for (const layer of layers) {
        const max = Number(layer.dataset.parallax) || 0
        if (!max) continue
        const offset = Math.round((progress * max) / unit) * unit
        layer.style.transform = `translate3d(0, ${offset}px, 0)`
      }

      // Palette cycling: 8 hard steps a second, up to 2x with scroll velocity.
      if (!config || pausedRef.current) return

      state.phase += delta * (1 + getScrollSpeed())

      let changed = false
      while (state.phase >= CYCLE_STEP) {
        state.phase -= CYCLE_STEP
        state.index = (state.index + 1) % config.colors.length
        changed = true
      }

      if (changed) paint(el, config, state.index)
    })

    return () => {
      stop()
      releaseSpeed()
      clearParallax()
    }
  }, [ref, cycle, onScreen, reducedMotion, memory])
}
