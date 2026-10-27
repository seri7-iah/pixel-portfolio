import { useEffect, useRef, useState } from 'react'
import { subscribe } from './ticker.js'

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

// Idle breathing plus an occasional slow blink. The hook only subscribes while
// the creature is awake and standing still, so paused, reduced-motion and
// off-screen creatures cost nothing and stay on the first idle frame.
export default function useIdleAnimation({
  enabled,
  frameCount = 2,
  breathMs = 900,
  blinkMin = 4200,
  blinkMax = 7000,
  blinkMs = 140,
}) {
  const [frame, setFrame] = useState(0)
  const [blinking, setBlinking] = useState(false)
  const frameRef = useRef(0)
  const blinkRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      if (frameRef.current !== 0) {
        frameRef.current = 0
        setFrame(0)
      }

      if (blinkRef.current) {
        blinkRef.current = false
        setBlinking(false)
      }

      return undefined
    }

    let breath = 0
    let wait = randomBetween(blinkMin, blinkMax)
    let closed = 0

    return subscribe((delta) => {
      breath += delta
      if (breath >= breathMs) {
        breath %= breathMs
        const next = (frameRef.current + 1) % frameCount
        frameRef.current = next
        setFrame(next)
      }

      if (closed > 0) {
        closed -= delta
        if (closed <= 0 && blinkRef.current) {
          blinkRef.current = false
          setBlinking(false)
        }
        return
      }

      wait -= delta
      if (wait <= 0) {
        blinkRef.current = true
        setBlinking(true)
        closed = blinkMs
        wait = randomBetween(blinkMin, blinkMax)
      }
    })
  }, [enabled, frameCount, breathMs, blinkMin, blinkMax, blinkMs])

  return { frame, blinking }
}
