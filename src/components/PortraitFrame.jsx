import { useLayoutEffect, useRef, useState } from 'react'
import GatePixel from './GatePixel.jsx'
import Sunglasses, { PARTICLE_POOL } from './Sunglasses.jsx'
import {
  CONSTELLATION_A,
  CONSTELLATION_B,
  CRESCENT_MD_HALO,
  CRESCENT_SM_HALO,
  PLANET,
  PLANET_SM,
  STAR4,
  STAR_CORNER_HALO,
} from '../lib/gateArt.js'

// The photo lives in /public. BASE_URL keeps the path correct if the site is
// ever served from a subdirectory instead of the domain root.
const PHOTO_SRC = `${import.meta.env.BASE_URL}profile.jpg`

function readTunerFlag() {
  if (typeof window === 'undefined') return false
  try {
    return new URLSearchParams(window.location.search).get('tune') === '1'
  } catch {
    return false
  }
}

const clampTune = (value) =>
  Number.isFinite(value) ? Math.min(200, Math.max(-100, value)) : 0

// Phase 3l: one palette for every piece of gate art. Colours come from the
// shared CSS tokens, so the frame and the signpost can never drift apart.
const MOON_PALETTE = {
  '#': 'var(--gate-gold)',
  o: 'var(--gate-star)',
  h: 'var(--gate-halo)',
}
const STAR_PALETTE = {
  '#': 'var(--gate-star)',
  h: 'var(--gate-halo)',
}
const CONSTELLATION_PALETTE = {
  S: 'var(--gate-star)',
  d: 'var(--gate-violet)',
}
const PLANET_PALETTE = {
  '#': 'var(--gate-lavender)',
  o: 'var(--gate-star)',
}
const PLANET_SMALL_PALETTE = {
  '#': 'var(--gate-gold)',
  o: 'var(--gate-star)',
}

export default function PortraitFrame({ ready = true }) {
  const [hasPhoto, setHasPhoto] = useState(true)
  const [worn, setWorn] = useState(true)
  const [tuning] = useState(readTunerFlag)
  const [tune, setTune] = useState({ x: 49, y: 45, w: 46 })
  const frameRef = useRef(null)

  // The tuner only exists with ?tune=1. It reads whatever the real CSS says on
  // mount, so the three boxes always show the current values.
  useLayoutEffect(() => {
    if (!tuning) return
    const frame = frameRef.current
    if (!frame) return
    const styles = window.getComputedStyle(frame)
    const read = (name, fallback) => {
      const value = Number.parseFloat(styles.getPropertyValue(name))
      return Number.isFinite(value) ? value : fallback
    }
    setTune({
      x: read('--shades-x', 49),
      y: read('--shades-y', 45),
      w: read('--shades-w', 46),
    })
  }, [tuning])

  const updateTune = (key, raw) => {
    const next = clampTune(Number(raw))
    setTune((current) => ({ ...current, [key]: next }))
    const frame = frameRef.current
    if (!frame) return
    const name =
      key === 'x' ? '--shades-x' : key === 'y' ? '--shades-y' : '--shades-w'
    frame.style.setProperty(name, `${next}%`)
  }

  return (
    <div className="portrait">
      <span className="portrait__rig" aria-hidden="true">
        <span className="portrait__anchor">
          <GatePixel
            className="portrait__anchor-moon"
            rows={CRESCENT_SM_HALO}
            palette={MOON_PALETTE}
          />
        </span>
        <span className="portrait__hangline portrait__hangline--left" />
        <span className="portrait__hangline portrait__hangline--right" />
      </span>

      <div className="portrait__hang">
        <button
          type="button"
          className="portrait__frame"
          ref={frameRef}
          aria-pressed={worn}
          aria-label={worn ? 'Take off sunglasses' : 'Wear sunglasses'}
          onClick={() => setWorn((value) => !value)}
        >
          <span className="portrait__window">
            {hasPhoto ? (
              <img
                className="portrait__image"
                src={PHOTO_SRC}
                alt="Portrait of POP"
                width="422"
                height="559"
                decoding="async"
                onError={() => setHasPhoto(false)}
              />
            ) : (
              <span
                className="portrait__placeholder"
                role="img"
                aria-label="Portrait of POP. Your photo goes here."
              >
                <span className="portrait__silhouette" aria-hidden="true" />
                <span className="portrait__placeholder-label" aria-hidden="true">
                  YOUR PHOTO HERE
                </span>
              </span>
            )}

            <Sunglasses worn={worn} ready={ready} />
          </span>

          <span className="portrait__gate" aria-hidden="true">
            <span className="portrait__crest">
              <GatePixel
                className="portrait__crest-star portrait__crest-star--left"
                rows={STAR4}
                palette={STAR_PALETTE}
              />
              <GatePixel
                className="portrait__crest-moon"
                rows={CRESCENT_MD_HALO}
                palette={MOON_PALETTE}
              />
              <GatePixel
                className="portrait__crest-star portrait__crest-star--right"
                rows={STAR4}
                palette={STAR_PALETTE}
              />
            </span>

            <span className="portrait__corner portrait__corner--tl">
              <GatePixel rows={STAR_CORNER_HALO} palette={STAR_PALETTE} />
            </span>
            <span className="portrait__corner portrait__corner--tr">
              <GatePixel rows={STAR_CORNER_HALO} palette={STAR_PALETTE} />
            </span>
            <span className="portrait__corner portrait__corner--bl">
              <GatePixel rows={STAR_CORNER_HALO} palette={STAR_PALETTE} />
            </span>
            <span className="portrait__corner portrait__corner--br">
              <GatePixel rows={STAR_CORNER_HALO} palette={STAR_PALETTE} />
            </span>

            <span className="portrait__constellation portrait__constellation--left">
              <GatePixel
                className="portrait__constellation-a"
                rows={CONSTELLATION_A}
                palette={CONSTELLATION_PALETTE}
              />
              <GatePixel
                className="portrait__constellation-b"
                rows={CONSTELLATION_B}
                palette={CONSTELLATION_PALETTE}
              />
            </span>
            <span className="portrait__constellation portrait__constellation--right">
              <GatePixel
                className="portrait__constellation-a"
                rows={CONSTELLATION_A}
                palette={CONSTELLATION_PALETTE}
              />
              <GatePixel
                className="portrait__constellation-b"
                rows={CONSTELLATION_B}
                palette={CONSTELLATION_PALETTE}
              />
            </span>
          </span>
        </button>

        <span className="portrait__orbit portrait__orbit--one" aria-hidden="true">
          <span className="portrait__planet">
            <GatePixel rows={PLANET} palette={PLANET_PALETTE} />
          </span>
        </span>
        <span className="portrait__orbit portrait__orbit--two" aria-hidden="true">
          <span className="portrait__planet portrait__planet--small">
            <GatePixel rows={PLANET_SM} palette={PLANET_SMALL_PALETTE} />
          </span>
        </span>

        <span className="portrait__cursor" aria-hidden="true" />

        <span className="portrait__spark portrait__spark--tl" aria-hidden="true" />
        <span className="portrait__spark portrait__spark--tr" aria-hidden="true" />
        <span className="portrait__spark portrait__spark--bl" aria-hidden="true" />
        <span className="portrait__spark portrait__spark--br" aria-hidden="true" />

        <span className="portrait__fx" aria-hidden="true">
          {Array.from({ length: PARTICLE_POOL }, (_, index) => (
            <span className="portrait__particle" key={index} />
          ))}
        </span>
      </div>

      {tuning ? (
        <aside className="shade-tuner" aria-label="Sunglasses placement tuner">
          <p className="shade-tuner__title">SHADES TUNER</p>
          <label className="shade-tuner__row" htmlFor="shades-x">
            <span>X %</span>
            <input
              id="shades-x"
              type="number"
              step="0.5"
              min="-100"
              max="200"
              value={tune.x}
              onChange={(event) => updateTune('x', event.target.value)}
            />
          </label>
          <label className="shade-tuner__row" htmlFor="shades-y">
            <span>Y %</span>
            <input
              id="shades-y"
              type="number"
              step="0.5"
              min="-100"
              max="200"
              value={tune.y}
              onChange={(event) => updateTune('y', event.target.value)}
            />
          </label>
          <label className="shade-tuner__row" htmlFor="shades-w">
            <span>W %</span>
            <input
              id="shades-w"
              type="number"
              step="0.5"
              min="-100"
              max="200"
              value={tune.w}
              onChange={(event) => updateTune('w', event.target.value)}
            />
          </label>
          <code className="shade-tuner__readout">
            --shades-x: {tune.x}%; --shades-y: {tune.y}%; --shades-w: {tune.w}%;
          </code>
        </aside>
      ) : null}
    </div>
  )
}
