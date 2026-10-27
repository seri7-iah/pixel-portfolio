import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Sprite from './Sprite.jsx'
import { subscribe } from '../lib/ticker.js'
import { PIX_FRAMES, PIX_PALETTE, PIX_VIEW_FRAMES } from '../lib/pixelArt.js'
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

// The player can face eight directions. Each pose names a frame set and whether
// the canvas needs mirroring; the front and back views never flip.
const CONTROL_POSES = {
  up: { view: 'back', flip: 1 },
  down: { view: 'front', flip: 1 },
  left: { view: 'side', flip: -1 },
  right: { view: 'side', flip: 1 },
  upLeft: { view: 'angleBack', flip: -1 },
  upRight: { view: 'angleBack', flip: 1 },
  downLeft: { view: 'angleFront', flip: -1 },
  downRight: { view: 'angleFront', flip: 1 },
}

// 0 = right, then counter-clockwise on screen.
const VECTOR_DIRECTIONS = [
  'right',
  'upRight',
  'up',
  'upLeft',
  'left',
  'downLeft',
  'down',
  'downRight',
]

// Opposite keys on either axis cancel out. Returning null leaves the previous
// facing in place instead of flickering between two views.
function directionFromKeys(keys) {
  const left = keys.has('left')
  const right = keys.has('right')
  const up = keys.has('up')
  const down = keys.has('down')

  if ((left && right) || (up && down)) return null
  if (up) return left ? 'upLeft' : right ? 'upRight' : 'up'
  if (down) return left ? 'downLeft' : right ? 'downRight' : 'down'
  if (left) return 'left'
  if (right) return 'right'
  return null
}

// Held keys as one movement vector: x to the right, y away from the viewer.
// Diagonals are scaled by SQRT1_2 so they cover the same distance per second as
// a straight line instead of being about 41% faster.
function movementFromKeys(keys) {
  let dx = 0
  let dy = 0

  if (keys.has('left')) dx -= 1
  if (keys.has('right')) dx += 1
  if (keys.has('up')) dy += 1
  if (keys.has('down')) dy -= 1

  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2
    dy *= Math.SQRT1_2
  }

  return { dx, dy }
}

// Nearest of the eight directions to a tap. Screen y grows downwards, so the
// angle is negated before it is rounded into a 45-degree sector.
function directionFromVector(dx, dy) {
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return null
  const sector = Math.round(Math.atan2(-dy, dx) / (Math.PI / 4))
  return VECTOR_DIRECTIONS[(sector + 8) % 8]
}

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
// refs and are written from the shared ticker; only mode, side facing, the
// control pose and the current walk frame re-render.
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
  const walkCountRef = useRef(PIX_FRAMES.walk.length)

  const [mode, setMode] = useState('idle')
  const [facing, setFacing] = useState(1)
  const [controlPose, setControlPose] = useState({ view: 'side', flip: 1 })
  const [walkFrame, setWalkFrame] = useState(0)

  const size = PIX_FRAMES.idle[0][0].length * scale
  const stride = WALK_SOURCE * scale
  const walking = active && !paused && !reducedMotion && mode === 'walk'
  const pose = controlling
    ? controlPose
    : { view: 'side', flip: facing }
  const viewFrames = PIX_VIEW_FRAMES[pose.view]

  useLayoutEffect(() => {
    walkCountRef.current = viewFrames.walk.length
  }, [viewFrames])

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
        walkCountRef.current,
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
    frameCount: viewFrames.idle.length,
  })

  // Control always starts and ends on the side view. Resetting the stored pose
  // on release means the next takeover never flashes the old front/back view.
  useEffect(() => {
    const side = { view: 'side', flip: facingRef.current }
    setControlPose((current) =>
      current.view === side.view && current.flip === side.flip ? current : side,
    )
  }, [controlling])

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

    // Reduced motion gets one short step per key press instead of a smooth
    // walk. The step follows the same 2D lane vector as the normal path, so a
    // diagonal key pair moves diagonally and is not faster than a straight one.
    const nudge = (dx, dy) => {
      const stepSize = scale <= 3 ? 12 : 16
      apply(pos.x + dx * stepSize, pos.y + dy * stepSize)
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

      const controlDirection = directionFromKeys(keys)
      if (controlDirection) setControlPose(CONTROL_POSES[controlDirection])

      if (reducedMotion) {
        const { dx, dy } = movementFromKeys(keys)
        if (dx !== 0 || dy !== 0) nudge(dx, dy)
      }
    }

    const onKeyUp = (event) => {
      const direction = CONTROL_KEYS.get(event.key)
      if (!direction) return

      event.preventDefault()
      keys.delete(direction)

      // Releasing one key can reveal a new diagonal. Releasing everything
      // keeps the last facing.
      const controlDirection = directionFromKeys(keys)
      if (controlDirection) setControlPose(CONTROL_POSES[controlDirection])
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
          const tapX = clamp(event.clientX - rect.left, limit.minX, limit.maxX)
          const tapY = rect.bottom - event.clientY

          // Facing comes from the full tap vector, including its height, and
          // is measured from Pix's centre rather than the canvas corner. The
          // lane measures height upwards, so the y term is flipped to screen
          // coordinates before it reaches the direction helper.
          const controlDirection = directionFromVector(
            tapX - (pos.x + size / 2),
            pos.y - tapY,
          )
          if (controlDirection) setControlPose(CONTROL_POSES[controlDirection])

          tapTarget = {
            x: tapX,
            y: clamp(tapY, limit.minY, limit.maxY),
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

      // Vertical movement is real depth inside the lane: W walks up/away and S
      // walks down/towards the viewer, so both axes can move at once.
      if (keys.size > 0) {
        const { dx, dy } = movementFromKeys(keys)

        targetVx = dx * controlSpeed
        targetVy = dy * controlSpeed
        hasIntent = dx !== 0 || dy !== 0
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

  const blinkIdle = blinking && !walking && viewFrames.idleBlink
  const frames = walking
    ? viewFrames.walk
    : blinkIdle
      ? viewFrames.idleBlink
      : viewFrames.idle
  const frameIndex = walking ? walkFrame : idleFrame
  const shadowLifted =
    walking && viewFrames.lift[walkFrame % viewFrames.lift.length] === 1

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
          flip={pose.flip < 0}
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
