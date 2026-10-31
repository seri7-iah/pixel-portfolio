import { subscribe } from './ticker.js'
import { getScrollSpeed, retainScrollSpeed } from './scrollSpeed.js'

// Pixel particle fields. One small canvas per world, drawn with fillRect at
// integer coordinates, so every speck stays a hard square. The loop runs only
// while its section is awake; the shared ticker and scroll-speed reader are
// retained and released with it.

const FLOOR_INSET = 160 // keep specks out of the 160px ground strip

const KINDS = {
  ash: {
    count: 44,
    vars: ['--ember-ash', '--ember-ash', '--ember-ash', '--ember-lava', '--ember-hot'],
    fallback: ['#8a8078', '#8a8078', '#8a8078', '#ff7a1a', '#ffd447'],
    vx: [-6, 6],
    vy: [-22, -7],
    alpha: [0.25, 0.62],
  },
  dust: {
    count: 36,
    vars: [
      '--cave-stone-light',
      '--cave-stone-light',
      '--cave-stone-light',
      '--crystal',
    ],
    fallback: ['#4f4740', '#4f4740', '#4f4740', '#5be3d0'],
    vx: [-4, 4],
    vy: [6, 16],
    alpha: [0.2, 0.55],
  },
  glint: {
    count: 22,
    vars: [
      '--void-glint',
      '--void-glint',
      '--void-glint',
      '--void-star',
    ],
    fallback: ['#b58cff', '#b58cff', '#b58cff', '#f4e9c1'],
    vx: [-4, 4],
    vy: [-4, 4],
    alpha: [0.35, 0.85],
  },
  // Phase 3e-2: Day at Home swaps the night fireflies for pale pollen drifting
  // up through the sunlit grass. Same field, same 60/30 caps.
  pollen: {
    count: 26,
    vars: ['--sun', '--grass-light', '--panel'],
    fallback: ['#ffd447', '#7fd67a', '#f4ecd8'],
    vx: [-5, 5],
    vy: [-12, -3],
    alpha: [0.3, 0.7],
  },
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

function wrap(value, min, max) {
  const span = max - min
  if (span <= 0) return min
  let next = value
  while (next < min) next += span
  while (next >= max) next -= span
  return next
}

export function createParticleField(canvas, { kind, unit = 4, max = 60 }) {
  const config = KINDS[kind]
  if (!canvas || !config) {
    return { start() {}, stop() {}, destroy() {} }
  }

  const context = canvas.getContext('2d')
  const colors = config.vars.map((name, index) => {
    const value = getComputedStyle(canvas).getPropertyValue(name).trim()
    return value || config.fallback[index]
  })

  const phone = unit <= 3
  const count = Math.min(max, Math.round(config.count * (phone ? 0.55 : 1)))

  let width = 0
  let height = 0
  let particles = []
  let unsubscribe = null
  let releaseSpeed = null
  let observer = null

  function limitY() {
    return Math.max(unit, height - FLOOR_INSET)
  }

  function spawn() {
    const limit = limitY()
    return {
      x: randomBetween(0, Math.max(unit, width - unit)),
      y: randomBetween(0, Math.max(unit, limit - unit)),
      vx: randomBetween(config.vx[0], config.vx[1]),
      vy: randomBetween(config.vy[0], config.vy[1]),
      alpha: randomBetween(config.alpha[0], config.alpha[1]),
      color: colors[Math.floor(Math.random() * colors.length)],
      size: unit,
    }
  }

  function fill() {
    particles = []
    for (let i = 0; i < count; i += 1) particles.push(spawn())
  }

  function resize() {
    if (!context) return
    const rect = canvas.getBoundingClientRect()
    const nextWidth = Math.max(1, Math.round(rect.width))
    const nextHeight = Math.max(1, Math.round(rect.height))
    if (nextWidth === width && nextHeight === height) return

    width = nextWidth
    height = nextHeight
    canvas.width = width
    canvas.height = height

    if (!particles.length) {
      fill()
    } else {
      const limit = limitY()
      for (const particle of particles) {
        particle.x = Math.min(particle.x, Math.max(0, width - unit))
        particle.y = Math.min(particle.y, Math.max(0, limit - unit))
      }
    }
  }

  function draw() {
    if (!context) return
    context.clearRect(0, 0, width, height)

    for (const particle of particles) {
      context.globalAlpha = particle.alpha
      context.fillStyle = particle.color
      context.fillRect(
        Math.round(particle.x),
        Math.round(particle.y),
        particle.size,
        particle.size,
      )
    }

    context.globalAlpha = 1
  }

  function start() {
    if (unsubscribe) return

    resize()
    if (!particles.length) fill()
    releaseSpeed = retainScrollSpeed()

    unsubscribe = subscribe((delta) => {
      const step = Math.min(delta, 64) / 1000
      const boost = 1 + getScrollSpeed() * 1.3
      const limit = limitY()

      for (const particle of particles) {
        particle.x = wrap(
          particle.x + particle.vx * step * boost,
          -particle.size,
          width + particle.size,
        )
        particle.y = wrap(
          particle.y + particle.vy * step * boost,
          -particle.size,
          limit,
        )
      }

      draw()
    })

    draw()
  }

  function stop() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    if (releaseSpeed) {
      releaseSpeed()
      releaseSpeed = null
    }
    particles = []
    if (context) context.clearRect(0, 0, width, height)
  }

  function destroy() {
    stop()
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  observer = new ResizeObserver(() => {
    resize()
    if (unsubscribe) draw()
  })
  observer.observe(canvas)

  resize()

  return { start, stop, destroy }
}
