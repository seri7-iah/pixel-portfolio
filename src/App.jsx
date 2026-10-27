import { useState } from 'react'
import CreatureScene from './components/CreatureScene.jsx'
import DialogueBox from './components/DialogueBox.jsx'
import PixelButton from './components/PixelButton.jsx'
import PortraitFrame from './components/PortraitFrame.jsx'
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
        <section id="home" className="scene scene--home" aria-labelledby="home-title">
          <div className="sky sky--home" aria-hidden="true">
            <span className="moon" />
            <span className="stars stars--one" />
            <span className="stars stars--two" />
            <span className="cloud cloud--one" />
            <span className="cloud cloud--two" />
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
            <span className="hill hill--back" />
            <span className="hill hill--front" />
            <span className="tree tree--one" />
            <span className="tree tree--two" />
            <span className="ground" />
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
          className="scene scene--cave"
          aria-labelledby="projects-title"
        >
          <div className="cave-decor" aria-hidden="true">
            <span className="cave-ceiling" />
            <span className="stalactite stalactite--one" />
            <span className="stalactite stalactite--two" />
            <span className="stalactite stalactite--three" />
            <span className="stalactite stalactite--four" />
            <span className="torch torch--left">
              <span className="torch__flame" />
            </span>
            <span className="torch torch--right">
              <span className="torch__flame" />
            </span>
            <span className="cave-crystal cave-crystal--one" />
            <span className="cave-crystal cave-crystal--two" />
            <span className="cave-floor">
              <span className="cave-floor__crystals" />
            </span>
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
          className="scene scene--about scene--ember"
          aria-labelledby="about-title"
        >
          <div className="ember-decor" aria-hidden="true">
            <span className="ember-ceiling" />
            <span className="ember-pillar ember-pillar--left" />
            <span className="ember-pillar ember-pillar--right" />
            <span className="ember-crack ember-crack--one" />
            <span className="ember-crack ember-crack--two" />
            <span className="ember-sparks" />
            <span className="lava-pool lava-pool--one" />
            <span className="lava-pool lava-pool--two" />
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
          className="scene scene--contact scene--void"
          aria-labelledby="contact-title"
        >
          <div className="void-decor" aria-hidden="true">
            <span className="void-stars" />
            <span className="void-glints" />
            <span className="void-rock void-rock--one" />
            <span className="void-rock void-rock--two" />
            <span className="void-rock void-rock--three" />
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
