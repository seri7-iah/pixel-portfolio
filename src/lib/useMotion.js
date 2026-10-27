import { useEffect, useState } from 'react'

const MOBILE_QUERY = '(max-width: 600px)'
const REDUCE_QUERY = '(prefers-reduced-motion: reduce)'

function mediaQuery(query) {
  if (typeof window === 'undefined' || !window.matchMedia) return null
  return window.matchMedia(query)
}

const mobileQuery = mediaQuery(MOBILE_QUERY)
const reduceQuery = mediaQuery(REDUCE_QUERY)

// Sprites are 4x on desktop and 3x on phones (DESIGN.md).
export function useSpriteScale() {
  const [scale, setScale] = useState(() =>
    mobileQuery && mobileQuery.matches ? 3 : 4,
  )

  useEffect(() => {
    if (!mobileQuery) return undefined

    const onChange = (event) => setScale(event.matches ? 3 : 4)
    mobileQuery.addEventListener('change', onChange)
    return () => mobileQuery.removeEventListener('change', onChange)
  }, [])

  return scale
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    Boolean(reduceQuery && reduceQuery.matches),
  )

  useEffect(() => {
    if (!reduceQuery) return undefined

    const onChange = (event) => setReduced(event.matches)
    reduceQuery.addEventListener('change', onChange)
    return () => reduceQuery.removeEventListener('change', onChange)
  }, [])

  return reduced
}
