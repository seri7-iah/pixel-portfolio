import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Sprite from './Sprite.jsx'
import { subscribe } from '../lib/ticker.js'
import { clamp, seekVelocity, snapPx, stepMotion } from '../lib/groundMotion.js'
import {
  EMBERWING_FLY_FRAMES,
  EMBERWING_PALETTE,
  EMBERWING_PERCH_FRAMES,
} from '../lib/emberwingArt.js'

const FLY_WAIT_MIN = 25000
const FLY_WAIT_MAX = 45000
// The first visit arrives soon after Contact comes on screen so the dragon is
// easy to spot; the long 25-45 second gap is kept between later flyovers.
const FIRST_WAIT_MIN = 2500
const FIRST_WAIT_MAX = 4500
const REST_MS = 5000
const FLAP_MS = 145
const IDLE_MS = 1250
const TOP_INSET = 68
const PERCH_TOP = 176
const CRUISE = 110
const DESCEND = 80
const TAKEOFF = 90
const LEAVE = 140

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

// Emberwing is a special flyover, not part of the Contact creature roster. The
// first visit arrives a few seconds after Contact comes on screen, then it
// waits off screen for 25-45 seconds between later flyovers. It crosses the top
// sky band, drops down the right-hand gutter to a pale perch at the far end of
// the ground strip, rests for five seconds, then climbs and leaves the other
// side. The path is deliberately kept out of the copy column at every width.
// The shared ticker and groundMotion helpers drive it, so it costs nothing
// while Contact is off screen or paused.
export default function EmberwingDragon({
  active = true,
  reducedMotion = false,
  scale = 4,
}) {
  const ref = useRef(null)
  const bodyRef = useRef(null)
  const size = 32 * scale

  const posRef = useRef({ x: -size, y: PERCH_TOP, placed: false })
  const velocityRef = useRef({ vx: 0, vy: 0 })
  const planRef = useRef({
    mode: 'wait',
    wait: randomBetween(FIRST_WAIT_MIN, FIRST_WAIT_MAX),
    flap: 0,
    rest: 0,
    idle: 0,
    visible: false,
  })
  const boundsRef = useRef({
    minX: -size,
    maxX: 0,
    minY: PERCH_TOP,
    maxY: 0,
    perchX: 0,
    width: 0,
    height: 0,
    placed: false,
  })
  const frameRef = useRef(0)
  const facingRef = useRef(1)
  const reducedMotionRef = useRef(reducedMotion)

  const [mode, setMode] = useState('wait')
  const [frame, setFrame] = useState(0)
  const [facing, setFacing] = useState(1)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    reducedMotionRef.current = reducedMotion
  }, [reducedMotion])

  const draw = useCallback((x, y, bank = 0, bob = 0) => {
    const el = ref.current
    if (el) el.style.transform = `translate3d(${snapPx(x)}px, ${-snapPx(y)}px, 0)`

    const body = bodyRef.current
    if (body) {
      body.style.transform = `translateY(${-Math.round(bob)}px) rotate(${bank.toFixed(2)}deg)`
    }
  }, [])

  const setFrameIndex = useCallback((next) => {
    if (frameRef.current === next) return
    frameRef.current = next
    setFrame(next)
  }, [])

  const setFacingDirection = useCallback((next) => {
    if (facingRef.current === next) return
    facingRef.current = next
    setFacing(next)
  }, [])

  const setVisibleState = useCallback((next) => {
    if (planRef.current.visible === next) return
    planRef.current.visible = next
    setVisible(next)
  }, [])

  const setPlanMode = useCallback((next) => {
    if (planRef.current.mode === next) return
    planRef.current.mode = next
    setMode(next)
  }, [])

  // Place the dragon and keep its lane in sync with the section size. The top
  // lane sits below the lip and above the copy; the perch sits on the pale
  // ledge at the right end of the ground strip.
  useLayoutEffect(() => {
    const el = ref.current
    const layer = el?.parentElement
    if (!el || !layer) return undefined

    const place = () => {
      const width = layer.clientWidth
      const height = layer.clientHeight
      if (!width || !height) return

      const topY = Math.max(PERCH_TOP + 8, height - TOP_INSET - size)
      const rightInset = Math.max(16, width * 0.04)
      const perchX = Math.max(0, width - size - rightInset)
      const bounds = boundsRef.current

      bounds.minX = -size
      bounds.maxX = width + size
      bounds.minY = PERCH_TOP
      bounds.maxY = topY
      bounds.perchX = perchX
      bounds.width = width
      bounds.height = height
      bounds.placed = true

      const pos = posRef.current
      if (!pos.placed) {
        pos.x = reducedMotionRef.current ? perchX : -size
        pos.y = reducedMotionRef.current ? PERCH_TOP : topY
        pos.placed = true
      } else {
        pos.x = clamp(pos.x, -size, width + size)
        pos.y = clamp(pos.y, PERCH_TOP, topY)
        if (reducedMotionRef.current) {
          pos.x = perchX
          pos.y = PERCH_TOP
        }
      }

      draw(pos.x, pos.y, 0, 0)

      if (reducedMotionRef.current) {
        planRef.current.mode = 'perched-static'
        planRef.current.visible = true
        setMode('perched-static')
        setVisible(true)
        setFrameIndex(0)
        setFacingDirection(1)
      }
    }

    place()

    const observer = new ResizeObserver(place)
    observer.observe(layer)

    return () => observer.disconnect()
  }, [size, draw, setFrameIndex, setFacingDirection])

  // Reduced motion keeps one still perched frame instead of a flyover.
  useEffect(() => {
    if (!reducedMotion) return

    const bounds = boundsRef.current
    if (!bounds.placed) return

    const pos = posRef.current
    pos.x = bounds.perchX
    pos.y = PERCH_TOP
    planRef.current.mode = 'perched-static'
    planRef.current.visible = true
    draw(pos.x, pos.y, 0, 0)
    setMode('perched-static')
    setVisible(true)
    setFrameIndex(0)
    setFacingDirection(1)
  }, [reducedMotion, draw, setFrameIndex, setFacingDirection])

  // Turning the system preference back off returns the dragon to its rare
  // flyover schedule instead of leaving it stuck on the perch.
  useEffect(() => {
    if (reducedMotion) return
    if (planRef.current.mode !== 'perched-static') return

    planRef.current.mode = 'wait'
    planRef.current.wait = randomBetween(FIRST_WAIT_MIN, FIRST_WAIT_MAX)
    planRef.current.visible = false
    setMode('wait')
    setVisible(false)
    setFrameIndex(0)
  }, [reducedMotion, setFrameIndex])

  useEffect(() => {
    if (!active) return undefined

    const el = ref.current
    const layer = el?.parentElement
    if (!el || !layer) return undefined

    return subscribe((delta, now) => {
      const bounds = boundsRef.current
      if (!bounds.placed) return

      const plan = planRef.current
      const pos = posRef.current
      const velocity = velocityRef.current

      if (plan.mode === 'wait') {
        plan.wait -= delta
        if (plan.wait > 0) return

        plan.flap = 0
        pos.x = -size
        pos.y = bounds.maxY
        velocity.vx = 0
        velocity.vy = 0
        setVisibleState(true)
        setPlanMode('fly')
        setFacingDirection(1)
        setFrameIndex(0)
      }

      if (plan.mode === 'fly') {
        const seek = seekVelocity(
          pos.x,
          pos.y,
          bounds.perchX,
          bounds.maxY,
          CRUISE,
          90,
        )
        stepMotion(pos, velocity, seek.vx, seek.vy, delta, 3.6, bounds)

        plan.flap += delta
        if (plan.flap >= FLAP_MS) {
          plan.flap %= FLAP_MS
          setFrameIndex((frameRef.current + 1) % EMBERWING_FLY_FRAMES.length)
        }

        if (seek.distance < 2) {
          velocity.vx = 0
          velocity.vy = 0
          setPlanMode('descend')
        }
      } else if (plan.mode === 'descend') {
        const seek = seekVelocity(
          pos.x,
          pos.y,
          bounds.perchX,
          PERCH_TOP,
          DESCEND,
          42,
        )
        stepMotion(pos, velocity, seek.vx, seek.vy, delta, 4.8, bounds)

        plan.flap += delta
        if (plan.flap >= FLAP_MS) {
          plan.flap %= FLAP_MS
          setFrameIndex((frameRef.current + 1) % EMBERWING_FLY_FRAMES.length)
        }

        if (seek.distance < 1.5) {
          pos.x = bounds.perchX
          pos.y = PERCH_TOP
          velocity.vx = 0
          velocity.vy = 0
          plan.rest = REST_MS
          plan.idle = 0
          setPlanMode('perched')
          setFrameIndex(0)
        }
      } else if (plan.mode === 'perched') {
        plan.rest -= delta
        plan.idle += delta

        if (plan.idle >= IDLE_MS) {
          plan.idle -= IDLE_MS
          setFrameIndex((frameRef.current + 1) % EMBERWING_PERCH_FRAMES.length)
        }

        if (plan.rest <= 0) {
          plan.flap = 0
          velocity.vx = 0
          velocity.vy = 0
          setPlanMode('takeoff')
          setFrameIndex(0)
        }
      } else if (plan.mode === 'takeoff') {
        const seek = seekVelocity(
          pos.x,
          pos.y,
          bounds.perchX,
          bounds.maxY,
          TAKEOFF,
          52,
        )
        stepMotion(pos, velocity, seek.vx, seek.vy, delta, 4.2, bounds)

        plan.flap += delta
        if (plan.flap >= FLAP_MS) {
          plan.flap %= FLAP_MS
          setFrameIndex((frameRef.current + 1) % EMBERWING_FLY_FRAMES.length)
        }

        if (seek.distance < 2) {
          velocity.vx = 0
          velocity.vy = 0
          setPlanMode('leave')
        }
      } else if (plan.mode === 'leave') {
        const seek = seekVelocity(
          pos.x,
          pos.y,
          bounds.width + size,
          bounds.maxY,
          LEAVE,
          120,
        )
        stepMotion(pos, velocity, seek.vx, seek.vy, delta, 3.2, bounds)

        plan.flap += delta
        if (plan.flap >= FLAP_MS) {
          plan.flap %= FLAP_MS
          setFrameIndex((frameRef.current + 1) % EMBERWING_FLY_FRAMES.length)
        }

        if (pos.x >= bounds.width + size - 1) {
          plan.wait = randomBetween(FLY_WAIT_MIN, FLY_WAIT_MAX)
          pos.x = -size
          pos.y = bounds.maxY
          velocity.vx = 0
          velocity.vy = 0
          setVisibleState(false)
          setPlanMode('wait')
        }
      }

      const flying = plan.mode !== 'perched' && plan.mode !== 'perched-static'
      const bank = flying ? clamp(-velocity.vy * 0.08, -7, 7) : 0
      const bob = flying ? Math.sin(now / 520) * 2 : 0
      draw(pos.x, pos.y, bank, bob)
    })
  }, [
    active,
    size,
    draw,
    setFrameIndex,
    setFacingDirection,
    setPlanMode,
    setVisibleState,
  ])

  const perched = mode === 'perched' || mode === 'perched-static'
  const frames = perched ? EMBERWING_PERCH_FRAMES : EMBERWING_FLY_FRAMES

  return (
    <span
      ref={ref}
      className={`emberwing${visible ? ' emberwing--visible' : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span ref={bodyRef} className="emberwing__body">
        <Sprite
          frames={frames}
          palette={EMBERWING_PALETTE}
          frameIndex={frame}
          scale={scale}
          flip={facing < 0}
        />
      </span>
    </span>
  )
}
