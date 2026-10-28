import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Sprite from './Sprite.jsx'
import { subscribe } from '../lib/ticker.js'
import {
  clamp,
  seekVelocity,
  snapPx,
  stepMotion,
  walkStep,
} from '../lib/groundMotion.js'
import useIdleAnimation from '../lib/useIdleAnimation.js'
import {
  NOTICE_MS,
  NOTICE_STAGGER,
  faceTowardMiddle,
  noticeLift,
  useNoticeSchedule,
} from '../lib/notice.js'
import NoticeBubble from './NoticeBubble.jsx'

const EDGE = 8
const WANDER_RATE = 7
const STOP_DISTANCE = 1.2
const DEFAULT_STRIDE = 8

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

// A decorative ground creature that walks or hops to a random spot on its
// section's ground strip, pauses, then picks another spot. Every creature is
// drawn in side view facing right; moving left only flips the sprite canvas.
// Position, velocity and walk phase live in refs and are written from the
// shared ticker, so only mode, facing and the current frame re-render.
export default function Critter({
  name,
  palette,
  idleFrames,
  idleBlinkFrames = null,
  walkFrames,
  liftFrames = null,
  scale = 4,
  speed = 26,
  stride = DEFAULT_STRIDE,
  hop = 0,
  laneMin = 64,
  laneMax = 108,
  startX = 0.5,
  breathMs = 900,
  blinkMin = 4200,
  blinkMax = 7000,
  easeDistance = 18,
  active = true,
  noticeArmed = false,
  noticeIndex = 0,
}) {
  const ref = useRef(null)
  const bodyRef = useRef(null)
  const shadowRef = useRef(null)
  const bubbleRef = useRef(null)
  const noticeRef = useRef({ active: false, started: false, elapsed: 0 })
  const posRef = useRef({ x: 0, y: laneMin, placed: false })
  const planRef = useRef({ mode: 'idle', wait: 900, tx: 0, ty: laneMin })
  const velocityRef = useRef({ vx: 0, vy: 0 })
  const phaseRef = useRef(0)
  const walkFrameRef = useRef(0)
  const modeRef = useRef('idle')
  const facingRef = useRef(1)

  const [mode, setMode] = useState('idle')
  const [facing, setFacing] = useState(1)
  const [walkFrame, setWalkFrame] = useState(0)

  const size = idleFrames[0][0].length * scale
  const walkStride = stride * scale
  const walking = active && mode === 'walk'

  const stopFrames = useCallback(() => {
    phaseRef.current = 0
    if (walkFrameRef.current !== 0) {
      walkFrameRef.current = 0
      setWalkFrame(0)
    }
  }, [])

  const setMoving = useCallback(
    (next) => {
      const value = next ? 'walk' : 'idle'
      if (modeRef.current !== value) {
        modeRef.current = value
        setMode(value)
      }
      if (!next) stopFrames()
    },
    [stopFrames],
  )

  const face = useCallback((direction) => {
    if (!direction || facingRef.current === direction) return
    facingRef.current = direction
    setFacing(direction)
  }, [])

  // Walk frames advance from the distance actually travelled, so speed changes
  // and a blocked creature never make the feet slide.
  const advanceFrames = useCallback(
    (distance) => {
      if (distance <= 0) return

      const next = walkStep(
        phaseRef.current,
        distance,
        walkStride,
        walkFrames.length,
      )
      phaseRef.current = next.phase

      if (next.frame !== walkFrameRef.current) {
        walkFrameRef.current = next.frame
        setWalkFrame(next.frame)
      }
    },
    [walkStride, walkFrames.length],
  )

  const draw = useCallback((x, y) => {
    const el = ref.current
    if (el) el.style.transform = `translate3d(${snapPx(x)}px, ${-snapPx(y)}px, 0)`
  }, [])

  const { frame: idleFrame, blinking } = useIdleAnimation({
    enabled: active && mode === 'idle',
    frameCount: idleFrames.length,
    breathMs,
    blinkMin,
    blinkMax,
  })

  const noticeOn = useNoticeSchedule({
    armed: noticeArmed,
    active,
    delay: noticeIndex * NOTICE_STAGGER,
  })

  // One 700ms notice beat: stop the wander plan, turn towards the middle of the
  // screen and raise the "!" bubble. The ticker drives the hop and the bubble
  // toggle, so this effect runs once and never re-renders during the reaction.
  useEffect(() => {
    if (!noticeOn || !active) return
    if (noticeRef.current.started) return
    noticeRef.current.started = true

    const plan = planRef.current
    const velocity = velocityRef.current
    plan.mode = 'idle'
    plan.wait = randomBetween(700, 1400)
    velocity.vx = 0
    velocity.vy = 0

    setMoving(false)
    const direction = faceTowardMiddle(ref.current)
    if (direction) face(direction)

    noticeRef.current.active = true
    noticeRef.current.elapsed = 0
    if (bubbleRef.current) bubbleRef.current.classList.add('is-on')
  }, [noticeOn, active, face, setMoving])

  // While inactive the render already falls back to the first idle frame, a
  // flat body and a full-size shadow; the motion effect resets the pose when
  // the creature wakes up again.

  // Place the creature and keep it inside the layer when the world resizes.
  useLayoutEffect(() => {
    const el = ref.current
    const layer = el?.parentElement
    if (!el || !layer) return undefined

    const pos = posRef.current
    const plan = planRef.current

    const place = () => {
      const maxX = Math.max(EDGE, layer.clientWidth - size - EDGE)

      if (!pos.placed) {
        pos.x = Math.min(maxX, Math.max(EDGE, layer.clientWidth * startX))
        pos.y = randomBetween(laneMin, laneMax)
        pos.placed = true
        plan.wait = randomBetween(600, 2400)
      } else if (pos.x > maxX) {
        pos.x = maxX
      }

      pos.y = clamp(pos.y, laneMin, laneMax)
      draw(pos.x, pos.y)
    }

    place()

    const observer = new ResizeObserver(place)
    observer.observe(layer)

    return () => observer.disconnect()
  }, [size, startX, laneMin, laneMax, draw])

  // Wandering: ease towards the target, pause, repeat. The shared ticker stops
  // this effect whenever the section is off screen, paused or reduced motion.
  useEffect(() => {
    if (!active) {
      // Leaving the section, pausing or turning on reduced motion mid-beat
      // clears the hop and the bubble so nothing stays frozen on screen. The
      // reaction counts as seen; it is a once-per-load greeting.
      const notice = noticeRef.current
      if (notice.active) {
        notice.active = false
        if (bodyRef.current) bodyRef.current.style.transform = ''
        if (bubbleRef.current) bubbleRef.current.classList.remove('is-on')
      }
      return undefined
    }

    const el = ref.current
    const layer = el?.parentElement
    if (!el || !layer) return undefined

    const pos = posRef.current
    const plan = planRef.current
    const velocity = velocityRef.current

    velocity.vx = 0
    velocity.vy = 0

    if (plan.mode !== 'idle') {
      plan.mode = 'idle'
      plan.wait = randomBetween(900, 2400)
    }

    setMoving(false)

    const bounds = () => ({
      minX: EDGE,
      maxX: Math.max(EDGE, layer.clientWidth - size - EDGE),
      minY: laneMin,
      maxY: laneMax,
    })

    const pickTarget = () => {
      const maxX = Math.max(EDGE, layer.clientWidth - size - EDGE)
      let nextX = randomBetween(EDGE, maxX)

      // Prefer a real walk over a tiny shuffle when there is room for one.
      for (let tries = 0; tries < 4 && maxX - EDGE > 96; tries += 1) {
        if (Math.abs(nextX - pos.x) >= 64) break
        nextX = randomBetween(EDGE, maxX)
      }

      plan.tx = nextX
      plan.ty = randomBetween(laneMin, laneMax)
      plan.mode = 'walk'

      if (Math.abs(nextX - pos.x) > 4) {
        face(nextX > pos.x ? 1 : -1)
      }

      setMoving(true)
    }

    return subscribe((delta) => {
      const notice = noticeRef.current
      if (notice.active) {
        notice.elapsed += delta
        const lift = noticeLift(notice.elapsed, scale)
        const body = bodyRef.current
        if (body) body.style.transform = lift > 0 ? `translateY(${-lift}px)` : ''

        if (notice.elapsed >= NOTICE_MS) {
          notice.active = false
          if (body) body.style.transform = ''
          if (bubbleRef.current) bubbleRef.current.classList.remove('is-on')
        }
        return
      }

      if (plan.mode === 'idle') {
        velocity.vx = 0
        velocity.vy = 0
        plan.wait -= delta
        if (plan.wait <= 0) pickTarget()
        return
      }

      const remaining = Math.hypot(plan.tx - pos.x, plan.ty - pos.y)

      if (remaining <= STOP_DISTANCE) {
        pos.x = plan.tx
        pos.y = plan.ty
        velocity.vx = 0
        velocity.vy = 0
        plan.mode = 'idle'
        plan.wait = randomBetween(2600, 4800)
        setMoving(false)
        draw(pos.x, pos.y)
        return
      }

      const seek = seekVelocity(
        pos.x,
        pos.y,
        plan.tx,
        plan.ty,
        speed,
        easeDistance,
      )
      const beforeX = pos.x
      const moved = stepMotion(
        pos,
        velocity,
        seek.vx,
        seek.vy,
        delta,
        WANDER_RATE,
        bounds(),
      )

      // Facing follows the direction the creature actually moved, so a stop
      // keeps the last facing and vertical movement never turns it.
      if (Math.abs(pos.x - beforeX) > 0.01) {
        face(pos.x > beforeX ? 1 : -1)
      }

      if (moved > 0.001) {
        setMoving(true)
        advanceFrames(moved)
      } else {
        setMoving(false)
      }

      draw(pos.x, pos.y)
    })
  }, [
    active,
    size,
    scale,
    speed,
    stride,
    laneMin,
    laneMax,
    easeDistance,
    draw,
    advanceFrames,
    setMoving,
    face,
  ])

  const blinkIdle = blinking && idleBlinkFrames
  const frames = walking
    ? walkFrames
    : blinkIdle
      ? idleBlinkFrames
      : idleFrames
  const frameIndex = walking ? walkFrame : idleFrame
  const airLift = walking && liftFrames ? (liftFrames[walkFrame] ?? 0) : 0
  const bodyLift = airLift > 0 ? Math.round(airLift * hop) : 0
  const shadowScale = airLift > 0 ? 1 - airLift * 0.3 : 1

  return (
    <div ref={ref} className={`critter critter--${name}`} aria-hidden="true">
      <span
        ref={shadowRef}
        className="critter__shadow"
        aria-hidden="true"
        style={hop > 0 ? { '--shadow-scale': shadowScale } : undefined}
      />
      <span
        ref={bodyRef}
        className="critter__body"
        style={bodyLift > 0 ? { transform: `translateY(${-bodyLift}px)` } : undefined}
      >
        <Sprite
          frames={frames}
          palette={palette}
          scale={scale}
          flip={facing < 0}
          frameIndex={frameIndex}
          playing={false}
        />
        <NoticeBubble bubbleRef={bubbleRef} scale={scale} />
      </span>
    </div>
  )
}
