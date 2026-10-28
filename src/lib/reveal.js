import { useEffect, useState } from 'react'

// Shared timing for the 8-bit reveal. The CSS block mirrors these numbers;
// DialogueBox needs them in JS so its typewriter starts after the box opens.
export const REVEAL_BASE = 320
export const REVEAL_STEP = 120
export const REVEAL_TOTAL = 1700

// One-shot section reveal: flips `is-revealed` the first time about 30% of a
// section is on screen. A section taller than the viewport never reaches 30%,
// so the threshold is lowered to whatever 90% of the viewport can cover.
// `settled` drops `is-revealing` (and its will-change) after the reveal ends.
// Reduced motion is handled in CSS: every hidden state and animation lives
// inside `@media (prefers-reduced-motion: no-preference)`.
export function useReveal(ref) {
  const [revealed, setRevealed] = useState(false)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (revealed) return undefined

    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return undefined
    }

    let observer
    let resizeTimer

    const connect = () => {
      if (observer) observer.disconnect()

      const reachable = (window.innerHeight * 0.9) / (el.offsetHeight || 1)
      const threshold = Math.min(0.3, Math.max(0.05, reachable))

      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return
          observer.disconnect()
          setRevealed(true)
        },
        { threshold },
      )

      observer.observe(el)
    }

    connect()

    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(connect, 150)
    }

    window.addEventListener('resize', onResize)

    return () => {
      if (observer) observer.disconnect()
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
    }
  }, [ref, revealed])

  useEffect(() => {
    if (!revealed || settled) return undefined
    const timer = window.setTimeout(() => setSettled(true), REVEAL_TOTAL)
    return () => window.clearTimeout(timer)
  }, [revealed, settled])

  return { revealed, settled }
}
