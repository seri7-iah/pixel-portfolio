import { useEffect, useRef, useState } from 'react'
import { subscribe } from '../lib/ticker.js'
import { usePrefersReducedMotion } from '../lib/useMotion.js'

// Phase 3k-A: a straight-on pair of pixel sunglasses, 32 x 6, with no arms and
// no turning. 'K' is the black frame, 'W' is the white glint and '.' is
// transparent. Every row is exactly 32 cells and the art is drawn here in code.
// Nothing is loaded from disk or the network.
const FRONT = [
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', // row 0 - solid top rim
  '.KKKKKKKWKKKKK....KKKKKKKWKKKKK.', // row 1
  '.KKKKKKWKKKKKK....KKKKKKWKKKKKK.', // row 2
  '..KKKKWKKKKKK......KKKKWKKKKKK..', // row 3
  '....KKKKKKK..........KKKKKKK....', // row 4
  '......KKKK.............KKKK.....', // row 5
]

const VIEW_W = 32
const VIEW_H = 6
const GLINT_CLIP = 'shades-lens'
// Centre of the top rim row, as a fraction of one cell, for the spark origins.
const RIM_Y = 0.5

function buildArt(rows) {
  const black = []
  const white = []
  const lens = []
  rows.forEach((row, y) => {
    row.split('').forEach((cell, x) => {
      if (cell === '.') return
      if (cell === 'W') white.push([x, y])
      else black.push([x, y])
      // The glint sweeps the lenses only, never the solid top rim.
      if (y >= 1) lens.push([x, y])
    })
  })
  return { black, white, lens }
}

const ART = buildArt(FRONT)

function cellsToRects(cells) {
  return cells.map(([x, y]) => (
    <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
  ))
}

const DROP_STEPS = 6
const DROP_STEP_MS = 46
const DROP_BOUNCE_MS = 60
const DROP_SETTLE_MS = 80
const DROP_END_MS = DROP_STEPS * DROP_STEP_MS + DROP_BOUNCE_MS + DROP_SETTLE_MS

const POP_MS = 240
const GLINT_STEPS = 14
const GLINT_STEP_MS = 43
const GLINT_SPAN = 3
const GLINT_X0 = -6
const GLINT_END_MS = GLINT_STEPS * GLINT_STEP_MS

// An 8-frame nod moving one whole pixel per frame. The fourth frame is the
// small extra dip at the bottom; the last frame returns to rest.
const NOD_FRAMES = [1, 2, 3, 4, 3, 2, 1, 0]
const NOD_FRAME_MS = 40
const NOD_MS = NOD_FRAMES.length * NOD_FRAME_MS

// A fixed pool shared by every particle. Nothing is created or deleted while
// the loop runs, and at most this many can be alive at once.
export const PARTICLE_POOL = 12
const BURST_MIN = 8
const BURST_MAX = 10
const PARTICLE_COLORS = ['#f4ecd8', '#ffb347', 'var(--accent)']
const PIXEL_SHAPES = ['dot', 'dot', 'block', 'spark']

const wait = (min, max) => min + Math.random() * (max - min)
const randomOf = (list) => list[Math.floor(Math.random() * list.length)]

export default function Sunglasses({ worn = true, ready = true }) {
  const reduced = usePrefersReducedMotion()
  const layerRef = useRef(null)
  const moveRef = useRef(null)
  const glintRef = useRef(null)
  const offsetRef = useRef({ x: 0, y: 0 })
  const pendingDropRef = useRef(true)

  const hasObserver = typeof IntersectionObserver !== 'undefined'
  const [entered, setEntered] = useState(hasObserver ? false : true)
  const [onScreen, setOnScreen] = useState(hasObserver ? false : true)

  // The drop starts the first time the frame is properly in view. The observer
  // stays disconnected while the Press Start overlay is up, so the moment is
  // not spent behind it.
  useEffect(() => {
    if (reduced || !ready) return undefined
    const node = layerRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return undefined

    const target = node.closest('.portrait__frame') || node
    const observer = new IntersectionObserver(
      (entries) => {
        const last = entries[entries.length - 1]
        if (!last) return
        if (last.isIntersecting) setEntered(true)
        setOnScreen(last.isIntersecting)
      },
      { threshold: 0.35 },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [ready, reduced])

  useEffect(() => {
    const layer = layerRef.current
    const move = moveRef.current
    const glint = glintRef.current
    if (!layer || !move) return undefined

    const frame = layer.closest('.portrait__frame')
    const portrait = layer.closest('.portrait')
    const fx = portrait ? portrait.querySelector('.portrait__fx') : null
    const poolNodes = fx ? Array.from(fx.children) : []
    const pool = poolNodes.map((_, index) => ({ index, alive: false }))

    let hasFx = false
    let metrics = {
      frameTop: 0,
      frameHeight: 0,
      baseTop: 0,
      baseLeft: 0,
      cell: 4,
      width: 0,
      height: 0,
    }
    // Spark origins at the outer ends of the top rim (row 0): one at the
    // far-left pixel and one at the far-right pixel.
    const geom = { leftX: 0, leftY: 0, rightX: 0, rightY: 0 }
    const bounds = { minX: 3, maxX: 4, minY: 3, maxY: 4 }

    const measure = () => {
      if (!fx) {
        hasFx = false
        return
      }
      const layerRect = layer.getBoundingClientRect()
      const fxRect = fx.getBoundingClientRect()
      const frameRect = frame ? frame.getBoundingClientRect() : null
      hasFx = fxRect.width > 0 && fxRect.height > 0 && Boolean(frameRect)

      metrics = {
        frameTop: frameRect ? frameRect.top - fxRect.top : 0,
        frameHeight: frameRect ? frameRect.height : 0,
        baseLeft: layerRect.left - fxRect.left,
        baseTop: layerRect.top - fxRect.top,
        cell: layerRect.width / VIEW_W,
        width: layerRect.width,
        height: layerRect.height,
      }

      bounds.minX = 3
      bounds.maxX = hasFx ? Math.max(4, fxRect.width - 3) : 4
      bounds.minY = 3
      bounds.maxY = hasFx
        ? Math.max(4, metrics.frameTop + metrics.frameHeight - 3)
        : 4

      const rimY = metrics.baseTop + metrics.cell * RIM_Y
      geom.leftX = metrics.baseLeft
      geom.leftY = rimY
      geom.rightX = metrics.baseLeft + metrics.width
      geom.rightY = rimY
    }

    const write = (x, y) => {
      const last = offsetRef.current
      if (last.x === x && last.y === y) return
      last.x = x
      last.y = y
      move.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    const hideGlint = () => {
      if (!glint) return
      glint.setAttribute('visibility', 'hidden')
      glint.setAttribute('transform', 'translate(0 0)')
    }

    const hideParticles = () => {
      pool.forEach((particle) => {
        particle.alive = false
        const node = poolNodes[particle.index]
        if (node) node.style.visibility = 'hidden'
      })
    }

    hideParticles()

    // No drop, no nod, no glint and no particles: the glasses are simply shown
    // still, and the toggle swaps between two still states.
    if (reduced) {
      write(0, 0)
      hideGlint()
      layer.style.visibility = worn ? 'visible' : 'hidden'
      return undefined
    }

    // Before the first reveal the layer stays hidden so nobody sees the resting
    // pose first. Off screen it holds still and stops ticking.
    if (!entered || !onScreen) {
      write(0, 0)
      hideGlint()
      layer.style.visibility = entered && worn ? 'visible' : 'hidden'
      return undefined
    }

    measure()
    const startY = metrics.frameHeight
      ? -Math.round(metrics.frameHeight + 32)
      : -320

    let phase = !worn ? 'pop' : pendingDropRef.current ? 'drop' : 'idle'
    if (phase === 'pop') pendingDropRef.current = true

    layer.style.visibility = 'visible'

    let elapsed = 0
    let clock = 0
    let unsubscribe = null
    const stop = () => {
      if (!unsubscribe) return
      unsubscribe()
      unsubscribe = null
    }

    // A window resize re-measures the layer, so the spark origins stay on the
    // rim ends after the frame changes size. No layout read happens per frame.
    const onResize = () => measure()
    window.addEventListener('resize', onResize)

    // Particle helpers. Transforms are whole pixels and visibility is a hard
    // on/off; no opacity ramp, blur or layout write ever runs per frame.
    let reuseCursor = 0
    const place = (particle) => {
      const node = poolNodes[particle.index]
      if (!node) return
      node.style.transform = `translate3d(${Math.round(particle.x)}px, ${Math.round(
        particle.y,
      )}px, 0)`
    }
    const paint = (particle) => {
      const node = poolNodes[particle.index]
      if (!node) return
      const size = particle.shape === 'block' ? 4 : 2
      node.style.width = `${size}px`
      node.style.height = `${size}px`
      node.style.background = particle.color
      node.style.boxShadow =
        particle.shape === 'spark'
          ? `-2px 0 0 ${particle.color}, 2px 0 0 ${particle.color}, 0 -2px 0 ${particle.color}, 0 2px 0 ${particle.color}`
          : 'none'
      node.style.visibility = 'visible'
      place(particle)
    }
    const acquire = () => {
      for (const particle of pool) {
        if (!particle.alive) return particle
      }
      const particle = pool[reuseCursor % pool.length]
      reuseCursor += 1
      return particle
    }
    // Side sparkles leave the outer ends of the top rim; the two nod sparkles
    // leave the same ends.
    const spawn = ({ side: wantedSide, burst = false, sparkle = false }) => {
      if (!hasFx || !pool.length) return
      const particle = acquire()
      if (!particle) return
      const side = wantedSide || (Math.random() < 0.5 ? -1 : 1)
      const fromLeft = side < 0

      particle.alive = true
      particle.sparkle = sparkle
      particle.x = fromLeft ? geom.leftX : geom.rightX
      particle.y = (fromLeft ? geom.leftY : geom.rightY) + wait(-2, 2)
      particle.shape = sparkle
        ? 'spark'
        : burst
          ? randomOf(['dot', 'block', 'spark', 'block'])
          : randomOf(PIXEL_SHAPES)
      particle.color = sparkle
        ? randomOf(['#f4ecd8', 'var(--accent)'])
        : randomOf(PARTICLE_COLORS)

      if (sparkle) {
        particle.vx = side * 10
        particle.vy = -12
        particle.gravity = 0
        particle.maxLife = 280
      } else if (burst) {
        particle.vx = side * wait(45, 110)
        particle.vy = wait(-95, -15)
        particle.gravity = 280
        particle.maxLife = wait(800, 1100)
      } else {
        particle.vx = side * wait(18, 52)
        particle.vy = wait(-48, -16)
        particle.gravity = 30
        particle.maxLife = 700
      }

      particle.life = particle.maxLife
      particle.shrunk = false
      paint(particle)
    }
    const burst = () => {
      if (!hasFx) return
      const count = BURST_MIN + Math.floor(Math.random() * (BURST_MAX - BURST_MIN + 1))
      for (let index = 0; index < count; index += 1) {
        spawn({ side: index % 2 === 0 ? -1 : 1, burst: true })
      }
    }
    const updateParticles = (dt) => {
      for (const particle of pool) {
        if (!particle.alive) continue
        particle.life -= dt
        if (particle.life <= 0) {
          particle.alive = false
          const node = poolNodes[particle.index]
          if (node) node.style.visibility = 'hidden'
          continue
        }

        particle.vy += particle.gravity * dt
        particle.x += particle.vx * dt
        particle.y += particle.vy * dt

        if (particle.x < bounds.minX) {
          particle.x = bounds.minX
          particle.vx = Math.abs(particle.vx) * 0.3
        } else if (particle.x > bounds.maxX) {
          particle.x = bounds.maxX
          particle.vx = -Math.abs(particle.vx) * 0.3
        }
        if (particle.y < bounds.minY) {
          particle.y = bounds.minY
          particle.vy = Math.abs(particle.vy) * 0.3
        } else if (particle.y > bounds.maxY) {
          particle.y = bounds.maxY
          particle.vy = -Math.abs(particle.vy) * 0.3
        }

        if (
          !particle.sparkle &&
          !particle.shrunk &&
          particle.shape === 'block' &&
          particle.life < particle.maxLife * 0.35
        ) {
          particle.shape = 'dot'
          particle.shrunk = true
          paint(particle)
        } else {
          place(particle)
        }
      }
    }

    const dropPoints = []
    for (let step = 0; step <= DROP_STEPS; step += 1) {
      dropPoints.push({
        at: step * DROP_STEP_MS,
        y: Math.round(startY * (1 - step / DROP_STEPS)),
      })
    }
    dropPoints.push({
      at: DROP_STEPS * DROP_STEP_MS + DROP_BOUNCE_MS,
      y: -2,
    })
    dropPoints.push({ at: DROP_END_MS, y: 0 })

    const popStart = offsetRef.current.y
    const popPoints = [
      { at: 0, y: popStart },
      { at: 55, y: popStart - 14 },
      { at: 115, y: popStart - 58 },
      { at: 185, y: startY },
    ]

    let nextGlint = wait(5000, 8000)
    let nextNod = wait(2000, 3000)
    let nextIdle = wait(500, 1200)
    let glintStart = -1
    let nodStart = -1
    let lastGlintStep = -1
    let nodY = 0
    let nodTilt = 0
    let nodCount = 0

    const idle = () => {
      clock = 0
      nextGlint = wait(5000, 8000)
      nextNod = wait(2000, 3000)
      nextIdle = wait(500, 1200)
      glintStart = -1
      nodStart = -1
      lastGlintStep = -1
      nodY = 0
      nodTilt = 0
      hideGlint()
      write(0, 0)
      burst()
    }

    const tick = (delta) => {
      const dt = Math.min(delta, 50) / 1000

      if (phase === 'drop') {
        elapsed += delta
        let y = startY
        for (const point of dropPoints) {
          if (elapsed >= point.at) y = point.y
        }
        write(0, y)
        if (elapsed >= DROP_END_MS) {
          pendingDropRef.current = false
          phase = 'idle'
          idle()
        }
        return
      }

      if (phase === 'pop') {
        elapsed += delta
        let y = popPoints[0].y
        for (const point of popPoints) {
          if (elapsed >= point.at) y = point.y
        }
        write(0, y)
        if (elapsed >= POP_MS) {
          layer.style.visibility = 'hidden'
          stop()
        }
        return
      }

      clock += delta
      updateParticles(dt)

      // Idle sparkles: one pixel every 0.5-1.2s from a random rim end.
      if (clock >= nextIdle) {
        spawn({ side: Math.random() < 0.5 ? -1 : 1 })
        nextIdle = clock + wait(500, 1200)
      }

      // Glint: a one cell wide stepped diagonal, swept in whole cells. It is
      // held back while a nod is running or about to start.
      if (glintStart < 0 && clock >= nextGlint) {
        const clearOfNod = nodStart < 0 && nextNod - clock > GLINT_END_MS + 250
        if (clearOfNod) {
          glintStart = clock
          lastGlintStep = -1
          if (glint) glint.setAttribute('visibility', 'visible')
        } else {
          nextGlint = clock + 300
        }
      }

      if (glintStart >= 0) {
        const step = Math.min(
          GLINT_STEPS - 1,
          Math.floor((clock - glintStart) / GLINT_STEP_MS),
        )
        if (step !== lastGlintStep) {
          lastGlintStep = step
          if (glint) {
            glint.setAttribute(
              'transform',
              `translate(${GLINT_X0 + step * GLINT_SPAN} 0)`,
            )
          }
        }
        if (clock - glintStart >= GLINT_END_MS) {
          glintStart = -1
          hideGlint()
          nextGlint = clock + wait(5000, 8000)
        }
      }

      // The nod is held back whenever a glint is running or about to start, so
      // they never share a frame. Alternating nods add a 1px tilt.
      if (nodStart < 0) {
        const clearOfGlint = glintStart < 0 && nextGlint - clock > NOD_MS + 250
        if (clock >= nextNod && clearOfGlint) {
          nodStart = clock
          nodCount += 1
          nodTilt = nodCount % 2 === 1 ? 1 : -1
          spawn({ side: -1, sparkle: true })
          spawn({ side: 1, sparkle: true })
        } else if (clock >= nextNod) {
          nextNod = clock + 300
        }
      }

      if (nodStart >= 0) {
        const beat = clock - nodStart
        const frame = Math.min(
          NOD_FRAMES.length - 1,
          Math.floor(beat / NOD_FRAME_MS),
        )
        nodY = NOD_FRAMES[frame]
        if (beat >= NOD_MS) {
          nodStart = -1
          nodY = 0
          nodTilt = 0
          nextNod = clock + wait(2000, 3000)
        }
      }

      write(nodTilt, nodY)
    }

    if (phase === 'drop') {
      write(0, startY)
    } else if (phase === 'pop') {
      write(0, popPoints[0].y)
    } else {
      write(0, 0)
    }

    unsubscribe = subscribe(tick)

    return () => {
      stop()
      window.removeEventListener('resize', onResize)
    }
  }, [worn, entered, onScreen, reduced])

  return (
    <span className="portrait__shades" ref={layerRef} aria-hidden="true">
      <span className="portrait__shades__move" ref={moveRef}>
        <svg
          className="portrait__shades__art"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          shapeRendering="crispEdges"
          focusable="false"
        >
          <defs>
            <clipPath id={GLINT_CLIP}>{cellsToRects(ART.lens)}</clipPath>
          </defs>
          <g fill="var(--shades-black)">{cellsToRects(ART.black)}</g>
          <g fill="var(--shades-white)">{cellsToRects(ART.white)}</g>
          <g
            className="portrait__shades__glint"
            ref={glintRef}
            clipPath={`url(#${GLINT_CLIP})`}
            visibility="hidden"
          >
            <g fill="var(--shades-white)">
              {Array.from({ length: VIEW_H }, (_, index) => (
                <rect key={index} x={index} y={index} width="1" height="1" />
              ))}
            </g>
          </g>
        </svg>
      </span>
    </span>
  )
}
