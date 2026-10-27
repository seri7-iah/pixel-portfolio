import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import Sprite from './Sprite.jsx'
import { subscribe } from '../lib/ticker.js'
import { clamp, snapPx } from '../lib/groundMotion.js'
import useIdleAnimation from '../lib/useIdleAnimation.js'

const EDGE = 8
const TAU = Math.PI * 2

// A floating creature (Ashwisp, Gloamer, Starmote). It keeps the same wrapper
// and shadow as a ground Critter, but the body lifts off the ground and bobs on
// whole pixels instead of running a walk cycle. A slow horizontal sway supplies
// the facing direction; creatures with drift 0 hold their last facing.
// Off-screen, paused and reduced-motion states all stop the ticker and hold a
// single hover frame.
export default function FloatCritter({
  name,
  palette,
  idleFrames,
  idleBlinkFrames = null,
  scale = 4,
  laneMin = 64,
  laneMax = 108,
  startX = 0.5,
  startY = 0.5,
  hover = 8,
  bob = 4,
  bobMs = 1800,
  drift = 0,
  driftMs = 9000,
  phase = 0,
  breathMs = 900,
  blinkMin = 4200,
  blinkMax = 7000,
  active = true,
}) {
  const ref = useRef(null)
  const bodyRef = useRef(null)
  const baseRef = useRef({ x: 0, y: laneMin, placed: false })
  const maxXRef = useRef(EDGE)
  const swayRef = useRef(phase * TAU)
  const facingRef = useRef(1)
  const [facing, setFacing] = useState(1)

  const size = idleFrames[0][0].length * scale

  const { frame, blinking } = useIdleAnimation({
    enabled: active,
    frameCount: idleFrames.length,
    breathMs,
    blinkMin,
    blinkMax,
  })

  const draw = useCallback((x, y) => {
    const el = ref.current
    if (el) {
      el.style.transform = `translate3d(${snapPx(x)}px, ${-snapPx(y)}px, 0)`
    }
  }, [])

  const setLift = useCallback((lift) => {
    const el = bodyRef.current
    if (el) el.style.transform = `translateY(${-snapPx(lift)}px)`
  }, [])

  // Place the creature and keep it inside its section when the world resizes.
  useLayoutEffect(() => {
    const el = ref.current
    const layer = el?.parentElement
    if (!el || !layer) return undefined

    const base = baseRef.current

    const place = () => {
      const maxX = Math.max(EDGE, layer.clientWidth - size - EDGE)
      maxXRef.current = maxX

      if (!base.placed) {
        base.x = Math.min(maxX, Math.max(EDGE, layer.clientWidth * startX))
        base.y = laneMin + (laneMax - laneMin) * startY
        base.placed = true
      } else if (base.x > maxX) {
        base.x = maxX
      }

      base.y = clamp(base.y, laneMin, laneMax)
      draw(
        clamp(base.x + Math.sin(swayRef.current) * drift, EDGE, maxX),
        base.y,
      )
    }

    place()
    setLift(hover)

    const observer = new ResizeObserver(place)
    observer.observe(layer)
    return () => observer.disconnect()
  }, [size, startX, startY, laneMin, laneMax, hover, drift, draw, setLift])

  useEffect(() => {
    if (!active) {
      setLift(hover)
      return undefined
    }

    const base = baseRef.current
    let elapsed = 0
    let lastX = clamp(
      base.x + Math.sin(swayRef.current) * drift,
      EDGE,
      maxXRef.current,
    )

    return subscribe((delta) => {
      elapsed = (elapsed + delta) % bobMs
      swayRef.current = (swayRef.current + (delta / driftMs) * TAU) % TAU

      const bobOffset = Math.sin((elapsed / bobMs) * TAU) * bob
      setLift(hover + bobOffset)

      // A drift of 0 means the creature stays put; the placement pass already
      // wrote its position, so only the bob needs updating each tick.
      if (drift <= 0) return

      const x = clamp(
        base.x + Math.sin(swayRef.current) * drift,
        EDGE,
        maxXRef.current,
      )

      if (Math.abs(x - lastX) > 0.5) {
        const direction = x > lastX ? 1 : -1
        if (direction !== facingRef.current) {
          facingRef.current = direction
          setFacing(direction)
        }
        lastX = x
      }

      draw(x, base.y)
    })
  }, [active, hover, bob, bobMs, drift, driftMs, draw, setLift])

  const blinkIdle = blinking && idleBlinkFrames
  const frames = blinkIdle ? idleBlinkFrames : idleFrames

  return (
    <div
      ref={ref}
      className={`float-critter float-critter--${name}`}
      aria-hidden="true"
    >
      <span
        className="critter__shadow critter__shadow--float"
        aria-hidden="true"
      />
      <span ref={bodyRef} className="float-critter__body">
        <Sprite
          frames={frames}
          palette={palette}
          scale={scale}
          flip={facing < 0}
          frameIndex={frame}
          playing={false}
        />
      </span>
    </div>
  )
}
