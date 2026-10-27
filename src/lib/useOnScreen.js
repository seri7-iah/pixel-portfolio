import { useEffect, useState } from 'react'

// Watches one element and reports whether any part of it is on screen.
// Used by creature zones and by the animated scenery layers.
export default function useOnScreen(ref) {
  const [onScreen, setOnScreen] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return onScreen
}
