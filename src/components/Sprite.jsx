import { useEffect, useRef, useState } from 'react'
import { subscribe } from '../lib/ticker.js'

// Draws a text-grid sprite on a tiny canvas. Frames can either swap at a fixed
// rate or be supplied by the caller (`frameIndex`), which is how distance-driven
// walk cycles keep the feet in time with the ground. "." is transparent, every
// other character is looked up in `palette`.
export default function Sprite({
  frames,
  palette,
  fps = 6,
  playing = true,
  scale = 4,
  flip = false,
  frameIndex = null,
  className = '',
}) {
  const canvasRef = useRef(null)
  const [timerFrame, setTimerFrame] = useState(0)
  const controlled = typeof frameIndex === 'number'

  const rawIndex = controlled ? frameIndex : playing ? timerFrame : 0
  const safeIndex = ((rawIndex % frames.length) + frames.length) % frames.length
  const grid = frames[safeIndex]
  const rows = grid.length
  const cols = grid[0].length

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

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
  }, [grid, rows, cols, palette])

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

  return (
    <canvas
      ref={canvasRef}
      className={['sprite', flip ? 'sprite--flip' : '', className]
        .filter(Boolean)
        .join(' ')}
      width={cols}
      height={rows}
      style={{ width: cols * scale, height: rows * scale }}
      aria-hidden="true"
    />
  )
}
