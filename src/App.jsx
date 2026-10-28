import { useRef, useState } from 'react'
import CreatureScene from './components/CreatureScene.jsx'
import DialogueBox from './components/DialogueBox.jsx'
import PixelButton from './components/PixelButton.jsx'
import PortraitFrame from './components/PortraitFrame.jsx'
import useOnScreen from './lib/useOnScreen.js'
import { usePrefersReducedMotion, useSpriteScale } from './lib/useMotion.js'
import './App.css'

const navItems = [
  { id: 'home', label: 'Home', side: 'left' },
  { id: 'projects', label: 'Projects', side: 'right' },
  { id: 'about', label: 'About', side: 'left' },
  { id: 'contact', label: 'Contact', side: 'right' },
]

const projects = [
  { id: '01', name: 'Project 01', tag: 'Crystal cache', art: 'crystal' },
  { id: '02', name: 'Project 02', tag: 'Supply chest', art: 'chest' },
  { id: '03', name: 'Project 03', tag: 'Trail sign', art: 'sign' },
]

function Signpost() {
  return (
    <nav className="signpost" aria-label="World areas">
      <span className="signpost__pole" aria-hidden="true" />
      <ol className="signpost__list">
        {navItems.map((item) => (
          <li
            key={item.id}
            className={`signpost__item signpost__item--${item.side}`}
          >
            <a className="signpost__link" href={`#${item.id}`}>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
      <span className="signpost__base" aria-hidden="true" />
    </nav>
  )
}

function CaveObject({ project }) {
  return (
    <a
      className="cave-object"
      href="#contact"
      aria-label={`${project.name}: ${project.tag}. Placeholder project link.`}
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
  const systemReducedMotion = usePrefersReducedMotion()
  const reducedMotion = systemReducedMotion && !motionOverride
  const spriteScale = useSpriteScale()

  const homeRef = useRef(null)
  const projectsRef = useRef(null)
  const aboutRef = useRef(null)
  const contactRef = useRef(null)
  const homeOnScreen = useOnScreen(homeRef)
  const projectsOnScreen = useOnScreen(projectsRef)
  const aboutOnScreen = useOnScreen(aboutRef)
  const contactOnScreen = useOnScreen(contactRef)
  // Scenery animations follow the same pause button as the creatures and stop
  // for the system reduced-motion preference. They also stop off screen.
  const decorLive = !creaturesPaused && !systemReducedMotion
  const homeSceneClass = `scene scene--home${
    decorLive && homeOnScreen ? ' is-live' : ''
  }`
  const caveSceneClass = `scene scene--cave${
    decorLive && projectsOnScreen ? ' is-live' : ''
  }`
  const aboutSceneClass = `scene scene--about scene--ember${
    decorLive && aboutOnScreen ? ' is-live' : ''
  }`
  const contactSceneClass = `scene scene--contact scene--void${
    decorLive && contactOnScreen ? ' is-live' : ''
  }`

  const toggleCreatures = () => {
    const next = !creaturesPaused
    setCreaturesPaused(next)
    if (next) setPixControl(false)
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <main id="main-content">
        <section
          id="home"
          ref={homeRef}
          className={homeSceneClass}
          aria-labelledby="home-title"
        >
          <div className="sky sky--home" aria-hidden="true">
            <span className="sky-horizon" />
            <span className="stars stars--one" />
            <span className="stars stars--two" />
            <span className="stars stars--three" />
            <span className="star-cross star-cross--one" />
            <span className="star-cross star-cross--two" />
            <span className="shooting-star" />
            <span className="moon" />
            <span className="cloud cloud--one" />
            <span className="cloud cloud--two" />
            <span className="cloud cloud--three" />
          </div>

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
              <p className="area-kicker">Home / Level 01</p>
              <h1 id="home-title">POP</h1>
            </div>

            <div className="home__right">
              <Signpost />
              <div className="home__portrait">
                <PortraitFrame />
              </div>
            </div>

            <div className="home__copy">
              <p className="home__lead">
                Placeholder welcome for the home area. Real copy will arrive in a later
                phase.
              </p>
              <p className="home__body">
                Placeholder supporting line. Keep this short so the scene has room to
                breathe.
              </p>
              <PixelButton href="#projects">Enter the cave</PixelButton>
            </div>

            <div className="home__dialogue">
              <DialogueBox label="Dialogue" speaker="Guide">
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
            <span className="hill hill--back" />
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
          />
        </section>

        <section
          id="projects"
          ref={projectsRef}
          className={caveSceneClass}
          aria-labelledby="projects-title"
        >
          <div className="cave-decor" aria-hidden="true">
            <span className="cave-glow" />
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
              <p className="area-kicker">Level 02 / Projects</p>
              <h2 id="projects-title">Projects</h2>
              <p>
                Placeholder introduction for the cave. Three objects stand in for projects
                until real work and links are added.
              </p>
            </header>

            <div className="cave-wall">
              <div className="cave-objects">
                {projects.map((project) => (
                  <CaveObject key={project.id} project={project} />
                ))}
              </div>
              <p className="cave-wall__note">
                Hover or tab to an object to reveal its short label.
              </p>
            </div>
          </div>

          <CreatureScene
            zone="cave"
            paused={creaturesPaused}
            reducedMotion={reducedMotion}
            scale={spriteScale}
          />
        </section>

        <section
          id="about"
          ref={aboutRef}
          className={aboutSceneClass}
          aria-labelledby="about-title"
        >
          <div className="ember-decor" aria-hidden="true">
            <span className="ember-glow" />
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
            <div className="ember-ash">
              <span className="ember-ash__layer ember-ash__layer--one" />
              <span className="ember-ash__layer ember-ash__layer--two" />
              <span className="ember-ash__layer ember-ash__layer--three" />
            </div>
          </div>

          <div className="container scene-copy scene-copy--about">
            <p className="area-kicker">Level 03 / About</p>
            <h2 id="about-title">About</h2>
            <p className="scene-copy__lead">
              Placeholder introduction for the about area. The text sits directly on the
              ember scene.
            </p>

            <DialogueBox className="about__dialogue" label="Dialogue" speaker="POP">
              <p>Hi, I&apos;m POP.</p>
            </DialogueBox>

            <div className="about__grid">
              <div className="about__block">
                <h3>Profile</h3>
                <p>
                  Placeholder bio paragraph. Real background details will replace this
                  text later.
                </p>
                <p>
                  A second placeholder paragraph checks the line length and breathing
                  room.
                </p>
              </div>

              <div className="about__block">
                <h3>Skills</h3>
                <ul className="pixel-list">
                  <li>Placeholder skill one.</li>
                  <li>Placeholder skill two.</li>
                  <li>Placeholder skill three.</li>
                  <li>Placeholder skill four.</li>
                </ul>
              </div>
            </div>
          </div>

          <span className="ground ground--section ground--ember" aria-hidden="true" />

          <CreatureScene
            zone="about"
            paused={creaturesPaused}
            reducedMotion={reducedMotion}
            scale={spriteScale}
          />
        </section>

        <section
          id="contact"
          ref={contactRef}
          className={contactSceneClass}
          aria-labelledby="contact-title"
        >
          <div className="void-decor" aria-hidden="true">
            <span className="void-nebula" />
            <span className="void-lip" />
            <span className="void-stars void-stars--cream" />
            <span className="void-stars void-stars--violet" />
            <span className="void-stars void-stars--dim" />
            <span className="void-star-cross void-star-cross--one" />
            <span className="void-star-cross void-star-cross--two" />
            <span className="void-glints void-glints--one" />
            <span className="void-glints void-glints--two" />
            <span className="void-rock void-rock--one" />
            <span className="void-rock void-rock--two" />
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
            <p className="area-kicker">Level 04 / Contact</p>
            <h2 id="contact-title">Contact</h2>
            <p className="scene-copy__lead">
              Placeholder contact message. The real contact details come in a later phase.
            </p>
            <p>Email placeholder.</p>
            <p>Social link placeholder.</p>
            <PixelButton href="#home" variant="secondary">
              Return to the signpost
            </PixelButton>
          </div>

          <span className="ground ground--section ground--void" aria-hidden="true" />

          <CreatureScene
            zone="contact"
            paused={creaturesPaused}
            reducedMotion={reducedMotion}
            scale={spriteScale}
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
  )
}

export default App
