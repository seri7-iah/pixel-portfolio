import { useCallback, useEffect, useRef, useState } from 'react'
import CaveDebris from './components/CaveDebris.jsx'
import CreatureScene from './components/CreatureScene.jsx'
import DepthMeter from './components/DepthMeter.jsx'
import DescendBand from './components/DescendBand.jsx'
import DialogueBox from './components/DialogueBox.jsx'
import DropHeading from './components/DropHeading.jsx'
import GatePixel from './components/GatePixel.jsx'
import ParticleField from './components/ParticleField.jsx'
import PixelButton from './components/PixelButton.jsx'
import PortraitFrame from './components/PortraitFrame.jsx'
import ThemeWipe from './components/ThemeWipe.jsx'
import TitleScreen from './components/TitleScreen.jsx'
import Typewriter from './components/Typewriter.jsx'
import WishStar from './components/WishStar.jsx'
import { GATE_ICONS, SPIRE, STAR4, STAR4_ALT, CRESCENT_SM_HALO } from './lib/gateArt.js'
import useOnScreen from './lib/useOnScreen.js'
import { usePrefersReducedMotion, useSpriteScale } from './lib/useMotion.js'
import { useReveal } from './lib/reveal.js'
import { markTitleSeen, shouldShowTitle } from './lib/title.js'
import {
  announceTheme,
  applyTheme,
  currentTheme,
  readHomePalette,
  saveTheme,
} from './lib/theme.js'
import useSceneFx from './lib/sceneFx.js'
import './App.css'
import './reveal.css'
import './title.css'

function revealClasses(base, reveal) {
  const classes = [base]
  if (reveal.revealed) classes.push('is-revealed')
  if (reveal.revealed && !reveal.settled) classes.push('is-revealing')
  return classes.join(' ')
}

const navItems = [
  { id: 'home', label: 'Home', side: 'left', icon: 'house' },
  { id: 'projects', label: 'Projects', side: 'right', icon: 'crystal' },
  { id: 'about', label: 'About', side: 'left', icon: 'flame' },
  { id: 'contact', label: 'Contact', side: 'right', icon: 'star' },
]

// Phase 3l: the signpost uses the same Celestial Gate art as the portrait
// frame, so both pieces read as one original set. Every grid is drawn as hard
// cells by GatePixel, and the tints come from the shared gate tokens.
const ICON_PALETTE = {
  '#': 'var(--sign-accent)',
  o: 'var(--gate-star)',
}
const CROWN_MOON_PALETTE = {
  '#': 'var(--gate-gold)',
  o: 'var(--gate-star)',
  h: 'var(--gate-halo)',
}
const CROWN_STAR_PALETTE = {
  '#': 'var(--gate-star)',
}
const SPIRE_PALETTE = {
  v: 'var(--gate-violet)',
  i: 'var(--gate-indigo)',
  o: 'var(--gate-gold)',
}
const MARKER_PALETTE = {
  '#': 'var(--gate-gold)',
  o: 'var(--gate-star)',
}

const projects = [
  { id: '01', name: 'Project 01', tag: 'Crystal cache', art: 'crystal' },
  { id: '02', name: 'Project 02', tag: 'Supply chest', art: 'chest' },
  { id: '03', name: 'Project 03', tag: 'Trail sign', art: 'sign' },
]

// Phase 3c: one dithered band per seam. The two base colours are CSS variable
// names read off the sections at draw time, so each band follows its own world
// palette. Lip colours come from the world above the seam, except the void dust,
// which is pale rock from the world below.
const descentBands = [
  {
    from: 'home',
    to: 'projects',
    upper: '--dirt',
    lower: '--cave-wall-deep',
    lip: {
      kind: 'rock',
      dark: '--dirt-dark',
      light: '--dirt-light',
      source: 'from',
    },
  },
  {
    from: 'projects',
    to: 'about',
    upper: '--cave-floor',
    lower: '--ember-rock-warm',
    lip: {
      kind: 'rock',
      dark: '--cave-rock',
      light: '--cave-stone-light',
      source: 'from',
    },
  },
  {
    from: 'about',
    to: 'contact',
    upper: '--ember-rock',
    lower: '--void-bg-top',
    lip: {
      kind: 'dust',
      dark: '--void-rock-shade',
      light: '--void-rock-warm',
      source: 'to',
    },
  },
]

function Signpost({ revealIndex = 0, activeZone = 'home' }) {
  return (
    <nav
      className="signpost rv-wipe"
      aria-label="World areas"
      style={{ '--rv-i': revealIndex }}
    >
      <span className="signpost__crown" aria-hidden="true">
        <GatePixel
          className="signpost__crown-moon"
          rows={CRESCENT_SM_HALO}
          palette={CROWN_MOON_PALETTE}
        />
        <GatePixel
          className="signpost__crown-star"
          rows={STAR4}
          palette={CROWN_STAR_PALETTE}
        />
      </span>
      <span className="signpost__spire" aria-hidden="true">
        <GatePixel rows={SPIRE} palette={SPIRE_PALETTE} />
      </span>
      <ol className="signpost__list">
        {navItems.map((item) => {
          const active = item.id === activeZone
          return (
            <li
              key={item.id}
              className={`signpost__item signpost__item--${item.side}`}
            >
              <a
                className={`signpost__link signpost__link--${item.id}${
                  active ? ' is-active' : ''
                }`}
                href={`#${item.id}`}
                data-zone={item.id}
                aria-current={active ? 'location' : undefined}
              >
                <GatePixel
                  className="signpost__icon"
                  rows={GATE_ICONS[item.icon]}
                  palette={ICON_PALETTE}
                />
                <span className="signpost__label">{item.label}</span>
              </a>
              {active ? (
                <span className="signpost__marker" aria-hidden="true">
                  <GatePixel
                    className="signpost__marker-star signpost__marker-star--a"
                    rows={STAR4}
                    palette={MARKER_PALETTE}
                  />
                  <GatePixel
                    className="signpost__marker-star signpost__marker-star--b"
                    rows={STAR4_ALT}
                    palette={MARKER_PALETTE}
                  />
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function CaveObject({ project, revealIndex = 0 }) {
  return (
    <a
      className="cave-object rv-wipe"
      href="#contact"
      aria-label={`${project.name}: ${project.tag}. Placeholder project link.`}
      style={{ '--rv-i': revealIndex }}
    >
      <span
        className={`cave-object__art cave-object__art--${project.art}`}
        aria-hidden="true"
      >
        <span className="cave-object__part cave-object__part--a" />
        <span className="cave-object__part cave-object__part--b" />
        <span className="cave-object__part cave-object__part--c" />
      </span>
      <span className="cave-object__name">{project.name}</span>
      <span className="cave-object__tag">{project.tag}</span>
    </a>
  )
}

function App() {
  const [creaturesPaused, setCreaturesPaused] = useState(false)
  const [pixControl, setPixControl] = useState(false)
  const [motionOverride, setMotionOverride] = useState(false)
  // Phase 3e-1: resolved during the first render, so the overlay is already in
  // the first paint. Returning visitors and #hash deep links never see it.
  const [titleOpen, setTitleOpen] = useState(() => shouldShowTitle())
  // Phase 3e-2: the inline script in index.html already resolved the theme, so
  // this reads the document instead of storage and can never disagree with the
  // first paint. The wipe is a Home-only 600ms Bayer dissolve.
  const [theme, setTheme] = useState(() => currentTheme())
  const [themeWipe, setThemeWipe] = useState(null)
  // Phase 3j: the Home signpost lights the plank for the world the depth gauge
  // already reads. No extra scroll listener is added.
  const [activeZone, setActiveZone] = useState('home')
  const systemReducedMotion = usePrefersReducedMotion()
  const reducedMotion = systemReducedMotion && !motionOverride
  const spriteScale = useSpriteScale()
  const restoreFocusRef = useRef(false)

  const appRef = useRef(null)
  const homeRef = useRef(null)
  const projectsRef = useRef(null)
  const aboutRef = useRef(null)
  const contactRef = useRef(null)
  const homeOnScreen = useOnScreen(homeRef)
  const projectsOnScreen = useOnScreen(projectsRef)
  const aboutOnScreen = useOnScreen(aboutRef)
  const contactOnScreen = useOnScreen(contactRef)
  const homeReveal = useReveal(homeRef, !titleOpen)
  const projectsReveal = useReveal(projectsRef)
  const aboutReveal = useReveal(aboutRef)
  const contactReveal = useReveal(contactRef)

  // Phase 3b-1: parallax layers, palette cycling and particle fields. These
  // read the system preference directly, so "Play anyway" cannot re-enable
  // decorative motion the visitor asked to suppress.
  const fxReduced = systemReducedMotion
  const fxPaused = creaturesPaused
  useSceneFx(homeRef, {
    cycle: 'home',
    onScreen: homeOnScreen,
    paused: fxPaused,
    reducedMotion: fxReduced,
  })
  useSceneFx(projectsRef, {
    onScreen: projectsOnScreen,
    paused: fxPaused,
    reducedMotion: fxReduced,
  })
  useSceneFx(aboutRef, {
    cycle: 'ember',
    onScreen: aboutOnScreen,
    paused: fxPaused,
    reducedMotion: fxReduced,
  })
  useSceneFx(contactRef, {
    cycle: 'void',
    onScreen: contactOnScreen,
    paused: fxPaused,
    reducedMotion: fxReduced,
  })

  // Scenery animations follow the same pause button as the creatures and stop
  // for the system reduced-motion preference. They also stop off screen.
  const decorLive = !creaturesPaused && !systemReducedMotion
  const homeSceneClass = revealClasses(
    `scene scene--home${decorLive && homeOnScreen ? ' is-live' : ''}`,
    homeReveal,
  )
  // The reveal fires once per page load, so it is also the trigger for the
  // one-shot crystal glint. Reduced motion keeps the crystals still.
  const caveGlint = projectsReveal.revealed && !systemReducedMotion
  const caveSceneClass = revealClasses(
    `scene scene--cave${decorLive && projectsOnScreen ? ' is-live' : ''}${
      caveGlint ? ' is-glinting' : ''
    }`,
    projectsReveal,
  )
  const aboutSceneClass = revealClasses(
    `scene scene--about scene--ember${
      decorLive && aboutOnScreen ? ' is-live' : ''
    }`,
    aboutReveal,
  )
  const contactSceneClass = revealClasses(
    `scene scene--contact scene--void${
      decorLive && contactOnScreen ? ' is-live' : ''
    }`,
    contactReveal,
  )

  const toggleCreatures = () => {
    const next = !creaturesPaused
    setCreaturesPaused(next)
    if (next) setPixControl(false)
  }

  // Phase 3e-2: the document attribute flips only after the wipe has painted
  // the outgoing palette, so the switch never shows a half-applied frame.
  const commitTheme = useCallback(() => {
    applyTheme(theme)
    announceTheme()
  }, [theme])

  const finishThemeWipe = useCallback(() => setThemeWipe(null), [])

  const toggleTheme = () => {
    if (themeWipe) return

    const next = theme === 'day' ? 'night' : 'day'
    saveTheme(next)
    setTheme(next)

    if (systemReducedMotion) {
      applyTheme(next)
      announceTheme()
      return
    }

    const from = readHomePalette()
    if (from) setThemeWipe({ from })
    else {
      applyTheme(next)
      announceTheme()
    }
  }

  // If reduced motion is turned on mid-switch, ThemeWipe closes at once; the
  // check lives in its ticker so this component never sets state in an effect.

  // Phase 3e-1: leaving the title records the session, removes the overlay and
  // hands focus back to the Home heading (or the first Home focusable if the
  // heading is missing).
  const closeTitle = useCallback(() => {
    markTitleSeen()
    restoreFocusRef.current = true
    setTitleOpen(false)
  }, [])

  useEffect(() => {
    if (titleOpen || !restoreFocusRef.current) return
    restoreFocusRef.current = false

    const heading = document.getElementById('home-title')
    const target = heading || document.querySelector('#home .brand')
    if (!target) return

    if (heading) heading.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
    if (heading) {
      heading.addEventListener(
        'blur',
        () => heading.removeAttribute('tabindex'),
        { once: true },
      )
    }
  }, [titleOpen])

  // Phase 3c: the entry beat. One 120ms, two-frame, 2px thump on the page
  // wrapper the first time a seam is crossed. Desktop only and never for the
  // system reduced-motion preference; there is no sound.
  const handleBandCross = () => {
    if (fxReduced || spriteScale <= 3) return

    const app = appRef.current
    if (!app || app.classList.contains('is-thumping')) return
    app.classList.add('is-thumping')
  }

  useEffect(() => {
    const app = appRef.current
    if (!app) return undefined

    const onAnimationEnd = (event) => {
      if (event.target !== app) return
      app.classList.remove('is-thumping')
    }

    app.addEventListener('animationend', onAnimationEnd)
    return () => app.removeEventListener('animationend', onAnimationEnd)
  }, [])

  // Phase 3j: pause the new CSS idle loops while the tab is hidden. The shared
  // rAF ticker already stops itself for the glasses and particles.
  useEffect(() => {
    const app = appRef.current
    if (!app) return undefined
    const sync = () => app.classList.toggle('is-tab-hidden', document.hidden)
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  return (
    <div className="app" ref={appRef}>
      <div
        className="app__page"
        inert={titleOpen}
        aria-hidden={titleOpen ? 'true' : undefined}
      >
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>

        <DepthMeter onWorldChange={setActiveZone} />

      <main id="main-content">
        <section
          id="home"
          ref={homeRef}
          className={homeSceneClass}
          aria-labelledby="home-title"
        >
          <ParticleField
            kind={theme === 'day' ? 'pollen' : null}
            scale={spriteScale}
            active={
              theme === 'day' && homeOnScreen && !fxPaused && !fxReduced
            }
          />

          <div className="sky sky--home" aria-hidden="true" data-parallax="48">
            <span className="sky-horizon" />
            <span className="stars stars--one" />
            <span className="stars stars--two" />
            <span className="stars stars--three" />
            <span className="cycle-stars" />
            <span className="star-cross star-cross--one" />
            <span className="star-cross star-cross--two" />
            <span className="shooting-star" />
            <span className="moon" />
            <span className="sun">
              <span className="sun__rays" />
              <span className="sun__disc" />
            </span>
            <span className="cloud cloud--one" />
            <span className="cloud cloud--two" />
            <span className="cloud cloud--three" />
          </div>

          <WishStar
            active={homeOnScreen && !creaturesPaused && !fxReduced}
            reducedMotion={fxReduced}
            scale={spriteScale}
          />

          <div className="container home">
            <header className="home__header">
              <a className="brand" href="#home" aria-label="POP, home">
                <span className="brand__mark" aria-hidden="true" />
                <span>POP</span>
              </a>
              <p className="home__note">Pixel portfolio / placeholder world</p>
              <div className="home__actions">
                <button
                  type="button"
                  className="pixel-button pix-control"
                  aria-pressed={pixControl}
                  aria-describedby="pix-control-help"
                  data-pix-control
                  disabled={creaturesPaused}
                  onClick={() => setPixControl((value) => !value)}
                >
                  Play as Pix
                </button>
                <span id="pix-control-help" className="sr-only">
                  Use W, A, S, D or the arrow keys to move Pix, or tap the ground
                  on a touch screen. Press Escape to release control.
                </span>
                <button
                  type="button"
                  className="creature-toggle"
                  aria-pressed={creaturesPaused}
                  onClick={toggleCreatures}
                >
                  <span className="creature-toggle__mark" aria-hidden="true" />
                  Pause creatures
                </button>
                <button
                  type="button"
                  className="theme-toggle"
                  aria-pressed={theme === 'day'}
                  aria-label={
                    theme === 'day' ? 'Switch to night' : 'Switch to day'
                  }
                  onClick={toggleTheme}
                >
                  <span
                    className={`theme-toggle__icon theme-toggle__icon--${
                      theme === 'day' ? 'moon' : 'sun'
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {systemReducedMotion && !motionOverride && !creaturesPaused ? (
                  <p className="motion-note">
                    Creatures are resting because your system has animations off
                    <button
                      type="button"
                      className="motion-note__action"
                      onClick={() => setMotionOverride(true)}
                    >
                      Play anyway
                    </button>
                  </p>
                ) : null}
              </div>
            </header>

            <p className="sr-only" role="status" aria-live="polite">
              {pixControl ? 'Controlling Pix' : 'Pix is wandering'}
            </p>

            <div className="home__title">
              <Typewriter
                as="p"
                className="area-kicker"
                text="Home / Level 01"
              />
              <DropHeading as="h1" id="home-title" text="POP" />
            </div>

            <div className="home__right">
              <Signpost revealIndex={0} activeZone={activeZone} />
              <div className="home__portrait">
                <PortraitFrame ready={!titleOpen} />
              </div>
            </div>

            <div className="home__copy">
              <p className="home__lead rv-wipe" style={{ '--rv-i': 1 }}>
                Placeholder welcome for the home area. Real copy will arrive in a later
                phase.
                <span className="rv-bar" aria-hidden="true" />
              </p>
              <p className="home__body rv-wipe" style={{ '--rv-i': 2 }}>
                Placeholder supporting line. Keep this short so the scene has room to
                breathe.
                <span className="rv-bar" aria-hidden="true" />
              </p>
              <PixelButton
                href="#projects"
                className="rv-wipe"
                style={{ '--rv-i': 3 }}
              >
                Enter the cave
              </PixelButton>
            </div>

            <div className="home__dialogue">
              <DialogueBox
                className="rv-wipe"
                label="Dialogue"
                speaker="Guide"
                revealIndex={4}
              >
                <p>
                  Placeholder dialogue. This box belongs to a character speaking, so keep
                  the line short.
                </p>
                <p>Placeholder second line for spacing.</p>
              </DialogueBox>
            </div>
          </div>

          <div className="landscape" aria-hidden="true">
            <span className="ridge ridge--far" />
            <span className="ridge ridge--mid" />
            <span className="ridge-tree ridge-tree--one" />
            <span className="ridge-tree ridge-tree--two" />
            <span className="hill hill--back" data-parallax="16" />
            <span className="hill hill--front" />
            <span className="tree tree--one" />
            <span className="tree tree--two" />
            <span className="tree tree--three" />
            <span className="bush bush--one" />
            <span className="bush bush--two" />
            <span className="rock rock--one" />
            <span className="rock rock--two" />
            <span className="fireflies fireflies--one" />
            <span className="fireflies fireflies--two" />
            <span className="ground ground--home">
              <span className="ground__tufts" />
              <span className="ground__flowers" />
              <span className="ground__pebbles" />
              <span className="ground__roots" />
            </span>
          </div>

          <CreatureScene
            zone="home"
            paused={creaturesPaused}
            reducedMotion={reducedMotion}
            scale={spriteScale}
            controlling={pixControl}
            onControllingChange={setPixControl}
            sectionRevealed={homeReveal.revealed}
            fxReduced={fxReduced}
          />

          {themeWipe ? (
            <ThemeWipe
              from={themeWipe.from}
              scale={spriteScale}
              reducedMotion={systemReducedMotion}
              onPainted={commitTheme}
              onDone={finishThemeWipe}
            />
          ) : null}
        </section>

        <DescendBand
          {...descentBands[0]}
          scale={spriteScale}
          reducedMotion={fxReduced}
          theme={theme}
          onCross={handleBandCross}
        />

        <section
          id="projects"
          ref={projectsRef}
          className={caveSceneClass}
          aria-labelledby="projects-title"
        >
          <ParticleField
            kind="dust"
            scale={spriteScale}
            active={projectsOnScreen && !fxPaused && !fxReduced}
          />

          <CaveDebris
            scale={spriteScale}
            active={projectsOnScreen && !fxPaused && !fxReduced}
          />

          <div className="cave-decor" aria-hidden="true">
            <span className="cave-glow" data-parallax="16" />
            <span className="cave-ceiling-stack" data-parallax="32">
              <span className="cave-ceiling-glow" />
              <span className="cave-ceiling-edge" />
              <span className="stalactite stalactite--one" />
              <span className="stalactite stalactite--two" />
              <span className="stalactite stalactite--three" />
              <span className="stalactite stalactite--four" />
              <span className="stalactite stalactite--five" />
              <span className="stalactite stalactite--six" />
              <span className="cave-drip cave-drip--one" />
              <span className="cave-drip cave-drip--two" />
              <span className="cave-ceiling" />
            </span>
            <span className="cave-wall-rock cave-wall-rock--left" />
            <span className="cave-wall-rock cave-wall-rock--right" />
            <span className="cave-vein cave-vein--one" />
            <span className="cave-vein cave-vein--two" />
            <span className="cave-crystal cave-crystal--one" />
            <span className="cave-crystal cave-crystal--two" />
            <span className="cave-crystal cave-crystal--three" />
            <span className="cave-crystal cave-crystal--four" />
            <span className="torch torch--left">
              <span className="torch__glow" />
              <span className="torch__flame" />
              <span className="torch__embers" />
            </span>
            <span className="torch torch--right">
              <span className="torch__glow" />
              <span className="torch__flame" />
              <span className="torch__embers" />
            </span>
            <span className="torch torch--low-left">
              <span className="torch__glow" />
              <span className="torch__flame" />
              <span className="torch__embers" />
            </span>
            <span className="torch torch--low-right">
              <span className="torch__glow" />
              <span className="torch__flame" />
              <span className="torch__embers" />
            </span>
            <span className="cave-dust">
              <span className="cave-dust__layer cave-dust__layer--one" />
              <span className="cave-dust__layer cave-dust__layer--two" />
            </span>
            <span className="cave-floor">
              <span className="cave-floor__lip" />
              <span className="cave-floor__cracks" />
              <span className="cave-floor__pebbles" />
              <span className="cave-floor__crystals" />
              <span className="cave-floor__moss" />
            </span>
            <span className="cave-moss cave-moss--one" />
            <span className="cave-moss cave-moss--two" />
          </div>

          <div className="container cave">
            <header className="section-intro">
              <Typewriter
                as="p"
                className="area-kicker"
                text="Level 02 / Projects"
              />
              <DropHeading as="h2" id="projects-title" text="Projects" />
              <p className="rv-wipe" style={{ '--rv-i': 0 }}>
                Placeholder introduction for the cave. Three objects stand in for projects
                until real work and links are added.
                <span className="rv-bar" aria-hidden="true" />
              </p>
            </header>

            <div className="cave-wall">
              <div className="cave-objects">
                {projects.map((project, index) => (
                  <CaveObject
                    key={project.id}
                    project={project}
                    revealIndex={index + 1}
                  />
                ))}
              </div>
              <p className="cave-wall__note rv-wipe" style={{ '--rv-i': 4 }}>
                Hover or tab to an object to reveal its short label.
                <span className="rv-bar" aria-hidden="true" />
              </p>
            </div>
          </div>

          <CreatureScene
            zone="cave"
            paused={creaturesPaused}
            reducedMotion={reducedMotion}
            scale={spriteScale}
            sectionRevealed={projectsReveal.revealed}
            fxReduced={fxReduced}
          />
        </section>

        <DescendBand
          {...descentBands[1]}
          scale={spriteScale}
          reducedMotion={fxReduced}
          onCross={handleBandCross}
        />

        <section
          id="about"
          ref={aboutRef}
          className={aboutSceneClass}
          aria-labelledby="about-title"
        >
          <ParticleField
            kind="ash"
            scale={spriteScale}
            active={aboutOnScreen && !fxPaused && !fxReduced}
          />

          <div className="ember-decor" aria-hidden="true">
            <span className="ember-glow" />
            <span className="ember-ceiling-stack" data-parallax="32">
              <span className="ember-ceiling-glow ember-ceiling-glow--soft" />
              <span className="ember-ceiling-glow" />
              <span className="ember-stalactite ember-stalactite--one" />
              <span className="ember-stalactite ember-stalactite--two ember-stalactite--hot" />
              <span className="ember-stalactite ember-stalactite--three ember-stalactite--hot" />
              <span className="ember-stalactite ember-stalactite--four" />
              <span className="ember-stalactite ember-stalactite--five" />
              <span className="ember-drip ember-drip--one" />
              <span className="ember-drip ember-drip--two" />
              <span className="ember-ceiling" />
            </span>
            <span className="ember-pillar ember-pillar--far-left" />
            <span className="ember-pillar ember-pillar--far-right" />
            <span className="ember-pillar ember-pillar--left" />
            <span className="ember-pillar ember-pillar--right" />
            <span className="ember-crack ember-crack--one" />
            <span className="ember-crack ember-crack--two" />
            <span className="ember-crack ember-crack--three" />
            <span className="lava-pool lava-pool--one" />
            <span className="lava-pool lava-pool--two" />
            <span className="lava-pool lava-pool--three" />
            <div className="ember-ash" data-parallax="16">
              <span className="ember-ash__layer ember-ash__layer--one" />
              <span className="ember-ash__layer ember-ash__layer--two" />
              <span className="ember-ash__layer ember-ash__layer--three" />
            </div>
          </div>

          <div className="container scene-copy scene-copy--about">
            <Typewriter
              as="p"
              className="area-kicker"
              text="Level 03 / About"
            />
            <DropHeading as="h2" id="about-title" text="About" />
            <p className="scene-copy__lead rv-wipe" style={{ '--rv-i': 0 }}>
              Placeholder introduction for the about area. The text sits directly on the
              ember scene.
              <span className="rv-bar" aria-hidden="true" />
            </p>

            <DialogueBox
              className="about__dialogue rv-dialogue"
              label="Dialogue"
              speaker="POP"
              typed
              lines={["Hi, I'm POP."]}
              revealIndex={1}
            />

            <div className="about__grid">
              <div className="about__block rv-wipe" style={{ '--rv-i': 2 }}>
                <h3>Profile</h3>
                <p>
                  Placeholder bio paragraph. Real background details will replace this
                  text later.
                </p>
                <p>
                  A second placeholder paragraph checks the line length and breathing
                  room.
                </p>
                <span className="rv-bar" aria-hidden="true" />
              </div>

              <div className="about__block rv-wipe" style={{ '--rv-i': 3 }}>
                <h3>Skills</h3>
                <ul className="pixel-list">
                  <li>Placeholder skill one.</li>
                  <li>Placeholder skill two.</li>
                  <li>Placeholder skill three.</li>
                  <li>Placeholder skill four.</li>
                </ul>
                <span className="rv-bar" aria-hidden="true" />
              </div>
            </div>
          </div>

          <span className="ground ground--section ground--ember" aria-hidden="true" />

          <CreatureScene
            zone="about"
            paused={creaturesPaused}
            reducedMotion={reducedMotion}
            scale={spriteScale}
            sectionRevealed={aboutReveal.revealed}
            fxReduced={fxReduced}
          />
        </section>

        <DescendBand
          {...descentBands[2]}
          scale={spriteScale}
          reducedMotion={fxReduced}
          onCross={handleBandCross}
        />

        <section
          id="contact"
          ref={contactRef}
          className={contactSceneClass}
          aria-labelledby="contact-title"
        >
          <ParticleField
            kind="glint"
            scale={spriteScale}
            active={contactOnScreen && !fxPaused && !fxReduced}
          />

          <div className="void-decor" aria-hidden="true">
            <span className="void-nebula" />
            <span className="void-lip" />
            <span className="void-stars void-stars--cream" data-parallax="32" />
            <span className="void-stars void-stars--violet" />
            <span className="void-stars void-stars--dim" />
            <span className="void-star-cross void-star-cross--one" />
            <span className="void-star-cross void-star-cross--two" />
            <span className="void-glints void-glints--one" />
            <span className="void-glints void-glints--two" />
            <span className="void-rock void-rock--one" />
            <span className="void-rock void-rock--two" data-parallax="16" />
            <span className="void-rock void-rock--three" />
            <span className="void-rock void-rock--four" />
            <span className="void-rock void-rock--five" />
            <span className="void-debris void-debris--one" />
            <span className="void-debris void-debris--two" />
            <span className="void-debris void-debris--three" />
            <span className="void-shelf void-shelf--one" />
            <span className="void-shelf void-shelf--two" />
            <span className="void-shelf void-shelf--three" />
            <span className="void-shelf void-shelf--four" />
            <span className="void-shelf void-shelf--five" />
            <span className="void-shelf void-shelf--six" />
            <span className="void-shelf void-shelf--seven" />
            <span className="void-perch" />
          </div>

          <div className="container scene-copy scene-copy--contact">
            <Typewriter
              as="p"
              className="area-kicker"
              text="Level 04 / Contact"
            />
            <DropHeading as="h2" id="contact-title" text="Contact" />
            <p className="scene-copy__lead rv-wipe" style={{ '--rv-i': 0 }}>
              Placeholder contact message. The real contact details come in a later phase.
              <span className="rv-bar" aria-hidden="true" />
            </p>
            <p className="rv-wipe" style={{ '--rv-i': 1 }}>
              Email placeholder.
              <span className="rv-bar" aria-hidden="true" />
            </p>
            <p className="rv-wipe" style={{ '--rv-i': 2 }}>
              Social link placeholder.
              <span className="rv-bar" aria-hidden="true" />
            </p>
            <PixelButton
              href="#home"
              variant="secondary"
              className="rv-wipe"
              style={{ '--rv-i': 3 }}
            >
              Return to the signpost
            </PixelButton>
          </div>

          <span className="ground ground--section ground--void" aria-hidden="true" />

          <CreatureScene
            zone="contact"
            paused={creaturesPaused}
            reducedMotion={reducedMotion}
            scale={spriteScale}
            sectionRevealed={contactReveal.revealed}
            fxReduced={fxReduced}
          />
        </section>

        <footer className="site-footer scene--void">
          <div className="container site-footer__inner">
            <p>Placeholder footer text.</p>
            <p>POP / pixel portfolio</p>
          </div>
        </footer>
      </main>
      </div>

      {titleOpen ? (
        <TitleScreen scale={spriteScale} onClose={closeTitle} />
      ) : null}
    </div>
  )
}

export default App
