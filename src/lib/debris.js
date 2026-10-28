import { subscribe } from './ticker.js'
import { getScrollSpeed, retainScrollSpeed } from './scrollSpeed.js'

// Phase 3b-2: cave debris. A brisk scroll in the Projects cave knocks a few
// rock chips loose from the ceiling. They fall, bounce once, rest for a second
// and blink out. Everything is drawn on one canvas at integer coordinates, in
// side gutters, so the chips never cover the copy or the creature lanes.

const FLOOR_INSET = 160
const TOP_INSET = 120
const COOLDOWN_MS = 3000
const SPEED_THRESHOLD = 0.4
const GRAVITY = 900
const BOUNCE = 0.36
const REST_MS = 1000
const BLINK_MS = 240
const BLINK_STEP = 60

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

export function createDebrisField(canvas, { unit = 4, max = 6 } = {}) {
  if (!canvas) {
    return { start() {}, stop() {}, destroy() {} }
  }

  const context = canvas.getContext('2d')
  const styles = getComputedStyle(canvas)
  const colors = [
    (styles.getPropertyValue('--cave-stone-light') || '#4f4740').trim(),
    (styles.getPropertyValue('--cave-stone-dark') || '#211d1a').trim(),
    (styles.getPropertyValue('--cave-rock') || '#3d3731').trim(),
  ]

  const phone = unit <= 3
  const maxChips = phone ? Math.min(3, max) : max
  const spawnMin = phone ? 2 : 3

  let width = 0
  let height = 0
  let chips = []
  let cooldown = 0
  let unsubscribe = null
  let releaseSpeed = null
  let observer = null

  const floorY = () =>
    Math.max(TOP_INSET + unit * 2, height - FLOOR_INSET + unit)

  // The page copy is centred inside a 1120px container with 32px of padding, so
  // this is the empty margin on each side. Chips stay in that margin (capped at
  // 96px) even on narrower desktops, where there is no room beside the copy.
  function gutter() {
    return Math.min(96, Math.max(32, width / 2 - 528))
  }

  // Spawn only in the side gutters, and keep each chip in its own column, so a
  // chip can never drift across the copy while it falls.
  function spawnChip() {
    const band = gutter()
    const size = Math.random() < 0.45 ? unit : unit * 2
    const left = Math.random() < 0.5
    const laneMin = left ? 0 : Math.max(0, width - band)
    const laneMax = left ? Math.max(0, band - size) : Math.max(0, width - size)

    return {
      x: randomBetween(laneMin, Math.max(laneMin, laneMax)),
      laneMin,
      laneMax: Math.max(laneMin, laneMax),
      y: TOP_INSET + randomBetween(-unit, unit),
      vx: randomBetween(-16, 16),
      vy: randomBetween(80, 160),
      size,
      color: colors[Math.floor(Math.random() * colors.length)],
      state: 'fall',
      bounced: false,
      rest: 0,
      blink: 0,
    }
  }

  function knockLoose() {
    const slots = maxChips - chips.length
    if (slots <= 0) return

    const wanted = Math.floor(randomBetween(spawnMin, maxChips + 1))
    const count = Math.min(slots, maxChips, wanted)

    for (let i = 0; i < count; i += 1) chips.push(spawnChip())
    cooldown = COOLDOWN_MS
  }

  function step(delta) {
    const dt = Math.min(delta, 64) / 1000
    const floor = floorY()

    for (const chip of chips) {
      if (chip.state === 'fall' || chip.state === 'bounce') {
        chip.vy += GRAVITY * dt
        chip.x += chip.vx * dt
        chip.y += chip.vy * dt

        if (chip.y + chip.size >= floor) {
          chip.y = floor - chip.size

          if (!chip.bounced) {
            chip.bounced = true
            chip.vy = Math.abs(chip.vy) * BOUNCE * -1
            chip.vx *= 0.6
            chip.state = 'bounce'
          } else {
            chip.vy = 0
            chip.vx = 0
            chip.state = 'rest'
            chip.rest = REST_MS
          }
        }

        if (chip.x < chip.laneMin) {
          chip.x = chip.laneMin
          chip.vx = Math.abs(chip.vx)
        } else if (chip.x > chip.laneMax) {
          chip.x = chip.laneMax
          chip.vx = -Math.abs(chip.vx)
        }
      } else if (chip.state === 'rest') {
        chip.rest -= delta
        if (chip.rest <= 0) {
          chip.state = 'blink'
          chip.blink = BLINK_MS
        }
      } else if (chip.state === 'blink') {
        chip.blink -= delta
      }
    }

    chips = chips.filter((chip) => chip.state !== 'blink' || chip.blink > 0)
  }

  function draw() {
    if (!context) return
    context.clearRect(0, 0, width, height)

    for (const chip of chips) {
      if (chip.state === 'blink') {
        const stepIndex = Math.floor((BLINK_MS - chip.blink) / BLINK_STEP)
        if (stepIndex % 2 === 1) continue
      }

      const x = Math.round(chip.x)
      const y = Math.round(chip.y)

      context.fillStyle = chip.color
      context.fillRect(x, y, chip.size, chip.size)

      // A single lighter pixel on the big chips keeps the rock readable.
      if (chip.size > unit) {
        context.fillStyle = colors[0]
        context.fillRect(x, y, unit, unit)
      }
    }
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

    for (const chip of chips) {
      chip.x = Math.min(chip.x, Math.max(0, width - chip.size))
      chip.y = Math.min(chip.y, Math.max(TOP_INSET, height - chip.size))
    }

    draw()
  }

  function start() {
    if (unsubscribe) return

    resize()
    cooldown = 0
    releaseSpeed = retainScrollSpeed()

    unsubscribe = subscribe((delta) => {
      if (cooldown > 0) cooldown -= delta

      if (getScrollSpeed() >= SPEED_THRESHOLD && cooldown <= 0) {
        knockLoose()
      }

      step(delta)
      draw()
    })
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

    chips = []
    cooldown = 0
    if (context) context.clearRect(0, 0, width, height)
  }

  function destroy() {
    stop()
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()

  return { start, stop, destroy }
}
