import { useEffect, useRef, useState } from 'react'
import Critter from './Critter.jsx'
import PixHero from './PixHero.jsx'
import {
  BONEMOSS_DARK_FRAMES,
  BONEMOSS_DARK_PALETTE,
  BONEMOSS_FRAMES,
  BONEMOSS_PALETTE,
  FOX_FRAMES,
  FOX_PALETTE,
  GLOOP_FRAMES,
  GLOOP_PALETTE,
  MOSS_FRAMES,
  MOSS_PALETTE,
} from '../lib/pixelArt.js'

// The creature layer sits on top of each section's ground strip. Feet are
// placed between laneMin and laneMax, measured up from the strip's bottom.
const GROUND_HEIGHT = 160

// Watches its own section. Creatures in a section that is off screen stay
// frozen and do not subscribe to the shared ticker.
function useOnScreen(ref) {
  const [onScreen, setOnScreen] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return onScreen
}

// One creature layer per section: Home (Pix and Gloop), About (Foxel),
// Contact (Mossling) and the Projects cave (two Bonemoss variants). Every
// creature is drawn in side view facing right and uses the shared ground-motion
// system, so a left-moving creature only flips its sprite canvas.
export default function CreatureScene({
  zone,
  paused = false,
  reducedMotion = false,
  scale = 4,
  controlling = false,
  onControllingChange,
}) {
  const ref = useRef(null)
  const onScreen = useOnScreen(ref)

  const phone = scale <= 3
  const grassDepth = phone ? 72 : 96
  const laneMin = GROUND_HEIGHT - grassDepth
  const laneMax = laneMin + (phone ? 32 : 44)
  const active = !paused && !reducedMotion && onScreen

  return (
    <div className={`creatures creatures--${zone}`} aria-hidden="true">
      {/* Only the ground strip and its headroom wake the zone. */}
      <span ref={ref} className="creatures__watch" />

      {zone === 'home' ? (
        <>
          <PixHero
            scale={scale}
            paused={paused}
            reducedMotion={reducedMotion}
            active={active}
            awake={!paused && onScreen}
            controlling={controlling}
            onControllingChange={onControllingChange}
            laneMin={laneMin}
            laneMax={laneMax}
            startX={0.2}
            wanderSpeed={phone ? 17 : 24}
            controlSpeed={phone ? 84 : 120}
          />

          <Critter
            name="gloop"
            palette={GLOOP_PALETTE}
            idleFrames={GLOOP_FRAMES.idle}
            idleBlinkFrames={GLOOP_FRAMES.idleBlink}
            walkFrames={GLOOP_FRAMES.hop}
            liftFrames={GLOOP_FRAMES.lift}
            scale={scale}
            speed={phone ? 12 : 17}
            stride={6}
            hop={phone ? 6 : 10}
            laneMin={laneMin}
            laneMax={laneMax}
            startX={0.62}
            breathMs={760}
            blinkMin={3200}
            blinkMax={5600}
            active={active}
          />
        </>
      ) : null}

      {/* Phones keep the roster at four, so Foxel is desktop-only. */}
      {zone === 'about' && !phone ? (
        <Critter
          name="foxel"
          palette={FOX_PALETTE}
          idleFrames={FOX_FRAMES.idle}
          idleBlinkFrames={FOX_FRAMES.idleBlink}
          walkFrames={FOX_FRAMES.trot}
          scale={scale}
          speed={42}
          stride={4}
          laneMin={laneMin}
          laneMax={laneMax}
          startX={0.55}
          breathMs={1500}
          blinkMin={3000}
          blinkMax={5200}
          active={active}
        />
      ) : null}

      {zone === 'contact' ? (
        <Critter
          name="mossling"
          palette={MOSS_PALETTE}
          idleFrames={MOSS_FRAMES.idle}
          idleBlinkFrames={MOSS_FRAMES.idleBlink}
          walkFrames={MOSS_FRAMES.walk}
          scale={scale}
          speed={phone ? 6 : 8}
          stride={5}
          laneMin={laneMin}
          laneMax={laneMax}
          startX={0.3}
          breathMs={1200}
          blinkMin={5000}
          blinkMax={8000}
          active={active}
        />
      ) : null}

      {zone === 'cave' ? (
        <>
          <Critter
            name="bonemoss"
            palette={BONEMOSS_PALETTE}
            idleFrames={BONEMOSS_FRAMES.idle}
            idleBlinkFrames={BONEMOSS_FRAMES.idleBlink}
            walkFrames={BONEMOSS_FRAMES.walk}
            scale={scale}
            speed={phone ? 5 : 7}
            stride={5}
            laneMin={laneMin}
            laneMax={laneMax}
            startX={0.28}
            breathMs={1400}
            blinkMin={5200}
            blinkMax={8200}
            active={active}
          />

          {phone ? null : (
            <Critter
              name="bonemoss-dark"
              palette={BONEMOSS_DARK_PALETTE}
              idleFrames={BONEMOSS_DARK_FRAMES.idle}
              idleBlinkFrames={BONEMOSS_DARK_FRAMES.idleBlink}
              walkFrames={BONEMOSS_DARK_FRAMES.walk}
              scale={scale}
              speed={6}
              stride={5}
              laneMin={laneMin}
              laneMax={laneMax}
              startX={0.72}
              breathMs={1600}
              blinkMin={5600}
              blinkMax={8600}
              active={active}
            />
          )}
        </>
      ) : null}
    </div>
  )
}
