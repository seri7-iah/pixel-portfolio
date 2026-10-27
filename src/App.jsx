import Card from './components/Card.jsx'
import DialogueBox from './components/DialogueBox.jsx'
import Panel from './components/Panel.jsx'
import PixelButton from './components/PixelButton.jsx'
import './App.css'

const areas = [
  { id: 'home', label: 'Home', level: '01' },
  { id: 'projects', label: 'Projects', level: '02' },
  { id: 'about', label: 'About', level: '03' },
  { id: 'contact', label: 'Contact', level: '04' },
]

const projectSlots = [
  {
    id: '01',
    title: 'Project slot 01',
    summary: 'Placeholder project summary. Replace this with a short description of the build.',
    detail: 'Placeholder detail line for tools, role, or a result.',
  },
  {
    id: '02',
    title: 'Project slot 02',
    summary: 'Placeholder project summary. This card shows how a second project will sit in the grid.',
    detail: 'Placeholder detail line for tools, role, or a result.',
  },
]

function App() {
  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <div className="container site-header__inner">
          <a className="brand" href="#home" aria-label="POP, back to the home area">
            <span className="brand__mark" aria-hidden="true" />
            <span>POP</span>
            <span className="brand__sub">pixel portfolio</span>
          </a>

          <nav className="level-nav" aria-label="World areas">
            <ol className="level-nav__list">
              {areas.map((area) => (
                <li key={area.id}>
                  <a className="level-nav__link" href={`#${area.id}`}>
                    <span className="level-nav__level" aria-hidden="true">
                      {area.level}
                    </span>
                    <span>{area.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section id="home" className="area area--home" aria-labelledby="home-title">
          <div className="container area__inner">
            <header className="area__head">
              <p className="area-tag">Level 01 / Home</p>
              <h1 id="home-title">Home</h1>
              <p className="area__lead">
                Placeholder introduction for the home area. Real copy will be written in a
                later phase.
              </p>
            </header>

            <div className="home-grid">
              <Panel eyebrow="Quest log" title="Start here" headingLevel={2}>
                <p>
                  Placeholder panel text. This block can hold a short welcome or a summary of
                  what I do.
                </p>
                <ul className="pixel-list">
                  <li>Placeholder list item one.</li>
                  <li>Placeholder list item two.</li>
                  <li>Placeholder list item three.</li>
                </ul>
              </Panel>

              <DialogueBox label="Dialogue" speaker="Guide">
                <p>
                  Placeholder dialogue line. This box will hold short, friendly messages in
                  the finished portfolio.
                </p>
                <p>
                  A second placeholder line shows the spacing and reading width inside the
                  box.
                </p>
                <div className="dialogue-box__actions">
                  <PixelButton href="#projects">Enter the projects area</PixelButton>
                </div>
              </DialogueBox>
            </div>
          </div>
        </section>

        <section
          id="projects"
          className="area area--cave"
          aria-labelledby="projects-title"
        >
          <div className="container area__inner">
            <header className="area__head">
              <p className="area-tag">Level 02 / Projects</p>
              <h2 id="projects-title">Projects</h2>
              <p className="area__lead">
                Placeholder introduction for the projects area. This section uses the Cave
                palette.
              </p>
            </header>

            <div className="card-grid">
              {projectSlots.map((project) => (
                <Card
                  key={project.id}
                  eyebrow={`Project ${project.id}`}
                  title={project.title}
                  headingLevel={3}
                  footer={<p className="card__note">Live site link placeholder.</p>}
                >
                  <p>{project.summary}</p>
                  <p>{project.detail}</p>
                </Card>
              ))}
            </div>

            <Panel eyebrow="Cave note" title="More projects later" headingLevel={3}>
              <p>
                Placeholder note for extra projects. The card grid will grow here when real
                projects are added.
              </p>
            </Panel>
          </div>
        </section>

        <section id="about" className="area area--about" aria-labelledby="about-title">
          <div className="container area__inner">
            <header className="area__head">
              <p className="area-tag">Level 03 / About</p>
              <h2 id="about-title">About</h2>
              <p className="area__lead">
                Placeholder introduction for the about area. This is where the longer story
                will live.
              </p>
            </header>

            <div className="about-grid">
              <Panel eyebrow="Player profile" title="Who is POP?" headingLevel={3}>
                <p>
                  Placeholder bio paragraph. Real background details will replace this text
                  later.
                </p>
                <p>
                  A second placeholder paragraph checks the line length and spacing of longer
                  body copy.
                </p>
              </Panel>

              <Panel eyebrow="Inventory" title="Skills" headingLevel={3}>
                <ul className="pixel-list">
                  <li>Placeholder skill one.</li>
                  <li>Placeholder skill two.</li>
                  <li>Placeholder skill three.</li>
                  <li>Placeholder skill four.</li>
                </ul>
              </Panel>
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="area area--contact"
          aria-labelledby="contact-title"
        >
          <div className="container area__inner">
            <header className="area__head">
              <p className="area-tag">Level 04 / Contact</p>
              <h2 id="contact-title">Contact</h2>
              <p className="area__lead">
                Placeholder introduction for the contact area. The real contact details come
                in a later phase.
              </p>
            </header>

            <div className="contact-grid">
              <DialogueBox label="Message" speaker="System">
                <p>
                  Placeholder contact message. This dialogue box will hold the final invite
                  to get in touch.
                </p>
                <p>Placeholder note about response time or preferred contact method.</p>
                <div className="dialogue-box__actions">
                  <PixelButton href="#home" variant="secondary">
                    Return to Home
                  </PixelButton>
                </div>
              </DialogueBox>

              <Panel eyebrow="Contact details" title="Placeholder" headingLevel={3}>
                <p>Email placeholder.</p>
                <p>Social link placeholder.</p>
                <p>Location placeholder.</p>
              </Panel>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <p>Placeholder footer text.</p>
          <p>POP / pixel portfolio</p>
        </div>
      </footer>
    </div>
  )
}

export default App
