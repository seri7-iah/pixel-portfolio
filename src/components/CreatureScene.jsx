import { useRef } from 'react'
import Critter from './Critter.jsx'
import EmberwingDragon from './EmberwingDragon.jsx'
import FloatCritter from './FloatCritter.jsx'
import PixHero from './PixHero.jsx'
import useOnScreen from '../lib/useOnScreen.js'
import {
  ASHWISP_FRAMES,
  ASHWISP_PALETTE,
  BONEMOSS_DARK_FRAMES,
  BONEMOSS_DARK_PALETTE,
  BONEMOSS_FRAMES,
  BONEMOSS_PALETTE,
  EMBERIMP_FRAMES,
  EMBERIMP_PALETTE,
  FOX_FRAMES,
  FOX_PALETTE,
  GLOAMER_FRAMES,
  GLOAMER_PALETTE,
  GLOOP_FRAMES,
  GLOOP_PALETTE,
  MOSS_FRAMES,
  MOSS_PALETTE,
  STARMOTE_FRAMES,
  STARMOTE_PALETTE,
} from '../lib/pixelArt.js'

// The creature layer sits on top of each section's ground strip. Feet are
// placed between laneMin and laneMax, measured up from the strip's bottom.
const GROUND_HEIGHT = 160

// One creature layer per section. Desktop shows the full cast of ten:
// Home (Pix, Gloop, Foxel), Projects cave (Bonemoss x2, Mossling),
// About (Emberimp, Ashwisp) and Contact (Gloamer, Starmote). Emberwing is a
// special Contact flyover outside the seven-mob budget. Phones show one per
// zone (Pix, Bonemoss, Emberimp, Gloamer) plus Emberwing in Contact, so
// Contact has two creatures and Starmote stays desktop-only. Every creature is
// drawn in side view facing right and only flips its sprite canvas when it
// turns.
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
      {/* Only the ground strip and its headroom wake the zone. Contact also
          needs its sky band awake for Emberwing's flyover, so its watch covers
          the whole section instead. */}
      <span
        ref={ref}
        className={`creatures__watch${
          zone === 'contact' ? ' creatures__watch--sky' : ''
        }`}
      />

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

          {/* Phones show Pix alone at Home, so the two critters stay desktop. */}
          {phone ? null : (
            <>
              <Critter
                name="gloop"
                palette={GLOOP_PALETTE}
                idleFrames={GLOOP_FRAMES.idle}
                idleBlinkFrames={GLOOP_FRAMES.idleBlink}
                walkFrames={GLOOP_FRAMES.hop}
                liftFrames={GLOOP_FRAMES.lift}
                scale={scale}
                speed={17}
                stride={6}
                hop={10}
                laneMin={laneMin}
                laneMax={laneMax}
                startX={0.62}
                breathMs={760}
                blinkMin={3200}
                blinkMax={5600}
                active={active}
              />

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
                startX={0.84}
                breathMs={1500}
                blinkMin={3000}
                blinkMax={5200}
                active={active}
              />
            </>
          )}
        </>
      ) : null}

      {zone === 'about' ? (
        <>
          <Critter
            name="emberimp"
            palette={EMBERIMP_PALETTE}
            idleFrames={EMBERIMP_FRAMES.idle}
            idleBlinkFrames={EMBERIMP_FRAMES.idleBlink}
            walkFrames={EMBERIMP_FRAMES.walk}
            scale={scale}
            speed={phone ? 30 : 42}
            stride={4}
            laneMin={laneMin}
            laneMax={laneMax}
            startX={0.26}
            breathMs={700}
            blinkMin={2600}
            blinkMax={4800}
            active={active}
          />

          {phone ? null : (
            <FloatCritter
              name="ashwisp"
              palette={ASHWISP_PALETTE}
              idleFrames={ASHWISP_FRAMES.idle}
              scale={scale}
              laneMin={laneMin}
              laneMax={laneMax}
              startX={0.68}
              startY={0.35}
              hover={scale * 5}
              bob={scale * 2}
              bobMs={1500}
              drift={scale * 6}
              driftMs={7000}
              phase={0.12}
              breathMs={520}
              blinkMin={999999}
              blinkMax={999999}
              active={active}
            />
          )}
        </>
      ) : null}

      {zone === 'contact' ? (
        <>
          <FloatCritter
            name="gloamer"
            palette={GLOAMER_PALETTE}
            idleFrames={GLOAMER_FRAMES.idle}
            idleBlinkFrames={GLOAMER_FRAMES.idleBlink}
            scale={scale}
            laneMin={laneMin}
            laneMax={laneMax}
            startX={0.32}
            startY={0.4}
            hover={scale * 2}
            bob={scale}
            bobMs={2600}
            drift={scale * 12}
            driftMs={12000}
            phase={0.55}
            breathMs={900}
            blinkMin={6200}
            blinkMax={9800}
            active={active}
          />

          {phone ? null : (
            <FloatCritter
              name="starmote"
              palette={STARMOTE_PALETTE}
              idleFrames={STARMOTE_FRAMES.idle}
              scale={scale}
              laneMin={laneMin}
              laneMax={laneMax}
              startX={0.74}
              startY={0.5}
              hover={scale * 4}
              bob={scale}
              bobMs={2000}
              phase={0.3}
              breathMs={700}
              blinkMin={999999}
              blinkMax={999999}
              active={active}
            />
          )}

          <EmberwingDragon
            active={active}
            reducedMotion={reducedMotion}
            scale={scale}
          />
        </>
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
            startX={0.18}
            breathMs={1400}
            blinkMin={5200}
            blinkMax={8200}
            active={active}
          />

          {phone ? null : (
            <>
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
                startX={0.52}
                breathMs={1600}
                blinkMin={5600}
                blinkMax={8600}
                active={active}
              />

              <Critter
                name="mossling"
                palette={MOSS_PALETTE}
                idleFrames={MOSS_FRAMES.idle}
                idleBlinkFrames={MOSS_FRAMES.idleBlink}
                walkFrames={MOSS_FRAMES.walk}
                scale={scale}
                speed={8}
                stride={5}
                laneMin={laneMin}
                laneMax={laneMax}
                startX={0.84}
                breathMs={1200}
                blinkMin={5000}
                blinkMax={8000}
                active={active}
              />
            </>
          )}
        </>
      ) : null}
    </div>
  )
}
