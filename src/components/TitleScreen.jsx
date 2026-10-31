import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import DropHeading from './DropHeading.jsx'
import Sprite from './Sprite.jsx'
import { BAYER8, readColor } from '../lib/dither.js'
import { snapPx, walkStep } from '../lib/groundMotion.js'
import { TITLE_WIPE_MS } from '../lib/title.js'
import { usePrefersReducedMotion } from '../lib/useMotion.js'
import useIdleAnimation from '../lib/useIdleAnimation.js'
import { subscribe } from '../lib/ticker.js'
import {
  GLOOP_FRAMES,
  GLOOP_PALETTE,
  PIX_FRAMES,
  PIX_PALETTE,
} from '../lib/pixelArt.js'

const MENU = [
  { id: 'start', label: 'START' },
  { id: 'skip', label: 'SKIP INTRO' },
]

// The last wipe level is 15: every Bayer cell has cleared and the live Home
// scene is visible through the overlay. The overlay only unmounts after that.
const WIPE_LAST = 15

// Same gravity drop as DropHeading (Phase 3a-fix), started a little later so
// the dialog is on screen before the letters fall.
const TITLE_DROP_DELAY = 260
const TITLE_DROP_STAGGER = 70

// Phase 3e-1: Press Start. Pix and Gloop are drawn with the real sprites and
// the 3c-art lighting pass, the sky reuses the Home star and moon styles, and
// the exit is an ordered Bayer dissolve over the live page. No gradients, no
// CRT filter, no blur and no sound.
function TitlePix({ scale, reducedMotion, walking }) {
  const ref = useRef(null)
  const xRef = useRef(null)
  const [walkFrame, setWalkFrame] = useState(0)

  const { frame: idleFrame, blinking } = useIdleAnimation({
    enabled: !reducedMotion && !walking,
    frameCount: PIX_FRAMES.idle.length,
    breathMs: 1150,
    blinkMin: 3000,
    blinkMax: 5200,
  })

  // Placement and the walk-off use the shared ticker. Walk frames advance from
  // the distance travelled, exactly like the Home creatures.
  useLayoutEffect(() => {
    const el = ref.current
    const layer = el?.parentElement
    if (!el || !layer) return undefined

    if (xRef.current === null) {
      const phone = layer.clientWidth <= 640
      xRef.current = layer.clientWidth * (phone ? 0.5 : 0.68)
      el.style.transform = `translate3d(${snapPx(xRef.current)}px, 0, 0)`
    }

    if (!walking || reducedMotion) return undefined

    const exitX = layer.clientWidth + 16
    const startX = xRef.current
    const speed = Math.max(320, (exitX - startX) / 0.8)
    let phase = 0
    let lastFrame = 0

    return subscribe((delta) => {
      const distance = (speed * delta) / 1000
      xRef.current = Math.min(exitX, xRef.current + distance)
      el.style.transform = `translate3d(${snapPx(xRef.current)}px, 0, 0)`

      const next = walkStep(
        phase,
        distance,
        8 * scale,
        PIX_FRAMES.walk.length,
      )
      phase = next.phase

      if (next.frame !== lastFrame) {
        lastFrame = next.frame
        setWalkFrame(next.frame)
      }
    })
  }, [walking, reducedMotion, scale])

  const frames = walking
    ? PIX_FRAMES.walk
    : blinking
      ? PIX_FRAMES.idleBlink
      : PIX_FRAMES.idle
  const frame = walking ? walkFrame : idleFrame

  return (
    <span ref={ref} className="title-actor title-actor--pix">
      <span className="critter__shadow" aria-hidden="true" />
      <span className="critter__body">
        <Sprite
          frames={frames}
          palette={PIX_PALETTE}
          scale={scale}
          frameIndex={frame}
          playing={false}
          light="pix"
          world="home"
          pulse={!reducedMotion}
        />
      </span>
    </span>
  )
}

function TitleGloop({ scale, reducedMotion }) {
  return (
    <span className="title-actor title-actor--gloop">
      <span className="critter__shadow" aria-hidden="true" />
      <span className="critter__body">
        <Sprite
          frames={GLOOP_FRAMES.hop}
          palette={GLOOP_PALETTE}
          scale={scale}
          fps={8}
          playing={!reducedMotion}
          light="gloop"
          world="home"
          pulse={!reducedMotion}
        />
      </span>
    </span>
  )
}

export default function TitleScreen({ scale = 4, onClose }) {
  const reducedMotion = usePrefersReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [starting, setStarting] = useState(false)
  const [level, setLevel] = useState(0)

  const rootRef = useRef(null)
  const wipeRef = useRef(null)
  const itemRefs = useRef([])
  const closedRef = useRef(false)

  const finish = useCallback(() => {
    if (closedRef.current) return
    closedRef.current = true
    onClose()
  }, [onClose])

  const start = useCallback(
    (mode) => {
      if (closedRef.current) return
      // Reduced motion: no walk, no dither; the title closes at once.
      if (mode === 'skip' || reducedMotion) {
        finish()
        return
      }
      setStarting(true)
    },
    [finish, reducedMotion],
  )

  // START owns the initial focus, so keyboard users land inside the dialog.
  useLayoutEffect(() => {
    itemRefs.current[0]?.focus({ preventScroll: true })
  }, [])

  // Lock the page while the overlay is up and restore the exact previous
  // scroll styles on close. The scrollbar width is paid back as body padding so
  // nothing shifts sideways behind the dither.
  useLayoutEffect(() => {
    const html = document.documentElement
    const body = document.body
    const previousHtml = html.style.overflow
    const previousBody = body.style.overflow
    const previousPad = body.style.paddingRight
    const gutter = Math.max(0, window.innerWidth - html.clientWidth)

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    if (gutter > 0) body.style.paddingRight = `${gutter}px`

    return () => {
      html.style.overflow = previousHtml
      body.style.overflow = previousBody
      body.style.paddingRight = previousPad
    }
  }, [])

  const onKeyDown = (event) => {
    if (starting) return
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

    event.preventDefault()
    const step = event.key === 'ArrowDown' ? 1 : -1
    const next = (activeIndex + step + MENU.length) % MENU.length
    setActiveIndex(next)
    itemRefs.current[next]?.focus()
  }

  const onScreenClick = (event) => {
    if (starting || closedRef.current) return
    if (event.target.closest && event.target.closest('button')) return
    start('start')
  }

  // The dither itself. The canvas first repaints the title backdrop as flat
  // palette bands (the DOM backdrop is hidden for the duration), then clears
  // Bayer cells from level 0 to 15. Cleared cells are transparent, so the live
  // Home scene shows through; the overlay is gone at TITLE_WIPE_MS.
  useLayoutEffect(() => {
    if (!starting) return undefined

    const canvas = wipeRef.current
    const screen = rootRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !screen || !ctx) {
      finish()
      return undefined
    }

    const colors = {
      skyTop: readColor(screen, '--sky-top'),
      skyBottom: readColor(screen, '--sky-bottom'),
      grass: readColor(screen, '--grass'),
      grassLight: readColor(screen, '--grass-light'),
      grassDark: readColor(screen, '--grass-dark'),
      dirt: readColor(screen, '--dirt'),
      dirtDark: readColor(screen, '--dirt-dark'),
    }

    const styles = window.getComputedStyle(screen)
    const ledgeSize = parseFloat(styles.getPropertyValue('--title-ledge')) || 148
    const grassSize = parseFloat(styles.getPropertyValue('--title-grass')) || 96

    let cell = 4
    let cols = 0
    let rows = 0
    let dpr = 1
    let current = 0
    let elapsed = 0
    let alive = true
    let buckets = []
    let bucket = 0

    const paintBase = () => {
      const width = canvas.width
      const height = canvas.height
      const ledge = Math.round(Math.min(ledgeSize, screen.clientHeight / 2) * dpr)
      const grass = Math.round(Math.min(grassSize, ledgeSize - 12) * dpr)
      const ledgeTop = height - ledge
      const skySplit = Math.round(height * 0.62)
      const lip = Math.max(2, Math.round(4 * dpr))

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, width, height)

      ctx.fillStyle = colors.skyTop
      ctx.fillRect(0, 0, width, Math.max(0, skySplit))
      ctx.fillStyle = colors.skyBottom
      ctx.fillRect(0, skySplit, width, Math.max(0, ledgeTop - skySplit))

      ctx.fillStyle = colors.grassLight
      ctx.fillRect(0, ledgeTop, width, lip)
      ctx.fillStyle = colors.grass
      ctx.fillRect(
        0,
        ledgeTop + lip,
        width,
        Math.max(0, grass - lip * 2),
      )
      ctx.fillStyle = colors.grassDark
      ctx.fillRect(0, ledgeTop + grass - lip, width, lip)
      ctx.fillStyle = colors.dirt
      ctx.fillRect(
        0,
        ledgeTop + grass,
        width,
        Math.max(0, height - (ledgeTop + grass) - lip),
      )
      ctx.fillStyle = colors.dirtDark
      ctx.fillRect(0, height - lip, width, lip)
    }

    // Cells are bucketed by their Bayer value once per size, so the dissolve
    // clears every cell exactly once instead of rescanning the whole canvas on
    // each level. A 4K screen still clears all cells well inside the 900ms.
    const buildBuckets = () => {
      buckets = Array.from({ length: 64 }, () => [])
      bucket = 0

      for (let row = 0; row < rows; row += 1) {
        const matrixRow = (row % 8) * 8
        const y = row * cell
        for (let col = 0; col < cols; col += 1) {
          buckets[BAYER8[matrixRow + (col % 8)]].push(col * cell, y)
        }
      }
    }

    const applyLevel = (next) => {
      const limit = (next / WIPE_LAST) * 64

      while (bucket < limit) {
        const coords = buckets[bucket]
        for (let index = 0; index < coords.length; index += 2) {
          ctx.clearRect(coords[index], coords[index + 1], cell, cell)
        }
        bucket += 1
      }
    }

    const fit = () => {
      dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1))
      const width = screen.clientWidth
      const height = screen.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      cell = Math.max(3, Math.round(4 * dpr))
      cols = Math.ceil(canvas.width / cell)
      rows = Math.ceil(canvas.height / cell)
      paintBase()
      buildBuckets()
      applyLevel(current)
    }

    fit()

    const onResize = () => fit()
    window.addEventListener('resize', onResize)

    const unsubscribe = subscribe((delta) => {
      if (!alive) return

      elapsed += delta
      const next = Math.min(
        WIPE_LAST,
        Math.floor((elapsed / TITLE_WIPE_MS) * 16),
      )

      if (next !== current) {
        current = next
        setLevel(next)
        applyLevel(next)
      }

      if (elapsed >= TITLE_WIPE_MS) {
        alive = false
        finish()
      }
    })

    return () => {
      alive = false
      unsubscribe()
      window.removeEventListener('resize', onResize)
    }
  }, [starting, finish])

  // The content clears in stepped tiers that follow the same wipe, so nothing
  // soft-fades: each group is simply gone on its level.
  const hidden = (from) => starting && level >= from

  return (
    <div
      ref={rootRef}
      className={`title-screen scene is-revealed${starting ? ' is-starting' : ''}`}
      data-theme="night"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome. Press start to enter the portfolio"
      onClick={onScreenClick}
      onKeyDown={onKeyDown}
    >
      <div className="title-screen__depth" aria-hidden="true" />

      <div
        className={`title-screen__sky${hidden(10) ? ' is-cleared' : ''}`}
        aria-hidden="true"
      >
        <span className="stars stars--one" />
        <span className="stars stars--two" />
        <span className="star-cross star-cross--one" />
        <span className="moon" />
      </div>

      {starting ? (
        <canvas
          ref={wipeRef}
          className="title-screen__wipe"
          aria-hidden="true"
        />
      ) : null}

      <div
        className={`title-screen__ledge${starting ? ' is-cleared' : ''}`}
        aria-hidden="true"
      >
        <span className="title-screen__tufts" />
      </div>

      <div className="title-screen__actors" aria-hidden="true">
        {hidden(10) ? null : <TitleGloop scale={scale} reducedMotion={reducedMotion} />}
        {hidden(14) ? null : (
          <TitlePix
            scale={scale}
            reducedMotion={reducedMotion}
            walking={starting}
          />
        )}
      </div>

      <div className="title-screen__content">
        <div className="title-lockup">
          <DropHeading
            as="p"
            className="title-logo"
            text="POP"
            startDelay={TITLE_DROP_DELAY}
            stagger={TITLE_DROP_STAGGER}
          />
          <p
            className={`title-logo__subtitle${hidden(9) ? ' is-cleared' : ''}`}
          >
            PIXEL PORTFOLIO
          </p>
        </div>

        <div
          className={`title-menu${hidden(7) ? ' is-cleared' : ''}`}
        >
          {MENU.map((item, index) => (
            <button
              key={item.id}
              type="button"
              ref={(node) => {
                itemRefs.current[index] = node
              }}
              className="title-menu__item"
              data-active={index === activeIndex}
              onFocus={() => setActiveIndex(index)}
              onClick={() => start(item.id)}
            >
              <span className="title-menu__cursor" aria-hidden="true" />
              <span className="title-menu__label">{item.label}</span>
            </button>
          ))}
        </div>

        <p
          className={`title-screen__hint${hidden(4) ? ' is-cleared' : ''}`}
        >
          <span>ENTER / TAP TO START</span>
          <span>WASD / ARROWS TO PLAY PIX LATER</span>
        </p>
      </div>
    </div>
  )
}
