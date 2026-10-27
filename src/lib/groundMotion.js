// Shared ground-creature motion. Everything here works in screen pixels and
// uses delta time, so movement and animation stay the same speed on any frame
// rate. The same helpers will drive the wanderers when they move to side view.

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// Sprite transforms are written on whole screen pixels. The canvas itself is
// always an integer multiple of its source size, so a rounded position keeps
// every source pixel on a crisp screen-pixel boundary.
export function snapPx(value) {
  return Math.round(value)
}

// Frame-rate independent ease towards a target velocity. `rate` is 1/second:
// a higher rate reacts faster. This is the ease-in and ease-out used by both
// wandering and keyboard/tap control.
export function easeVelocity(vx, vy, targetVx, targetVy, delta, rate) {
  const t = 1 - Math.exp((-rate * delta) / 1000)
  let nextVx = vx + (targetVx - vx) * t
  let nextVy = vy + (targetVy - vy) * t

  if (Math.abs(nextVx) < 0.05) nextVx = 0
  if (Math.abs(nextVy) < 0.05) nextVy = 0

  return { vx: nextVx, vy: nextVy }
}

// Cruise speed scaled down across the last `easeDistance` pixels. The small
// floor keeps the final approach moving instead of stalling just short of the
// target; the caller snaps the last pixel.
export function arrivalSpeed(distance, cruise, easeDistance = 20) {
  if (distance <= 0.5) return 0

  const ramp = Math.min(1, (distance - 0.5) / easeDistance)
  return cruise * Math.max(0.18, ramp)
}

// Target velocity for walking towards a point, including the ease-out.
export function seekVelocity(
  x,
  y,
  targetX,
  targetY,
  cruise,
  easeDistance = 20,
) {
  const dx = targetX - x
  const dy = targetY - y
  const distance = Math.hypot(dx, dy)

  if (distance < 0.0001) return { vx: 0, vy: 0, distance: 0 }

  const speed = arrivalSpeed(distance, cruise, easeDistance)
  return {
    vx: (dx / distance) * speed,
    vy: (dy / distance) * speed,
    distance,
  }
}

// Walk frames advance with distance travelled, not time. `stride` is the
// screen-pixel distance covered by one full loop, so a slower or faster walk
// keeps the same footfall.
export function walkStep(phase, distance, stride, count) {
  const next = (phase + distance / stride) % 1
  const frame = Math.min(count - 1, Math.floor(next * count))
  return { phase: next, frame }
}

// Moves one creature by its eased velocity, clamps it to the ground lane and
// returns the distance actually covered (important when it is against an edge).
export function stepMotion(
  pos,
  velocity,
  targetVx,
  targetVy,
  delta,
  rate,
  bounds,
) {
  const next = easeVelocity(
    velocity.vx,
    velocity.vy,
    targetVx,
    targetVy,
    delta,
    rate,
  )

  velocity.vx = next.vx
  velocity.vy = next.vy

  const beforeX = pos.x
  const beforeY = pos.y
  const dt = delta / 1000

  pos.x = clamp(pos.x + velocity.vx * dt, bounds.minX, bounds.maxX)
  pos.y = clamp(pos.y + velocity.vy * dt, bounds.minY, bounds.maxY)

  if (pos.x <= bounds.minX || pos.x >= bounds.maxX) velocity.vx = 0
  if (pos.y <= bounds.minY || pos.y >= bounds.maxY) velocity.vy = 0

  return Math.hypot(pos.x - beforeX, pos.y - beforeY)
}
