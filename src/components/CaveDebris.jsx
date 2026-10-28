import { useEffect, useRef } from 'react'
import { createDebrisField } from '../lib/debris.js'

// One decorative canvas in the Projects cave. Chips only spawn while the cave
// is on screen, awake and scrolling briskly. Phones get 3px chips and a cap of
// three; desktop gets 4px chips and a cap of six.
export default function CaveDebris({ scale = 4, active = true }) {
  const canvasRef = useRef(null)
  const fieldRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const phone = scale <= 3
    const field = createDebrisField(canvas, {
      unit: phone ? 3 : 4,
      max: phone ? 3 : 6,
    })

    fieldRef.current = field

    return () => {
      field.destroy()
      fieldRef.current = null
    }
  }, [scale])

  useEffect(() => {
    const field = fieldRef.current
    if (!field) return

    if (active) field.start()
    else field.stop()
  }, [active, scale])

  return <canvas ref={canvasRef} className="cave-debris" aria-hidden="true" />
}
