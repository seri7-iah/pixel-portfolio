import { useEffect, useRef } from 'react'
import { createParticleField } from '../lib/particles.js'

// A section-sized canvas of hard 3px/4px specks. It is decorative, sits behind
// the scenery, text and creatures, and only runs while its section is on
// screen and awake.
export default function ParticleField({
  kind,
  scale = 4,
  active = true,
  className = '',
}) {
  const canvasRef = useRef(null)
  const fieldRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const phone = scale <= 3
    const field = createParticleField(canvas, {
      kind,
      unit: phone ? 3 : 4,
      max: phone ? 30 : 60,
    })

    fieldRef.current = field

    return () => {
      field.destroy()
      fieldRef.current = null
    }
  }, [kind, scale])

  useEffect(() => {
    const field = fieldRef.current
    if (!field) return

    if (active) field.start()
    else field.stop()
  }, [active, kind, scale])

  return (
    <canvas
      ref={canvasRef}
      className={['particles', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  )
}
