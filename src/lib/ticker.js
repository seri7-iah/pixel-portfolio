// One requestAnimationFrame loop shared by every animated sprite.
// The loop stops when nothing subscribes and while the tab is hidden.

const listeners = new Set()

let frameId = 0
let lastTime = 0

function loop(now) {
  const delta = Math.min(now - lastTime, 120)
  lastTime = now

  for (const listener of listeners) {
    listener(delta, now)
  }

  frameId = requestAnimationFrame(loop)
}

function start() {
  if (frameId || !listeners.size || document.hidden) return
  lastTime = performance.now()
  frameId = requestAnimationFrame(loop)
}

function stop() {
  if (!frameId) return
  cancelAnimationFrame(frameId)
  frameId = 0
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop()
    else start()
  })
}

export function subscribe(listener) {
  listeners.add(listener)
  start()

  return () => {
    listeners.delete(listener)
    if (!listeners.size) stop()
  }
}
