import { useEffect, useRef } from 'react'
import Sprite from './Sprite.jsx'
import { subscribe } from '../lib/ticker.js'

// Phase 3b-2: the Home wish star. Every 10-20 seconds a small pixel star
// crosses the upper sky. Clicking it (or tapping it) bursts 12 hard pixels and
// it disappears. Only the star itself takes pointer events; the layer and the
// burst canvas stay transparent to the page.

const WAIT_MIN = 10000
const WAIT_MAX = 20000
const FLY_MIN = 1500
const FLY_MAX = 2100
const BURST_MS = 700
const BURST_COUNT = 12

const STAR_FRAME = [
  '....s....',
  '....s....',
  '...sss...',
  '.sssssss.',
  'sssswssss',
  '.sssssss.',
  '...sss...',
  '....s....',
  '....s....',
]

const STAR_FRAMES = [STAR_FRAME]
const STAR_PALETTE = {
  s: '#f4e9c1',
  w: '#fff8e0',
}
const BURST_COLORS = ['#f4e9c1', '#fff8e0', '#ffd98a']

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

export default function WishStar({
  active = true,
  reducedMotion = false,
  scale = 4,
}) {
  const layerRef = useRef(null)
  const starRef = useRef(null)
  const burstRef = useRef(null)
  const burstStartRef = useRef(null)
  const stateRef = useRef({
    mode: 'wait',
    wait: randomBetween(WAIT_MIN, WAIT_MAX),
    elapsed: 0,
    duration: FLY_MIN,
    x0: 0,
    x1: 0,
    y0: 0,
    y1: 0,
    burstTime: 0,
    particles: [],
  })

  const burstSide = scale * 32

  useEffect(() => {
    if (!active || reducedMotion) return undefined

    const layer = layerRef.current
    const star = starRef.current
    const burst = burstRef.current
    const context = burst ? burst.getContext('2d') : null
    if (!layer || !star || !burst || !context) return undefined

    const state = stateRef.current
    const starSize = 9 * scale
    const unit = scale

    const hide = () => star.classList.remove('is-on')
    const show = () => star.classList.add('is-on')

    const schedule = () => {
      state.mode = 'wait'
      state.wait = randomBetween(WAIT_MIN, WAIT_MAX)
      state.particles = []
      context.clearRect(0, 0, burstSide, burstSide)
    }

    const startFlight = () => {
      const width = layer.clientWidth
      const height = layer.clientHeight
      if (!width || !height) {
        state.wait = 2000
        return
      }

      const leftward = Math.random() < 0.5
      state.x0 = leftward ? width : -starSize
      state.x1 = leftward ? -starSize : width
      state.y0 = randomBetween(84, Math.max(96, Math.min(220, height * 0.26)))
      state.y1 = state.y0 + randomBetween(0, 32)
      state.duration = randomBetween(FLY_MIN, FLY_MAX)
      state.elapsed = 0
      state.mode = 'fly'

      star.style.transform = `translate3d(${Math.round(state.x0)}px, ${Math.round(state.y0)}px, 0)`
      show()
    }

    const drawBurst = (delta) => {
      const dt = Math.min(delta, 64) / 1000
      context.clearRect(0, 0, burstSide, burstSide)

      for (const particle of state.particles) {
        particle.life -= delta
        if (particle.life <= 0) continue

        particle.vy += 110 * dt
        particle.x += particle.vx * dt
        particle.y += particle.vy * dt

        context.fillStyle = particle.color
        context.fillRect(
          Math.round(particle.x),
          Math.round(particle.y),
          unit,
          unit,
        )
      }
    }

    const startBurst = (centerX, centerY) => {
      state.mode = 'burst'
      state.burstTime = 0
      state.particles = []

      burst.style.transform = `translate3d(${Math.round(
        centerX - burstSide / 2,
      )}px, ${Math.round(centerY - burstSide / 2)}px, 0)`

      const middle = burstSide / 2
      for (let i = 0; i < BURST_COUNT; i += 1) {
        const angle =
          (Math.PI * 2 * i) / BURST_COUNT + randomBetween(-0.22, 0.22)
        const speed = randomBetween(55, 135)

        state.particles.push({
          x: middle,
          y: middle,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 18,
          life: randomBetween(360, 660),
          color: BURST_COLORS[i % BURST_COLORS.length],
        })
      }

      hide()
    }

    burstStartRef.current = startBurst

    const stop = subscribe((delta) => {
      if (state.mode === 'wait') {
        state.wait -= delta
        if (state.wait <= 0) startFlight()
        return
      }

      if (state.mode === 'fly') {
        state.elapsed += delta
        const t = Math.min(1, state.elapsed / state.duration)
        const x = state.x0 + (state.x1 - state.x0) * t
        const y = state.y0 + (state.y1 - state.y0) * t

        star.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(
          y,
        )}px, 0)`

        if (t >= 1) {
          hide()
          schedule()
        }
        return
      }

      state.burstTime += delta
      drawBurst(delta)
      if (state.burstTime >= BURST_MS) schedule()
    })

    return () => {
      stop()
      burstStartRef.current = null
    }
  }, [active, reducedMotion, scale, burstSide])

  // Reduced motion removes the wish star entirely. Turning the preference on
  // mid-session also clears a star or burst that is already in the sky.
  useEffect(() => {
    if (!reducedMotion) return

    const state = stateRef.current
    const star = starRef.current
    const burst = burstRef.current

    state.mode = 'wait'
    state.particles = []
    if (star) star.classList.remove('is-on')

    const context = burst ? burst.getContext('2d') : null
    if (burst && context) context.clearRect(0, 0, burst.width, burst.height)
  }, [reducedMotion])

  if (reducedMotion) return null

  const handleClick = () => {
    const startBurst = burstStartRef.current
    const star = starRef.current
    const layer = layerRef.current
    if (!startBurst || !star || !layer) return
    if (stateRef.current.mode !== 'fly') return

    const rect = star.getBoundingClientRect()
    const layerRect = layer.getBoundingClientRect()

    startBurst(
      rect.left - layerRect.left + rect.width / 2,
      rect.top - layerRect.top + rect.height / 2,
    )
  }

  return (
    <span className="wish-layer" ref={layerRef} aria-hidden="true">
      <span className="wish-star" ref={starRef} onClick={handleClick}>
        <Sprite
          frames={STAR_FRAMES}
          palette={STAR_PALETTE}
          scale={scale}
          frameIndex={0}
          playing={false}
        />
      </span>
      <canvas
        ref={burstRef}
        className="wish-burst"
        width={burstSide}
        height={burstSide}
        style={{ width: burstSide, height: burstSide }}
        aria-hidden="true"
      />
    </span>
  )
}
