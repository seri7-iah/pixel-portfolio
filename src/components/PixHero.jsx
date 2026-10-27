import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Sprite from './Sprite.jsx'
import { subscribe } from '../lib/ticker.js'
import { PIX_FRAMES, PIX_PALETTE } from '../lib/pixelArt.js'
import {
  clamp,
  seekVelocity,
  snapPx,
  stepMotion,
  walkStep,
} from '../lib/groundMotion.js'
import useIdleAnimation from '../lib/useIdleAnimation.js'

const EDGE = 8
const IDLE_RELEASE_MS = 20000
const WANDER_RATE = 7
const CONTROL_RATE = 12
const WANDER_EASE = 14
const CONTROL_EASE = 34
const STOP_DISTANCE = 1.2
const WALK_SOURCE = 8

// Keys are mapped to directions so WASD and the arrow keys share one path.
const CONTROL_KEYS = new Map([
  ['ArrowLeft', 'left'],
  ['ArrowRight', 'right'],
  ['ArrowUp', 'up'],
  ['ArrowDown', 'down'],
  ['a', 'left'],
  ['d', 'right'],
  ['w', 'up'],
  ['s', 'down'],
  ['A', 'left'],
  ['D', 'right'],
  ['W', 'up'],
  ['S', 'down'],
])

const noop = () => {}

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

// Keep the hint inside the scene when Pix walks to either edge.
function alignHint(hint, x, layerWidth, boxWidth, halfHint) {
  if (!hint) return

  let align = 'center'
  if (halfHint > 0 && x < halfHint) align = 'left'
  else if (halfHint > 0 && x + boxWidth + halfHint > layerWidth) align = 'right'

  if (hint.dataset.align !== align) hint.dataset.align = align
}

// Pix wanders like the other creatures, but can also be taken over with the
// mouse, a tap or the "Play as Pix" button. Position and walk phase live in
// refs and are written from the shared ticker; only mode, facing and the
// current walk frame re-render.
export default function PixHero({
  scale = 4,
  paused = false,
  reducedMotion = false,
  active = true,
  awake = active,
  controlling = false,
  onControllingChange = noop,
  laneMin = 64,
  laneMax = 108,
  startX = 0.2,
  wanderSpeed = 24,
  controlSpeed = 120,
}) {
  const rootRef = useRef(null)
  const hintRef = useRef(null)
  const hintWidthRef = useRef(0)
  const posRef = useRef({ x: 0, y: laneMin, placed: false })
  const planRef = useRef({ mode: 'idle', wait: 900, tx: 0, ty: laneMin })
  const keysRef = useRef(new Set())
  const modeRef = useRef('idle')
  const facingRef = useRef(1)
  const velocityRef = useRef({ vx: 0, vy: 0 })
  const phaseRef = useRef(0)
  const walkFrameRef = useRef(0)

  const [mode, setMode] = useState('idle')
  const [facing, setFacing] = useState(1)
  const [walkFrame, setWalkFrame] = useState(0)

  const size = PIX_FRAMES.idle[0][0].length * scale
  const stride = WALK_SOURCE * scale
  const walking = active && !paused && !reducedMotion && mode === 'walk'

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

  const advanceFrames = useCallback(
    (distance) => {
      if (distance <= 0) return

      const next = walkStep(
        phaseRef.current,
        distance,
        stride,
        PIX_FRAMES.walk.length,
      )
      phaseRef.current = next.phase

      if (next.frame !== walkFrameRef.current) {
        walkFrameRef.current = next.frame
        setWalkFrame(next.frame)
      }
    },
    [stride],
  )

  const draw = useCallback(
    (x, y) => {
      const el = rootRef.current
      const layer = el?.parentElement
      const px = snapPx(x)
      const py = snapPx(y)

      if (el) el.style.transform = `translate3d(${px}px, ${-py}px, 0)`

      if (layer) {
        alignHint(
          hintRef.current,
          px,
          layer.clientWidth,
          size,
          hintWidthRef.current / 2,
        )
      }
    },
    [size],
  )

  const { frame: idleFrame, blinking } = useIdleAnimation({
    enabled: awake && !paused && !reducedMotion && mode === 'idle',
  })

  // A paused, frozen or off-screen Pix never keeps a stale walk pose.
  useEffect(() => {
    if (paused || !active) setMoving(false)
  }, [paused, active, setMoving])

  // Place Pix inside the lane and keep the position valid when the world resizes.
  useLayoutEffect(() => {
    const el = rootRef.current
    const layer = el?.parentElement
    if (!el || !layer) return undefined

    const pos = posRef.current

    const place = () => {
      const maxX = Math.max(EDGE, layer.clientWidth - size - EDGE)

      if (!pos.placed) {
        pos.x = Math.min(maxX, Math.max(EDGE, layer.clientWidth * startX))
        pos.y = randomBetween(laneMin, laneMax)
        pos.placed = true
        planRef.current.wait = randomBetween(600, 2400)
      } else if (pos.x > maxX) {
        pos.x = maxX
      }

      pos.y = clamp(pos.y, laneMin, laneMax)
      if (hintRef.current) hintWidthRef.current = hintRef.current.offsetWidth
      draw(pos.x, pos.y)
    }

    place()

    const observer = new ResizeObserver(place)
    observer.observe(layer)

    return () => observer.disconnect()
  }, [size, startX, laneMin, laneMax, draw])

  useLayoutEffect(() => {
    if (!controlling) return

    const hint = hintRef.current
    if (hint) hintWidthRef.current = hint.offsetWidth

    const layer = rootRef.current?.parentElement
    if (layer) {
      alignHint(
        hint,
        snapPx(posRef.current.x),
        layer.clientWidth,
        size,
        hintWidthRef.current / 2,
      )
    }
  }, [controlling, size])

  // Wandering resumes whenever Pix is not being controlled. Speed eases in and
  // out, and the walk cycle advances from the distance actually travelled.
  useEffect(() => {
    if (paused || reducedMotion || controlling || !active) return undefined

    const el = rootRef.current
    const layer = el?.parentElement
    if (!el || !layer) return undefined

    const pos = posRef.current
    const plan = planRef.current
    const keys = keysRef.current
    const velocity = velocityRef.current

    keys.clear()
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
        wanderSpeed,
        WANDER_EASE,
      )
      const moved = stepMotion(
        pos,
        velocity,
        seek.vx,
        seek.vy,
        delta,
        WANDER_RATE,
        bounds(),
      )

      if (moved > 0.001) {
        setMoving(true)
        advanceFrames(moved)
      }

      draw(pos.x, pos.y)
    })
  }, [
    paused,
    reducedMotion,
    controlling,
    active,
    size,
    wanderSpeed,
    laneMin,
    laneMax,
    draw,
    advanceFrames,
    setMoving,
    face,
  ])

  // Controlled mode. The listeners only exist while Pix is in control, so
  // arrows and WASD behave normally at every other time.
  useEffect(() => {
    if (!controlling || paused || !awake) return undefined

    const el = rootRef.current
    const layer = el?.parentElement
    if (!el || !layer) return undefined

    const pos = posRef.current
    const plan = planRef.current
    const keys = keysRef.current
    const velocity = velocityRef.current

    keys.clear()
    plan.mode = 'idle'
    velocity.vx = 0
    velocity.vy = 0
    setMoving(false)

    let idleElapsed = 0
    let tapTarget = null
    let reducedStepWait = 0

    const bounds = () => ({
      minX: EDGE,
      maxX: Math.max(EDGE, layer.clientWidth - size - EDGE),
      minY: laneMin,
      maxY: laneMax,
    })

    const apply = (x, y) => {
      const limit = bounds()
      pos.x = clamp(x, limit.minX, limit.maxX)
      pos.y = clamp(y, limit.minY, limit.maxY)
    }

    let released = false

    const release = () => {
      if (released) return
      released = true
      keys.clear()
      velocity.vx = 0
      velocity.vy = 0
      setMoving(false)
      onControllingChange(false)
    }

    // Reduced motion gets one short hop per key press instead of a smooth walk.
    const nudge = (direction) => {
      const stepSize = scale <= 3 ? 12 : 16
      let dx = 0
      let dy = 0

      if (direction === 'left') dx = -stepSize
      else if (direction === 'right') dx = stepSize
      else if (direction === 'up') dy = stepSize
      else if (direction === 'down') dy = -stepSize

      apply(pos.x + dx, pos.y + dy)
      if (dx) face(dx > 0 ? 1 : -1)
      setMoving(false)
      idleElapsed = 0
      draw(pos.x, pos.y)
    }

    const onKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isTypingTarget(event.target)) return

      if (event.key === 'Escape') {
        release()
        return
      }

      const direction = CONTROL_KEYS.get(event.key)
      if (!direction) return

      event.preventDefault()
      idleElapsed = 0
      tapTarget = null
      keys.add(direction)

      if (reducedMotion) nudge(direction)
    }

    const onKeyUp = (event) => {
      const direction = CONTROL_KEYS.get(event.key)
      if (!direction) return

      event.preventDefault()
      keys.delete(direction)
    }

    const onBlur = () => keys.clear()

    const onVisibilityChange = () => {
      if (document.hidden) keys.clear()
    }

    const onPointerDown = (event) => {
      if (el.contains(event.target)) return
      if (
        event.target instanceof Element &&
        event.target.closest('[data-pix-control]')
      ) {
        return
      }

      const ground = layer.parentElement?.querySelector('.ground')

      // A touch on the ground walks Pix there; every other click releases him.
      if (event.pointerType !== 'mouse' && ground) {
        const rect = ground.getBoundingClientRect()
        const onGround =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom

        if (onGround) {
          const limit = bounds()
          tapTarget = {
            x: clamp(event.clientX - rect.left, limit.minX, limit.maxX),
            y: clamp(rect.bottom - event.clientY, limit.minY, limit.maxY),
          }
          idleElapsed = 0
          reducedStepWait = 0
          return
        }
      }

      release()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    document.addEventListener('pointerdown', onPointerDown, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)

    const unsubscribe = subscribe((delta) => {
      if (keys.size > 0 || tapTarget) idleElapsed = 0
      else idleElapsed += delta

      if (idleElapsed >= IDLE_RELEASE_MS) {
        release()
        return
      }

      // Reduced motion uses the idle frame and moves in short, spaced steps.
      if (reducedMotion) {
        if (!tapTarget) return

        reducedStepWait -= delta
        if (reducedStepWait > 0) return
        reducedStepWait = 110

        const stepSize = scale <= 3 ? 12 : 16
        const dxTarget = tapTarget.x - pos.x
        const dyTarget = tapTarget.y - pos.y
        const distance = Math.hypot(dxTarget, dyTarget)

        if (distance <= stepSize) {
          apply(tapTarget.x, tapTarget.y)
          tapTarget = null
        } else {
          apply(
            pos.x + (dxTarget / distance) * stepSize,
            pos.y + (dyTarget / distance) * stepSize,
          )
        }

        if (Math.abs(dxTarget) > 0.5) face(dxTarget > 0 ? 1 : -1)
        setMoving(false)
        draw(pos.x, pos.y)
        return
      }

      let targetVx = 0
      let targetVy = 0
      let hasIntent = false

      if (keys.size > 0) {
        let dx = 0
        let dy = 0

        if (keys.has('left')) dx -= 1
        if (keys.has('right')) dx += 1
        if (keys.has('up')) dy += 1
        if (keys.has('down')) dy -= 1

        const normalizer = dx !== 0 && dy !== 0 ? Math.SQRT1_2 : 1
        targetVx = dx * controlSpeed * normalizer
        targetVy = dy * controlSpeed * normalizer
        hasIntent = true
        tapTarget = null
      } else if (tapTarget) {
        const seek = seekVelocity(
          pos.x,
          pos.y,
          tapTarget.x,
          tapTarget.y,
          controlSpeed,
          CONTROL_EASE,
        )

        if (seek.distance <= STOP_DISTANCE) {
          apply(tapTarget.x, tapTarget.y)
          tapTarget = null
          velocity.vx = 0
          velocity.vy = 0
          setMoving(false)
          draw(pos.x, pos.y)
          return
        }

        targetVx = seek.vx
        targetVy = seek.vy
        hasIntent = true
      }

      const beforeX = pos.x
      const moved = stepMotion(
        pos,
        velocity,
        targetVx,
        targetVy,
        delta,
        CONTROL_RATE,
        bounds(),
      )

      if (Math.abs(pos.x - beforeX) > 0.01) {
        face(pos.x > beforeX ? 1 : -1)
      }

      if (moved > 0.001) {
        setMoving(true)
        advanceFrames(moved)
      } else {
        setMoving(false)
      }

      if (!hasIntent && Math.hypot(velocity.vx, velocity.vy) < 1.2) {
        velocity.vx = 0
        velocity.vy = 0
        setMoving(false)
      }

      draw(pos.x, pos.y)
    })

    return () => {
      unsubscribe()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      keys.clear()
      velocity.vx = 0
      velocity.vy = 0
    }
  }, [
    controlling,
    paused,
    reducedMotion,
    awake,
    size,
    scale,
    controlSpeed,
    laneMin,
    laneMax,
    onControllingChange,
    draw,
    advanceFrames,
    setMoving,
    face,
  ])

  const handleClick = (event) => {
    event.stopPropagation()
    if (paused || controlling || !awake) return
    onControllingChange(true)
  }

  const blinkIdle = blinking && !walking
  const frames = walking
    ? PIX_FRAMES.walk
    : blinkIdle
      ? PIX_FRAMES.idleBlink
      : PIX_FRAMES.idle
  const frameIndex = walking ? walkFrame : idleFrame
  const shadowLifted = walking && PIX_FRAMES.lift[walkFrame] === 1

  return (
    <div
      ref={rootRef}
      className="critter critter--pix"
      aria-hidden="true"
      onClick={handleClick}
    >
      <span
        className={`critter__shadow${shadowLifted ? ' critter__shadow--lift' : ''}`}
        aria-hidden="true"
      />
      <span className="critter__body">
        <Sprite
          frames={frames}
          palette={PIX_PALETTE}
          scale={scale}
          flip={facing < 0}
          frameIndex={frameIndex}
          playing={false}
        />
      </span>
      {controlling ? (
        <span ref={hintRef} className="pix-hint" aria-hidden="true">
          YOU&apos;RE IN CONTROL - WASD / ARROWS - ESC TO RELEASE
          <span className="pix-hint__touch">TAP THE GROUND TO WALK</span>
        </span>
      ) : null}
    </div>
  )
}
