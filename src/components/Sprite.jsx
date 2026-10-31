import { useEffect, useRef, useState } from 'react'
import { subscribe } from '../lib/ticker.js'
import { getLitSprite, hasEmissive, litPadding } from '../lib/spriteLight.js'

// The emissive pulse runs at about 2 fps from the shared ticker. Only the
// cached glow tone changes; no pixel pass is recomputed.
const PULSE_STEP = 500

// Draws a text-grid sprite on a tiny canvas. Frames can either swap at a fixed
// rate or be supplied by the caller (`frameIndex`), which is how distance-driven
// walk cycles keep the feet in time with the ground. "." is transparent, every
// other character is looked up in `palette`.
//
// `light` + `world` opt the sprite into the baked lighting pass from
// spriteLight.js. The lit canvas is 1 source pixel bigger on every side; a
// wrapper keeps the original footprint so lanes and feet do not move. Sprites
// without those props (WishStar) keep the original 1:1 backing store scaled up
// by CSS.
export default function Sprite({
  frames,
  palette,
  fps = 6,
  playing = true,
  scale = 4,
  flip = false,
  frameIndex = null,
  className = '',
  light = null,
  world = null,
  pulse = false,
}) {
  const canvasRef = useRef(null)
  const glowRef = useRef(0)
  const accentRef = useRef(null)
  const [timerFrame, setTimerFrame] = useState(0)
  // Phase 3e-2: Home's rim light changes with the Night/Day theme. The event
  // drops the cached accent and re-bakes every lit sprite once per switch.
  const [themeTick, setThemeTick] = useState(0)
  const controlled = typeof frameIndex === 'number'

  const rawIndex = controlled ? frameIndex : playing ? timerFrame : 0
  const safeIndex = ((rawIndex % frames.length) + frames.length) % frames.length
  const grid = frames[safeIndex]
  const rows = grid.length
  const cols = grid[0].length

  const lit = Boolean(light && world)
  const emissive = lit && hasEmissive(light)
  const pad = lit ? litPadding() : 0
  const outCols = cols + pad * 2
  const outRows = rows + pad * 2
  // Unlit sprites keep a 1:1 backing store and are scaled up by CSS, exactly as
  // before the lighting pass. Lit sprites are baked at CSS scale, so their
  // backing store already matches their display size.
  const pixelWidth = lit ? outCols * scale : cols
  const pixelHeight = lit ? outRows * scale : rows
  const cssWidth = lit ? pixelWidth : cols * scale
  const cssHeight = lit ? pixelHeight : rows * scale

  // Reads the world accent from the existing section tokens: Home uses its
  // sprite rim (moonlight blue at Night, sun yellow at Day), the other worlds
  // use their own --accent.
  useEffect(() => {
    const onTheme = () => {
      accentRef.current = null
      setThemeTick((value) => value + 1)
    }

    window.addEventListener('pop:theme', onTheme)
    return () => window.removeEventListener('pop:theme', onTheme)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    if (lit) {
      if (!accentRef.current) {
        const scene = canvas.closest('.scene')
        if (scene && typeof window !== 'undefined') {
          const styles = window.getComputedStyle(scene)
          const name = world === 'home' ? '--sprite-rim' : '--accent'
          let accent = (styles.getPropertyValue(name) || '').trim()
          if (!accent && world === 'home') {
            accent = (styles.getPropertyValue('--line') || '').trim()
          }
          accentRef.current = accent || null
        }
      }

      const baked = getLitSprite(grid, palette, {
        scale,
        world,
        spriteId: light,
        accent: accentRef.current,
        glow: glowRef.current,
      })

      if (baked) {
        context.imageSmoothingEnabled = false
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(baked, 0, 0)

        // Bake the second glow tone now, so the first pulse tick is a draw.
        // Static sprites (the notice bubble) never swap, so skip that work.
        if (emissive && pulse) {
          getLitSprite(grid, palette, {
            scale,
            world,
            spriteId: light,
            accent: accentRef.current,
            glow: 1,
          })
        }
        return
      }
    }

    context.clearRect(0, 0, cols, rows)

    for (let y = 0; y < rows; y += 1) {
      const row = grid[y] ?? ''

      for (let x = 0; x < row.length; x += 1) {
        const color = palette[row[x]]
        if (!color) continue

        context.fillStyle = color
        context.fillRect(x, y, 1, 1)
      }
    }
  }, [grid, rows, cols, palette, scale, lit, light, world, emissive, pulse, themeTick])

  // Emissive pulse: swaps two pre-baked glow tones every 500ms. Paused
  // creatures and reduced motion fall back to the static first tone.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !lit || !emissive) return undefined

    const drawTone = (glow) => {
      const baked = getLitSprite(grid, palette, {
        scale,
        world,
        spriteId: light,
        accent: accentRef.current,
        glow,
      })
      if (!baked) return

      const context = canvas.getContext('2d')
      if (!context) return

      context.imageSmoothingEnabled = false
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(baked, 0, 0)
    }

    if (!pulse) {
      if (glowRef.current !== 0) {
        glowRef.current = 0
        drawTone(0)
      }
      return undefined
    }

    let elapsed = 0

    return subscribe((delta) => {
      elapsed += delta
      if (elapsed < PULSE_STEP) return

      elapsed %= PULSE_STEP
      glowRef.current = glowRef.current === 0 ? 1 : 0
      drawTone(glowRef.current)
    })
  }, [lit, emissive, pulse, grid, palette, scale, world, light])

  useEffect(() => {
    if (controlled || !playing || frames.length < 2) return undefined

    let elapsed = 0
    const interval = 1000 / fps

    return subscribe((delta) => {
      elapsed += delta
      if (elapsed < interval) return

      elapsed %= interval
      setTimerFrame((index) => (index + 1) % frames.length)
    })
  }, [controlled, playing, fps, frames])

  const canvas = (
    <canvas
      ref={canvasRef}
      className={['sprite', flip ? 'sprite--flip' : '', className]
        .filter(Boolean)
        .join(' ')}
      width={pixelWidth}
      height={pixelHeight}
      style={
        lit
          ? {
              position: 'absolute',
              top: -scale,
              left: -scale,
              width: pixelWidth,
              height: pixelHeight,
            }
          : { width: cssWidth, height: cssHeight }
      }
      aria-hidden="true"
    />
  )

  if (!lit) return canvas

  // The wrapper keeps the old sprite footprint exactly, so the extra outline
  // padding can never shift a creature's lane, shadow or centre.
  return (
    <span className="sprite-box" style={{ width: cols * scale, height: rows * scale }}>
      {canvas}
    </span>
  )
}
